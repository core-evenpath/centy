import 'server-only';

import { googleAI } from '@genkit-ai/google-genai';
import { FieldValue } from 'firebase-admin/firestore';

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase-admin';
import type { ModuleItem } from '@/lib/modules/types';

// Mirror the embedder config from fireRagSetup.ts (D6: reuse same model).
const embedder = googleAI.embedder('gemini-embedding-001', {
  outputDimensionality: 768,
});

/**
 * Index a single module item into relayRetrieval/{partnerId}/items/{itemId}.
 *
 * Idempotent: itemId is the doc ID — re-indexing overwrites in place.
 * Fire-and-forget callers MUST NOT await this on a user-facing path.
 *
 * Skips (logged, not errored) when:
 *   - source item is missing (deleted between action and index)
 *   - ragText is empty
 *   - item is inactive (isActive === false)
 */
export async function indexModuleItem(
  partnerId: string,
  moduleId: string,
  itemId: string,
): Promise<void> {
  const start = Date.now();

  const itemRef = db
    .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
    .doc(itemId);

  const itemDoc = await itemRef.get();
  if (!itemDoc.exists) {
    console.warn(`[relay-index] skip ${itemId}: source item missing`);
    return;
  }

  const item = itemDoc.data() as ModuleItem;

  if (!item.ragText) {
    console.warn(`[relay-index] skip ${itemId}: empty ragText`);
    return;
  }
  if (!item.isActive) {
    console.warn(`[relay-index] skip ${itemId}: inactive`);
    return;
  }

  const embeddingResult = (
    await ai.embed({ embedder, content: item.ragText })
  )[0].embedding;

  const docRef = db
    .collection('relayRetrieval')
    .doc(partnerId)
    .collection('items')
    .doc(itemId);

  await docRef.set({
    text: item.ragText,
    embedding: FieldValue.vector(embeddingResult),
    partnerId,
    itemId,
    moduleId,
    structured: {
      name: item.name,
      price: item.price ?? null,
      category: item.category ?? null,
      isActive: item.isActive,
    },
    indexedAt: FieldValue.serverTimestamp(),
  });

  console.log(
    `[relay-index] item ${itemId} partner ${partnerId}: embedded in ${Date.now() - start}ms, text_len ${item.ragText.length}`,
  );
}
