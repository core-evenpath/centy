# Baseline investigation — outcome

Session completed 2026-04-19 on branch `claude/baseline-investigation`, stacked on `main` at HEAD `244261a`.

## Baseline measurements

| Measurement | Result | Command |
|---|---|---|
| Pre-fix baseline (current `main`) | **401** | `rm -rf .next && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit \| grep -c "error TS"` |
| Post-generator-fix baseline | **276** | same command |
| Post-cast-cleanup baseline | **276** | same command |

**Net reduction: −125 errors (31% of the original total).**

Stable across multiple measurements within this session.

## Diagnosis

**A — Generator staleness.** See `registry-data-diagnosis.md` for full analysis.

In summary: `scripts/extract-block-registry-data.js` declared `ServerSubVerticalData` as `{ id, blocks }` in its output template, but then embedded vertical-source literals carrying `{ id, name, industryId, blocks }`. Every regeneration reproduced 125 identical TS2353 "`'name' does not exist`" errors.

## Fix shipped

Three commits on `claude/baseline-investigation`:

| Commit | Summary |
|---|---|
| `de7b8330` | Diagnosis doc |
| `a2dfb85f` | Widen `ServerSubVerticalData` in generator template (add optional `name?`, `industryId?`) |
| `026af78e` | Regenerate `_registry-data.ts` |
| `6b69c688` | Drop `as unknown as SubVerticalWithIndustry[]` casts in `analytics.ts:164` + `lookups.ts:40` (no longer needed); drop now-unused `type SubVerticalWithIndustry` imports |

All fixes are surgical:
- 7 lines added to one generator script
- Generated output re-emitted mechanically
- Two call sites had redundant casts removed (and one redundant import each)
- Zero feature code changed
- Zero tsconfig / TypeScript-version changes
- No `@ts-ignore` / `@ts-expect-error` added

## Post-fix error distribution

Top contributors on the post-fix tree (276 total):

| Errors | File |
|---|---|
| 28 | `src/lib/business-autofill-service.ts` |
| 19 | `src/components/partner/*` |
| 15 | `src/actions/vault-actions.ts` |
| 13 | `src/lib/mockData.ts` |
| 10 | `src/components/partner/settings/ProfileDocuments.tsx` |
| 9 | `src/app/partner/*` |
| 8 | `src/lib/types/multi-workspace.ts` |
| 7 | `src/components/workflow/builder/NodeLibrary.tsx` |
| 7 | `src/components/partner/modules/ItemEditor.tsx` |
| 7 | `src/components/admin/PartnerAIMemory.tsx` |

No single file or pattern dominates the remaining 276. They're distributed cleanup concerns unrelated to the generator bug, each small and separable.

## Recommendation for Phase 3 pre-flight resumption

**CLEAN.** Phase 3 pre-flight can resume against the new baseline of **276** once this branch merges.

### Specific guidance for the next pre-flight session:

1. **Update `phase3-preflight-revised-prompt.md` Section 4.2** before running it:
   - Replace `Expected value: 330 ± 5` with `Expected value: 276 ± 5` (or whatever the number is after this branch merges — re-measure post-merge)
   - Remove references to a prior PR #175 / `efd6891` — those commits don't exist; the actual fix lives in the three commits listed above on the branch from this session

2. **Task 8 of the revised pre-flight is already done** (dropping the `as unknown as SubVerticalWithIndustry[]` casts). Flag it as already-shipped rather than attempting to repeat it.

3. **Task 9 of the revised pre-flight (erratum notes to Phase 2 close docs) should still run.** `ENGINE_ROLLOUT_SUMMARY.md` and `docs/engine-rollout-phase2/tuning.md` continue to reference "tsc baseline: 401" — erratum blocks correcting that to 276 (and explaining the generator bug) should be added. The erratum block should reference the commits on this branch, not the nonexistent `efd6891` / PR #175.

### Phase 2 retrospective correction flag

`ENGINE_ROLLOUT_SUMMARY.md` line ~50 and `docs/engine-rollout-phase2/tuning.md` line ~268 both reference "tsc baseline: 401 throughout Phase 2." Those claims propagate a state that existed but was the wrong measurement. Phase 2's per-session tsc-delta discipline was valid (each session preserved whatever count it observed, and that count was 401 from the first session through the last). But the retrospective framing that 401 represented a healthy number was incorrect — 125 of those 401 errors were a fixable generator bug.

**Do NOT edit either file in this session.** Phase 2 retrospectives should be preserved as historical record. The next pre-flight session's Task 9 is where erratum notes get added at the top of each file, pointing to this investigation.

## Sanity checks run

- [x] Baseline measured twice pre-fix (both returned 401)
- [x] Baseline measured post-fix (276)
- [x] Baseline measured post-cast-cleanup (276, unchanged — cast removals didn't mask anything)
- [x] Top cluster file is auto-generated (header confirms)
- [x] Generator exists and runs (`node scripts/extract-block-registry-data.js`)
- [x] Regenerated file diffs cleanly against pre-fix (only the interface block widened; no spurious formatting drift in the 145 sub-vertical literal lines)
- [x] Zero `@ts-ignore` / `@ts-expect-error` additions (grep returns empty diff)
- [x] Zero tsconfig / TypeScript-version changes

## Open questions

None new from this session. Q_P3_01 and Q_P3_02 become resolved by this fix:
- **Q_P3_01** (tsc baseline drift 401 → 455 between Phase 2 close and Phase 3 attempt): superseded. The 455 measurement from that prior session isn't reproducible on current `main`; current baseline is 401 pre-fix. That prior escalation remains in the record for audit.
- **Q_P3_02** (PR #175 prerequisite missing): this session IS the baseline investigation that Q_P3_02 said was missing. It produced the `docs/baseline-investigation/` artifacts that Q_P3_02 flagged as absent. Once this branch merges, Phase 3 pre-flight can resume.

Both can transition to "resolved" in the next pre-flight session's opening note (not edited by this session per append-only discipline).
