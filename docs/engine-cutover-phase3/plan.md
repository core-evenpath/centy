# Phase 3 Cutover — Execution Plan

Milestone sequence for Phase 3. Session estimate at bottom.

Prerequisites: this pre-flight merged + admin reset page session completed.

---

## Milestone sequence

### P3.M01 — Health gating cutover (X05)

**Goal:** Flip Health gating from shadow-mode to real-mode via feature flag.

**Files / surfaces:**
- `src/actions/relay-health-actions.ts` — `triggerHealthRecompute` + `recomputeEngineHealth` paths
- `src/lib/relay/health/` — gating policy constant
- `src/app/admin/relay/health/` — admin UI may surface gating state
- Feature flag constant (possibly `src/lib/feature-flags.ts` or inline)

**Dependency:** none (earliest destructive milestone; only depends on pre-flight).

**Rollback:** feature flag default stays off on first ship; flip to on in a subsequent atomic PR (P3.M01-flip). Rollback = flip flag back. No state migration.

**Risk:** **Low.** Shadow-mode behavior preserved by default; second PR flips the constant.

**Estimate:** 1 session (~2 hours).

---

### P3.M02 — *(REMOVED — no partner migration needed)*

Original playbook had partner-state migration here. Confirmed: no production partners. Milestone deleted.

---

### P3.M03 — Remove derivation shim

**Goal:** Delete the code path that derives `partner.engines` from legacy partner state when the field is missing. Every partner now writes engines explicitly via Phase 2's onboarding recipes.

**Files / surfaces:**
- `src/lib/relay/engine-recipes.ts` — `getPartnerEngines` has a fallback branch; remove the non-explicit-engines path
- `src/lib/relay/orchestrator/signals/partner.ts` — callers that rely on the derivation

**Dependency:** none from other Phase 3 milestones. Depends on confirming no code path reads partners without explicit engines (audit before removal).

**Rollback:** revert the commit. Shim is small (a single fallback function); reverting is clean.

**Risk:** **Medium.** "Audit first" requirement — need a grep + test pass confirming no callers depend on derivation. If test suite is already green after removal, rollback risk is low.

**Estimate:** ~0.5 session.

---

### P3.M04 — Delete `relay-block-taxonomy.ts`

**Goal:** Remove the legacy taxonomy file that predates the block registry. All callers migrated to `_registry-data.ts` during Phase 2.

**Files / surfaces:**
- `src/lib/relay/relay-block-taxonomy.ts` — to delete
- Grep for imports; any stragglers migrate to registry data

**Dependency:** M03 complete (derivation shim may have been a caller).

**Rollback:** revert. File is self-contained legacy.

**Risk:** **Low.** File is known-unused; the "evidence precedes removal" audit commit confirms zero live callers before the delete commit.

**Estimate:** ~0.25 session.

---

### P3.M05 — Simplify orchestrator permissive fallbacks

**Goal:** Remove the "partner has no engines → show everything" and "service break with no eligible block → show everything" fallback branches from the orchestrator. Replace the latter with the contact-fallback rule per Q10 audit.

**Files / surfaces:**
- `src/lib/relay/orchestrator/` — fallback branches in block selection
- Orchestrator tests — update expected behavior

**Dependency:** M03 + M04 + Q10 audit (already shipped this session).

**Rollback:** revert the removal commits. Fallbacks were defensive; removing them makes edge cases fail-closed, reverting re-adds them fail-open.

**Risk:** **Medium.** Service-break contact-fallback rule needs integration tests per engine. Per-engine Phase C test patterns can cover this.

**Estimate:** 1 session.

---

### P3.M06 — Final validation across all engines

**Goal:** Re-run Phase C-equivalent validation for all 5 engines post-cutover. Verify no regressions, X05 gating works as expected, service-break contact-fallback routes correctly.

**Files / surfaces:**
- No production code changes (validation only)
- New integration tests where gaps found

**Dependency:** M01, M03, M04, M05 complete. Admin reset page exists so Health resets can be exercised.

