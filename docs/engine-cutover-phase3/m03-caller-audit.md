# P3.M03 — `getPartnerEngines` derivation shim caller audit

Session: Phase 3 Session 1, P3.M03.
Branch: `claude/cutover-p3-m03` (stacked on `claude/cutover-p3-m01`).
HEAD: M01 just landed; baseline tsc 276; tests 531/531.

## Audit method

```bash
grep -rn "getPartnerEngines\s*(" src/ --include="*.ts" --include="*.tsx"
```

29 total occurrences. Of those:
- 23 in `__tests__/` directories (test stubs / fixtures)
- 1 is the function definition itself (`src/lib/relay/engine-recipes.ts:236`)
- 1 is a JSDoc reference in `src/lib/types.ts:163`
- **4 are live production call sites** (production code, not tests)

## Production callers — classification

| Caller | What it passes | Could reach derivation branch? | Empty-return handling today |
|---|---|---|---|
| `src/actions/relay-health-actions.ts:414` | `partner` cast `as unknown as Parameters<...>[0]` (loose shape) | Yes — passes whatever `partner` arg the action received | `if (resolved.length > 0) engines = resolved;` — falls back to `['booking']` default if empty |
| `src/app/admin/relay/health/preview/page.tsx:30` | `data` (Firestore-loaded partner doc) | Yes — Firestore docs may lack `engines` field | `partnerEngines = getPartnerEngines(data);` then engine-gates preview scripts. Empty list = no engine-specific scripts appended (booking-only path) |
| `src/app/admin/relay/health/page.tsx:28` | `data as unknown as Parameters<...>[0]` (Firestore doc) | Yes | `partnerEnginesById[d.id] = engines;` — stored for matrix rendering. Empty list → matrix renders em-dashes for every engine column |
| `src/lib/relay/orchestrator/index.ts:161` | `partner.partnerData as Parameters<...>[0] ?? {}` (orchestrator runtime) | Yes — runtime hot path | Passed to engine selection. Empty list means `selectActiveEngine` rule 4 returns null engine; orchestrator falls into engine-agnostic legacy path |

## Discrepancy with pre-session expectation

The Phase 3 Session 1 prompt's expected outcome:

> "37 total call sites; one live runtime caller (`src/actions/relay-health-actions.ts:~57586`, passing a typed `Partner`); the rest are tests or doc examples."

Actual:

- 29 call sites (not 37)
- **4** live runtime callers (not 1)
- All 4 pass **loose Firestore-shape data** (not typed Partner)

The prompt explicitly defines this as a halt condition:

> "If your audit finds a live caller passing a partner without `engines`, **stop and surface** — that contradicts Phase 2's onboarding-writes-engines invariant and needs investigation."

## Why removal might still be safe (architectural reasoning)

1. **No production partners.** Per `tuning.md §4.2`: Phase 3's risk model is architectural cleanup, not production cutover. If no production partners exist, no Firestore doc reaches these callers without explicit `engines`.
2. **Every caller has empty-list handling.** Removing derivation changes semantics from "derive from functionId" to "return `[]`." Each of the 4 callers handles `[]` already:
   - `relay-health-actions.ts` → default to `['booking']`
   - `preview/page.tsx` → no engine-specific scripts appended
   - `health/page.tsx` → matrix em-dashes
   - `orchestrator/index.ts` → engine-agnostic legacy path
3. **Phase 2 onboarding writes engines.** Any partner created via `applyEngineRecipe` in M14 has `engines` populated.

## Why removal might NOT be safe (counterarguments)

1. **The semantic change is observable.** Pre-Phase-2 partners (if any exist in any environment, including dev/staging) currently get derived engines. Post-removal they get `[]` and the legacy-fallback behavior. This is a behavior change, not a no-op.
2. **The orchestrator caller is the runtime hot path.** Switching it from "5-engine support derived from functionId" to "engine-agnostic legacy fallback" is a meaningful UX change for any partner without explicit engines.
3. **The pre-session audit was wrong.** That alone is reason to pause. The prompt's safety reasoning assumed "no caller relies on derivation." Actual code shows 4 callers that can reach the derivation branch with loose-shape partners. The principle the playbook relied on may not hold as cleanly as expected.

## Recommendation: HALT and confirm

