import type { Fulfillment, OrderStatus } from '../types'

export function nextStatuses(status: OrderStatus, fulfillment: Fulfillment): OrderStatus[] {
  switch (status) {
    case 'placed': return ['accepted', 'rejected', 'cancelled']
    case 'accepted': return ['preparing']
    case 'preparing': return [fulfillment === 'pickup' ? 'ready' : 'out_for_delivery']
    case 'ready': return ['completed']
    case 'out_for_delivery': return ['completed']
    default: return []
  }
}

export function statusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    placed: 'Order placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready for pickup',
    out_for_delivery: 'Out for delivery', completed: 'Completed', rejected: 'Rejected', cancelled: 'Cancelled',
  }
  return labels[status]
}

export function statusDescription(status: OrderStatus, fulfillment: Fulfillment) {
  const descriptions: Record<OrderStatus, string> = {
    placed: 'Your order is in the demo queue, waiting for the vendor to review it.',
    accepted: 'The vendor accepted your order and is getting things ready.',
    preparing: 'Your food is being prepared. This progress is simulated for the demo.',
    ready: 'Head to the selected campus collection point and pay cash when you collect your order.',
    out_for_delivery: 'The order has been marked for campus handoff. There is no live courier tracking.',
    completed: fulfillment === 'pickup' ? 'The pickup handoff is marked complete in this demo.' : 'The campus handoff is marked complete in this demo.',
    rejected: 'The vendor could not accept this order in the demo. No payment was taken.',
    cancelled: 'This demonstration order has been cancelled. No payment was taken.',
  }
  return descriptions[status]
}
