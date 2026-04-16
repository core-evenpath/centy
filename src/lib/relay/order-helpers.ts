// ── Pure order helpers (no I/O) ─────────────────────────────────────────
//
// Shared between server actions, the API route, and block components. No
// Firestore / Next imports so this stays cheap to load from anywhere.

import type {
  OrderItem,
  OrderStatus,
  OrderSummary,
  RelayOrder,
} from './order-types';

// Unambiguous alphabet (no O/0/I/1) so IDs are easy to read aloud.
const ORDER_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateOrderId(): string {
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += ORDER_ID_ALPHABET.charAt(
      Math.floor(Math.random() * ORDER_ID_ALPHABET.length),
    );
  }
  return `ORD-${id}`;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

// ── Pricing ─────────────────────────────────────────────────────────────
//
// Free shipping above ₹500, flat ₹50 otherwise; 18% GST on the
// post-discount subtotal. Intentionally a simple rule — partners will
// plug in real pricing later, this is just enough to exercise the
// checkout flow end-to-end.

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;
const TAX_RATE = 0.18;

export interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export function computeOrderPricing(
  items: Pick<OrderItem, 'price' | 'quantity'>[],
  discountAmount = 0,
): PricingBreakdown {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + shippingCost + tax;
  return { subtotal, discountAmount, shippingCost, tax, total };
}

export function orderToSummary(order: RelayOrder): OrderSummary {
  return {
    orderId: order.id,
    status: order.status,
    statusLabel: getStatusLabel(order.status),
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
    total: order.total,
    currency: order.currency,
    createdAt: order.createdAt,
    estimatedDelivery: order.tracking?.estimatedDelivery,
    trackingUrl: order.tracking?.trackingUrl,
    carrier: order.tracking?.carrier,
  };
}

// ── Status → UI step mapping ────────────────────────────────────────────
//
// The tracker block renders a 5-step pipeline. Real `OrderStatus` has
// 8 states (incl. cancelled/refunded); collapse to the display steps.

export const ORDER_TRACKER_STEPS = [
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
] as const;

export function orderStatusToStepLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 'Confirmed';
    case 'processing':
      return 'Packed';
    case 'shipped':
      return 'Shipped';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
    case 'refunded':
      return getStatusLabel(status);
    default:
      return 'Confirmed';
  }
}
