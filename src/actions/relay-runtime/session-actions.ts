'use server';

// ── Relay runtime session: top-level CRUD ───────────────────────────────
//
// Cart/booking actions live in sibling files. This file only exposes the
// session lifecycle: get-or-create, fetch, and arbitrary partial updates
// the client may need (e.g. capturing a customer name).

import {
  loadOrCreateSession,
  loadSession,
  updateSession,
} from '@/lib/relay/session-store';
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
    await loadOrCreateSession(partnerId, conversationId);
    await updateSession(partnerId, conversationId, updates);
    const session = await loadSession(partnerId, conversationId);
    return session
      ? { success: true, session }
      : { success: false, error: 'Session disappeared after update' };
  } catch (e) {
    console.error('[relay-session] update failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
