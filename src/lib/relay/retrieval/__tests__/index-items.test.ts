import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/ai/genkit', () => ({
  ai: {
    embed: vi.fn(async () => [{ embedding: [0.1, 0.2, 0.3] }]),
  },
}));
// embedder is a descriptor object, not called at import time
vi.mock('@genkit-ai/google-genai', () => ({
  googleAI: {
    embedder: vi.fn(() => ({ name: 'mock-embedder' })),
  },
}));

import { indexModuleItem } from '../index-items';

const PARTNER = 'p1';
const MODULE = 'mod1';
const ITEM = 'item1';
const SOURCE_PATH = `partners/${PARTNER}/businessModules/${MODULE}/items/${ITEM}`;
const DEST_PATH = `relayRetrieval/${PARTNER}/items/${ITEM}`;

function seedActiveItem(overrides: Record<string, unknown> = {}): void {
  seedMockDoc(SOURCE_PATH, {
    name: 'Espresso',
    price: 3.5,
    category: 'drinks',
    isActive: true,
    ragText: 'Espresso: a strong coffee shot. Price: $3.50.',
    ...overrides,
  });
}

beforeEach(() => {
  resetFirestoreMock();
});

describe('indexModuleItem', () => {
  it('indexes a new item into relayRetrieval', async () => {
    seedActiveItem();
    await indexModuleItem(PARTNER, MODULE, ITEM);

    const doc = firestoreStore.get(DEST_PATH);
    expect(doc).toBeDefined();
    expect(doc?.data.text).toBe('Espresso: a strong coffee shot. Price: $3.50.');
    expect(doc?.data.partnerId).toBe(PARTNER);
    expect(doc?.data.itemId).toBe(ITEM);
    expect(doc?.data.moduleId).toBe(MODULE);
    expect((doc?.data.structured as Record<string, unknown>).name).toBe('Espresso');
  });

  it('overwrites on re-index (idempotent)', async () => {
    seedActiveItem();
    await indexModuleItem(PARTNER, MODULE, ITEM);
    await indexModuleItem(PARTNER, MODULE, ITEM);

    const docs = [...firestoreStore.keys()].filter((k) => k.startsWith('relayRetrieval'));
    expect(docs).toHaveLength(1);
  });

  it('reflects updated ragText after re-index', async () => {
    seedActiveItem();
    await indexModuleItem(PARTNER, MODULE, ITEM);

    seedMockDoc(SOURCE_PATH, {
      name: 'Espresso',
      price: 3.5,
      category: 'drinks',
      isActive: true,
      ragText: 'Espresso — updated description.',
    });
    await indexModuleItem(PARTNER, MODULE, ITEM);

    const doc = firestoreStore.get(DEST_PATH);
    expect(doc?.data.text).toBe('Espresso — updated description.');
  });

  it('skips when ragText is empty', async () => {
    seedActiveItem({ ragText: '' });
    await indexModuleItem(PARTNER, MODULE, ITEM);

    expect(firestoreStore.has(DEST_PATH)).toBe(false);
  });

  it('skips when item is inactive', async () => {
    seedActiveItem({ isActive: false });
    await indexModuleItem(PARTNER, MODULE, ITEM);

    expect(firestoreStore.has(DEST_PATH)).toBe(false);
  });

  it('skips gracefully when source item is missing', async () => {
    await expect(indexModuleItem(PARTNER, MODULE, ITEM)).resolves.toBeUndefined();
    expect(firestoreStore.has(DEST_PATH)).toBe(false);
  });
});
