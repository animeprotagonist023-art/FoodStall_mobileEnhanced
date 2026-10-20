import type { CartLine, MenuItem, Vendor } from '../types'
import { SERVICE } from '../config/brand'

export function getLineUnitPrice(line: CartLine, item: MenuItem) {
  const size = item.sizes?.find((option) => option.name === line.size)
  const addons = item.addons?.filter((option) => line.addonNames.includes(option.name)).reduce((total, option) => total + option.price, 0) ?? 0
  return item.price + (size?.priceDelta ?? 0) + addons
}

export function getLineTotal(line: CartLine, item: MenuItem) {
  return getLineUnitPrice(line, item) * line.quantity
}

export function getCartSubtotal(cart: CartLine[], menu: MenuItem[]) {
  return cart.reduce((total, line) => {
    const item = menu.find((candidate) => candidate.id === line.itemId)
    return total + (item ? getLineTotal(line, item) : 0)
  }, 0)
}

export function getDeliveryFee(fulfillment: 'pickup' | 'delivery', vendor?: Vendor) {
  return fulfillment === 'delivery' && vendor?.acceptsDelivery ? SERVICE.deliveryFee : 0
}

export function money(value: number) {
  return `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}
