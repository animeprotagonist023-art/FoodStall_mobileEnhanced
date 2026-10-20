import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Bike, Bookmark, Check, CheckCircle2,
  ChevronDown, ChevronRight, Clock3, Coffee, CookingPot,
  Heart, Home, Info, Leaf, MapPin, Menu as MenuIcon, Minus, PackageCheck,
  Plus, Search, ShieldCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles,
  Store, Trash2, Truck, Utensils, Wallet, X, Zap, ClipboardList, Pencil,
  LayoutDashboard, RotateCcw, CircleDollarSign, PanelTop, CircleUserRound,
} from 'lucide-react'
import { BRAND, SERVICE } from '../config/brand'
import { categories, initialMenu, initialVendors } from '../data/demoData'
import { readStored, writeStored } from '../lib/persistence'
import { getCartSubtotal, getDeliveryFee, getLineTotal, getLineUnitPrice, money } from '../lib/pricing'
import { nextStatuses, statusDescription, statusLabel } from '../lib/orderLifecycle'
import type { CartLine, DemoOrder, FoodCategory, Fulfillment, MenuItem, OrderStatus, Vendor } from '../types'

// Everything in this application is demonstration state held in the browser. No order leaves this device.
type View = 'home' | 'explore' | 'vendor' | 'favorites' | 'orders' | 'cart' | 'checkout' | 'confirmation' | 'tracking' | 'profile' | 'vendorDashboard' | 'operations'
type SortMode = 'recommended' | 'quickest' | 'price-low' | 'name'
type ItemModalState = { itemId: string; size: string; addons: string[]; quantity: number; instructions: string; lineId?: string }
type PendingSwap = { line: CartLine; vendorName: string }
type MenuFormState = { id?: string; name: string; description: string; price: string; category: Exclude<FoodCategory, 'All'>; available: boolean }

const STORE_KEYS = {
  vendors: 'foodstall.vendors.v1', menu: 'foodstall.menu.v1', cart: 'foodstall.cart.v1',
  favorites: 'foodstall.favorites.v1', orders: 'foodstall.orders.v1', profileName: 'foodstall.profile-name.v1',
}

const ORDER_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled']

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
function isVendorList(value: unknown): value is Vendor[] {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && ['id', 'name', 'category', 'description', 'image', 'avatar', 'rating', 'prepTime', 'priceLabel', 'hours', 'location'].every((field) => typeof item[field] === 'string')
    && typeof item.isOpen === 'boolean' && typeof item.acceptsPickup === 'boolean' && typeof item.acceptsDelivery === 'boolean'
    && (item.featured === undefined || typeof item.featured === 'boolean'))
}
function isMenuList(value: unknown): value is MenuItem[] {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && ['id', 'vendorId', 'name', 'description', 'image', 'category'].every((field) => typeof item[field] === 'string')
    && typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 && typeof item.available === 'boolean'
    && (item.popular === undefined || typeof item.popular === 'boolean')
    && (item.sizes === undefined || (Array.isArray(item.sizes) && item.sizes.every((size) => isRecord(size) && typeof size.name === 'string' && typeof size.priceDelta === 'number' && Number.isFinite(size.priceDelta))))
    && (item.addons === undefined || (Array.isArray(item.addons) && item.addons.every((addon) => isRecord(addon) && typeof addon.name === 'string' && typeof addon.price === 'number' && Number.isFinite(addon.price))))
    && (item.tags === undefined || (Array.isArray(item.tags) && item.tags.every((tag) => typeof tag === 'string'))))
}
function isCartList(value: unknown): value is CartLine[] {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && typeof item.id === 'string' && typeof item.vendorId === 'string' && typeof item.itemId === 'string'
    && typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20
    && (item.size === undefined || typeof item.size === 'string')
    && Array.isArray(item.addonNames) && item.addonNames.every((name) => typeof name === 'string') && typeof item.instructions === 'string')
}
function isFavoriteList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}
function isOrderList(value: unknown): value is DemoOrder[] {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && ['id', 'vendorId', 'vendorName', 'destination', 'deliveryInstructions', 'customerName', 'createdAt'].every((field) => typeof item[field] === 'string')
    && typeof item.subtotal === 'number' && typeof item.deliveryFee === 'number' && typeof item.total === 'number'
    && typeof item.etaMinutes === 'number' && (item.fulfillment === 'pickup' || item.fulfillment === 'delivery')
    && (item.payment === 'Cash at pickup' || item.payment === 'Cash at handoff') && ORDER_STATUSES.includes(item.status as OrderStatus)
    && Array.isArray(item.items) && item.items.every((line) => isRecord(line) && typeof line.itemId === 'string' && typeof line.name === 'string' && typeof line.unitPrice === 'number' && typeof line.quantity === 'number' && line.quantity > 0 && Array.isArray(line.addonNames) && line.addonNames.every((name) => typeof name === 'string') && typeof line.instructions === 'string' && typeof line.image === 'string' && (line.size === undefined || typeof line.size === 'string'))
    && Array.isArray(item.timeline) && item.timeline.every((event) => isRecord(event) && ORDER_STATUSES.includes(event.status as OrderStatus) && typeof event.at === 'string' && typeof event.note === 'string'))
}

function makeSeedOrders(): DemoOrder[] {
  const now = Date.now()
  const item = initialMenu.find((candidate) => candidate.id === 'silog-classic')!
  const coffee = initialMenu.find((candidate) => candidate.id === 'iced-latte')!
  const riceVendor = initialVendors.find((candidate) => candidate.id === 'rice-shine')!
  const coffeeVendor = initialVendors.find((candidate) => candidate.id === 'brew-bloom')!
  const older = new Date(now - 22 * 60_000).toISOString()
  const recent = new Date(now - 4 * 60_000).toISOString()
  return [
    {
      id: 'FS-1041', vendorId: riceVendor.id, vendorName: riceVendor.name,
      items: [{ itemId: item.id, name: item.name, unitPrice: 101, quantity: 1, size: 'Regular', addonNames: ['Extra egg'], instructions: 'Egg well done, please.', image: item.image }],
      subtotal: 101, deliveryFee: 15, total: 116, fulfillment: 'delivery', destination: SERVICE.deliveryLocations[1],
      deliveryInstructions: 'Demo: leave at the designated campus handoff point.', customerName: 'Alex (demo)', payment: 'Cash at handoff', status: 'preparing',
      createdAt: older, etaMinutes: 15, timeline: [
        { status: 'placed', at: older, note: 'Demo order submitted' },
        { status: 'accepted', at: new Date(now - 19 * 60_000).toISOString(), note: 'Accepted by the vendor (demo)' },
        { status: 'preparing', at: new Date(now - 16 * 60_000).toISOString(), note: 'Preparation started (demo)' },
      ],
    },
    {
      id: 'FS-1042', vendorId: coffeeVendor.id, vendorName: coffeeVendor.name,
      items: [{ itemId: coffee.id, name: coffee.name, unitPrice: 85, quantity: 1, size: '12 oz', addonNames: [], instructions: '', image: coffee.image }],
      subtotal: 85, deliveryFee: 0, total: 85, fulfillment: 'pickup', destination: 'Brew & Bloom counter (demo point)',
      deliveryInstructions: '', customerName: 'Sam (demo)', payment: 'Cash at pickup', status: 'placed',
      createdAt: recent, etaMinutes: 8, timeline: [{ status: 'placed', at: recent, note: 'Demo order submitted' }],
    },
  ]
}

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
function shortOrder(id: string) { return `#${id}` }

function FoodImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return (
    <div className={cx('image-frame', className)}>
      {!failed ? <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : (
        <div className="image-fallback" role="img" aria-label={alt}><Utensils size={26} strokeWidth={1.5} /><span>{alt}</span></div>
      )}
    </div>
  )
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className={cx('brand-mark', compact && 'brand-mark-small')} aria-hidden="true"><Utensils size={compact ? 16 : 19} strokeWidth={2.1} /></span>
}

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

function Button({ children, onClick, variant = 'primary', size = 'normal', disabled = false, type = 'button', className = '', title }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'; size?: 'normal' | 'small'; disabled?: boolean; type?: 'button' | 'submit'; className?: string; title?: string
}) {
  return <button type={type} className={cx('button', `button-${variant}`, size === 'small' && 'button-small', className)} onClick={onClick} disabled={disabled} title={title}>{children}</button>
}

function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{detail && <p className="section-detail">{detail}</p>}</div>{action}</div>
}

