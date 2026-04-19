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
- [ ] **NOT** modified `src/lib/relay/engine-recipes.ts`
- [ ] **NOT** modified any caller
- [ ] **NOT** updated tests

Awaiting direction before proceeding with M03 removal.
