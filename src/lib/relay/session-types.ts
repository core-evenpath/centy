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
  /**
   * P2.M01: ISO currency code. Derived from the first-added item's
   * (implicit) currency or defaulted at partner-level when items lack
   * one. Absent on carts created before P2; callers should default to
   * partner currency on read when undefined.
   */
  currency?: string;
  /**
   * P2.M01: per-field TTL per ADR-P4-01 §TTL. Bumped on every cart
   * mutation (~2h window). Read-path consumers treat an expired cart
   * as empty and rely on the application-level sweeper (Phase 2+) to
   * prune stale docs.
   */
  expiresAt?: string;
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
  /**
   * P3.M01: booking holds per ADR-P4-01 §Schema. Nests under the
   * existing `booking` sub-object alongside `slots`. Holds are
   * anon-allowed ephemeral reservations; confirmation at commit
   * boundary (via `confirmBookingHoldAction`) writes a real booking
   * doc and releases the hold.
   *
   * Each hold carries its own `holdExpiresAt` — per-field TTL per ADR
   * §TTL. Expiry is enforced via on-read + on-write sweep
   * (`pruneExpiredHolds`), not via a background cron.
   */
  holds?: RelaySessionBookingHold[];
}

export interface RelaySessionBookingHold {
  /** Client-side stable id for this hold. */
  holdId: string;
  /** What's being held (room, slot, ticket — partner-module item ref). */
  resourceId: string;
  /** FK to partners/{pid}/businessModules/{mod}/items/{id}. */
  moduleItemId: string;
  /** ISO — slot start. */
  startAt: string;
  /** ISO — slot end. */
  endAt: string;
  /** ISO — per-hold TTL per ADR §TTL (~15min target). */
  holdExpiresAt: string;
  /** ISO — when the hold was created. */
  createdAt: string;
  /** Partner-opaque payload. */
  metadata?: Record<string, unknown>;
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
  /**
   * P4.M01: space engine state. Date-range holds distinct from
   * booking's slot-range. Its own top-level sub-object per ADR-P4-01
   * §Schema (space is its own engine, not a sub-section of booking).
   */
  space?: RelaySessionSpace;
}

export interface RelaySessionSpace {
  holds: RelaySessionSpaceHold[];
}

export interface RelaySessionSpaceHold {
  /** Client-side stable id for this hold. */
  holdId: string;
  /** What's being held (room, property, unit). */
  resourceId: string;
  /** FK to partners/{pid}/businessModules/{mod}/items/{id}. */
  moduleItemId: string;
  /** YYYY-MM-DD — check-in date (date, not timestamp). */
  checkIn: string;
  /** YYYY-MM-DD — check-out date. */
  checkOut: string;
  /** ISO — per-hold TTL per ADR §TTL. */
  holdExpiresAt: string;
  /** ISO — when the hold was created. */
  createdAt: string;
  /** Guest count — optional; partners may gate availability on it. */
  guestCount?: number;
  /** Partner-opaque payload. */
  metadata?: Record<string, unknown>;
}

// ── Helpers ─────────────────────────────────────────────────────────────

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export const CART_TTL_MS = 2 * 60 * 60 * 1000; // 2h per ADR-P4-01 §TTL

/**
 * P2.M01: per-field cart TTL. Computes the future ISO timestamp at
 * which the cart is considered expired. Callers (cart mutations)
 * stamp this every write; read-path consumers may compare against
 * `Date.now()` to decide whether to treat the cart as empty.
 */
export function computeCartExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + CART_TTL_MS).toISOString();
}

/**
 * Returns true when the cart's expiresAt is in the past. Undefined
 * expiresAt is treated as non-expired (pre-P2 carts).
 */
export function isCartExpired(
  cart: Pick<RelaySessionCart, 'expiresAt'> | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!cart?.expiresAt) return false;
  const exp = Date.parse(cart.expiresAt);
  return Number.isFinite(exp) && exp < now.getTime();
}

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
