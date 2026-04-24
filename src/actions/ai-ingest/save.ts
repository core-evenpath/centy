'use server';

// ── AI ingest: save to module ──────────────────────────────────────────
//
// After the user approves the extracted items in the review modal,
// this action writes them through `bulkCreateModuleItemsAction`.
// `ModuleItem` has no generic metadata slot, so we stash the ingest
// provenance (source + confidence) inside `fields.__ingest` — harmless
// for consumers that don't know about it and easy to query later.

import { revalidatePath } from 'next/cache';
import { bulkCreateModuleItemsAction } from '@/actions/modules-actions';
import type { ModuleItem } from '@/lib/modules/types';
import type {
  ExtractedItem,
  SaveIngestedResult,
  IngestSource,
} from '@/lib/relay/ai-ingest/types';

function toModuleItem(item: ExtractedItem, source: IngestSource): Partial<ModuleItem> {
  const fields: Record<string, unknown> = { ...item.fields };
  fields.__ingest = {
    source: `ai_ingest:${source}`,
    confidence: item.confidence,
    importedAt: new Date().toISOString(),
    preview: item.preview,
  };
  return {
    name: item.name,
    description: item.description ?? '',
    category: item.category ?? 'general',
    price: item.price ?? 0,
    currency: item.currency ?? 'INR',
    fields,
    images: item.images ?? [],
    isActive: true,
    isFeatured: false,
    trackInventory: false,
  };
}

export async function saveIngestedItemsAction(
  partnerId: string,
  moduleId: string,
  items: ExtractedItem[],
  userId: string,
  source: IngestSource,
): Promise<SaveIngestedResult> {
  if (!partnerId || !moduleId) {
    return { success: false, error: 'partnerId and moduleId are required' };
  }
  if (!items.length) {
    return { success: false, error: 'No items to save' };
  }

  try {
    const payload = items.map((i) => toModuleItem(i, source));
    const result = await bulkCreateModuleItemsAction(
      partnerId,
      moduleId,
      payload,
      userId,
    );

    if (result.success) {
      try {
        revalidatePath('/partner/relay/datamap');
        revalidatePath(`/partner/relay/data`);
      } catch {
        /* best-effort */
      }
    }

    return {
      success: result.success,
      created: result.data?.created,
      failed: result.data?.failed,
      error: result.error,
    };
  } catch (err) {
    console.error('[ai-ingest] save failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save items',
    };
  }
}
