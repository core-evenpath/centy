import 'server-only';

// ── Core Memory source adapter ─────────────────────────────────────────
//
// Reads `partners/{pid}/hubDocuments/{id}` docs (the canonical
// Core-Memory store — see `partnerhub-actions.ts`) and concatenates
// their `extractedText` into a single content blob. Missing docs are
// silently skipped; the caller decides what to do if everything is
// empty.

import { db } from '@/lib/firebase-admin';
import type { SourceExtractionResult } from './types';

const MAX_TEXT_PER_DOC = 30_000;

export async function extractFromCoreMemory(
  partnerId: string,
  docIds: string[],
): Promise<SourceExtractionResult> {
  if (docIds.length === 0) {
    return {
      success: false,
      content: '',
      sourceLabel: 'Core Memory',
      error: 'No document IDs supplied',
    };
  }

  try {
    const col = db.collection('partners').doc(partnerId).collection('hubDocuments');
    const snaps = await Promise.all(docIds.map((id) => col.doc(id).get()));

    const fragments: string[] = [];
    let matchedDocs = 0;
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() as Record<string, unknown> | undefined;
      const raw = data?.extractedText ?? data?.content;
      if (typeof raw === 'string' && raw.length > 0) {
        fragments.push(raw.slice(0, MAX_TEXT_PER_DOC));
        matchedDocs++;
      }
    }

    return {
      success: fragments.length > 0,
      content: fragments.join('\n\n'),
      sourceLabel: `${matchedDocs} Core Memory document${matchedDocs === 1 ? '' : 's'}`,
      error:
        fragments.length === 0
          ? 'None of the selected documents contained extracted text'
          : undefined,
    };
  } catch (err) {
    return {
      success: false,
      content: '',
      sourceLabel: 'Core Memory',
      error: err instanceof Error ? err.message : 'Failed to load documents',
    };
  }
}
