// P1.M04 — commit-gate tests + end-to-end identity flow.
//
// Covers:
// - requireIdentityOrThrow unit behavior
// - Integration: anon session → commerce turn → gate throws →
//   resolveContact + setSessionIdentity → gate returns contactId

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import {
  IdentityRequiredError,
  requireIdentityOrThrow,
} from '../commit-gate';
import {
  loadOrCreateSession,
  loadSession,
  setActiveEngine,
  setSessionIdentity,
} from '@/lib/relay/session-store';
import type { RelaySession } from '@/lib/relay/session-types';

beforeEach(() => {
  resetFirestoreMock();
});

describe('requireIdentityOrThrow — unit', () => {
  it('throws IdentityRequiredError on null session', () => {
    expect(() => requireIdentityOrThrow(null)).toThrowError(IdentityRequiredError);
  });

  it('throws on session without identity', () => {
    const session = {
      conversationId: 'c',
      partnerId: 'p',
      cart: { items: [], subtotal: 0, total: 0 },
      booking: { slots: [] },
      createdAt: 't',
      updatedAt: 't',
      expiresAt: 't',
    } as RelaySession;
    expect(() => requireIdentityOrThrow(session)).toThrow(IdentityRequiredError);
  });

  it('throws on session with identity={} (empty group)', () => {
    const session = {
      conversationId: 'c',
      partnerId: 'p',
      cart: { items: [], subtotal: 0, total: 0 },
      booking: { slots: [] },
      createdAt: 't',
      updatedAt: 't',
      expiresAt: 't',
      identity: {},
    } as RelaySession;
    expect(() => requireIdentityOrThrow(session)).toThrow(IdentityRequiredError);
  });

  it('returns contactId when resolved', () => {
    const session = {
      conversationId: 'c',
      partnerId: 'p',
      cart: { items: [], subtotal: 0, total: 0 },
      booking: { slots: [] },
      createdAt: 't',
      updatedAt: 't',
      expiresAt: 't',
      identity: { contactId: '+15551234567', resolvedAt: 't' },
    } as RelaySession;
    expect(requireIdentityOrThrow(session)).toBe('+15551234567');
  });

  it('IdentityRequiredError carries stable code IDENTITY_REQUIRED', () => {
    try {
      requireIdentityOrThrow(null);
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(IdentityRequiredError);
      expect((err as IdentityRequiredError).code).toBe('IDENTITY_REQUIRED');
    }
  });
});

describe('end-to-end identity flow (P1.M04 integration)', () => {
  it('anon → engine-set → gate-throws → resolve+setIdentity → gate-returns-id', async () => {
    const PARTNER = 'p1';
    const CONV = 'c1';

    // 1. Start anon session
    const fresh = await loadOrCreateSession(PARTNER, CONV);
    expect(fresh.identity).toBeUndefined();

    // 2. Set active engine (anon-allowed action)
    await setActiveEngine(PARTNER, CONV, 'commerce');
    const afterEngine = await loadSession(PARTNER, CONV);
    expect(afterEngine?.activeEngine).toBe('commerce');

    // 3. Commit-gated action would throw on the anon session
    expect(() => requireIdentityOrThrow(afterEngine)).toThrow(IdentityRequiredError);

    // 4. Resolve contact + set identity (prerequisite)
    const { resolveContact } = await import('@/actions/contact-actions');
    const resolved = await resolveContact(PARTNER, '+15551234567');
    expect(resolved.success).toBe(true);
    if (!resolved.success) return;
    expect(resolved.contactId).toBe('+15551234567');

    await setSessionIdentity(PARTNER, CONV, resolved.contactId);

    // 5. Re-load session
    const afterIdentity = await loadSession(PARTNER, CONV);

    // 6. Commit-gated action now returns the contactId
    const gated = requireIdentityOrThrow(afterIdentity);
    expect(gated).toBe('+15551234567');

    // 7. Sibling fields preserved through identity write
    expect(afterIdentity?.activeEngine).toBe('commerce');
    expect(afterIdentity?.cart.items).toEqual([]);

    // 8. Contact doc created (side effect)
    const contactPath = `contacts/${PARTNER}_+15551234567`;
    expect(firestoreStore.get(contactPath)).toBeDefined();
  });
});
