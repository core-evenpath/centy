/**
 * Backward-compat tests for indexToFirestore after the extraFieldsFactory
 * extension in MR-1.M04.
 *
 * Verifies that existing callers (e.g. thesis-docs/save/route.ts) which call
 * indexToFirestore / indexPdfFile WITHOUT the optional factory parameter
 * continue to write the original { fileId, partnerId, embedding, text } shape
 * and do NOT include relay-specific fields like kind / chunkIdx.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  firestoreStore,
  makeFirestoreAdminMock,
  resetFirestoreMock,
} from '@/__tests__/helpers/firestore-admin-mock';

vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/ai/genkit', () => ({
  ai: {
    embed: vi.fn(async () => [{ embedding: [0.1, 0.2, 0.3] }]),
  },
}));
vi.mock('@genkit-ai/google-genai', () => ({
  googleAI: { embedder: vi.fn(() => ({ name: 'mock-embedder' })) },
}));
vi.mock('@genkit-ai/firebase', () => ({
  defineFirestoreRetriever: vi.fn(() => ({})),
}));

import { indexToFirestore } from '../fireRagSetup';

beforeEach(() => {
  resetFirestoreMock();
});

describe('indexToFirestore — backward compat (no extraFieldsFactory)', () => {
  it('writes original schema: fileId, partnerId, embedding, text — no extra fields', async () => {
    await indexToFirestore('test_collection', 'p1', 'file-1', ['hello world']);

    const docs = [...firestoreStore.entries()].filter(([k]) =>
      k.startsWith('test_collection'),
    );
    expect(docs).toHaveLength(1);

    const data = docs[0][1].data;
    expect(data.fileId).toBe('file-1');
    expect(data.partnerId).toBe('p1');
    expect(data.text).toBe('hello world');
    expect(data.embedding).toBeDefined();

    // Must NOT contain relay-specific fields
    expect(data.kind).toBeUndefined();
    expect(data.chunkIdx).toBeUndefined();
    expect(data.indexedAt).toBeUndefined();
  });

  it('writes one doc per chunk', async () => {
    await indexToFirestore('test_collection', 'p1', 'file-2', ['chunk a', 'chunk b', 'chunk c']);

    const docs = [...firestoreStore.keys()].filter((k) => k.startsWith('test_collection'));
    expect(docs).toHaveLength(3);
  });
});

describe('indexToFirestore — with extraFieldsFactory', () => {
  it('merges factory output per chunk', async () => {
    await indexToFirestore('relay_col', 'p1', 'file-3', ['text a', 'text b'], (chunkIdx) => ({
      kind: 'doc',
      chunkIdx,
      indexedAt: '2026-01-01T00:00:00.000Z',
    }));

    const docs = [...firestoreStore.entries()]
      .filter(([k]) => k.startsWith('relay_col'))
      .sort(([, a], [, b]) => (a.data.chunkIdx as number) - (b.data.chunkIdx as number));

    expect(docs).toHaveLength(2);
    expect(docs[0][1].data.kind).toBe('doc');
    expect(docs[0][1].data.chunkIdx).toBe(0);
    expect(docs[1][1].data.chunkIdx).toBe(1);

    // Core fields still present alongside extra fields
    expect(docs[0][1].data.text).toBe('text a');
    expect(docs[0][1].data.fileId).toBe('file-3');
  });
});
