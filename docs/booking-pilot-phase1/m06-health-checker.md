# M06 — Health checker (pure functions)

**Files:**
- `lib/relay/health/{types,field-health,block-health,stage-health,engine-health,fix-proposals,index}.ts`
- `__tests__/health/*.test.ts`

**Goal:** Pure deterministic Health checker. No I/O, no AI, no model calls.

## Types

```ts
interface BlockHealth {
  blockId: string;
  status: 'ok' | 'empty' | 'missing' | 'skipped';
  hasFlowReference: boolean;
  hasModuleConnection: boolean;
  fieldsOk: number; fieldsEmpty: number; fieldsMissing: number;
}

interface StageHealth { stageId: string; status: Health; blockCount: number; blocksWithData: number; }

interface FixProposal {
  kind: 'bind-field' | 'enable-block' | 'connect-flow' | 'populate-module';
  blockId?: string; field?: string; moduleSlug?: string; sourceField?: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  payload: Record<string, unknown>;
}

interface EngineHealthDoc {
  partnerId: string; engine: Engine; status: 'green' | 'amber' | 'red'; computedAt: number;
  stages: StageHealth[];
  orphanBlocks: Array<{ blockId: string; reason: string }>;
  orphanFlowTargets: Array<{ flowId: string; stageId: string; blockId: string }>;
  unresolvedBindings: Array<{ blockId: string; field: string; reason: string }>;
  emptyModules: string[];
  fixProposals: FixProposal[];
}
```

## Functions

- `field-health.ts` re-exports primitives from existing `lib/relay/binding-health.ts`.
- `computeBlockHealth`: roll up field healths + check flow reference + module connection.
- `computeStageHealth`: ok if ≥1 renderable block, missing if 0 renderable, skipped if stage empty.
- `computeEngineHealth`: filter blocks to engine + 'shared', roll up. Status:
  - **red** if any canonical stage has 0 renderable blocks
  - **amber** if any unresolved binding or empty module
  - **green** otherwise

## `proposeFixes` — rule-based only

- Field-name similarity via Levenshtein or token overlap (≥ 0.6) **plus** type compatibility (numeric↔numeric, string↔string, array↔array).
- No NLP, no embeddings, no AI.

## Purity rules

- No `await`, no Firestore, no `fetch`
- Only one `Date.now()` at the very end of `computeEngineHealth`
- Same input → same output (except `computedAt`)
- No input mutation

## Acceptance

- [ ] All modules pure (no I/O, no mutation, deterministic)
- [ ] Tests cover: green, missing-stage red, orphan-block red, orphan-flow-target red, unresolved-binding amber, empty-module amber, fix-proposal match, fix-proposal no-match
- [ ] Coverage ≥ 80% on `lib/relay/health/**`
- [ ] Zero network/filesystem calls in tests

## Escalation triggers

- `moduleBinding` shape is too complex to roll up deterministically
- Fix-proposal false-positive rate > 30% on hand-validated fixtures

## Commit

`[booking-pilot M06] pure health checker: block, stage, engine + fix proposals`
