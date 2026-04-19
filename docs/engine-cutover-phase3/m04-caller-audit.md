# P3.M04 — `relay-block-taxonomy.ts` caller audit

Session: Phase 3 Session 1, P3.M04.
Branch: `claude/cutover-p3-m04` (stacked on `claude/cutover-p3-m03`).

## Audit

```bash
grep -rn "relay-block-taxonomy" src/ --include="*.ts" --include="*.tsx"
grep -rn "getBlockMappingForFunction\|getBlockMappingsForIndustry" src/ --include="*.ts" --include="*.tsx" | grep -v __tests__
```

Results:
- **1 live import**: `src/lib/flow-engine.ts:9`
- **1 live call**: `src/lib/flow-engine.ts:255` — `getBlockMappingForFunction(functionId)`
- **0 other production callers** for either exported function
- No test fixtures import the module

Matches the pre-session audit expectation exactly.

## Caller context (`flow-engine.ts:250–265`)

Intent-only fallback mode — fires when no current stage is set. Uses the taxonomy to pick block types relevant to the detected intent:

```ts
const mapping = getBlockMappingForFunction(functionId);
const allBlocks = [...mapping.primaryBlocks, ...mapping.secondaryBlocks];
const relevantBlocks = STAGE_BLOCK_RELEVANCE[stageType] ?? [];

blockTypes = allBlocks.filter((b) => relevantBlocks.includes(b));
if (blockTypes.length === 0) {
  blockTypes = relevantBlocks.slice(0, 3);
}
```

The caller wants a list of block IDs available to this functionId, intersected with block IDs relevant to the detected stage type.

## Migration path

Replace the taxonomy lookup with engine-scoped registry data:

```ts
// BEFORE:
const mapping = getBlockMappingForFunction(functionId);
const allBlocks = [...mapping.primaryBlocks, ...mapping.secondaryBlocks];

// AFTER:
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';
import { deriveEnginesFromFunctionId } from '@/lib/relay/engine-recipes';
import type { BlockTag } from '@/lib/relay/engine-types';

const engines = deriveEnginesFromFunctionId(functionId);
const allBlocks = ALL_BLOCKS_DATA
  .filter((b) => {
    const tags = (b as typeof b & { engines?: BlockTag[] }).engines;
    if (!tags || tags.length === 0) return false;  // untagged → excluded
    return tags.some((t) => engines.includes(t as never)) || tags.includes('shared');
  })
  .map((b) => b.id);
```

Pattern matches `src/actions/relay-health-actions.ts:loadBlockSnapshots` — same engine-tag filter, production-proven.

**Semantic note:** the taxonomy's FALLBACK_MAPPING was returned for unknown functionIds (empty functionId, legacy data). Post-migration, unknown functionIds return engines `[]` from `deriveEnginesFromFunctionId`, filter produces `allBlocks=[]`, and the caller's existing fallback on line 263 (`if (blockTypes.length === 0) blockTypes = relevantBlocks.slice(0, 3)`) handles it. Behavior preserved.

## Proceeding

Migrate `flow-engine.ts`, delete `src/lib/relay-block-taxonomy.ts`, verify zero lingering references.
