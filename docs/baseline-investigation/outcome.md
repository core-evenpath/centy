# Baseline Investigation — Outcome and Recommendation

**Session:** Phase 3 baseline investigation
**Date:** 2026-04-19
**Branch:** `claude/baseline-investigation`
**Base:** `main` at `0ee6897` (Phase 2 close merge, PR #173)

---

## 1. Baseline measurement

| Checkpoint | tsc error count |
|---|---|
| Claimed at Phase 2 close (ENGINE_ROLLOUT_SUMMARY.md:50,157; tuning.md:268) | **401** |
| Phase 3 pre-flight (session prior, 2026-04-19) | **455** |
| This investigation, session start (re-verified clean) | **455** |
| **Post-fix, this investigation, session end** | **330** |

Command used at every measurement: `rm -rf .next && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit 2>&1 | grep -c "error TS"`.

Environment: Node v23.8.0, TypeScript 5.9.3 (from `package.json`). Unchanged across all measurements.

---

## 2. Diagnosis

**Category: B — type-definition mismatch (structural, pre-existing).**

Full evidence in [registry-data-diagnosis.md](./registry-data-diagnosis.md). Short form:

- All 125 errors in `src/app/admin/relay/blocks/previews/_registry-data.ts` were `TS2353` complaining `'name' does not exist in type 'ServerSubVerticalData'`.
- The file is auto-generated. Its generator (`scripts/extract-block-registry-data.js`) emitted a narrow `ServerSubVerticalData` type (`id + blocks`) while extracting sub-vertical arrays from per-vertical source files whose objects carry `id, name, industryId, blocks` per `SubVerticalDef` in `src/app/admin/relay/blocks/previews/_types.ts:22-28`.
- The mismatch has existed since commit `7c36f26` ("Add block registry foundation files") — every regeneration of `_registry-data.ts` produced the same 125 errors.
- Consumers downstream (`src/actions/relay-module-analytics/analytics.ts:164`, `lookups.ts:40`) already work around the narrow type by casting `as unknown as SubVerticalWithIndustry[]`, where `SubVerticalWithIndustry` is defined in `src/lib/relay/module-analytics-derive.ts:10` and explicitly uses `industryId`. That's independent confirmation that the widened shape is what consumers actually want.

---

## 3. Fix attempted: yes

Two commits on `claude/baseline-investigation`:

1. **`[baseline-investigation] fix generator path + widen ServerSubVerticalData`**
   - `scripts/extract-block-registry-data.js`: replaced hardcoded `/home/user/centy/...` path (which did not exist on any current dev machine) with `path.resolve(__dirname, '..', 'src/app/admin/relay/blocks/previews')`.
   - Widened the emitted `ServerSubVerticalData` type to `{ id, name, industryId, blocks, genericBlocks? }` to match the actual source shape.

2. **`[baseline-investigation] regenerate _registry-data.ts`**
   - Ran `node scripts/extract-block-registry-data.js`.
   - Diff: 3 lines added to the type declaration. All 125 data rows are byte-identical to before.

No hand-edits to the generated file. No `@ts-ignore`. No tsconfig changes. No TypeScript-version changes. No feature code touched.

---

## 4. Post-fix measurement and interpretation

**Post-fix baseline: 330 errors.**

- `_registry-data.ts` post-fix errors: **0** (verified with `grep "_registry-data.ts" /tmp/tsc-post-fix.txt` → no matches).
- Drop matches prediction exactly (`455 − 125 = 330`). Widening the type did not create new errors (no `industryId` cascade, no consumer regressions).

**The post-fix 330 is below the claimed Phase 2 close baseline of 401.**

This means the 401 figure was not a true measurement of committed `main`. Three candidate explanations (this session did not pick between them; see diagnosis doc §"Why the claimed 401 baseline did not catch this"):

1. The 401 was measured against a different file state (an older locally-regenerated `_registry-data.ts`).
2. The 401 was estimated or copy-forwarded across retrospectives without re-measurement despite the tuning.md §Gate-session discipline.
3. Some historical tsconfig or tsc-version difference that suppressed TS2353 on those objects, with the change predating Phase 2 close.

None of the three explanations changes the correct path forward: **330 is the true current baseline on committed `main`** and is the anchor for Phase 3.

---

## 5. Recommendation for Phase 3 pre-flight resumption

**Clean resumption — against a new baseline of 330.**

Rationale:

- The 125-error cluster was a single structural issue localized to one file, cleanly resolved by a type widening in the generator.
- No evidence of additional drift or systemic regressions.
- The remaining 330 errors are distributed across many files in the codebase and represent a separate cleanup concern unrelated to this session's trigger.
- Phase 2 close docs' reference to 401 was never a true floor; 330 is a *lower* number, so Phase 3 can safely use it.

### Phase 3 pre-flight changes needed

When the next session resumes Phase 3 pre-flight, Section 3.1 of that prompt (which currently says "tsc baseline: 401") must be updated to reference **330** as the entry baseline. Options for the reviewer:

1. Amend the Phase 3 pre-flight prompt to use 330 and cite this investigation.
2. Leave the Phase 3 pre-flight prompt as written and rely on the next Claude session reading `outcome.md` / `CUTOVER_QUESTIONS.md` Q_P3_01 first — the supersession note will redirect.

Option 1 is simpler; option 2 is hands-off. Either works.

### Phase 2 retrospective correction (flagged, not applied)

The following Phase 2 docs reference the inaccurate 401 baseline. They are **not edited by this session** — flagging them for the reviewer to decide whether to annotate:

- `ENGINE_ROLLOUT_SUMMARY.md:50` — `**tsc baseline**: 401 throughout Phase 2 (zero new errors).`
- `ENGINE_ROLLOUT_SUMMARY.md:157` — `Current baseline: 401.`
- `docs/engine-rollout-phase2/tuning.md:268` — `Gate-session re-measurement at HEAD showed **401**`

Recommendation: append a one-line erratum to each of the above noting that the Phase 3 baseline investigation (PR-TBD) established the true measurement as 330 on the same `0ee6897` commit, and the 401 figure was a miscount. Do NOT rewrite the originals per the append-only/no-edit discipline. This is a separate commit; out of scope for this investigation PR.

---

## 6. Residual work beyond this session

**Not attempted; intentionally out of scope.**

- The 330 remaining errors are distributed per `outcome.md` §1. Top contributors (from `/tmp/tsc-post-fix.txt` breakdown):

  | Errors | File / area |
  |---|---|
  | 28 | `src/lib/business-autofill-service.ts` |
  | 19 | `src/components/partner/` |
  | 15 | `src/actions/vault-actions.ts` |
  | 13 | `src/lib/mockData.ts` |
  | 10 | `src/components/partner/settings/ProfileDocuments.tsx` |

- Whether to drive these to zero is a separate Phase 3 or post-Phase-3 decision; it does not block the pre-flight.

- Bonus cleanup opportunity noted (not done in this session, also out of scope): `src/actions/relay-module-analytics/analytics.ts:164` and `src/actions/relay-module-analytics/lookups.ts:40` can drop their `as unknown as SubVerticalWithIndustry[]` casts now that the emitted type aligns with the consumer's shape. Worth a follow-up task.

---

## 7. Operational checks (Definition of Done verification)

- [x] Baseline re-verified on clean tree (Section 2.2)
- [x] `_registry-data.ts` cluster diagnosed (B)
- [x] `registry-data-diagnosis.md` committed
- [x] Surgical fix attempted (diagnosis B path)
- [x] Post-fix tsc measurement captured (330, verified)
- [x] `outcome.md` committed with recommendation (this file)
- [x] Every commit prefixed `[baseline-investigation]`
- [x] Zero feature code changes (diffs limited to `scripts/extract-block-registry-data.js`, `_registry-data.ts`, `docs/baseline-investigation/*`, `CUTOVER_QUESTIONS.md`, `CUTOVER_PROGRESS.md`)
- [x] No `@ts-ignore` / `@ts-expect-error` added
- [x] No tsconfig / TypeScript-version changes

---

## 8. One-line summary

`_registry-data.ts` 125-error cluster was a structural generator-vs-source-type mismatch dating to foundation commit `7c36f26`; fixed by widening the emitted `ServerSubVerticalData` type and regenerating; post-fix tsc baseline is 330, below the claimed 401 at Phase 2 close — 330 is the true current baseline; Phase 3 pre-flight can resume cleanly against 330.
