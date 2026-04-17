// Rule-based fix proposals for Health issues. Pure, no AI, no embeddings.
//
// Two components govern a match:
//   1. Levenshtein / token-overlap similarity ≥ 0.6
//   2. Type compatibility (numeric↔numeric, string↔string, array↔array)
//
// Proposals are ranked by confidence (high > medium > low). Admin UI (M09)
// consumes them for the Apply-fix flows.

import type {
  FixProposal,
  FixConfidence,
  BlockSnapshot,
  ModuleSnapshot,
} from './types';

// ── Similarity primitives ──────────────────────────────────────────────

// Classic Levenshtein, O(n*m). Bounded by the longest string — fine for
// field-name scale (< 40 chars typical).
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }
  return dp[m][n];
}

// Normalize to [0, 1] similarity; 1 = identical, 0 = completely different.
export function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// Token overlap on word-boundary splits (`_`, `-`, camelCase, whitespace).
// Useful when fields have matching concepts but different prefix/suffix
// (e.g., `room_name` vs `roomName` vs `unit_name`).
export function tokenOverlapSimilarity(a: string, b: string): number {
  const tokenize = (s: string): string[] =>
    s.replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 && tb.size === 0) return 1;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  const denom = Math.max(ta.size, tb.size);
  return denom === 0 ? 0 : overlap / denom;
}

// Combined similarity: best of the two.
export function fieldSimilarity(a: string, b: string): number {
  return Math.max(levenshteinSimilarity(a, b), tokenOverlapSimilarity(a, b));
}

// The 0.6 threshold is the single tuning knob. Above this, a proposal is
// emitted; below, the field is treated as truly orphan.
export const FIX_MATCH_THRESHOLD = 0.6;

function confidenceForScore(score: number): FixConfidence {
  if (score >= 0.85) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
}

// ── Proposal generators ────────────────────────────────────────────────

// For each unresolved required field on a block with a connected module,
// find the module-field with the best name-similarity + type match.
export function proposeBindFieldFixes(
  block: BlockSnapshot,
  module: ModuleSnapshot | null,
): FixProposal[] {
  if (!module) return [];
  const proposals: FixProposal[] = [];

  for (const field of block.requiredFields) {
    const binding = block.fieldBindings[field];
    if (binding && binding.bound) continue; // already resolved

    const targetType = binding?.type;
    let best: { name: string; score: number } | null = null;
    for (const mf of module.fieldCatalog) {
      if (targetType && mf.type !== targetType) continue;
      const score = fieldSimilarity(field, mf.name);
      if (score < FIX_MATCH_THRESHOLD) continue;
      if (!best || score > best.score) best = { name: mf.name, score };
    }

    if (best) {
      proposals.push({
        kind: 'bind-field',
        blockId: block.id,
        field,
        moduleSlug: module.slug,
        sourceField: best.name,
        confidence: confidenceForScore(best.score),
        reason: `Field "${field}" matches module field "${best.name}" (similarity ${best.score.toFixed(2)})`,
        payload: {
          blockId: block.id,
          field,
          moduleSlug: module.slug,
          sourceField: best.name,
        },
      });
    }
  }

  return proposals;
}

// Populate-module proposal: module is connected but has zero items.
export function proposeEmptyModuleFix(
  blockId: string,
  moduleSlug: string,
): FixProposal {
  return {
    kind: 'populate-module',
    blockId,
    moduleSlug,
    confidence: 'medium',
    reason: `Module "${moduleSlug}" is connected but empty — add items via /admin/modules or CSV import.`,
    payload: { blockId, moduleSlug },
  };
}

// Connect-flow: a block is tagged for the engine but no flow stage references it.
export function proposeConnectFlowFix(blockId: string, stageId: string): FixProposal {
  return {
    kind: 'connect-flow',
    blockId,
    confidence: 'medium',
    reason: `Block "${blockId}" is tagged but not referenced by the ${stageId} stage.`,
    payload: { blockId, stageId },
  };
}

// Enable-block: the flow references this block but the partner hasn't enabled it.
export function proposeEnableBlockFix(blockId: string): FixProposal {
  return {
    kind: 'enable-block',
    blockId,
    confidence: 'high',
    reason: `Flow stage suggests "${blockId}" but the partner has it disabled.`,
    payload: { blockId },
  };
}