**Rollback:** none needed (validation-only).

**Risk:** **Low.** Finding problems here triggers a follow-up milestone; the validation itself is non-destructive.

**Estimate:** ~0.5 session.

---

### P3.M07 — Consolidate documentation

**Goal:** Merge Phase 1 + Phase 2 + Phase 3 retrospectives into a cohesive architecture doc. Archive per-session retros; close out the question log.

**Files / surfaces:**
- `ENGINE_ROLLOUT_SUMMARY.md`, `ENGINE_ROLLOUT_PROGRESS.md`, Phase 2 retros → consolidate under `docs/engine-architecture.md` or equivalent
- `CUTOVER_PROGRESS.md` → close with final summary
- `CUTOVER_QUESTIONS.md` → resolve remaining Q_P3_## entries
- `ENGINE_ROLLOUT_QUESTIONS.md` → close out Q10, Q13, Q15, Q17

**Dependency:** M01–M06 all complete.

**Rollback:** none needed (docs-only).

**Risk:** **Low.**

**Estimate:** ~0.5 session.

---

### P3.M08 — X04 Drafting AI (Narrow scope)

**Goal:** Ship the admin seed-drafting CLI tool per `x04-scope-decision.md`.

**Files / surfaces:**
- `scripts/draft-seed.ts` (new)
- Possibly `src/lib/relay/seed-templates/_types.ts` for shared schema
- `package.json` — add an npm script alias

**Dependency:** M01 complete (X05 before X04 per timing decision). M03–M05 don't gate X04.

**Rollback:** delete the script file + alias. Committed seeds are static.

**Risk:** **Low.** Admin-only tool; zero runtime surface.

**Estimate:** 1 session (~1.5 weeks of active work compressed into a session if AI pipeline is straightforward).

---

### P3.M09 — X05 observation closure sign-off

**Goal:** Formally close the observation window per Model B criteria. Transition Q2 + Q11 to resolved. Document in `CUTOVER_PROGRESS.md`.

**Files / surfaces:**
- `CUTOVER_PROGRESS.md` — closure sign-off block
- `ENGINE_ROLLOUT_QUESTIONS.md` — Q2, Q11 → resolved

**Dependency:** M01 live (gating on); M06 validation green.

**Rollback:** none needed (doc-only sign-off).

**Risk:** **Very low.**

**Estimate:** ~0.1 session (merged into M07 consolidate-docs session).

---

## Session estimates

| Session | Milestones | Est. hours |
|---|---|---|
| Session 1 | P3.M01 (X05 ship flag default-off) + P3.M03 (derivation shim) + P3.M04 (delete taxonomy) | ~2.5h |
| Session 2 | P3.M01-flip (flag on) + P3.M05 (permissive fallbacks) + P3.M06 (validation) | ~2.5h |
| Session 3 | P3.M08 (X04 Narrow) + P3.M07 + M09 (docs consolidation + closure) | ~2.5h |

**Total: 3 sessions for Phase 3.** Original playbook estimated 2-3; matches.

## Risk summary

| Milestone | Risk | Rollback |
|---|---|---|
| M01 | Low | Feature flag default off |
| M03 | Medium | Revert (small commit) |
| M04 | Low | Revert (known-unused) |
| M05 | Medium | Revert (fallbacks were defensive) |
| M06 | Low | Validation-only |
| M07 | Low | Docs-only |
| M08 | Low | Delete tool |
| M09 | Very low | Docs-only |

No single milestone is high-risk. Medium-risk ones (M03, M05) both have clean revert paths.

## Dependencies graph

```
pre-flight (this session) ──→ admin reset page session ──┐
                                                         ↓
                                                     Session 1
                                                    M01 M03 M04
                                                         ↓
                                                     Session 2
                                                    M01-flip M05 M06
                                                         ↓
                                                     Session 3
                                                     M08 M07 M09
                                                         ↓
                                                     Phase 3 close
```
