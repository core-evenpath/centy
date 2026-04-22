import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  makeFirestoreAdminMock,
  resetFirestoreMock,
  seedMockDoc,
} from '@/__tests__/helpers/firestore-admin-mock';

const { mockIndexPdfFile } = vi.hoisted(() => ({
  mockIndexPdfFile: vi.fn(async () => {}),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => makeFirestoreAdminMock());
vi.mock('@/ai/fireRagSetup', () => ({
  indexPdfFile: mockIndexPdfFile,
  RAGINDEX_COLLECTION_NAME: 'centy_documents',
}));

import { indexRelayDoc } from '../index-docs';

const PARTNER = 'p1';
const FILE_ID = 'vault-doc-1';
const FILE_PATH = '/tmp/test.pdf';
const RELAY_DOCS_COL = `relayRetrieval/${PARTNER}/docs`;
const CENTY_DOCS_COL = 'centy_documents';

function seedConfig(excludedDocIds: string[]): void {
  seedMockDoc(`partners/${PARTNER}/relayConfig/config`, {
    excludedVaultDocIds: excludedDocIds,
  });
}

beforeEach(() => {
  resetFirestoreMock();
  vi.clearAllMocks();
});

describe('indexRelayDoc', () => {
  it('calls indexPdfFile with relayRetrieval/{pid}/docs collection', async () => {
    await indexRelayDoc(PARTNER, FILE_ID, FILE_PATH);

    expect(mockIndexPdfFile).toHaveBeenCalledOnce();
    type IndexPdfFileArgs = [string, string, string, string, ((n: number) => Record<string, unknown>)?];
    const call = mockIndexPdfFile.mock.calls[0] as unknown as IndexPdfFileArgs;
    const [collectionName, partnerId, fileId, filePath] = call;
    expect(collectionName).toBe(RELAY_DOCS_COL);
    expect(partnerId).toBe(PARTNER);
    expect(fileId).toBe(FILE_ID);
    expect(filePath).toBe(FILE_PATH);
  });

  it('factory produces { kind, chunkIdx, indexedAt } — contiguous chunkIdx', async () => {
    await indexRelayDoc(PARTNER, FILE_ID, FILE_PATH);

    type IndexPdfFileArgs = [string, string, string, string, ((n: number) => Record<string, unknown>)?];
    const factory = (mockIndexPdfFile.mock.calls[0] as unknown as IndexPdfFileArgs)[4] as (n: number) => Record<string, unknown>;
    expect(typeof factory).toBe('function');

    for (let i = 0; i < 3; i++) {
      const fields = factory(i);
      expect(fields.kind).toBe('doc');
      expect(fields.chunkIdx).toBe(i);
      expect(typeof fields.indexedAt).toBe('string');
    }
  });

  it('does not pass centy_documents as collection', async () => {
    await indexRelayDoc(PARTNER, FILE_ID, FILE_PATH);

    type IndexPdfFileArgs = [string, string, string, string, ((n: number) => Record<string, unknown>)?];
    expect((mockIndexPdfFile.mock.calls[0] as unknown as IndexPdfFileArgs)[0]).not.toBe(CENTY_DOCS_COL);
  });

  it('respects excludedVaultDocIds — skips excluded files', async () => {
    seedConfig([FILE_ID]);
    await indexRelayDoc(PARTNER, FILE_ID, FILE_PATH);

    expect(mockIndexPdfFile).not.toHaveBeenCalled();
  });

  it('indexes a non-excluded file even when config exists', async () => {
    seedConfig(['other-doc']);
    await indexRelayDoc(PARTNER, FILE_ID, FILE_PATH);

    expect(mockIndexPdfFile).toHaveBeenCalledOnce();
  });

  it('indexes when partner has no relayConfig doc (no exclusions)', async () => {
    // No config seeded — configDoc.exists === false
    await indexRelayDoc(PARTNER, FILE_ID, FILE_PATH);

    expect(mockIndexPdfFile).toHaveBeenCalledOnce();
  });

  it('rethrows errors from indexPdfFile', async () => {
    mockIndexPdfFile.mockRejectedValueOnce(new Error('embed failed'));
    await expect(indexRelayDoc(PARTNER, FILE_ID, FILE_PATH)).rejects.toThrow('embed failed');
  });
});