Per the prompt's halt condition + the "pause on ambiguity" rule from `booking-pilot/00-context.md`, I am stopping before the removal commit and surfacing for direction.

Three resolution paths:

**A — Proceed with removal.** Accept the architectural reasoning above: no production partners, every caller handles empty lists, Phase 2 onboarding writes engines explicitly. The semantic change for hypothetical legacy partners is fine because no such partners exist in any deployed environment. Risk: low if the no-production-partners invariant holds.

**B — Update the playbook expectation, audit each caller in depth, then proceed.** Re-baseline the prompt's expected-callers count, individually verify each caller's empty-list behavior is acceptable, then remove the shim. Adds ~30min but produces a stronger audit artifact.

**C — Reduce shim removal scope.** Keep the derivation function (`deriveEnginesFromFunctionId`) AND keep `getPartnerEngines`'s fallback, but flag the fallback with a console.warn so any production hit gets observed. Defer full removal to Phase 4 once observation confirms zero production hits. Risk: lowest, but also lowest cleanup value.

**Recommendation: B.** A is fast but skips the audit work that the prompt's expectation gap surfaces. C is over-cautious for a cutover phase. B produces the right artifact + acceptable removal speed.

## Action taken so far

- [x] Audited all `getPartnerEngines` call sites (29 total, 4 production)
- [x] Classified each production caller's empty-list handling
- [x] Documented the pre-session-expectation discrepancy
- [x] **Option B (extended audit)** — per-caller deep audit below
- [ ] NOT yet modified `src/lib/relay/engine-recipes.ts`

---

## Option B — per-caller deep audit

For each of the 4 production callers, trace the data path from its
data source to `getPartnerEngines` and verify the empty-list behavior
at the call site. Then inventory test fixtures that exercise the
derivation branch so their root-cause migration is scoped.

### Caller 1 — `src/actions/relay-health-actions.ts:414`

**Data path:** `triggerHealthRecompute(partnerId, partner?)`. The
`partner` argument is optional; invokers decide whether to pass it.

**Invokers in production (via grep):**
- `src/actions/modules-actions.ts:977` → `await triggerHealthRecompute(partnerId);` — **no partner arg**
- `src/actions/relay-seed-actions.ts:139` → `await triggerHealthRecompute(partnerId);` — **no partner arg**
- `src/actions/relay-seed-actions.ts:216` → `await triggerHealthRecompute(partnerId);` — **no partner arg**

**Finding:** no production invoker passes `partner`. The `if (partner) { ... getPartnerEngines(...) }` branch is **architecturally unreachable from production**. Test fixtures (`apply-fix-proposal.test.ts`, `relay-health-actions.test.ts`) pass `partner` for coverage, but production paths always hit the default `['booking']` fallback.

**Shim-removal impact:** zero. Branch never fires in production anyway. Post-removal, even if a future caller passes a partner with missing `engines`, the caller's existing `if (resolved.length > 0) engines = resolved;` guard handles the empty case cleanly.

### Caller 2 — `src/app/admin/relay/health/preview/page.tsx:30`

**Data path:** Next.js server component loads a partner doc via `adminDb.collection('partners').doc(partnerId).get()`. Returns the raw Firestore doc data.

**Empty-list handling:** `if (data) partnerEngines = getPartnerEngines(data);` → sets `partnerEngines` to whatever `getPartnerEngines` returns. Then:

```ts
const scripts: AnyPreviewScript[] = [...BOOKING_PREVIEW_SCRIPTS];
if (partnerEngines.includes('commerce')) scripts.push(...COMMERCE_PREVIEW_SCRIPTS);
if (partnerEngines.includes('lead')) ...
// etc
```

Empty list → booking scripts only, no engine-specific scripts appended. The catch-block comment on line 32 explicitly says `"Fall back to raw id; no engines → booking scripts only"` — the page already treats empty-engines as an expected degraded state.

**Shim-removal impact:** partners without `engines` go from "5-engine preview script set derived from functionId" to "booking-only preview script set." Acceptable degradation for partners that haven't been Phase-2-onboarded.

### Caller 3 — `src/app/admin/relay/health/page.tsx:28`

**Data path:** Next.js server component iterates partner docs via `adminDb.collection('partners').limit(50).get()`. Builds `partnerEnginesById` map used by `HealthShell` to render the matrix.

