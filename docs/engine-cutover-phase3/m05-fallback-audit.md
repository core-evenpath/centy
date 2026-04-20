# P3.M05 — Orchestrator permissive-fallback audit

Session: Phase 3 Session 2, P3.M05.
Branch: `claude/phase-2-engine-rollout-Hr3aW`.
Baseline: tsc = 276, tests 531/531.

"Evidence precedes removal" (tuning.md §4.1). This doc enumerates every
permissive fallback branch in the orchestrator and the save-path
actions that need Health gating wired in. M05's removal commits
reference this.

## 1. Permissive fallbacks in the orchestrator

### 1.1 Engine-null fallback in blocks signal

**File:** `src/lib/relay/orchestrator/signals/blocks.ts:85-89`

```ts
if (activeEngine) {
  visibleBlockIds = visibleBlockIds.filter((id) =>
    blockMatchesEngine(id, activeEngine),
  );
}
```

**Behavior today:** when `activeEngine` is `null`, no engine filter is
applied — every partner-visible block reaches the policy layer.

**Why it's reachable:** `selectActiveEngine` rule 5 (engine-selection.ts:73)
returns `engine: null` when `partnerEngines.length === 0`. Post-P3.M03,
`getPartnerEngines` returns `[]` for partners without an explicit `engines`
array. The orchestrator then runs with `activeEngine = null` and this
branch silently permits every visible block.

**Removal semantics:** filter unconditionally using `activeEngine ?? null`
— when null, filter yields empty. Effect: partners without engines see
no blocks (not the whole catalog). Phase 3 invariant (no production
partners without engines) makes this a no-op runtime change.

### 1.2 Engine-null fallback in flow signal

**File:** `src/lib/relay/orchestrator/signals/flow.ts:66-71`

```ts
if (activeEngine && data.engine && data.engine !== activeEngine) {
  // Partner override is for a different engine — fall through...
} else {
  return data;
}
```

**Behavior today:** partner override with `data.engine` unset is returned
regardless of `activeEngine`. Combined with the later template lookup
(`if (activeEngine === 'booking')` etc.), an `activeEngine === null`
skips all engine-specific template paths and falls through to
`getFlowTemplateForFunction(functionId)` — the pre-pilot legacy map.

**Why it's reachable:** same root cause — `activeEngine === null`.

