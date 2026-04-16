'use server';

// ── Relay runtime session: top-level CRUD ───────────────────────────────
//
// Cart/booking actions live in sibling files. This file only exposes the
// session lifecycle: get-or-create, fetch, and arbitrary partial updates
// the client may need (e.g. capturing a customer name).

import { loadOrCreateSession, loadSession, saveSession } from '@/lib/relay/session-store';
import type { RelaySession } from '@/lib/relay/session-types';

export interface SessionActionResult {
  success: boolean;
  session?: RelaySession;
  error?: string;
}

export async function getOrCreateRelaySessionAction(
  conversationId: string,
  partnerId: string,
): Promise<SessionActionResult> {
  try {
    if (!conversationId || !partnerId) {
      return { success: false, error: 'conversationId and partnerId are required' };
    }
    const session = await loadOrCreateSession(partnerId, conversationId);
    return { success: true, session };
  } catch (e) {
    console.error('[relay-session] getOrCreate failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function getRelaySessionAction(
  conversationId: string,
  partnerId: string,
): Promise<SessionActionResult> {
  try {
    const session = await loadSession(partnerId, conversationId);
    if (!session) return { success: false, error: 'Session not found' };
    return { success: true, session };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function updateRelaySessionAction(
  conversationId: string,
  partnerId: string,
  updates: Partial<Pick<RelaySession, 'customer' | 'booking' | 'cart'>>,
): Promise<SessionActionResult> {
  try {
    const existing = await loadOrCreateSession(partnerId, conversationId);
    const merged: RelaySession = {
      ...existing,
      ...updates,
      // Identity fields are immutable
      conversationId: existing.conversationId,
      partnerId: existing.partnerId,
      createdAt: existing.createdAt,
    };
    const saved = await saveSession(merged);
    return { success: true, session: saved };
  } catch (e) {
    console.error('[relay-session] update failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