**Empty-list handling:** `partnerEnginesById[d.id] = engines;` stores whatever `getPartnerEngines` returned. The matrix gates cells on `partnerEngines.includes(engine)` — empty list renders em-dashes for every engine column.

**Shim-removal impact:** partners without `engines` go from "derived-engine matrix cells" to "all-em-dashes matrix cells." Admin-facing UX change. The original comment on line 25-27 explicitly calls out the derivation behavior: `"partner.engines override → functionId derivation"`. Removing the shim means this comment needs updating alongside the behavior change.

### Caller 4 — `src/lib/relay/orchestrator/index.ts:161`

**Data path:** Runtime hot path. `partner.partnerData` is the raw Firestore doc loaded in `loadPartnerSignal` (`src/lib/relay/orchestrator/signals/partner.ts`). The signal loader reads `snap.data() as Record<string, unknown>` — no schema-level guarantee that `engines` is populated.

**Empty-list handling:** `partnerEngines = []` → `selectActiveEngine` rule 4 fails → returns `{ engine: null, reason: 'fallback-none' }`. The orchestrator proceeds with `activeEngine: null`.

**Downstream with `activeEngine = null`:**
- `loadFlowSignal(ctx, functionId, null)` — resolves flow template by `functionId` alone (Phase 1 legacy path, still present)
- `loadBlocksSignal(partnerId, null)` — engine-agnostic blocks catalog
- Health degraded-mode check guard: `if (activeEngine)` — skips when null

**Shim-removal impact:** partners without `engines` go from "5-engine-scoped orchestrator behavior" to "engine-agnostic legacy orchestrator behavior." The legacy path is preserved for Phase 1 backward compat; it functions correctly but loses engine-specific routing improvements from Phase 2. Acceptable for partners that haven't been Phase-2-onboarded.

### Summary of the 4 production callers

| Caller | Empty-engines behavior | Shim removal acceptable? |
|---|---|---|
| 1 — `relay-health-actions.ts:414` | Defensive branch unreachable in production | ✅ Yes — no observable change |
| 2 — `preview/page.tsx:30` | Booking-only preview scripts | ✅ Yes — documented degradation |
| 3 — `health/page.tsx:28` | Em-dashes across matrix | ✅ Yes — admin-facing-only change |
| 4 — `orchestrator/index.ts:161` | Engine-agnostic legacy path | ✅ Yes — preserved fallback |

All four callers handle empty engines correctly. Removal is safe under the no-production-partners invariant.

### Test-fixture inventory (22 fixtures across 8 files)

These test fixtures construct partners WITHOUT `engines` and rely on the derivation branch:

| File | Fixtures |
|---|---|
| `engine-recipes-engagement.test.ts` | 1 |
| `engine-recipes-info.test.ts` | 1 |
| `engine-recipes-lead.test.ts` | 2 |
| `x01-service-overlay.test.ts` | 2 |
| `health-matrix-commerce.test.ts` | 3 |
| `health-matrix-engagement.test.ts` | 5 |
| `health-matrix-info.test.ts` | 4 |
| `health-matrix-lead.test.ts` | 4 |

**Migration approach:** these tests are asserting recipe-table correctness (functionId → engines). Post-removal they should call `deriveEnginesFromFunctionId(fn)` directly — which remains exported for onboarding's use. The test's intent doesn't change; only the function under test does.

For cases that genuinely need to test the partner-level API (where the partner has `engines` explicitly set), fixtures can pass `engines: [...]` directly and call `getPartnerEngines` against that — those tests become passthrough tests rather than derivation tests.

### Revised plan

1. Update test fixtures to call `deriveEnginesFromFunctionId` directly for the derivation assertions (22 fixtures across 8 files)
2. Remove the derivation branch from `getPartnerEngines`; relax its parameter back to `Pick<Partner, 'engines'>`
3. Simplify the 3 callers' type casts (`as unknown as Parameters<...>` no longer needed with the tighter param type — the passing shape was always a superset of `Pick<Partner, 'engines'>`)
4. `src/lib/types.ts:163` JSDoc comment update ("runtime derivation via getPartnerEngines" is no longer accurate)
5. Keep `deriveEnginesFromFunctionId` exported (onboarding still uses it)

**Proceeding with this plan.**