**Removal semantics:** we keep the legacy template map as the
`activeEngine === null` path intentionally (it's not a permissive
fallback, it's the engine-agnostic default). The permissive part is
that a partner with a custom flow doc not scoped to any engine is
still honored when their engine resolution fails — cleanup here is
documentation, not code change. **Not modified in M05.**

### 1.3 Policy-layer empty-allowlist fallback

**File:** `src/lib/relay/orchestrator/policy.ts:133-140`

```ts
if (isTransactional(flow.intent) && allowed.length > 0) return 'block_only';
// ...
if (allowed.length > 0) return 'block_only';
return 'fallback';
```

**Behavior today:** when `allowed.length === 0`, `decidePath` returns
`'fallback'` and the orchestrator emits text-only reply (no block).

**Why it's reachable for service-break:** when `activeEngine === 'service'`
and the partner's visible blocks don't include any service-tagged or
shared block, the post-filter visibleBlockIds is empty → base is
empty → allowed is empty → path is 'fallback'.

**Removal semantics:** replace 'fallback' with a contact-block injection
specifically when `activeEngine === 'service'` and a service-break
intent is active. The Q10 audit (§"Action for P3.M05") specifies the
rule: service break + no eligible service-tagged block → render
`contact` with error context. See §3 below for the rule.

### 1.4 Orchestrator index — engine-null comment

**File:** `src/lib/relay/orchestrator/index.ts:162-168`

This is a comment, not a fallback. It acknowledges that `partner.engines = []`
→ `activeEngine = null` → downstream signals fall into permissive paths.
M05 removes the permissive paths referenced; the comment gets updated.

## 2. Save-path callers of `triggerHealthRecompute`

Grep: `rg "triggerHealthRecompute" src/ --type ts`

| File | Line | Callsite context |
|---|---|---|
| `src/actions/modules-actions.ts` | 977 | After `updateModuleItem` succeeds |
| `src/actions/relay-seed-actions.ts` | 139 | After `applySeedTemplate` bulk write |
| `src/actions/relay-seed-actions.ts` | 216 | After second seed flow batch commit |
| `src/actions/relay-health-actions.ts` | — | Self (defines the function) |
| `src/lib/relay/preview/script-runner.ts` | — | Comment only; not called (preview isolation) |

**Gating wiring strategy:** each caller is a **post-save** recompute, not
a pre-save check. `evaluateHealthGate` is for **pre-save** gating: read
current Health, deny if red. The semantic shape M05 ships:

1. Add a pre-save `evaluateHealthGate` check at the top of each save
   action that could degrade Health further when partner state is
   already red. With `HEALTH_GATING_ENABLED = false` (default), the
   gate always allows. When M01-flip ships, the gate enforces.
2. Return a structured error on deny — callers render a "health-red"
   message rather than silently failing.

**Scope discipline:** only wire the two highest-impact save paths in
M05:
- `updateModuleItem` — partner module item saves (high volume)
- `applySeedTemplate` — seed template applies (bulk writes, most risky)

Other save paths (block configs, flow definition, partner settings)
are lower-risk and stay unwired in M05 — add them in a follow-up if
telemetry surfaces issues.

## 3. Q10 contact-fallback rule

**Rule:** when `activeEngine === 'service'` AND `allowed.length === 0`
AND `intent ∈ SERVICE_BREAK_INTENTS`, inject `'contact'` as the
rendered block with error context in the telemetry.

**Placement:** orchestrator selection layer
(`src/lib/relay/orchestrator/index.ts`), after the policy decision and
before the Gemini call. This matches tuning.md §4.4 ("single
orchestrator rule; no per-intent service blocks authored").

**Service-break intent set:** the Q10 audit enumerates per-engine
service-break intents by name (track-reservation, cancel-booking,
track-order, etc.), but the orchestrator's `IntentSignal` enum is
semantic not engine-specific. For M05, use the semantic mapping:

| IntentSignal value | Treated as service-break? |
|---|---|
| `'returning'` | yes (track/status of prior commitment) |
| `'complaint'` | yes (report-issue flow) |
| `'contact'` | yes (already contact-seeking) |
| `'urgent'` | yes (escalation) |
| all others | no |

When activeEngine is 'service' and intent falls in this set AND the
catalog is empty, emit contact.

**Why this set:** these four IntentSignals cover the Q10 service-break
taxonomy via their semantic shape. Engine-specific intents
(`track-reservation`) aren't distinct IntentSignal values — they all
classify as `'returning'` or `'contact'` via the existing
`detectIntent` logic (flow-engine.ts).

## 4. Test coverage strategy

Per tuning.md §3.2 (confirm-by-test), M05 commits each land with a
targeted test:

1. **Engine-null filter removal (§1.1):** unit test for `loadBlocksSignal`
   verifying that when `activeEngine === null`, visibleBlockIds is `[]`
   (not the full set). Test mocks `db.collection` calls.

2. **Contact-fallback rule (§3):** integration-style test at
   `src/lib/relay/orchestrator/__tests__/contact-fallback.test.ts`
   verifying that service + empty catalog + returning intent →
   response includes blockId `'contact'`.

3. **Save-path gating wiring (§2):** unit tests for the two targeted
   save paths, using `withGatingEnabled(true, ...)` to exercise the
   deny branch. With flag off, tests verify the save proceeds
   unchanged (backward compat during shadow period).

## 5. Rollback plan

Each M05 sub-commit is independently revertable:

| Commit | Rollback |
|---|---|
| M05.1 engine-null filter | `git revert <sha>` — re-enables permissive visible-blocks |
| M05.2 contact-fallback | `git revert <sha>` — service-break returns to text-only |
| M05.3 gating wiring | `git revert <sha>` — save paths stop checking gate; writes proceed unconditionally |

Since `HEALTH_GATING_ENABLED = false` throughout M05, gating is
dormant; the wiring revert is purely cleanup. Runtime behavior is
unchanged between "M05 shipped, flag off" and "M05 reverted".

## 6. Proceeding

M05 sub-commit order:
1. `[cutover P3.M05-audit]` — this doc
2. `[cutover P3.M05.1]` — engine-null permissive fallback removal (blocks.ts §1.1)
3. `[cutover P3.M05.2]` — contact-fallback rule for service-break (§3)
4. `[cutover P3.M05.3]` — wire `evaluateHealthGate` into two save paths (§2)
