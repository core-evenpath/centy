import 'server-only';

// ── Firestore helpers for the partner orders subcollection ──────────────
//
// Orders live under `partners/{partnerId}/orders/{orderId}`. Admin SDK
// is used throughout so these helpers can be called from server actions
// without running the `firestore.rules` gate.

import { db } from '@/lib/firebase-admin';
import type { RelayOrder } from './order-types';

export function partnerOrdersCol(partnerId: string) {
  return db.collection('partners').doc(partnerId).collection('orders');
}

export function partnerOrderRef(partnerId: string, orderId: string) {
  return partnerOrdersCol(partnerId).doc(orderId);
}

export async function loadOrder(
  partnerId: string,
  orderId: string,
): Promise<RelayOrder | null> {
  const snap = await partnerOrderRef(partnerId, orderId).get();
  return snap.exists ? (snap.data() as RelayOrder) : null;
}

export async function saveOrder(order: RelayOrder): Promise<RelayOrder> {
  const next: RelayOrder = { ...order, updatedAt: new Date().toISOString() };
  await partnerOrderRef(order.partnerId, order.id).set(next, { merge: true });
  return next;
}
