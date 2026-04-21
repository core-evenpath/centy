/**
 * End-to-end retrieval pipeline: indexModuleItem → loadRagSignal with
 * scoped collectionPath.  Uses mocked Firestore and a mocked embedder so
 * no real infrastructure is required.
 *
 * What this proves: a write produced by the indexer lands in exactly the
 * path that loadRagSignal will query when given the per-partner items
 * collection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

const { mockEmbed, mockRetrieve } = vi.hoisted(() => ({
  mockEmbed: vi.fn(async () => [{ embedding: [0.1, 0.2, 0.3] }]),
  mockRetrieve: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/ai/genkit', () => ({ ai: { embed: mockEmbed, retrieve: mockRetrieve } }));
vi.mock('@genkit-ai/google-genai', () => ({
  googleAI: { embedder: vi.fn(() => ({ name: 'mock-embedder' })) },
}));
vi.mock('@/ai/fireRagSetup', () => ({
  RAGINDEX_COLLECTION_NAME: 'centy_documents',
  firestoreRetriever: vi.fn((name: string) => ({ name })),
}));

import { indexModuleItem } from '../index-items';
import { loadRagSignal } from '@/lib/relay/orchestrator/signals/rag';

const PARTNER = 'p1';
const MODULE = 'mod1';

function seedItem(itemId: string, overrides: Record<string, unknown> = {}): void {
  seedMockDoc(`partners/${PARTNER}/businessModules/${MODULE}/items/${itemId}`, {
    name: `Item ${itemId}`,
    price: 10,
    category: 'food',
    isActive: true,
    ragText: `${itemId}: a delicious menu item.`,
    ...overrides,
  });
}

function makeCtx(message: string) {
  return {
    partnerId: PARTNER,
    skipRag: false,
    messages: [{ role: 'user' as const, content: message }],
  };
}

beforeEach(() => {
  resetFirestoreMock();
  vi.clearAllMocks();
});

describe('items retrieval — end-to-end pipeline', () => {
  it('indexes 2 active items and skips 1 inactive; retrieve returns 2 indexed docs', async () => {
    seedItem('item-a');
    seedItem('item-b');
    seedItem('item-c', { isActive: false });

    await indexModuleItem(PARTNER, MODULE, 'item-a');
    await indexModuleItem(PARTNER, MODULE, 'item-b');
    await indexModuleItem(PARTNER, MODULE, 'item-c');

    const indexed = [...firestoreStore.keys()].filter((k) =>
      k.startsWith(`relayRetrieval/${PARTNER}/items`),
    );
    expect(indexed).toHaveLength(2);
    expect(indexed).toContain(`relayRetrieval/${PARTNER}/items/item-a`);
    expect(indexed).toContain(`relayRetrieval/${PARTNER}/items/item-b`);
  });

  it('loadRagSignal with scoped collectionPath queries relayRetrieval, not centy_documents', async () => {
    const { firestoreRetriever } = await import('@/ai/fireRagSetup');

    mockRetrieve.mockResolvedValue([
      { text: 'item-a: a delicious menu item.', metadata: { score: 0.9 } },
    ]);

    const result = await loadRagSignal(makeCtx('do you have pasta?') as never, 'inquiry', {
      collectionPath: `relayRetrieval/${PARTNER}/items`,
    });

    expect(firestoreRetriever).toHaveBeenCalledWith(`relayRetrieval/${PARTNER}/items`);
    expect(result.used).toBe(true);
    expect(result.chunks[0].text).toBe('item-a: a delicious menu item.');
  });

  it('full pipeline: index then retrieve returns indexed text', async () => {
    seedItem('item-a');
    await indexModuleItem(PARTNER, MODULE, 'item-a');

    const docInStore = firestoreStore.get(`relayRetrieval/${PARTNER}/items/item-a`);
    expect(docInStore).toBeDefined();

    // Simulate retrieval returning the indexed text
    mockRetrieve.mockResolvedValue([
      { text: docInStore!.data.text as string, metadata: { score: 0.85 } },
    ]);

    const result = await loadRagSignal(makeCtx('what are your hours?') as never, 'inquiry', {
      collectionPath: `relayRetrieval/${PARTNER}/items`,
    });

    expect(result.used).toBe(true);
    expect(result.chunks[0].text).toBe('item-a: a delicious menu item.');
  });
});
