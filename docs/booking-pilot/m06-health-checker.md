# M06 — Health checker (pure functions)

## Files (all new)

- `lib/relay/health/types.ts`
- `lib/relay/health/field-health.ts` — thin re-exports of existing primitives from `lib/relay/binding-health.ts`
- `lib/relay/health/block-health.ts`
- `lib/relay/health/stage-health.ts`
- `lib/relay/health/engine-health.ts`
- `__tests__/relay-health/*.test.ts`

## Function signatures

```ts
computeBlockHealth(block, partnerModules, flowRefs): BlockHealth
computeStageHealth(stageId, engineBlocks): StageHealth
computeEngineHealth(input: EngineHealthInput): EngineHealthDoc
```

All **pure** — no I/O, no Firestore reads, no network. Inputs in, document out.

## `EngineHealthDoc` shape

```ts
{
  partnerId: string;
  engine: Engine;
  status: 'green' | 'amber' | 'red';
  computedAt: number;
  stages: Array<{ stageId: string; status: Health; blockCount: number }>;
  orphanBlocks: Array<{ blockId: string; reason: string }>;
  orphanFlowTargets: Array<{ flowId: string; stageId: string; blockId: string }>;
  unresolvedBindings: Array<{ blockId: string; field: string; reason: string }>;
  emptyModules: string[];
  fixProposals: Array<FixProposal>;
}
```

## Fix proposals — deterministic only

- **Field-name similarity (Levenshtein or token overlap) + type compatibility.**
- Never invoke an AI model.
- Return an ordered list (best match first). Ties broken by lexical order for stability.

## Acceptance

- All functions pure (no I/O). Confirm by reading the code — no imports of `firebase-admin`, `fetch`, or any SDK.
- Unit tests cover:
  - Green case (all bound, no orphans)
  - Missing stage
  - Orphan block
  - Orphan flow target
  - Unresolved binding with close-match proposal
  - Unresolved binding with no match (empty proposals)
  - Empty module
- Test coverage ≥ 70% for `lib/relay/health/*` (escalation trigger if not).

## Commit

`[booking-pilot M06] pure health checker: block, stage, engine + fix proposals`
