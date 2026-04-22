import 'server-only';

import { indexPdfFile } from '@/ai/fireRagSetup';
import { db } from '@/lib/firebase-admin';

/**
 * Index a partner-uploaded PDF into relayRetrieval/{pid}/docs.
 *
 * Respects the partner's excludedVaultDocIds from relayKnowledge —
 * excluded vault files are not indexed (strategy.md open question #1,
 * resolved: read at index time, not cached).
 *
 * Uses indexPdfFile's extraFieldsFactory to add { kind: 'doc',
 * chunkIdx, indexedAt } alongside the chunk's { text, embedding,
 * fileId, partnerId } that indexToFirestore writes.
 *
 * Fire-and-forget pattern at call site; this function itself awaits
 * completion.
 *
 * NOTE: Re-upload dedup (accumulating chunks on same fileId) is a
 * known gap — MR-5 owns the delete/update path for vault file changes.
 *
 * @param partnerId - Partner whose docs collection is written to
 * @param fileId    - vaultFiles doc ID
 * @param filePath  - local filesystem path to the uploaded PDF
 */
export async function indexRelayDoc(
  partnerId: string,
  fileId: string,
  filePath: string,
): Promise<void> {
  const start = Date.now();

  // Exclusion guard: read at index time (not cached) per strategy.md open question #1.
  const configDoc = await db
    .collection(`partners/${partnerId}/relayConfig`)
    .doc('config')
    .get();
  const excludedIds: string[] = configDoc.exists
    ? ((configDoc.data()?.excludedVaultDocIds as string[]) ?? [])
    : [];

  if (excludedIds.includes(fileId)) {
    console.info(`[relay-index] doc ${fileId} partner ${partnerId}: excluded — skipping`);
    return;
  }

  try {
    await indexPdfFile(
      `relayRetrieval/${partnerId}/docs`,
      partnerId,
      fileId,
      filePath,
      (chunkIdx) => ({
        kind: 'doc',
        chunkIdx,
        indexedAt: new Date().toISOString(),
      }),
    );
    console.log(
      `[relay-index] doc ${fileId} partner ${partnerId}: indexed from ${filePath} in ${Date.now() - start}ms`,
    );
  } catch (err) {
    console.error(`[relay-index] doc ${fileId} partner ${partnerId}: indexing failed`, err);
    throw err;
  }
}
