/**
 * Server-safe admin block registry helpers.
 *
 * The source of truth for block IDs, labels, intents, and stages is the
 * admin preview registry at `src/app/admin/relay/blocks/previews/*`.
 * That tree contains React components (client-only). The data-only
 * sibling `_registry-data.ts` (auto-generated) is the server-safe
 * version we can import from route handlers without dragging the React
 * component graph into the API bundle.
 *
 * This module builds:
 *   - the per-partner allowed block list (shared + sub-vertical blocks)
 *   - the Gemini system-prompt fragment describing each block ID
 *
 * Gemini is instructed to reply with `{ blockId, text, suggestions }`
 * where `blockId` is one of the allowed IDs. The runtime renders the
 * matching admin preview component — no more RAG population, no more
 * partner item data flowing into the chat card.
 */

import {
  ALL_BLOCKS_DATA,
  ALL_SUB_VERTICALS_DATA,
  SHARED_BLOCK_IDS_DATA,
  type ServerBlockData,
} from '@/app/admin/relay/blocks/previews/_registry-data';
import type { Engine, BlockTag } from './engine-types';

// Blocks whose preview is a passive presentation element, not a real
// "choose me for the customer's question" response. These are still
// valid block IDs, but we hide them from the classifier menu.
const CLASSIFIER_EXCLUDE = new Set<string>(['suggestions']);

export function getAllowedBlocksForFunction(functionId: string | null | undefined): ServerBlockData[] {
  const subVertical = functionId
    ? ALL_SUB_VERTICALS_DATA.find((s) => s.id === functionId)
    : null;

  const allowedIds = new Set<string>([
    ...SHARED_BLOCK_IDS_DATA,
    ...(subVertical?.blocks ?? []),
  ]);

  return ALL_BLOCKS_DATA
    .filter((b) => allowedIds.has(b.id))
    .filter((b) => b.status !== 'planned')
    .filter((b) => !CLASSIFIER_EXCLUDE.has(b.id));
}

export function getAllowedBlockIds(functionId: string | null | undefined): string[] {
  return getAllowedBlocksForFunction(functionId).map((b) => b.id);
}

/**
 * M12: engine-scoped catalog. Returns the intersection of
 * `getAllowedBlocksForFunction(functionId)` with blocks tagged for the
 * given engine (or 'shared'). When `engine` is null/undefined, returns
 * the full function-scoped list — preserving pre-pilot behavior for
 * partners who haven't resolved an activeEngine yet.
 *
 * Blocks without `engines` tagging are also preserved in the permissive
 * path so Phase 1 doesn't regress non-booking partners whose blocks
 * haven't been tagged (home services, education, etc.).
 */
export function getAllowedBlocksForFunctionAndEngine(
  functionId: string | null | undefined,
  engine: Engine | null | undefined,
): ServerBlockData[] {
  const base = getAllowedBlocksForFunction(functionId);
  if (!engine) return base;

  return base.filter((b) => {
    const tags = (b as ServerBlockData & { engines?: BlockTag[] }).engines;
    // Untagged blocks pass through — M04 only tagged the booking pilot's
    // 7 verticals. Other verticals' blocks ship untagged for now and
    // must remain available to partners whose engines include them.
    if (!tags || tags.length === 0) return true;
    return tags.includes(engine) || tags.includes('shared');
  });
}

export function getAllowedBlockIdsForEngine(
  functionId: string | null | undefined,
  engine: Engine | null | undefined,
): string[] {
  return getAllowedBlocksForFunctionAndEngine(functionId, engine).map((b) => b.id);
}

/**
 * Build the block-catalog fragment that goes into Gemini's system
 * prompt. Emits a compact one-line-per-block list so the model can pick
 * the best `blockId` for the visitor's last message.
 */
export function buildBlockCatalogPrompt(blocks: ServerBlockData[]): string {
  if (blocks.length === 0) {
    return 'No block designs are registered for this partner. Reply with plain text only.';
  }

  const lines: string[] = [
    'BLOCK CATALOG — pick the single best `blockId` for the visitor\'s latest message:',
    '',
  ];

  for (const b of blocks) {
    const intentHint = b.intents.length > 0 ? `  — triggers: ${b.intents.slice(0, 6).join(', ')}` : '';
    lines.push(`- ${b.id} [stage: ${b.stage}] — ${b.desc}${intentHint}`);
  }

  lines.push('');
  lines.push('If nothing fits, omit `blockId` and reply with text only.');

  return lines.join('\n');
}