function EmptyState({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{detail}</p>{action}</div>
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone = ['completed', 'ready'].includes(status) ? 'success' : ['rejected', 'cancelled'].includes(status) ? 'danger' : status === 'placed' ? 'warning' : 'accent'
  return <Pill tone={tone}>{statusLabel(status)}</Pill>
}

function App() {
  const [vendors, setVendors] = useState<Vendor[]>(() => readStored(STORE_KEYS.vendors, initialVendors.map((v) => ({ ...v })), isVendorList))
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => readStored(STORE_KEYS.menu, initialMenu.map((m) => ({ ...m })), isMenuList))
  const [cart, setCart] = useState<CartLine[]>(() => readStored(STORE_KEYS.cart, [], isCartList))
  const [favorites, setFavorites] = useState<string[]>(() => readStored(STORE_KEYS.favorites, [], isFavoriteList))
  const [orders, setOrders] = useState<DemoOrder[]>(() => readStored(STORE_KEYS.orders, makeSeedOrders(), isOrderList))
  const [view, setView] = useState<View>('home')
  const [selectedVendorId, setSelectedVendorId] = useState('rice-shine')
  const [trackingOrderId, setTrackingOrderId] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<FoodCategory>('All')
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [onlyDelivery, setOnlyDelivery] = useState(false)
  const [budgetFilter, setBudgetFilter] = useState<'any' | 'under60' | 'under90'>('any')
  const [sortMode, setSortMode] = useState<SortMode>('recommended')
  const [itemModal, setItemModal] = useState<ItemModalState | null>(null)
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null)
  const [toast, setToast] = useState('')
  const [cartNote, setCartNote] = useState('')
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [destination, setDestination] = useState(SERVICE.pickupLocations[0])
  const [customerName, setCustomerName] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [confirmedOrderId, setConfirmedOrderId] = useState('')
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [dashboardVendorId, setDashboardVendorId] = useState('rice-shine')
  const [dashboardTab, setDashboardTab] = useState<'orders' | 'menu'>('orders')
  const [detailOrderId, setDetailOrderId] = useState('')
  const [rejectOrderId, setRejectOrderId] = useState('')
  const [rejectReason, setRejectReason] = useState('Vendor is unable to fulfil this order in the demo.')
  const [menuForm, setMenuForm] = useState<MenuFormState | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [profileName, setProfileName] = useState(() => readStored(STORE_KEYS.profileName, '', (value): value is string => typeof value === 'string' && value.length <= 50))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => writeStored(STORE_KEYS.vendors, vendors), [vendors])
  useEffect(() => writeStored(STORE_KEYS.menu, menuItems), [menuItems])
  useEffect(() => writeStored(STORE_KEYS.cart, cart), [cart])
  useEffect(() => writeStored(STORE_KEYS.favorites, favorites), [favorites])
  useEffect(() => writeStored(STORE_KEYS.orders, orders), [orders])
  useEffect(() => writeStored(STORE_KEYS.profileName, profileName), [profileName])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectedVendor = vendors.find((vendor) => vendor.id === selectedVendorId)
  const currentVendor = vendors.find((vendor) => vendor.id === (cart[0]?.vendorId ?? selectedVendorId))
  const dashboardVendor = vendors.find((vendor) => vendor.id === dashboardVendorId) ?? vendors[0]
  const cartVendorId = cart[0]?.vendorId
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0)
  const subtotal = useMemo(() => getCartSubtotal(cart, menuItems), [cart, menuItems])
  const favoriteVendors = vendors.filter((vendor) => favorites.includes(`vendor:${vendor.id}`))
  const favoriteDishes = menuItems.filter((item) => favorites.includes(`dish:${item.id}`))
  const activeTrackingOrder = orders.find((order) => order.id === trackingOrderId) ?? orders.find((order) => order.id === confirmedOrderId)
  const profileDisplayName = profileName.trim() || 'Campus guest'
  const recentProfileOrders = useMemo(() => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3), [orders])
  const completedProfileOrders = orders.filter((order) => order.status === 'completed').length
  const featuredVendors = vendors.filter((vendor) => vendor.featured && vendor.isOpen).slice(0, 3)
  const popularMeals = menuItems.filter((item) => item.popular && item.available && vendors.find((vendor) => vendor.id === item.vendorId)?.isOpen).slice(0, 4)

  const vendorMatches = (vendor: Vendor, search: string) => {
    const text = `${vendor.name} ${vendor.category} ${vendor.description} ${menuItems.filter((item) => item.vendorId === vendor.id).map((item) => item.name).join(' ')}`.toLowerCase()
    return text.includes(search.toLowerCase().trim())
  }
  const filteredVendors = useMemo(() => {
    const results = vendors.filter((vendor) => {
      if (query.trim() && !vendorMatches(vendor, query)) return false
      if (onlyOpen && !vendor.isOpen) return false
      if (onlyDelivery && !vendor.acceptsDelivery) return false
      if (activeCategory !== 'All' && !menuItems.some((item) => item.vendorId === vendor.id && item.category === activeCategory)) return false
      if (budgetFilter !== 'any') {
        const prices = menuItems.filter((item) => item.vendorId === vendor.id && item.available).map((item) => item.price)
        const cap = budgetFilter === 'under60' ? 60 : 90
        if (!prices.some((price) => price < cap)) return false
      }
      return true
    })
    if (sortMode === 'quickest') results.sort((a, b) => Number(a.prepTime.match(/\d+/)?.[0] ?? 999) - Number(b.prepTime.match(/\d+/)?.[0] ?? 999))
    if (sortMode === 'price-low') results.sort((a, b) => Number(a.priceLabel.match(/\d+/)?.[0] ?? 999) - Number(b.priceLabel.match(/\d+/)?.[0] ?? 999))
    if (sortMode === 'name') results.sort((a, b) => a.name.localeCompare(b.name))
    if (sortMode === 'recommended') results.sort((a, b) => Number(b.featured) - Number(a.featured))
    return results
    // vendorMatches reads the same local arrays rendered by this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, menuItems, query, onlyOpen, onlyDelivery, activeCategory, budgetFilter, sortMode])

  function navigate(next: View) {
    setView(next)
    setMobileMenuOpen(false)
    setItemModal(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openVendor(vendorId: string) {
    setSelectedVendorId(vendorId)
    navigate('vendor')
  }

  function openExplore(category: FoodCategory = 'All') {
    setActiveCategory(category)
    navigate('explore')
  }

  function openItem(item: MenuItem) {
    const vendor = vendors.find((candidate) => candidate.id === item.vendorId)
    if (!item.available) { setToast('That item is marked sold out in this demo.'); return }
    if (!vendor?.isOpen) { setToast(`${vendor?.name ?? 'This vendor'} is currently paused in the demo.`); return }
    if (cart.length && cart[0].vendorId !== item.vendorId) {
      setToast('One vendor per checkout. Add from this stall by choosing “Start a fresh cart”.')
      setPendingSwap({ line: { id: `line-${Date.now()}`, vendorId: item.vendorId, itemId: item.id, quantity: 1, size: item.sizes?.[0]?.name, addonNames: [], instructions: '' }, vendorName: vendor.name })
      return
    }
    setItemModal({ itemId: item.id, size: item.sizes?.[0]?.name ?? '', addons: [], quantity: 1, instructions: '' })
  }

  function addModalItem() {
    if (!itemModal) return
    const item = menuItems.find((candidate) => candidate.id === itemModal.itemId)
    if (!item || !item.available || !vendors.find((vendor) => vendor.id === item.vendorId)?.isOpen) {
      setToast('This item is no longer available in the demo.'); setItemModal(null); return
    }
    if (itemModal.lineId) {
      const updatedLine: CartLine = { id: itemModal.lineId, vendorId: item.vendorId, itemId: item.id, quantity: itemModal.quantity, size: itemModal.size || undefined, addonNames: [...itemModal.addons], instructions: itemModal.instructions.trim() }
      setCart((current) => current.map((line) => line.id === itemModal.lineId ? updatedLine : line))
      setItemModal(null)
      setToast(`${item.name} selection updated.`)
      return
    }
    if (cart.length && cart[0].vendorId !== item.vendorId) {
      const vendorName = vendors.find((vendor) => vendor.id === item.vendorId)?.name ?? 'another vendor'
      setPendingSwap({ line: { id: `line-${Date.now()}`, vendorId: item.vendorId, itemId: item.id, quantity: itemModal.quantity, size: itemModal.size || undefined, addonNames: [...itemModal.addons], instructions: itemModal.instructions.trim() }, vendorName })
      setItemModal(null)
      return
    }
    const line: CartLine = { id: `line-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, vendorId: item.vendorId, itemId: item.id, quantity: itemModal.quantity, size: itemModal.size || undefined, addonNames: [...itemModal.addons], instructions: itemModal.instructions.trim() }
    setCart((current) => [...current, line])
    setItemModal(null)
    setToast(`${item.name} added to your cart.`)
  }

  function confirmSwapCart() {
    if (!pendingSwap) return
    setCart([pendingSwap.line])
    setSelectedVendorId(pendingSwap.line.vendorId)
    setToast(`Started a fresh cart for ${pendingSwap.vendorName}.`)
    setPendingSwap(null)
    navigate('cart')
  }

  function updateLineQuantity(lineId: string, delta: number) {
    setCart((current) => current.map((line) => line.id === lineId ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0))
  }

  function editCartLine(line: CartLine) {
    const item = menuItems.find((candidate) => candidate.id === line.itemId)
    if (!item) { setToast('This menu item is no longer available in the demo.'); return }
    setItemModal({ itemId: item.id, size: line.size ?? item.sizes?.[0]?.name ?? '', addons: [...line.addonNames], quantity: line.quantity, instructions: line.instructions, lineId: line.id })
  }

  function toggleFavorite(key: string) {
    const exists = favorites.includes(key)
    setFavorites((current) => exists ? current.filter((saved) => saved !== key) : [...current, key])
    setToast(exists ? 'Removed from your saved list.' : 'Saved for later.')
  }

  function startCheckout() {
    if (!cart.length) { setToast('Add something delicious before checkout.'); return }
    const vendor = vendors.find((candidate) => candidate.id === cart[0].vendorId)
    if (!vendor?.isOpen) { setToast('This vendor is paused. Please choose an open stall.'); return }
    if (cart.some((line) => !menuItems.find((item) => item.id === line.itemId)?.available)) { setToast('One item is sold out. Remove it before checkout.'); return }
    setFulfillment(vendor.acceptsPickup ? 'pickup' : 'delivery')
    setDestination(vendor.acceptsPickup ? SERVICE.pickupLocations[0] : SERVICE.deliveryLocations[0])
    setCheckoutError('')
    navigate('checkout')
  }

  function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCheckoutError('')
    if (!cart.length || !cartVendorId) { setCheckoutError('Your cart is empty. Add a menu item before confirming.'); return }
    const vendor = vendors.find((candidate) => candidate.id === cartVendorId)
    if (!vendor?.isOpen) { setCheckoutError('This vendor is paused in the demo. Please choose an open stall.'); return }
    if (fulfillment === 'pickup' && !vendor.acceptsPickup) { setCheckoutError('This vendor does not support pickup in the demo.'); return }
    if (fulfillment === 'delivery' && !vendor.acceptsDelivery) { setCheckoutError('This vendor does not support campus delivery in the demo.'); return }
    const validDestinations = fulfillment === 'pickup' ? SERVICE.pickupLocations : SERVICE.deliveryLocations
    if (!validDestinations.includes(destination)) { setCheckoutError('Choose one of the listed campus demonstration locations.'); return }
    const unavailable = cart.find((line) => !menuItems.find((item) => item.id === line.itemId)?.available)
    if (unavailable) { setCheckoutError('At least one cart item is now unavailable. Return to the cart to remove it.'); return }
    const orderId = `FS-${Math.floor(1000 + Math.random() * 9000)}`
    const currentSubtotal = getCartSubtotal(cart, menuItems)
    const currentFee = getDeliveryFee(fulfillment, vendor)
    const timestamp = new Date().toISOString()
    const items = cart.map((line) => {
      const item = menuItems.find((candidate) => candidate.id === line.itemId)!
      return { itemId: item.id, name: item.name, unitPrice: getLineUnitPrice(line, item), quantity: line.quantity, size: line.size, addonNames: [...line.addonNames], instructions: line.instructions, image: item.image }
    })
    const order: DemoOrder = {
      id: orderId, vendorId: vendor.id, vendorName: vendor.name, items,
      subtotal: currentSubtotal, deliveryFee: currentFee, total: currentSubtotal + currentFee,
      fulfillment, destination, deliveryInstructions: [fulfillment === 'delivery' ? deliveryInstructions.trim() : '', cartNote.trim() ? `Note to stall: ${cartNote.trim()}` : ''].filter(Boolean).join(' · '),
      customerName: customerName.trim() || profileName.trim() || 'Campus guest',
      payment: fulfillment === 'pickup' ? 'Cash at pickup' : 'Cash at handoff', status: 'placed', createdAt: timestamp, etaMinutes: Number(vendor.prepTime.match(/\d+/)?.[0] ?? 10),
      timeline: [{ status: 'placed', at: timestamp, note: 'Order placed in the local demo' }],
    }
    setOrders((current) => [order, ...current])
    setCart([])
    setCartNote('')
    setConfirmedOrderId(orderId)
    setTrackingOrderId(orderId)
    navigate('confirmation')
  }

  function updateOrderStatus(orderId: string, next: OrderStatus, note?: string) {
    setOrders((current) => current.map((order) => {
      if (order.id !== orderId) return order
      if (!nextStatuses(order.status, order.fulfillment).includes(next)) {
        setToast(`That status change is not allowed from “${statusLabel(order.status)}”.`)
        return order
      }
      const timestamp = new Date().toISOString()
      return { ...order, status: next, statusNote: note, timeline: [...order.timeline, { status: next, at: timestamp, note: note || `${statusLabel(next)} in the local demo` }] }
    }))
    if (next === 'completed') setToast('Order marked completed in the demo.')
    else if (next === 'rejected' || next === 'cancelled') setToast(`Order ${next} in the demo. No payment was taken.`)
    else setToast(`Order updated: ${statusLabel(next)}.`)
  }

  function setVendorOpen(vendorId: string, isOpen: boolean) {
    setVendors((current) => current.map((vendor) => vendor.id === vendorId ? { ...vendor, isOpen } : vendor))
    setToast(`${vendors.find((vendor) => vendor.id === vendorId)?.name ?? 'Vendor'} marked ${isOpen ? 'open' : 'paused'} in the demo.`)
  }

  function openMenuForm(item?: MenuItem) {
    setMenuForm(item ? { id: item.id, name: item.name, description: item.description, price: String(item.price), category: item.category, available: item.available } : { name: '', description: '', price: '', category: 'Rice meals', available: true })
  }

  function saveMenuItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!menuForm || !menuForm.name.trim() || !menuForm.price.trim() || !Number.isFinite(Number(menuForm.price)) || Number(menuForm.price) < 0) return
    if (menuForm.id) {
      setMenuItems((current) => current.map((item) => item.id === menuForm.id ? { ...item, name: menuForm.name.trim(), description: menuForm.description.trim(), price: Number(menuForm.price), category: menuForm.category, available: menuForm.available } : item))
      setToast('Menu item updated in local demo storage.')
    } else {
      const item: MenuItem = { id: `custom-${Date.now()}`, vendorId: dashboardVendorId, name: menuForm.name.trim(), description: menuForm.description.trim(), price: Number(menuForm.price), category: menuForm.category, image: dashboardVendor?.image ?? initialVendors[0].image, available: menuForm.available }
      setMenuItems((current) => [item, ...current])
      setToast('New menu item added to the demo menu.')
    }
    setMenuForm(null)
  }

  function restoreDemo() {
    const initialOrders = makeSeedOrders()
    setVendors(initialVendors.map((v) => ({ ...v })))
    setMenuItems(initialMenu.map((m) => ({ ...m })))
    setCart([])
    setFavorites([])
    setOrders(initialOrders)
    setQuery('')
    setActiveCategory('All')
    setOnlyOpen(false)
    setOnlyDelivery(false)
    setBudgetFilter('any')
    setSortMode('recommended')
    setConfirmedOrderId('')
    setTrackingOrderId('')
    setResetOpen(false)
    navigate('home')
    setToast('FoodStall demo restored to its starting state.')
  }

  function orderTrack(order: DemoOrder) {
    setTrackingOrderId(order.id)
    navigate('tracking')
  }

  function resetSearch() {
    setQuery(''); setActiveCategory('All'); setOnlyOpen(false); setOnlyDelivery(false); setBudgetFilter('any'); setSortMode('recommended')
  }

  function goToSearch() {
    openExplore('All')
    window.setTimeout(() => document.getElementById('explore-search')?.focus(), 100)
  }

  const showHeader = !['confirmation'].includes(view)

  return <div className="app-shell">
    {showHeader && <header className="site-header">
      <div className="header-inner">
        <button className="brand-lockup" onClick={() => navigate('home')} aria-label="FoodStall home"><BrandMark /><span><strong>{BRAND.name}</strong><small>GOOD FOOD, CAMPUS CLOSE</small></span></button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={cx('nav-link', view === 'home' && 'active')} onClick={() => navigate('home')}>Home</button>
          <button className={cx('nav-link', view === 'explore' && 'active')} onClick={() => openExplore()}>Explore stalls</button>
          <button className={cx('nav-link', view === 'favorites' && 'active')} onClick={() => navigate('favorites')}>Saved</button>
          <button className={cx('nav-link', view === 'orders' && 'active')} onClick={() => navigate('orders')}>My orders</button>
          <button className={cx('nav-link', view === 'profile' && 'active')} onClick={() => navigate('profile')}>Profile</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button header-search" aria-label="Search food" onClick={goToSearch}><Search size={19} /></button>
          <button className="header-cart" onClick={() => navigate('cart')} aria-label={`Cart, ${cartCount} items`}><ShoppingBag size={18} /><span>Cart</span><b>{cartCount}</b></button>
          <button className="avatar-button" onClick={() => navigate('profile')} aria-label={`Open profile: ${profileDisplayName}`}><CircleUserRound size={20} /></button>
          <button className="icon-button mobile-menu-trigger" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen}><MenuIcon size={20} /></button>
        </div>
      </div>
      {mobileMenuOpen && <div className="mobile-menu"><button onClick={() => navigate('home')}>Home</button><button onClick={() => openExplore()}>Explore stalls</button><button onClick={() => navigate('favorites')}>Saved items</button><button onClick={() => navigate('orders')}>My orders</button><button onClick={() => navigate('profile')}>My profile</button><button onClick={() => navigate('vendorDashboard')}>Vendor demo</button><button onClick={() => navigate('operations')}>Operations demo</button></div>}
    </header>}

    <main className="page-container">
      {view === 'home' && <>
        <section className="hero-section">
          <div className="hero-copy">
            <div className="campus-badge"><span className="badge-dot" /> MADE FOR CAMPUS DAYS <span className="badge-divider" /> {BRAND.campus}</div>
            <h1>Good food,<br /><em>closer to class.</em></h1>
            <p className="hero-subtitle">Your next merienda, rice meal, or caffeine reset — from campus stalls to your next stop.</p>
            <form className="hero-search" onSubmit={(event) => { event.preventDefault(); openExplore() }}>
              <Search size={19} /><input aria-label="Search meals or stalls" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try tapsilog, iced latte, or a stall…" /><button type="submit" aria-label="Search"><ArrowRight size={19} /></button>
            </form>
            <div className="hero-trust-row"><span><MapPin size={15} /> Campus-only ordering</span><span><Wallet size={15} /> Cash at pickup or handoff</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-main"><FoodImage src="https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=90" alt="Colorful rice meal in a bowl" /></div>
            <div className="hero-photo-small"><FoodImage src="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=85" alt="Iced coffee in a glass" /></div>
            <div className="hero-note"><span className="hero-note-icon"><Zap size={16} fill="currentColor" /></span><span><strong>Lunch break, sorted</strong><small>Order ahead in a few taps</small></span></div>
            <div className="hero-sticker">LOCAL<br />BITES <span>✳</span></div>
          </div>
        </section>

        <section className="campus-note-strip"><div className="campus-note-icon"><ShieldCheck size={19} /></div><p><strong>Just for the campus community.</strong> This demo uses fictional stalls and sample pickup points. No real orders or payments are sent.</p><button onClick={() => navigate('profile')}>How it works <ArrowRight size={15} /></button></section>

        <section className="category-section">
          <SectionHeading eyebrow="WHAT SOUNDS GOOD?" title="A little something for every break" action={<button className="text-link" onClick={() => openExplore()}>All categories <ArrowRight size={16} /></button>} />
          <div className="category-grid">
            {categories.filter((category) => category.name !== 'All').map((category, index) => {
              const icons = [<Utensils key="rice" />, <Heart key="filipino" />, <CookingPot key="noodles" />, <Coffee key="coffee" />, <Sparkles key="snacks" />, <Leaf key="bakery" />, <Wallet key="budget" />]
              return <button className={`category-tile category-tone-${index + 1}`} key={category.name} onClick={() => openExplore(category.name)}><span className="category-icon">{icons[index]}</span><strong>{category.name}</strong><small>{category.detail}</small></button>
            })}
          </div>
        </section>

        <section className="section-block">
          <SectionHeading eyebrow="THE CAMPUS FAVORITES" title="Good things are cooking" detail="A few local favorites to get your day moving." action={<button className="text-link" onClick={() => openExplore()}>See all stalls <ArrowRight size={16} /></button>} />
          <div className="vendor-grid featured-vendors">{featuredVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} menuItems={menuItems} favorite={favorites.includes(`vendor:${vendor.id}`)} onOpen={() => openVendor(vendor.id)} onFavorite={() => toggleFavorite(`vendor:${vendor.id}`)} />)}</div>
        </section>

        <section className="section-block meals-block">
          <SectionHeading eyebrow="THE GOOD STUFF" title="Popular on campus" detail="Student-friendly picks, all sample prices in Philippine pesos." action={<button className="text-link" onClick={() => openExplore()}>Browse the menu <ArrowRight size={16} /></button>} />
          <div className="food-grid">{popularMeals.map((item) => <FoodCard key={item.id} item={item} vendor={vendors.find((vendor) => vendor.id === item.vendorId)!} favorite={favorites.includes(`dish:${item.id}`)} onOpen={() => openItem(item)} onVendor={() => openVendor(item.vendorId)} onFavorite={() => toggleFavorite(`dish:${item.id}`)} />)}</div>
        </section>

        <section className="order-how-section"><div className="how-copy"><p className="eyebrow">A VERY EASY ROUTINE</p><h2>More break.<br /><em>Less back-and-forth.</em></h2><p>Pick a stall, choose a campus handoff point, and pay with cash when you collect your food. That's the whole idea.</p><Button onClick={() => openExplore()}>Find your next meal <ArrowRight size={17} /></Button></div><div className="how-steps"><div className="how-step"><span>01</span><div><strong>Find something good</strong><p>Search stalls and browse the menu before the rush.</p></div><Search size={20} /></div><div className="how-step"><span>02</span><div><strong>Choose pickup or delivery</strong><p>Select from the available campus demo points.</p></div><MapPin size={20} /></div><div className="how-step"><span>03</span><div><strong>Pay when it reaches you</strong><p>Cash at the counter or campus handoff. No online payment.</p></div><Wallet size={20} /></div></div></section>
      </>}

      {view === 'explore' && <section className="page-view explore-view">
        <div className="page-intro"><div><p className="eyebrow">YOUR CAMPUS FOOD GUIDE</p><h1>Find your <em>next favorite.</em></h1><p>Discover fictional participating stalls and sample menus for this clickable demo.</p></div><div className="intro-mark"><BrandMark /><span>Campus<br />only</span></div></div>
        <div className="explore-search-bar"><Search size={20} /><input id="explore-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a stall, dish, or category…" aria-label="Search stalls and dishes" /><button onClick={resetSearch} className="reset-search" disabled={!query && activeCategory === 'All' && !onlyOpen && !onlyDelivery && budgetFilter === 'any' && sortMode === 'recommended'}>Clear</button></div>
        <div className="explore-toolbar"><div className="filter-heading"><SlidersHorizontal size={17} /><strong>Make it yours</strong></div><label className="check-filter"><input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} /> Open now</label><label className="check-filter"><input type="checkbox" checked={onlyDelivery} onChange={(event) => setOnlyDelivery(event.target.checked)} /> Campus delivery</label><label className="select-filter"><Wallet size={15} /><select aria-label="Filter by price" value={budgetFilter} onChange={(event) => setBudgetFilter(event.target.value as typeof budgetFilter)}><option value="any">Any budget</option><option value="under60">Has meals under ₱60</option><option value="under90">Has meals under ₱90</option></select><ChevronDown size={14} /></label><label className="select-filter"><ArrowDownUp size={15} /><select aria-label="Sort stalls" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="recommended">Recommended</option><option value="quickest">Quickest prep</option><option value="price-low">Lowest starting price</option><option value="name">Name A–Z</option></select><ChevronDown size={14} /></label></div>
        <div className="category-pills">{categories.map((category) => <button key={category.name} className={cx('category-pill', activeCategory === category.name && 'selected')} onClick={() => setActiveCategory(category.name)}>{category.name}</button>)}</div>
        <div className="results-label"><span><strong>{filteredVendors.length}</strong> {filteredVendors.length === 1 ? 'stall' : 'stalls'} to explore</span><span>Demo availability · changes locally</span></div>
        {filteredVendors.length ? <div className="vendor-grid explore-vendor-grid">{filteredVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} menuItems={menuItems} favorite={favorites.includes(`vendor:${vendor.id}`)} onOpen={() => openVendor(vendor.id)} onFavorite={() => toggleFavorite(`vendor:${vendor.id}`)} />)}</div> : <EmptyState icon={<Search size={24} />} title="No stalls found" detail="Try another dish or loosen the filters to find something tasty." action={<Button variant="secondary" onClick={resetSearch}>Reset filters</Button>} />}
        <p className="demo-footnote"><Info size={14} /> All stall names, menus, prices, opening times, and ratings here are fictional demonstration data.</p>
      </section>}

      {view === 'vendor' && selectedVendor && <section className="page-view vendor-view">
        <button className="back-link" onClick={() => navigate('explore')}><ArrowLeft size={16} /> Back to all stalls</button>
        <div className="vendor-hero"><FoodImage src={selectedVendor.image} alt={`${selectedVendor.name} sample cover`} className="vendor-cover" /><div className="vendor-profile-card"><div className="vendor-avatar-large">{selectedVendor.avatar}</div><div className="vendor-profile-text"><div className="vendor-title-row"><h1>{selectedVendor.name}</h1><button className={cx('heart-button', favorites.includes(`vendor:${selectedVendor.id}`) && 'saved')} aria-label="Save vendor" onClick={() => toggleFavorite(`vendor:${selectedVendor.id}`)}><Heart size={19} fill={favorites.includes(`vendor:${selectedVendor.id}`) ? 'currentColor' : 'none'} /></button></div><p>{selectedVendor.category}</p><div className="vendor-meta"><span><Clock3 size={14} /> {selectedVendor.prepTime}</span><span><MapPin size={14} /> Pickup{selectedVendor.acceptsDelivery ? ' · Delivery' : ''}</span><span><strong>★ {selectedVendor.rating}</strong> <small>demo rating</small></span></div></div><div className="vendor-open-info"><Pill tone={selectedVendor.isOpen ? 'success' : 'warning'}>{selectedVendor.isOpen ? 'Open for demo orders' : 'Temporarily paused'}</Pill><small><Clock3 size={13} /> {selectedVendor.hours}</small></div></div></div>
        {!selectedVendor.isOpen && <div className="inline-notice warning-notice"><Info size={18} /><p><strong>This stall is paused in the demo.</strong> You can still browse its menu, but adding items is unavailable until it is reopened in the vendor dashboard.</p><Button variant="secondary" size="small" onClick={() => navigate('vendorDashboard')}>Open vendor demo</Button></div>}
        <div className="vendor-menu-head"><div><p className="eyebrow">MADE FRESH, MADE LOCAL (DEMO)</p><h2>On the menu</h2><p>Pick your favorites. Prices and availability are sample data.</p></div><div className="menu-support-note"><PackageCheck size={20} /><span>Cash payment<br /><strong>at collection / handoff</strong></span></div></div>
        <div className="menu-category-row">{Array.from(new Set(menuItems.filter((item) => item.vendorId === selectedVendor.id).map((item) => item.category))).map((category) => <button key={category} onClick={() => { setActiveCategory(category); document.getElementById(`menu-${category.replaceAll(' ', '-')}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{category}<ChevronRight size={13} /></button>)}</div>
        {Array.from(new Set(menuItems.filter((item) => item.vendorId === selectedVendor.id).map((item) => item.category))).map((category) => <section className="menu-category-section" id={`menu-${category.replaceAll(' ', '-')}`} key={category}><h3>{category}</h3><div className="vendor-food-list">{menuItems.filter((item) => item.vendorId === selectedVendor.id && item.category === category).map((item) => <MenuRow key={item.id} item={item} onAdd={() => openItem(item)} onFavorite={() => toggleFavorite(`dish:${item.id}`)} favorite={favorites.includes(`dish:${item.id}`)} isVendorOpen={selectedVendor.isOpen} />)}</div></section>)}
        <div className="demo-footnote"><Info size={14} /> This is a demonstration storefront. Vendor identities, hours, prices, and fulfillment points are not verified college facilities.</div>
      </section>}

      {view === 'favorites' && <section className="page-view">
        <div className="page-intro"><div><p className="eyebrow">YOUR LITTLE LIST</p><h1>Saved for <em>later.</em></h1><p>Keep your go-to stalls and the dishes you want to try close by.</p></div><div className="intro-mark"><Heart size={27} /><span>Made<br />yours</span></div></div>
        {favoriteVendors.length === 0 && favoriteDishes.length === 0 ? <EmptyState icon={<Bookmark size={25} />} title="Nothing saved just yet" detail="Tap the little heart on a stall or dish to make your own shortlist." action={<Button onClick={() => openExplore()}>Explore stalls <ArrowRight size={16} /></Button>} /> : <>
          {favoriteVendors.length > 0 && <section className="section-block compact-section"><SectionHeading title="Saved stalls" detail={`${favoriteVendors.length} ${favoriteVendors.length === 1 ? 'stall' : 'stalls'} on your list`} /><div className="vendor-grid">{favoriteVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} menuItems={menuItems} favorite onOpen={() => openVendor(vendor.id)} onFavorite={() => toggleFavorite(`vendor:${vendor.id}`)} />)}</div></section>}
          {favoriteDishes.length > 0 && <section className="section-block compact-section"><SectionHeading title="Saved dishes" detail={`${favoriteDishes.length} menu ${favoriteDishes.length === 1 ? 'item' : 'items'} to remember`} /><div className="food-grid">{favoriteDishes.map((item) => <FoodCard key={item.id} item={item} vendor={vendors.find((vendor) => vendor.id === item.vendorId)!} favorite onOpen={() => openItem(item)} onVendor={() => openVendor(item.vendorId)} onFavorite={() => toggleFavorite(`dish:${item.id}`)} />)}</div></section>}
        </>}
      </section>}

      {view === 'cart' && <section className="page-view checkout-layout-page"><div className="checkout-main-col"><button className="back-link" onClick={() => navigate('explore')}><ArrowLeft size={16} /> Keep browsing</button><div className="page-title-inline"><div><p className="eyebrow">YOUR ORDER, SO FAR</p><h1>Your <em>cart.</em></h1><p className="page-intro-sub">A thoughtful little break, coming right up.</p></div>{cart.length > 0 && <Button variant="ghost" size="small" onClick={() => { setCart([]); setToast('Cart cleared.') }}><Trash2 size={15} /> Clear cart</Button>}</div>
        {!cart.length ? <EmptyState icon={<ShoppingCart size={27} />} title="Your cart is taking a break" detail="Browse the campus stalls and add something to get started." action={<Button onClick={() => openExplore()}>Find food <ArrowRight size={16} /></Button>} /> : <>
          <div className="cart-vendor-heading"><span className="mini-vendor-avatar">{currentVendor?.avatar}</span><div><strong>{currentVendor?.name}</strong><small>One stall per checkout</small></div><Button size="small" variant="ghost" onClick={() => openVendor(currentVendor?.id ?? '')}>View menu <ArrowRight size={14} /></Button></div>
          <div className="cart-lines">{cart.map((line) => { const item = menuItems.find((candidate) => candidate.id === line.itemId); if (!item) return null; return <div className="cart-line" key={line.id}><FoodImage src={item.image} alt={item.name} className="cart-line-image" /><div className="cart-line-info"><strong>{item.name}</strong><p>{[line.size, ...line.addonNames].filter(Boolean).join(' · ') || 'As listed'}</p>{line.instructions && <small>Note: {line.instructions}</small>}<button className="cart-edit-link" onClick={() => editCartLine(line)}><Pencil size={12} /> Edit options</button><span className="cart-line-price">{money(getLineTotal(line, item))}</span></div><div className="quantity-stepper"><button aria-label={`Remove one ${item.name}`} onClick={() => updateLineQuantity(line.id, -1)}><Minus size={14} /></button><span>{line.quantity}</span><button aria-label={`Add one ${item.name}`} onClick={() => updateLineQuantity(line.id, 1)}><Plus size={14} /></button></div><button className="remove-line" aria-label={`Remove ${item.name}`} onClick={() => setCart((current) => current.filter((candidate) => candidate.id !== line.id))}><Trash2 size={16} /></button></div> })}</div>
          <label className="form-label cart-note-label">Anything else for the stall? <span>Optional note</span><textarea value={cartNote} rows={2} placeholder="Keep the sauce on the side…" onChange={(event) => setCartNote(event.target.value)} /></label>
          <div className="order-assurance"><ShieldCheck size={19} /><p><strong>No online payments here.</strong> This demo uses cash at pickup or when your campus handoff arrives.</p></div>
        </>}
      </div>
      {cart.length > 0 && <aside className="summary-card"><div className="summary-card-heading"><h2>Order summary</h2><span>{cartCount} item{cartCount === 1 ? '' : 's'}</span></div><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Campus delivery fee <small>if selected</small></span><strong>{money(fulfillment === 'delivery' ? SERVICE.deliveryFee : 0)}</strong></div><div className="summary-divider" /><div className="summary-row total-row"><span>Total estimate</span><strong>{money(subtotal + (fulfillment === 'delivery' ? SERVICE.deliveryFee : 0))}</strong></div><p className="summary-caption">Final amount is confirmed before placing the demo order.</p><Button className="full-button" onClick={startCheckout}>Continue to checkout <ArrowRight size={17} /></Button><div className="summary-safety"><ShieldCheck size={15} /> Cash payment only · demo order</div></aside>}
      </section>}

      {view === 'checkout' && <section className="page-view checkout-layout-page checkout-view"><div className="checkout-main-col"><button className="back-link" onClick={() => navigate('cart')}><ArrowLeft size={16} /> Back to cart</button><div className="page-title-inline"><div><p className="eyebrow">ALMOST THERE</p><h1>Make it <em>yours.</em></h1><p className="page-intro-sub">Choose how your food meets you on campus.</p></div><div className="step-indicator"><span>1</span><span className="step-current">2</span><span>3</span></div></div>
        {checkoutError && <div className="form-error"><Info size={16} /> {checkoutError}</div>}
        <form onSubmit={placeOrder} className="checkout-form">
          <section className="checkout-form-section"><div className="form-section-heading"><span className="step-number">01</span><div><h2>Pickup or campus delivery?</h2><p>Only supported methods appear for this stall.</p></div></div><div className="fulfillment-options">
            <button type="button" className={cx('fulfillment-option', fulfillment === 'pickup' && 'selected')} disabled={!currentVendor?.acceptsPickup} onClick={() => { setFulfillment('pickup'); setDestination(SERVICE.pickupLocations[0]); setCheckoutError('') }}><span className="fulfillment-icon"><Store size={20} /></span><span><strong>I'll pick it up</strong><small>Collect from a campus demo point</small></span><span className="radio-dot" /></button>
            <button type="button" className={cx('fulfillment-option', fulfillment === 'delivery' && 'selected')} disabled={!currentVendor?.acceptsDelivery} onClick={() => { setFulfillment('delivery'); setDestination(SERVICE.deliveryLocations[0]); setCheckoutError('') }}><span className="fulfillment-icon"><Bike size={21} /></span><span><strong>Campus handoff</strong><small>Delivery to an approved demo point</small></span><span className="radio-dot" /></button>
          </div>{(!currentVendor?.acceptsPickup || !currentVendor?.acceptsDelivery) && <p className="form-helper">This stall currently supports {currentVendor?.acceptsPickup && currentVendor?.acceptsDelivery ? 'pickup and delivery' : currentVendor?.acceptsPickup ? 'pickup only' : 'campus delivery only'} in the demo.</p>}</section>
          <section className="checkout-form-section"><div className="form-section-heading"><span className="step-number">02</span><div><h2>{fulfillment === 'pickup' ? 'Where will you collect?' : 'Where on campus?'}</h2><p>These are editable example points, not verified campus facilities.</p></div></div><label className="form-label">{fulfillment === 'pickup' ? 'Collection point' : 'Campus handoff point'}<span className="required-mark">Required</span><div className="select-wrap"><MapPin size={16} /><select required value={destination} onChange={(event) => setDestination(event.target.value)}>{(fulfillment === 'pickup' ? SERVICE.pickupLocations : SERVICE.deliveryLocations).map((location) => <option key={location} value={location}>{location}</option>)}</select><ChevronDown size={16} /></div></label>
            {fulfillment === 'delivery' && <label className="form-label">Handoff instructions <span>Optional</span><textarea rows={2} value={deliveryInstructions} onChange={(event) => setDeliveryInstructions(event.target.value)} placeholder="e.g. I'll be waiting near the demo landmark." /><small className="field-hint">Please keep instructions within the campus location selected above. No arbitrary street addresses.</small></label>}
          </section>
          <section className="checkout-form-section"><div className="form-section-heading"><span className="step-number">03</span><div><h2>A name for the order</h2><p>Optional in this account-free demo.</p></div></div><label className="form-label">Name to call <span>Optional</span><input type="text" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Alex" maxLength={50} /></label></section>
          <section className="checkout-form-section payment-section"><div className="form-section-heading"><span className="step-number">04</span><div><h2>Pay with cash</h2><p>No card, e-wallet, or online payment is connected.</p></div></div><div className="cash-payment-card"><span className="cash-icon"><Wallet size={21} /></span><div><strong>{fulfillment === 'pickup' ? 'Cash at pickup' : 'Cash at campus handoff'}</strong><p>{fulfillment === 'pickup' ? 'Pay the stall when you collect your food.' : 'Pay when you receive the order at your selected campus point.'}</p></div><CheckCircle2 size={18} /></div></section>
          <div className="checkout-submit-mobile"><Button type="submit" className="full-button">Place demo order · {money(subtotal + getDeliveryFee(fulfillment, currentVendor))} <ArrowRight size={17} /></Button><small>Submitting creates a local demo order only.</small></div>
        </form>
      </div>
      <aside className="summary-card checkout-summary-card"><div className="summary-card-heading"><h2>Your order</h2><button className="text-link tiny-link" onClick={() => navigate('cart')}>Edit</button></div><div className="mini-order-lines">{cart.map((line) => { const item = menuItems.find((candidate) => candidate.id === line.itemId); return item ? <div className="mini-order-line" key={line.id}><FoodImage src={item.image} alt={item.name} className="mini-order-image" /><div><strong>{item.name}</strong><small>Qty {line.quantity}{line.size ? ` · ${line.size}` : ''}</small></div><b>{money(getLineTotal(line, item))}</b></div> : null })}</div><div className="summary-divider" /><div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-row"><span>Delivery fee</span><strong>{money(getDeliveryFee(fulfillment, currentVendor))}</strong></div><div className="summary-divider" /><div className="summary-row total-row"><span>Total to pay in cash</span><strong>{money(subtotal + getDeliveryFee(fulfillment, currentVendor))}</strong></div><div className="eta-note"><Clock3 size={17} /><span>Approx. {currentVendor?.prepTime ?? '10–15 min'} prep time<br /><small>Sample estimate, not a live promise.</small></span></div><div className="desktop-checkout-submit"><Button type="submit" className="full-button" onClick={() => { const form = document.querySelector<HTMLFormElement>('.checkout-form'); form?.requestSubmit() }}>Confirm demo order <ArrowRight size={17} /></Button><p>Nothing is sent to a real vendor.</p></div></aside>
      </section>}

      {view === 'confirmation' && (() => { const order = orders.find((candidate) => candidate.id === confirmedOrderId); if (!order) return <EmptyState icon={<ShoppingBag size={25} />} title="No confirmed order found" detail="The demo order may have been reset. Start browsing to create a new one." action={<Button onClick={() => navigate('home')}>Back to FoodStall</Button>} />; return <section className="confirmation-page"><div className="confirmation-confetti" aria-hidden="true">✳ <span>✦</span> · ✳</div><div className="confirmation-check"><Check size={33} /></div><p className="eyebrow">A LITTLE SOMETHING TO LOOK FORWARD TO</p><h1>Order placed.<br /><em>You're all set.</em></h1><p className="confirmation-sub">Your demo order is saved in this browser. No real stall has been notified and no payment was taken.</p><div className="confirmed-order-card"><div className="confirmed-order-top"><div><small>DEMO ORDER NUMBER</small><h2>{shortOrder(order.id)}</h2></div><StatusPill status={order.status} /></div><div className="confirmation-vendor"><span className="mini-vendor-avatar">{vendors.find((vendor) => vendor.id === order.vendorId)?.avatar ?? 'F'}</span><div><strong>{order.vendorName}</strong><small>{order.fulfillment === 'pickup' ? 'Pickup order' : 'Campus delivery order'}</small></div></div><div className="confirmed-detail-row"><span><MapPin size={15} /> {order.fulfillment === 'pickup' ? 'Collection point' : 'Campus handoff'}</span><strong>{order.destination}</strong></div><div className="confirmed-detail-row"><span><Wallet size={15} /> Payment</span><strong>{order.payment}</strong></div><div className="summary-divider" /><div className="summary-row total-row"><span>Total to pay</span><strong>{money(order.total)}</strong></div><div className="confirmed-items">{order.items.map((item, index) => <span key={`${item.itemId}-${index}`}>{item.quantity} × {item.name}</span>)}</div></div><div className="confirmation-actions"><Button onClick={() => orderTrack(order)}>Follow demo order <ArrowRight size={17} /></Button><Button variant="secondary" onClick={() => navigate('home')}>Back to home</Button></div><p className="confirmation-footnote"><ShieldCheck size={15} /> Cash is only expected at pickup / handoff if this were a real service.</p></section> })()}

      {view === 'tracking' && <section className="page-view tracking-view"><button className="back-link" onClick={() => navigate('orders')}><ArrowLeft size={16} /> Back to my orders</button>{!activeTrackingOrder ? <EmptyState icon={<Truck size={25} />} title="No order selected" detail="Choose a demonstration order from your order history to follow its status." action={<Button onClick={() => navigate('orders')}>View my orders</Button>} /> : <><div className="tracking-page-heading"><div><p className="eyebrow">YOUR ORDER PROGRESS</p><h1>On its <em>way.</em></h1><p>Follow the simulated status for <strong>{shortOrder(activeTrackingOrder.id)}</strong> from {activeTrackingOrder.vendorName}.</p></div><div className="tracking-visual"><Truck size={30} /><span>DEMO<br />TRACKING</span></div></div><div className="tracking-main-grid"><div className="tracking-status-card"><div className="tracking-status-top"><div><small>CURRENT STATUS</small><h2>{statusLabel(activeTrackingOrder.status)}</h2></div><StatusPill status={activeTrackingOrder.status} /></div><p className="tracking-description">{statusDescription(activeTrackingOrder.status, activeTrackingOrder.fulfillment)}</p>
            {['rejected', 'cancelled'].includes(activeTrackingOrder.status) ? <div className="terminal-order-note"><Info size={18} /><p>{activeTrackingOrder.statusNote || 'This order will remain in your demo order history.'}</p></div> : <div className="order-timeline">{(activeTrackingOrder.fulfillment === 'pickup' ? ['placed', 'accepted', 'preparing', 'ready', 'completed'] as OrderStatus[] : ['placed', 'accepted', 'preparing', 'out_for_delivery', 'completed'] as OrderStatus[]).map((status) => { const eventIndex = activeTrackingOrder.timeline.findIndex((event) => event.status === status); const latestIndex = Math.max(...activeTrackingOrder.timeline.map((event) => (activeTrackingOrder.fulfillment === 'pickup' ? ['placed', 'accepted', 'preparing', 'ready', 'completed'] : ['placed', 'accepted', 'preparing', 'out_for_delivery', 'completed']).indexOf(event.status))); const orderIndex = (activeTrackingOrder.fulfillment === 'pickup' ? ['placed', 'accepted', 'preparing', 'ready', 'completed'] : ['placed', 'accepted', 'preparing', 'out_for_delivery', 'completed']).indexOf(status); const done = orderIndex <= latestIndex; const event = eventIndex >= 0 ? activeTrackingOrder.timeline[eventIndex] : undefined; return <div className={cx('timeline-item', done && 'timeline-done', eventIndex >= 0 && 'timeline-has-event')} key={status}><span className="timeline-icon">{done ? <Check size={15} /> : <span />}</span><div><strong>{statusLabel(status)}</strong><p>{event?.note ?? timelineHint(status, activeTrackingOrder.fulfillment)}</p>{event && <small>{formatTime(event.at)} · {formatDate(event.at)}</small>}</div></div> })}</div>}
            <div className="tracking-disclaimer"><Info size={15} /><span>This is a frontend simulation only. There is no live GPS, dispatch, vendor notification, or real-time status connection.</span></div>
            {activeTrackingOrder.status === 'placed' && <Button variant="outline" className="cancel-order-button" onClick={() => updateOrderStatus(activeTrackingOrder.id, 'cancelled', 'Cancelled by the demo customer.')}>Cancel demo order</Button>}
          </div><aside className="tracking-order-summary"><div className="tracking-summary-title"><div><small>ORDER DETAILS</small><h2>{shortOrder(activeTrackingOrder.id)}</h2></div><span>{formatTime(activeTrackingOrder.createdAt)}</span></div><div className="tracking-vendor-row"><span className="mini-vendor-avatar">{vendors.find((vendor) => vendor.id === activeTrackingOrder.vendorId)?.avatar ?? 'F'}</span><div><strong>{activeTrackingOrder.vendorName}</strong><small>{activeTrackingOrder.fulfillment === 'pickup' ? 'Pickup' : 'Campus delivery'}</small></div></div><div className="tracking-location"><MapPin size={16} /><div><small>{activeTrackingOrder.fulfillment === 'pickup' ? 'Collection point' : 'Campus handoff point'}</small><strong>{activeTrackingOrder.destination}</strong></div></div>{activeTrackingOrder.items.map((item, index) => <div className="tracked-order-line" key={`${item.itemId}-${index}`}><span>{item.quantity} × {item.name}</span><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}<div className="summary-divider" /><div className="summary-row"><span>Subtotal</span><strong>{money(activeTrackingOrder.subtotal)}</strong></div><div className="summary-row"><span>Delivery fee</span><strong>{money(activeTrackingOrder.deliveryFee)}</strong></div><div className="summary-row total-row"><span>Total</span><strong>{money(activeTrackingOrder.total)}</strong></div><div className="cash-reminder"><Wallet size={17} /><span><strong>{activeTrackingOrder.payment}</strong><small>No online payment is connected.</small></span></div><Button variant="secondary" className="full-button" onClick={() => navigate('orders')}>View order history</Button></aside></div></>}</section>}

      {view === 'orders' && <section className="page-view"><div className="page-intro"><div><p className="eyebrow">EVERYTHING IN ONE PLACE</p><h1>Your order <em>story.</em></h1><p>Previous and current orders from your local FoodStall demo.</p></div><div className="intro-mark"><ClipboardList size={28} /><span>Order<br />history</span></div></div>
        {orders.length === 0 ? <EmptyState icon={<ClipboardList size={25} />} title="No orders yet" detail="When you place a demo order, it will be saved here for easy tracking." action={<Button onClick={() => openExplore()}>Explore stalls</Button>} /> : <div className="orders-list">{orders.map((order) => <article className="order-history-card" key={order.id}><div className="order-history-top"><div className="order-history-vendor"><span className="mini-vendor-avatar">{vendors.find((vendor) => vendor.id === order.vendorId)?.avatar ?? 'F'}</span><div><strong>{order.vendorName}</strong><small>{shortOrder(order.id)} · {formatDate(order.createdAt)} · {formatTime(order.createdAt)}</small></div></div><StatusPill status={order.status} /></div><div className="order-history-middle"><div>{order.items.map((item, index) => <span key={`${item.itemId}-${index}`}>{item.quantity} × {item.name}{index < order.items.length - 1 ? ', ' : ''}</span>)}<small><MapPin size={13} /> {order.fulfillment === 'pickup' ? 'Pickup' : 'Campus delivery'} · {order.destination}</small></div><strong className="history-total">{money(order.total)}</strong></div><div className="order-history-bottom"><span className="payment-mini"><Wallet size={14} /> {order.payment}</span><div className="order-actions"><Button size="small" variant="secondary" onClick={() => orderTrack(order)}>View tracking <ArrowRight size={14} /></Button>{['completed', 'rejected', 'cancelled'].includes(order.status) && <Button size="small" variant="ghost" onClick={() => { const available = order.items.every((line) => menuItems.find((item) => item.id === line.itemId)?.available); if (!available) { setToast('Some old items are unavailable; choose fresh items from the menu.'); return } const first = order.items[0]; const vendor = vendors.find((candidate) => candidate.id === order.vendorId); if (!vendor?.isOpen) { setToast('That stall is paused. Browse an open stall to order again.'); return } setCart(order.items.map((line, index) => ({ id: `reorder-${Date.now()}-${index}`, vendorId: order.vendorId, itemId: line.itemId, quantity: line.quantity, size: line.size, addonNames: line.addonNames, instructions: line.instructions }))); setSelectedVendorId(first ? order.vendorId : selectedVendorId); navigate('cart'); setToast('Items copied to a new demo cart. Review prices and options before checkout.') }}><RotateCcw size={14} /> Reorder</Button>}</div></div></article>)}</div>}
        <div className="demo-footnote"><Info size={14} /> The starting order history includes sample orders for demonstration. Status changes are shared with the vendor demo dashboard.</div>
      </section>}

      {view === 'profile' && <section className="page-view profile-view">
        <div className="profile-page-heading">
          <div>
            <p className="eyebrow">YOUR FOODSTALL CORNER</p>
            <h1>Your profile, <em>your pace.</em></h1>
            <p>Welcome, {profileDisplayName}. Keep your demo details, saved picks, and campus orders together in one place.</p>
          </div>
          <div className="profile-heading-art"><span className="profile-heading-spark"><Sparkles size={19} /></span><div className="profile-heading-avatar">{profileName.trim() ? profileName.trim().charAt(0).toUpperCase() : <CircleUserRound size={36} />}</div><span className="profile-heading-note">A little corner<br />just for you</span></div>
        </div>

        <div className="profile-dashboard-grid">
          <div className="profile-left-column">
            <section className="profile-card profile-identity-card">
              <div className="profile-identity-top">
                <div className="profile-avatar">{profileName.trim() ? profileName.trim().charAt(0).toUpperCase() : <CircleUserRound size={31} />}</div>
                <div className="profile-identity-copy"><span className="profile-demo-chip"><span /> DEMO PROFILE</span><h2>{profileDisplayName}</h2><p>Saved in this browser only</p></div>
              </div>
              <form className="profile-edit-form" onSubmit={(event) => { event.preventDefault(); const cleanedName = profileName.trim().slice(0, 50); setProfileName(cleanedName); writeStored(STORE_KEYS.profileName, cleanedName); setToast('Your profile name has been saved on this device.') }}>
                <label className="form-label" htmlFor="profile-display-name">What should stalls call you?</label>
                <input id="profile-display-name" className="profile-name-input" value={profileName} maxLength={50} onChange={(event) => setProfileName(event.target.value)} placeholder="Enter a display name" autoComplete="nickname" />
                <p className="profile-form-hint">This name is used for demo orders when you leave the checkout name blank.</p>
                <div className="profile-edit-actions"><Button type="submit"><Check size={16} /> Save profile</Button><Button type="button" variant="ghost" onClick={() => { setProfileName(''); writeStored(STORE_KEYS.profileName, ''); setToast('Profile name cleared. Orders will use “Campus guest” unless you enter another name.') }}>Clear name</Button></div>
              </form>
              <div className="profile-stats profile-stats-enhanced">
                <div><strong>{orders.length}</strong><span>All demo orders</span></div>
                <div><strong>{completedProfileOrders}</strong><span>Completed</span></div>
                <div><strong>{favorites.length}</strong><span>Saved picks</span></div>
                <div><strong>{cartCount}</strong><span>In your cart</span></div>
              </div>
              <div className="profile-shortcuts profile-shortcuts-enhanced">
                <button onClick={() => navigate('orders')}><span className="profile-shortcut-icon"><ClipboardList size={18} /></span><span><strong>My orders</strong><small>Check progress and past orders</small></span><b>{orders.length}</b><ChevronRight size={17} /></button>
                <button onClick={() => navigate('favorites')}><span className="profile-shortcut-icon"><Heart size={18} /></span><span><strong>Saved items</strong><small>Your favorite stalls and dishes</small></span><b>{favorites.length}</b><ChevronRight size={17} /></button>
                <button onClick={() => navigate('cart')}><span className="profile-shortcut-icon"><ShoppingBag size={18} /></span><span><strong>Your cart</strong><small>Review your current selection</small></span><b>{cartCount}</b><ChevronRight size={17} /></button>
              </div>
            </section>

            <section className="profile-recent-card">
              <div className="profile-section-head"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Your latest orders</h2></div><button className="text-link" onClick={() => navigate('orders')}>View all <ArrowRight size={15} /></button></div>
              {recentProfileOrders.length ? <div className="profile-recent-list">{recentProfileOrders.map((order) => <article className="profile-recent-order" key={order.id}>
                <span className="profile-recent-vendor">{vendors.find((vendor) => vendor.id === order.vendorId)?.avatar ?? 'F'}</span>
                <div className="profile-recent-info"><strong>{order.vendorName}</strong><small>{shortOrder(order.id)} · {formatDate(order.createdAt)}</small><span>{order.fulfillment === 'pickup' ? 'Pickup' : 'Campus delivery'} · {order.items.reduce((total, item) => total + item.quantity, 0)} item{order.items.reduce((total, item) => total + item.quantity, 0) === 1 ? '' : 's'}</span></div>
                <div className="profile-recent-end"><strong>{money(order.total)}</strong><StatusPill status={order.status} /><button aria-label={`Track order ${shortOrder(order.id)}`} onClick={() => orderTrack(order)}><ArrowRight size={16} /></button></div>
              </article>)}</div> : <div className="profile-empty-recent"><ClipboardList size={24} /><strong>Your order story starts here.</strong><p>Your demo orders will appear here after you try the checkout flow.</p><Button onClick={() => openExplore()}>Explore stalls <ArrowRight size={15} /></Button></div>}
            </section>
          </div>

          <div className="profile-right-column">
            <section className="profile-benefit-card"><div className="profile-benefit-icon"><ShieldCheck size={21} /></div><div><p className="eyebrow">A SAFE LITTLE DEMO</p><h2>No account needed.</h2><p>FoodStall is a website prototype. Your name and sample activity stay in this browser, and nothing is sent to real vendors.</p></div><div className="profile-benefit-points"><span><CheckCircle2 size={16} /> No sign-in or student ID</span><span><CheckCircle2 size={16} /> Cash-only flow shown for demonstration</span><span><CheckCircle2 size={16} /> Campus demo locations only</span></div></section>
            <div className="help-panel profile-help-panel"><p className="eyebrow">GOOD TO KNOW</p><h2>A few helpful answers.</h2>{[
          ['Is FoodStall an official college service?', 'No. FoodStall is an independent frontend prototype. The stalls, sample ratings, prices, and campus landmarks shown are fictional and are not claims of college approval or endorsement.'],
          ['Can I really order food here?', 'Not in this version. Placing an order creates a demonstration record in your browser only. It does not notify a vendor, charge you, or trigger a delivery.'],
          ['How does payment work in the demo?', 'Cash at pickup or cash at campus handoff is the only displayed method. There are no credit-card, GCash, or other online payment integrations.'],
          ['Can I deliver outside campus?', 'No. The prototype only offers an editable list of campus demo points. It does not accept arbitrary off-campus addresses.'],
          ['Will my saved items remain after refresh?', 'Favorites, cart contents, menu edits, vendor availability, and demo orders are saved in this browser using local storage. This is not secure server-side storage.'],
        ].map(([question, answer], index) => <div className="faq-item" key={question}><button onClick={() => setFaqOpen(faqOpen === index ? null : index)} aria-expanded={faqOpen === index}><span>{question}</span>{faqOpen === index ? <Minus size={17} /> : <Plus size={17} />}</button>{faqOpen === index && <p>{answer}</p>}</div>)}<div className="profile-shortcuts profile-help-shortcuts"><button onClick={() => navigate('vendorDashboard')}><span className="profile-shortcut-icon"><LayoutDashboard size={17} /></span><span><strong>Vendor dashboard demo</strong><small>Manage sample orders and menu items</small></span><ChevronRight size={17} /></button><button onClick={() => navigate('operations')}><span className="profile-shortcut-icon"><PanelTop size={17} /></span><span><strong>Operations demo</strong><small>Review stall status and service settings</small></span><ChevronRight size={17} /></button></div></div>
          </div>
        </div>
        <div className="reset-demo-row profile-reset-row"><div><strong>Want a fresh start?</strong><p>Restore the original sample stalls and menus, clear your cart and favorites, and replace demo orders.</p></div><Button variant="outline" onClick={() => setResetOpen(true)}><RotateCcw size={15} /> Reset demo data</Button></div>
      </section>}

      {view === 'vendorDashboard' && <section className="page-view dashboard-view"><div className="dashboard-page-heading"><div><p className="eyebrow">VENDOR WORKSPACE · DEMO</p><h1>Run your <em>stall.</em></h1><p>Manage sample orders and menu availability. Changes appear in the customer storefront on this device.</p></div><div className="dashboard-vendor-select"><label htmlFor="dashboard-vendor">DEMO STALL</label><select id="dashboard-vendor" value={dashboardVendorId} onChange={(event) => setDashboardVendorId(event.target.value)}>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select><ChevronDown size={16} /></div></div>
        <div className="dashboard-demo-warning"><Info size={17} /><p><strong>Demo role switch.</strong> This page is not protected by authentication or real vendor permissions. Every action updates local demonstration data only.</p></div>
        <div className="dashboard-welcome-row"><div className="dash-vendor-ident"><span className="dash-vendor-avatar">{dashboardVendor?.avatar}</span><div><h2>{dashboardVendor?.name}</h2><p>{dashboardVendor?.category} · {dashboardVendor?.hours}</p></div></div><button className={cx('store-toggle', dashboardVendor?.isOpen && 'is-open')} onClick={() => setVendorOpen(dashboardVendorId, !dashboardVendor?.isOpen)}><span className="toggle-dot" /><span>{dashboardVendor?.isOpen ? 'Open for demo orders' : 'Paused'}</span><ChevronDown size={14} /></button></div>
        <div className="dashboard-stats"><div className="dashboard-stat"><span className="dash-stat-icon stat-icon-peach"><ClipboardList size={18} /></span><small>Awaiting review</small><strong>{orders.filter((order) => order.vendorId === dashboardVendorId && order.status === 'placed').length}</strong><span>Orders to check</span></div><div className="dashboard-stat"><span className="dash-stat-icon stat-icon-blue"><CookingPot size={18} /></span><small>In preparation</small><strong>{orders.filter((order) => order.vendorId === dashboardVendorId && ['accepted', 'preparing'].includes(order.status)).length}</strong><span>Active kitchen work</span></div><div className="dashboard-stat"><span className="dash-stat-icon stat-icon-green"><PackageCheck size={18} /></span><small>Ready / handoff</small><strong>{orders.filter((order) => order.vendorId === dashboardVendorId && ['ready', 'out_for_delivery'].includes(order.status)).length}</strong><span>Awaiting completion</span></div><div className="dashboard-stat"><span className="dash-stat-icon stat-icon-gold"><CircleDollarSign size={18} /></span><small>Completed value</small><strong>{money(orders.filter((order) => order.vendorId === dashboardVendorId && order.status === 'completed').reduce((sum, order) => sum + order.total, 0))}</strong><span>Sample sales only</span></div></div>
        <div className="dashboard-tab-row"><button className={cx(dashboardTab === 'orders' && 'active')} onClick={() => setDashboardTab('orders')}><ClipboardList size={17} /> Orders <span>{orders.filter((order) => order.vendorId === dashboardVendorId && !['completed', 'rejected', 'cancelled'].includes(order.status)).length}</span></button><button className={cx(dashboardTab === 'menu' && 'active')} onClick={() => setDashboardTab('menu')}><Utensils size={17} /> Menu management <span>{menuItems.filter((item) => item.vendorId === dashboardVendorId).length}</span></button></div>
        {dashboardTab === 'orders' ? <div className="dashboard-orders-panel"><div className="dashboard-panel-heading"><div><h2>Incoming orders</h2><p>Open an order to review item details and update its status.</p></div><span className="demo-live-label"><span /> Local demo queue</span></div>{orders.filter((order) => order.vendorId === dashboardVendorId).length ? <div className="dashboard-order-table">{orders.filter((order) => order.vendorId === dashboardVendorId).map((order) => <article className="dashboard-order-row" key={order.id}><div className="dashboard-order-id"><strong>{shortOrder(order.id)}</strong><small>{formatTime(order.createdAt)} · {order.customerName}</small></div><div className="dashboard-order-items"><strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)} item{order.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}</strong><small>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</small></div><div className="dashboard-order-fulfilment"><span>{order.fulfillment === 'pickup' ? <Store size={14} /> : <Bike size={14} />}{order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}</span><small>{order.destination}</small></div><div className="dashboard-order-end"><StatusPill status={order.status} /><strong>{money(order.total)}</strong><button className="text-link" onClick={() => setDetailOrderId(order.id)}>Review order <ChevronRight size={14} /></button></div></article>)}</div> : <EmptyState icon={<ClipboardList size={25} />} title="No demo orders for this stall" detail="Place a sample order in the customer storefront, or switch to a stall with existing demo orders." action={<Button variant="secondary" onClick={() => navigate('explore')}>Browse storefront</Button>} />}</div> : <div className="dashboard-menu-panel"><div className="dashboard-panel-heading"><div><h2>Your menu</h2><p>Edit sample dishes or mark an item unavailable to customers.</p></div><Button onClick={() => openMenuForm()}><Plus size={16} /> Add menu item</Button></div><div className="dashboard-menu-list">{menuItems.filter((item) => item.vendorId === dashboardVendorId).map((item) => <article className="dashboard-menu-row" key={item.id}><FoodImage src={item.image} alt={item.name} className="dashboard-menu-image" /><div className="dashboard-menu-info"><strong>{item.name}</strong><small>{item.category} · {item.description}</small><b>{money(item.price)}</b></div><Pill tone={item.available ? 'success' : 'danger'}>{item.available ? 'Available' : 'Sold out'}</Pill><div className="dashboard-menu-actions"><button aria-label={`Edit ${item.name}`} title="Edit item" onClick={() => openMenuForm(item)}><Pencil size={15} /></button><button aria-label={`${item.available ? 'Mark sold out' : 'Mark available'} ${item.name}`} title={item.available ? 'Mark sold out' : 'Mark available'} onClick={() => { setMenuItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, available: !candidate.available } : candidate)); setToast(`${item.name} marked ${item.available ? 'sold out' : 'available'}.`) }}>{item.available ? <X size={16} /> : <Check size={16} />}</button></div></article>)}</div></div>}
        <div className="dashboard-bottom-note"><ShieldCheck size={17} /><span><strong>State stays in sync.</strong> Menu and order updates are shared with the customer-facing pages through local demo state.</span></div>
      </section>}

      {view === 'operations' && <section className="page-view operations-view"><div className="page-intro"><div><p className="eyebrow">OPERATIONS · DEMO ONLY</p><h1>The bigger <em>picture.</em></h1><p>A lightweight view of the campus marketplace and editable prototype settings.</p></div><div className="intro-mark"><PanelTop size={27} /><span>Ops<br />overview</span></div></div><div className="ops-metrics"><div><small>Total stalls</small><strong>{vendors.length}</strong></div><div><small>Open in demo</small><strong>{vendors.filter((vendor) => vendor.isOpen).length}</strong></div><div><small>Sample orders</small><strong>{orders.length}</strong></div><div><small>Cash payment modes</small><strong>2</strong></div></div><section className="operations-vendors"><div className="dashboard-panel-heading"><div><h2>Stall overview</h2><p>Switch status to see the customer storefront change.</p></div><Button variant="outline" onClick={() => setResetOpen(true)}><RotateCcw size={15} /> Reset demo</Button></div>{vendors.map((vendor) => <div className="operations-vendor-row" key={vendor.id}><span className="mini-vendor-avatar">{vendor.avatar}</span><div><strong>{vendor.name}</strong><small>{vendor.category}</small></div><Pill tone={vendor.isOpen ? 'success' : 'warning'}>{vendor.isOpen ? 'Open' : 'Paused'}</Pill><span className="ops-order-count">{orders.filter((order) => order.vendorId === vendor.id).length} demo orders</span><button className={cx('mini-toggle', vendor.isOpen && 'on')} onClick={() => setVendorOpen(vendor.id, !vendor.isOpen)} aria-label={`Set ${vendor.name} ${vendor.isOpen ? 'paused' : 'open'}`}><span /></button></div>)}</section><section className="operations-settings"><div><h2>Service settings</h2><p>Centralized editable demo settings live in <code>src/config/brand.ts</code>.</p></div><div className="ops-setting-line"><span>Campus service</span><strong>DEBESMSCAT · demo only</strong></div><div className="ops-setting-line"><span>Payment method</span><strong>Cash at pickup / handoff</strong></div><div className="ops-setting-line"><span>Sample delivery fee</span><strong>{money(SERVICE.deliveryFee)}</strong></div><div className="ops-setting-line"><span>Delivery boundary</span><strong>Listed campus demo points only</strong></div></section><div className="demo-footnote"><Info size={14} /> Role switching and operations controls are presentation conveniences, not access control. No approvals or real orders are managed here.</div></section>}
    </main>

    {showHeader && <footer className="site-footer"><div className="footer-top"><div className="brand-lockup footer-brand"><BrandMark /><span><strong>{BRAND.name}</strong><small>GOOD FOOD, CAMPUS CLOSE</small></span></div><p>Small campus breaks.<br />A little easier.</p><div className="footer-links"><button onClick={() => navigate('profile')}>How it works</button><button onClick={() => navigate('vendorDashboard')}>Vendor demo</button><button onClick={() => navigate('operations')}>Operations demo</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} FoodStall · Frontend prototype</span><span><ShieldCheck size={13} /> Independent demo · not an official college service</span></div></footer>}

    {cartCount > 0 && !['cart', 'checkout', 'confirmation'].includes(view) && <button className="floating-cart" onClick={() => navigate('cart')}><span className="floating-cart-icon"><ShoppingBag size={19} /><b>{cartCount}</b></span><span><strong>View your cart</strong><small>{cartCount} item{cartCount === 1 ? '' : 's'} · {money(subtotal)}</small></span><ArrowRight size={18} /></button>}

    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><button className={view === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Home size={19} /><span>Home</span></button><button className={view === 'explore' || view === 'vendor' ? 'active' : ''} onClick={() => openExplore()}><Search size={19} /><span>Explore</span></button><button className={view === 'favorites' ? 'active' : ''} onClick={() => navigate('favorites')}><Heart size={19} /><span>Saved</span></button><button className={view === 'orders' || view === 'tracking' || view === 'confirmation' ? 'active' : ''} onClick={() => navigate('orders')}><ClipboardList size={19} /><span>Orders</span></button><button className={view === 'profile' ? 'active' : ''} onClick={() => navigate('profile')}><CircleUserRound size={19} /><span>Profile</span></button><button className={cx(view === 'cart' || view === 'checkout' ? 'active' : '', 'mobile-cart-nav')} onClick={() => navigate('cart')}><ShoppingBag size={19} />{cartCount > 0 && <b>{cartCount}</b>}<span>Cart</span></button></nav>

    {itemModal && <ItemModal item={menuItems.find((item) => item.id === itemModal.itemId)!} state={itemModal} setState={setItemModal} onClose={() => setItemModal(null)} onAdd={addModalItem} />}
    {pendingSwap && <ModalShell title="Start a fresh cart?" eyebrow="ONE STALL AT A TIME" onClose={() => setPendingSwap(null)}><div className="swap-cart-body"><div className="swap-icon"><ShoppingBag size={22} /></div><p>Your cart has items from another stall. For this demo, checkout can only include one vendor at a time.</p><div className="swap-product-row"><span className="mini-vendor-avatar">{vendors.find((vendor) => vendor.id === pendingSwap.line.vendorId)?.avatar ?? 'F'}</span><div><strong>{pendingSwap.vendorName}</strong><small>Selected item will be added to a fresh cart.</small></div></div><p className="subtle-warning">Your current cart will be replaced only if you choose to continue.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setPendingSwap(null)}>Keep current cart</Button><Button onClick={confirmSwapCart}>Start fresh cart <ArrowRight size={16} /></Button></div></div></ModalShell>}
    {rejectOrderId && <ModalShell title="Reject this demo order?" eyebrow="VENDOR ACTION" onClose={() => setRejectOrderId('')}><div className="modal-form"><p>The customer-facing tracking page will show this order as rejected. No real order or payment is affected.</p><label className="form-label">Reason for rejection<textarea rows={3} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} maxLength={180} /></label><div className="modal-actions"><Button variant="secondary" onClick={() => setRejectOrderId('')}>Go back</Button><Button variant="danger" onClick={() => { updateOrderStatus(rejectOrderId, 'rejected', rejectReason.trim() || 'Rejected by vendor in demo.'); setRejectOrderId('') }}>Reject order</Button></div></div></ModalShell>}
    {menuForm && <ModalShell title={menuForm.id ? 'Edit menu item' : 'Add a menu item'} eyebrow="MENU MANAGEMENT" onClose={() => setMenuForm(null)}><form className="modal-form" onSubmit={saveMenuItem}><label className="form-label">Dish name <span>Required</span><input required maxLength={70} value={menuForm.name} onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })} placeholder="e.g. Crispy chicken rice" /></label><label className="form-label">Description <span>Optional</span><textarea rows={2} maxLength={180} value={menuForm.description} onChange={(event) => setMenuForm({ ...menuForm, description: event.target.value })} placeholder="Describe the dish briefly" /></label><div className="form-two-col"><label className="form-label">Price (₱) <span>Required</span><input type="number" min="0" step="1" required value={menuForm.price} onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })} placeholder="69" /></label><label className="form-label">Category<select value={menuForm.category} onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value as MenuFormState['category'] })}>{categories.filter((category) => category.name !== 'All').map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select></label></div><label className="availability-checkbox"><input type="checkbox" checked={menuForm.available} onChange={(event) => setMenuForm({ ...menuForm, available: event.target.checked })} /> Available for demo orders</label><div className="modal-actions"><Button variant="secondary" onClick={() => setMenuForm(null)}>Cancel</Button><Button type="submit">Save menu item <Check size={16} /></Button></div></form></ModalShell>}
    {detailOrderId && (() => { const order = orders.find((candidate) => candidate.id === detailOrderId); if (!order) return null; const actions = nextStatuses(order.status, order.fulfillment).filter((status) => status !== 'rejected' && status !== 'cancelled'); return <ModalShell title={`Order ${shortOrder(order.id)}`} eyebrow="DEMO ORDER DETAILS" onClose={() => setDetailOrderId('')}><div className="order-detail-modal"><div className="detail-status-line"><StatusPill status={order.status} /><strong>{money(order.total)}</strong></div><div className="detail-customer"><span className="mini-vendor-avatar"><CircleUserRound size={19} /></span><div><strong>{order.customerName}</strong><small>Placed {formatDate(order.createdAt)} at {formatTime(order.createdAt)}</small></div></div><div className="detail-fulfillment"><MapPin size={16} /><span><strong>{order.fulfillment === 'pickup' ? 'Pickup' : 'Campus delivery'}</strong><small>{order.destination}</small></span></div><div className="detail-order-lines">{order.items.map((item, index) => <div key={`${item.itemId}-${index}`}><span>{item.quantity} × {item.name}<small>{[item.size, ...item.addonNames].filter(Boolean).join(' · ')}</small>{item.instructions && <small>Note: {item.instructions}</small>}</span><strong>{money(item.unitPrice * item.quantity)}</strong></div>)}</div>{order.deliveryInstructions && <div className="detail-note"><strong>Order / handoff note</strong><p>{order.deliveryInstructions}</p></div>}<div className="summary-row"><span>Payment</span><strong>{order.payment}</strong></div><div className="modal-actions modal-actions-stack">{actions.map((status) => <Button key={status} variant={status === 'completed' ? 'primary' : 'secondary'} onClick={() => { updateOrderStatus(order.id, status); setDetailOrderId('') }}>{status === 'accepted' ? 'Accept order' : status === 'preparing' ? 'Mark preparing' : status === 'ready' ? 'Mark ready for pickup' : status === 'out_for_delivery' ? 'Mark out for delivery' : 'Mark completed'} <ArrowRight size={15} /></Button>)}{order.status === 'placed' && <Button variant="danger" onClick={() => { setDetailOrderId(''); setRejectOrderId(order.id); setRejectReason('Vendor is unable to fulfil this order in the demo.') }}>Reject order</Button>}</div>{actions.length === 0 && <p className="form-helper">This order is in a final state; no further status action is available.</p>}</div></ModalShell> })()}
    {resetOpen && <ModalShell title="Restore the starting demo?" eyebrow="RESET LOCAL DATA" onClose={() => setResetOpen(false)}><div className="modal-form"><p>This will restore the original sample vendors and menus, return vendor availability to its default, clear your cart and favorites, and replace demo orders with the starting examples.</p><p className="subtle-warning">Only FoodStall data stored in this browser is affected. No server data exists in this prototype.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setResetOpen(false)}>Keep my changes</Button><Button variant="danger" onClick={restoreDemo}><RotateCcw size={15} /> Restore demo</Button></div></div></ModalShell>}

    {toast && <div className="toast-message" role="status"><CheckCircle2 size={18} /><span>{toast}</span><button aria-label="Dismiss message" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>
}

