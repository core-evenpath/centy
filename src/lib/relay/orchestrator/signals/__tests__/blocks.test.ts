// P3.M05.1: engine-null blocks signal behavior.
//
// Verifies the permissive "no engine → show all visible blocks"
// fallback is gone. Partners without explicit engines resolution
// now see an empty visibleBlockIds.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

import { loadBlocksSignal } from '../blocks';

beforeEach(() => {
  resetFirestoreMock();
});

function seedVisibleBlocks(partnerId: string, blockIds: string[]): void {
  for (const blockId of blockIds) {
    firestoreStore.set(`partners/${partnerId}/relayConfig/${blockId}`, {
      id: blockId,
      data: {
        blockId,
        isVisible: true,
        sortOrder: 1,
      },
    });
  }
}

describe('loadBlocksSignal — P3.M05.1 engine-null fail-closed', () => {
  it('returns empty visibleBlockIds when activeEngine is null', async () => {
    seedVisibleBlocks('p1', ['room_card', 'booking_confirm', 'contact']);

    const result = await loadBlocksSignal('p1', null);

    expect(result.hasPrefs).toBe(true);
    expect(result.visibleBlockIds).toEqual([]);
  });

  it('returns engine-filtered visibleBlockIds when activeEngine is set', async () => {
    // room_card is tagged 'booking'; contact is tagged 'shared' → both
    // pass the booking filter. booking_confirm is also booking-tagged.
    seedVisibleBlocks('p1', ['room_card', 'booking_confirm', 'contact']);

    const result = await loadBlocksSignal('p1', 'booking');

    expect(result.visibleBlockIds).toContain('contact');
    // At least one booking-tagged block survives; exact contents
    // depend on registry tags, but engine filtering is active.
    expect(result.visibleBlockIds.length).toBeGreaterThan(0);
  });

  it('returns empty when partner has no prefs AND activeEngine is null', async () => {
    // No seeded data.
    const result = await loadBlocksSignal('p1', null);

    expect(result.hasPrefs).toBe(false);
    expect(result.visibleBlockIds).toEqual([]);
  });
});
