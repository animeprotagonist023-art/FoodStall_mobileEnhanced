export type FoodCategory = 'All' | 'Rice meals' | 'Filipino' | 'Noodles' | 'Coffee & drinks' | 'Snacks' | 'Bakery' | 'Budget meals'
export type Fulfillment = 'pickup' | 'delivery'
export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'rejected' | 'cancelled'

export interface FoodOption {
  name: string
  price: number
}

export interface FoodSize {
  name: string
  priceDelta: number
}

export interface MenuItem {
  id: string
  vendorId: string
  name: string
  description: string
  price: number
  category: Exclude<FoodCategory, 'All'>
  image: string
  available: boolean
  popular?: boolean
  sizes?: FoodSize[]
  addons?: FoodOption[]
  tags?: string[]
}

export interface Vendor {
  id: string
  name: string
  category: string
  description: string
  image: string
  avatar: string
  rating: string
  prepTime: string
  priceLabel: string
  isOpen: boolean
  hours: string
  acceptsPickup: boolean
  acceptsDelivery: boolean
  featured?: boolean
  location: string
}

export interface CartLine {
  id: string
  vendorId: string
  itemId: string
  quantity: number
  size?: string
  addonNames: string[]
  instructions: string
}

export interface OrderedLine {
  itemId: string
  name: string
  unitPrice: number
  quantity: number
  size?: string
  addonNames: string[]
  instructions: string
  image: string
}

export interface DemoOrder {
  id: string
  vendorId: string
  vendorName: string
  items: OrderedLine[]
  subtotal: number
  deliveryFee: number
  total: number
  fulfillment: Fulfillment
  destination: string
  deliveryInstructions: string
  customerName: string
  payment: 'Cash at pickup' | 'Cash at handoff'
  status: OrderStatus
  createdAt: string
  etaMinutes: number
  statusNote?: string
  timeline: { status: OrderStatus; at: string; note: string }[]
}
