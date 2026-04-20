// ── Relay runtime session types ─────────────────────────────────────────
//
// Stateful cart / booking state attached to a Relay chat conversation.
// The session document is keyed by `{partnerId}_{conversationId}` and
// lives in the top-level `relaySessions` Firestore collection so the
// widget can read/write it from any origin via the action API.
//
// These types are kept here (no `'use server'`) so they can be imported
// by both client components and server actions.

export interface RelaySessionItem {
  itemId: string;
  moduleSlug: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
  addedAt: string;
}

export interface RelaySessionCart {
  items: RelaySessionItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount?: number;
  total: number;
}

export type RelayBookingStatus = 'tentative' | 'confirmed' | 'cancelled';

export interface RelayBookingSlot {
  slotId: string;
  serviceId: string;
  serviceName: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  duration: number;   // minutes
  price: number;
  staffId?: string;
  staffName?: string;
  status: RelayBookingStatus;
  reservedAt: string;
}

export interface RelaySessionBooking {
  slots: RelayBookingSlot[];
  guestCount?: number;
  notes?: string;
}

export interface RelaySessionCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

// P1.M03 — session identity group (ADR-P4-01 §Schema).
//
// Pointer to the cross-conversation contact doc at
// `contacts/{partnerId}_{phone}`. Optional at every level:
// anon sessions have `identity` absent or `{}`. Resolution happens
// via `resolveContact` + `setSessionIdentity` at the action that
// captures the phone (or upstream of a commit-gated action).
export interface RelaySessionIdentity {
  /** E.164 phone pointer to the canonical contact record. */
  contactId?: string;
  /** ISO timestamp of when the contactId was written. */
  resolvedAt?: string;
}

export interface RelaySession {
  conversationId: string;
  partnerId: string;
  cart: RelaySessionCart;
  booking: RelaySessionBooking;
  customer?: RelaySessionCustomer;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  // Sticky active engine (M02). null explicitly represents "no engine
  // resolved yet" (first turn); undefined means legacy session pre-dating
  // M11. Written by M11; all reads ignore until M12 wires engine scoping.
  activeEngine?: import('./engine-types').Engine | null;
  /** P1.M03: identity group. Absent / `{}` means anon session. */
  identity?: RelaySessionIdentity;
}

// ── Helpers ─────────────────────────────────────────────────────────────

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function relaySessionDocId(partnerId: string, conversationId: string): string {
  return `${partnerId}_${conversationId}`;
}

export function emptyCart(): RelaySessionCart {
  return { items: [], subtotal: 0, total: 0 };
}

export function emptyBooking(): RelaySessionBooking {
  return { slots: [] };
}

export function recomputeCartTotals(cart: RelaySessionCart): RelaySessionCart {
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = cart.discountAmount ?? 0;
  return {
    ...cart,
    subtotal,
    total: Math.max(0, subtotal - discount),
  };
}