function timelineHint(status: string, fulfillment: Fulfillment) {
  const hints: Record<string, string> = {
    placed: 'Waiting for the stall to review the order.', accepted: 'The stall has accepted the order.', preparing: 'The kitchen is getting your order ready.', ready: 'The order is ready at the selected pickup point.', out_for_delivery: 'The order is heading to your campus handoff point.', completed: fulfillment === 'pickup' ? 'Pickup is complete.' : 'Handoff is complete.',
  }
  return hints[status] ?? ''
}

function VendorCard({ vendor, menuItems, favorite, onOpen, onFavorite }: { vendor: Vendor; menuItems: MenuItem[]; favorite: boolean; onOpen: () => void; onFavorite: () => void }) {
  const startingItems = menuItems.filter((item) => item.vendorId === vendor.id && item.available).length
  return <article className="vendor-card"><button className="vendor-card-image-button" onClick={onOpen} aria-label={`View ${vendor.name} menu`}><FoodImage src={vendor.image} alt={`${vendor.name} sample food`} className="vendor-card-image" /><span className={cx('vendor-state', vendor.isOpen ? 'state-open' : 'state-paused')}><span />{vendor.isOpen ? 'Open' : 'Paused'}</span><span className="vendor-image-arrow"><ArrowRight size={16} /></span></button><div className="vendor-card-body"><div className="vendor-card-title-row"><button className="vendor-name-button" onClick={onOpen}><h3>{vendor.name}</h3></button><button className={cx('heart-button', favorite && 'saved')} aria-label={favorite ? `Unsave ${vendor.name}` : `Save ${vendor.name}`} onClick={onFavorite}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button></div><p className="vendor-category-text">{vendor.category}</p><div className="vendor-card-meta"><span className="rating-meta">★ <strong>{vendor.rating}</strong><small> demo</small></span><span><Clock3 size={13} /> {vendor.prepTime}</span></div><div className="vendor-card-footer"><span>{vendor.priceLabel}</span><button onClick={onOpen}>{startingItems} menu picks <ChevronRight size={15} /></button></div></div></article>
}

