import 'server-only';
import { db } from '@/lib/firebase-admin';
import {
  RelaySession,
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

export async function saveSession(session: RelaySession): Promise<RelaySession> {
  const updated: RelaySession = { ...session, updatedAt: new Date().toISOString() };
  await relaySessionRef(session.partnerId, session.conversationId).set(updated, { merge: true });
  return updated;
}

export async function loadOrCreateSession(
  partnerId: string,
  conversationId: string,
): Promise<RelaySession> {
  const existing = await loadSession(partnerId, conversationId);
  if (existing) return existing;
  const fresh = newSession(partnerId, conversationId);
  await relaySessionRef(partnerId, conversationId).set(fresh);
  return fresh;
}
