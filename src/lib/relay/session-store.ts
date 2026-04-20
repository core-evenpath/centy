import 'server-only';
import { db } from '@/lib/firebase-admin';
import {
  RelaySession,
  RelaySessionBooking,
  RelaySessionCart,
  RelaySessionCustomer,
  RelaySessionSpace,
  SESSION_TTL_MS,
  emptyBooking,
  emptyCart,
  relaySessionDocId,
} from './session-types';

// ── Firestore helpers for the Relay runtime session document ────────────
//
// The runtime session lives in the top-level `relaySessions` collection
// so it can be read/written by the widget without touching the partner
// subtree. The document is keyed by `{partnerId}_{conversationId}` so a
// partner can list / TTL all of their sessions cheaply.
//
// Write discipline (P1.M01 / ADR-P4-01 §Prerequisite): mutation writers
// use Firestore field-path `.update({...})` form, not whole-doc
// `.set({...}, { merge: true })`. Whole-doc merge replaces nested
// arrays wholesale; field-path updates leave untouched paths alone.
// Every setter below assumes `loadOrCreateSession()` has run first so
// the doc exists (documented invariant for all callers).

const COLLECTION = 'relaySessions';

export function relaySessionRef(partnerId: string, conversationId: string) {
  return db.collection(COLLECTION).doc(relaySessionDocId(partnerId, conversationId));
}

export function newSession(partnerId: string, conversationId: string): RelaySession {
  const now = new Date();
  return {
    conversationId,
    partnerId,
    cart: emptyCart(),
    booking: emptyBooking(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
}

export async function loadSession(
  partnerId: string,
  conversationId: string,
): Promise<RelaySession | null> {
  const snap = await relaySessionRef(partnerId, conversationId).get();
  return snap.exists ? (snap.data() as RelaySession) : null;
}

export async function loadOrCreateSession(
  partnerId: string,
  conversationId: string,
): Promise<RelaySession> {
  const existing = await loadSession(partnerId, conversationId);
  if (existing) return existing;
  const fresh = newSession(partnerId, conversationId);
  // Initial-write: genuine create, no merge semantics. The only
  // non-update write in this module; every subsequent write uses
  // field-path .update().
  await relaySessionRef(partnerId, conversationId).set(fresh);
  return fresh;
}

// ── Targeted setters (P1.M01) ──────────────────────────────────────────
//
// Each setter owns one sub-object per ADR-P4-01 single-writer-per-field
// discipline:
//   - setSessionCart → cart-actions.ts
//   - setSessionBooking → booking-actions.ts
//   - setSessionCustomer → session-actions.ts
//   - setActiveEngine → orchestrator (M11)
//   - updateSession → multi-sub-object writes (session-actions
//     updateRelaySessionAction, create-order cart-drain)

export async function setSessionCart(
  partnerId: string,
  conversationId: string,
  cart: RelaySessionCart,
): Promise<RelaySessionCart> {
  await relaySessionRef(partnerId, conversationId).update({
    cart,
    updatedAt: new Date().toISOString(),
  });
  return cart;
}

export async function setSessionBooking(
  partnerId: string,
  conversationId: string,
  booking: RelaySessionBooking,
): Promise<RelaySessionBooking> {
  await relaySessionRef(partnerId, conversationId).update({
    booking,
    updatedAt: new Date().toISOString(),
  });
  return booking;
}

export async function setSessionCustomer(
  partnerId: string,
  conversationId: string,
  customer: RelaySessionCustomer,
): Promise<RelaySessionCustomer> {
  await relaySessionRef(partnerId, conversationId).update({
    customer,
    updatedAt: new Date().toISOString(),
  });
  return customer;
}

// Generic multi-sub-object updater. Use sparingly — prefer a targeted
// setter when writing a single sub-object. Intended for rare callers
// like `updateRelaySessionAction` which accepts a partial payload.
export async function updateSession(
  partnerId: string,
  conversationId: string,
  updates: Partial<Pick<RelaySession, 'cart' | 'booking' | 'customer'>>,
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (updates.cart !== undefined) payload.cart = updates.cart;
  if (updates.booking !== undefined) payload.booking = updates.booking;
  if (updates.customer !== undefined) payload.customer = updates.customer;
  await relaySessionRef(partnerId, conversationId).update(payload);
}

// M11: single-field update for the session's sticky active engine. Called
// by the orchestrator when the M11 `selectActiveEngine` result changes.
// `engine === null` explicitly un-sets the active engine (post-`fallback-none`).
export async function setActiveEngine(
  partnerId: string,
  conversationId: string,
  engine: RelaySession['activeEngine'],
): Promise<void> {
  await relaySessionRef(partnerId, conversationId).update({
    activeEngine: engine,
    updatedAt: new Date().toISOString(),
  });
}

// ── P4.M01 Space helpers ───────────────────────────────────────────────
//
// Space is its own top-level sub-object per ADR-P4-01 §Schema. Same
// whole-group write pattern as setSessionBooking — the reducer
// produces the full new state; caller persists it atomically.

export async function setSessionSpace(
  partnerId: string,
  conversationId: string,
  space: RelaySessionSpace,
): Promise<RelaySessionSpace> {
  await relaySessionRef(partnerId, conversationId).update({
    space,
    updatedAt: new Date().toISOString(),
  });
  return space;
}

// ── P1.M03 Identity helpers ────────────────────────────────────────────
//
// Write: dotted field-path update so siblings (cart, booking, etc.) are
// untouched. Read: pure function over a loaded session — hot path
// consumers avoid a Firestore round-trip.

export async function setSessionIdentity(
  partnerId: string,
  conversationId: string,
  contactId: string,
): Promise<void> {
  await relaySessionRef(partnerId, conversationId).update({
    'identity.contactId': contactId,
    'identity.resolvedAt': new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function getSessionIdentity(
  session: RelaySession | null,
): { contactId: string | null; resolved: boolean } {
  const contactId = session?.identity?.contactId ?? null;
  return { contactId, resolved: contactId !== null };
}