function FoodCard({ item, vendor, favorite, onOpen, onVendor, onFavorite }: { item: MenuItem; vendor: Vendor; favorite: boolean; onOpen: () => void; onVendor: () => void; onFavorite: () => void }) {
  return <article className="food-card"><div className="food-card-image-wrap"><button className="food-card-image-button" onClick={onOpen} aria-label={`Customize ${item.name}`}><FoodImage src={item.image} alt={item.name} className="food-card-image" /></button>{item.popular && <span className="popular-label"><Sparkles size={12} /> Popular pick</span>}<button className={cx('heart-button food-heart', favorite && 'saved')} aria-label={favorite ? `Unsave ${item.name}` : `Save ${item.name}`} onClick={onFavorite}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button></div><div className="food-card-body"><button className="food-vendor-link" onClick={onVendor}>{vendor.name} <ChevronRight size={12} /></button><h3>{item.name}</h3><p>{item.description}</p><div className="food-card-bottom"><strong>{money(item.price)}</strong><button className="add-food-button" onClick={onOpen} disabled={!item.available || !vendor.isOpen} aria-label={`Add ${item.name}`}><Plus size={17} /></button></div></div></article>
}

function MenuRow({ item, onAdd, onFavorite, favorite, isVendorOpen }: { item: MenuItem; onAdd: () => void; onFavorite: () => void; favorite: boolean; isVendorOpen: boolean }) {
  return <article className={cx('menu-row', (!item.available || !isVendorOpen) && 'menu-row-disabled')}><FoodImage src={item.image} alt={item.name} className="menu-row-image" /><div className="menu-row-copy"><div className="menu-row-title"><h4>{item.name}</h4>{item.popular && <span className="menu-mini-tag">Popular</span>}{!item.available && <Pill tone="danger">Sold out</Pill>}</div><p>{item.description}</p><div className="menu-row-bottom"><strong>{money(item.price)}</strong>{(item.sizes?.length || item.addons?.length) ? <small>Customizable</small> : <small>As listed</small>}</div></div><div className="menu-row-actions"><button className={cx('heart-button', favorite && 'saved')} aria-label={favorite ? `Unsave ${item.name}` : `Save ${item.name}`} onClick={onFavorite}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button><button className="add-food-button" onClick={onAdd} disabled={!item.available || !isVendorOpen} aria-label={`Customize ${item.name}`}><Plus size={17} /></button></div></article>
}

