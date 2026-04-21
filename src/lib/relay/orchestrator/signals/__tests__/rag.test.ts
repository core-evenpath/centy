import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRetrieve } = vi.hoisted(() => ({ mockRetrieve: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/ai/genkit', () => ({ ai: { retrieve: mockRetrieve } }));
vi.mock('@/ai/fireRagSetup', () => ({
  RAGINDEX_COLLECTION_NAME: 'centy_documents',
  firestoreRetriever: vi.fn((name: string) => ({ name })),
}));

import { loadRagSignal } from '../rag';
import { firestoreRetriever } from '@/ai/fireRagSetup';

const baseCtx = {
  partnerId: 'p1',
  skipRag: false,
  messages: [{ role: 'user' as const, content: 'what are your hours?' }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadRagSignal — backward compat', () => {
  it('uses RAGINDEX_COLLECTION_NAME when no opts passed', async () => {
    mockRetrieve.mockResolvedValue([]);
    await loadRagSignal(baseCtx as never, 'inquiry');
    expect(firestoreRetriever).toHaveBeenCalledWith('centy_documents');
  });
});

describe('loadRagSignal — collectionPath override', () => {
  it('uses the supplied collectionPath', async () => {
    mockRetrieve.mockResolvedValue([]);
    await loadRagSignal(baseCtx as never, 'inquiry', {
      collectionPath: 'relayRetrieval/p1/items',
    });
    expect(firestoreRetriever).toHaveBeenCalledWith('relayRetrieval/p1/items');
  });

  it('returns chunks from scoped collection', async () => {
    mockRetrieve.mockResolvedValue([
      { text: 'Espresso: strong coffee.', metadata: { score: 0.9 } },
    ]);
    const result = await loadRagSignal(baseCtx as never, 'inquiry', {
      collectionPath: 'relayRetrieval/p1/items',
    });
    expect(result.used).toBe(true);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].text).toBe('Espresso: strong coffee.');
  });

  it('returns empty-result when scoped collection has no docs', async () => {
    mockRetrieve.mockResolvedValue([]);
    const result = await loadRagSignal(baseCtx as never, 'inquiry', {
      collectionPath: 'relayRetrieval/p1/items',
    });
    expect(result.used).toBe(false);
    expect(result.reason).toBe('empty-result');
  });
});
