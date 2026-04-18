import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  firestoreControls,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '../firestore-admin-mock';

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());

// SUT import must come after vi.mock.
import { db } from '@/lib/firebase-admin';

beforeEach(() => {
  resetFirestoreMock();
});

describe('firestore-admin-mock helper', () => {
  it('supports top-level collection read/write', async () => {
    await (db.collection('partners').doc('p1') as any).set({ name: 'Acme' });
    const snap = await (db.collection('partners').doc('p1') as any).get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toEqual({ name: 'Acme' });
  });

  it('supports nested subcollection reads (the Q9 gap)', async () => {
    // This is exactly what loadPartnerBlockPrefs does.
    seedMockDoc('partners/p1/relayConfig/room_card', {
      isVisible: true,
      fieldBindings: { title: { sourceField: 'roomName' } },
    });
    const snap = await (db
      .collection('partners')
      .doc('p1') as any)
      .collection('relayConfig')
      .get();
    expect(snap.docs.length).toBe(1);
    expect(snap.docs[0].id).toBe('room_card');
    expect((snap.docs[0].data() as any).isVisible).toBe(true);
  });

  it('filters by parent path — sibling subcollections do not leak', async () => {
    seedMockDoc('partners/p1/relayConfig/a', { v: 1 });
    seedMockDoc('partners/p2/relayConfig/b', { v: 2 });
    const p1Snap = await (db.collection('partners').doc('p1') as any)
      .collection('relayConfig')
      .get();
    expect(p1Snap.docs.length).toBe(1);
    expect(p1Snap.docs[0].id).toBe('a');
  });

  it('throwOnWrite hook throws on .set and halts persistence', async () => {
    firestoreControls.throwOnWrite = true;
    await expect(
      (db.collection('partners').doc('p1') as any).set({ name: 'Acme' }),
    ).rejects.toThrow('simulated write failure');
    expect(firestoreStore.get('partners/p1')).toBeUndefined();
  });

  it('supports merge semantics on .set({...}, { merge: true })', async () => {
    await (db.collection('partners').doc('p1') as any).set({ a: 1 });
    await (db.collection('partners').doc('p1') as any).set({ b: 2 }, { merge: true });
    const snap = await (db.collection('partners').doc('p1') as any).get();
    expect(snap.data()).toEqual({ a: 1, b: 2 });
  });

  it('supports .count() aggregation on subcollections', async () => {
    for (const id of ['i1', 'i2', 'i3']) {
      seedMockDoc(`partners/p1/businessModules/m1/items/${id}`, { name: id });
    }
    const countSnap = await (db.collection('partners').doc('p1') as any)
      .collection('businessModules')
      .doc('m1')
      .collection('items')
      .count()
      .get();
    expect(countSnap.data().count).toBe(3);
  });

  it('resetFirestoreMock clears state and controls', async () => {
    seedMockDoc('partners/p1', { name: 'Acme' });
    firestoreControls.throwOnWrite = true;
    resetFirestoreMock();
    expect(firestoreStore.size).toBe(0);
    expect(firestoreControls.throwOnWrite).toBe(false);
  });
});