function ModalShell({ children, title, eyebrow, onClose }: { children: ReactNode; title: string; eyebrow: string; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>{children}</section></div>
}

function ItemModal({ item, state, setState, onClose, onAdd }: { item: MenuItem; state: ItemModalState; setState: (state: ItemModalState) => void; onClose: () => void; onAdd: () => void }) {
  if (!item) return null
  const price = item.price + (item.sizes?.find((size) => size.name === state.size)?.priceDelta ?? 0) + (item.addons?.filter((addon) => state.addons.includes(addon.name)).reduce((sum, addon) => sum + addon.price, 0) ?? 0)
  return <ModalShell title={state.lineId ? 'Edit your selection' : 'Make it just right'} eyebrow={state.lineId ? 'UPDATE CART ITEM' : 'CUSTOMIZE YOUR ORDER'} onClose={onClose}><div className="item-modal-content"><FoodImage src={item.image} alt={item.name} className="item-modal-image" /><div className="item-modal-intro"><div><h3>{item.name}</h3><p>{item.description}</p></div><strong>{money(price)}</strong></div>{item.sizes && item.sizes.length > 0 && <fieldset className="option-fieldset"><legend>Choose a size <span>Required</span></legend>{item.sizes.map((size) => <label className="option-row" key={size.name}><input type="radio" name="size" checked={state.size === size.name} onChange={() => setState({ ...state, size: size.name })} /><span><strong>{size.name}</strong>{size.priceDelta > 0 && <small>+{money(size.priceDelta)}</small>}</span><span className="radio-dot" /></label>)}</fieldset>}{item.addons && item.addons.length > 0 && <fieldset className="option-fieldset"><legend>Add a little extra <span>Optional</span></legend>{item.addons.map((addon) => <label className="option-row" key={addon.name}><input type="checkbox" checked={state.addons.includes(addon.name)} onChange={(event) => setState({ ...state, addons: event.target.checked ? [...state.addons, addon.name] : state.addons.filter((name) => name !== addon.name) })} /><span><strong>{addon.name}</strong>{addon.price > 0 && <small>+{money(addon.price)}</small>}{addon.price === 0 && <small>No extra charge</small>}</span><span className="checkbox-look">{state.addons.includes(addon.name) && <Check size={13} />}</span></label>)}</fieldset>}<label className="form-label item-instructions">Special instructions <span>Optional</span><textarea rows={2} value={state.instructions} onChange={(event) => setState({ ...state, instructions: event.target.value })} maxLength={160} placeholder="Anything the stall should know?" /></label><div className="item-modal-footer"><div className="quantity-stepper modal-quantity"><button aria-label="Decrease quantity" onClick={() => setState({ ...state, quantity: Math.max(1, state.quantity - 1) })} disabled={state.quantity <= 1}><Minus size={14} /></button><span>{state.quantity}</span><button aria-label="Increase quantity" onClick={() => setState({ ...state, quantity: Math.min(20, state.quantity + 1) })} disabled={state.quantity >= 20}><Plus size={14} /></button></div><Button onClick={onAdd} className="modal-add-button">{state.lineId ? 'Save changes' : 'Add'} · {money(price * state.quantity)} <ShoppingBag size={16} /></Button></div><p className="item-modal-note"><Info size={13} /> Prices and menu options are editable demo data.</p></div></ModalShell>
}

export default App
