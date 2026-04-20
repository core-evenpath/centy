// ── Relay runtime order types ───────────────────────────────────────────
//
// Orders are created at checkout from the runtime cart session, then
// persisted under `partners/{partnerId}/orders/{orderId}`. This file is
// intentionally free of `'use server'` / Firestore imports so both
// client and server can consume these types.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  itemId: string;
  moduleSlug: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

export interface OrderAddress {
  name: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderTracking {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export type PaymentMethod = 'cod' | 'online' | 'upi' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface RelayOrder {
  id: string;
  partnerId: string;
  conversationId: string;
  /**
   * P2.M02: required commit-boundary contact pointer per ADR-P4-01
   * §Anon handling. Equals the resolved E.164 phone; points at
   * `contacts/{partnerId}_{contactId}`. Optional only on orders
   * created pre-P2.M02 (legacy shape); new orders MUST populate it.
   */
  contactId?: string;

  items: OrderItem[];

  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;

  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;

  status: OrderStatus;
  tracking?: OrderTracking;
  timeline: OrderTimeline[];

  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface CreateOrderInput {
  conversationId: string;
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OrderSummary {
  orderId: string;
  status: OrderStatus;
  statusLabel: string;
  itemCount: number;
  total: number;
  currency: string;
  createdAt: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
  carrier?: string;
}

export interface OrderLookupResult extends OrderSummary {
  timeline: OrderTimeline[];
}
