# X04 Drafting AI — scope decision

Session: Phase 3 pre-flight v3, Task 3.

## Background

Phase 2 tuning.md §5 deferred X04 to Phase 3 for two reasons:
1. Zero onboarding-friction data; partners hadn't hit pain points that required AI assistance
2. Adding AI during engine-expansion compounds risk

Phase 2 Session 3 retro confirmed: hand-authored seeds sufficed across all 4 engine sessions. No retrospective surfaced "seeds are too thin" as operator pain.

## Candidate comparison

### Narrow — AI-assisted seed template generation (admin-only)

**What it is:** A build-time tool an admin runs when authoring new seed templates. Admin describes the partner shape; AI drafts 5 seed items; admin reviews/edits → commits. Runtime impact: zero.

- **Success metric:** admin seed-authoring time drops meaningfully for new verticals. Measurable via "minutes per template" before/after.
- **Rollback:** delete the tool. Committed seeds are static; removing the generator doesn't affect anything downstream.
- **Phase 1–2 invariants:** respected. No orchestrator change, no session state, no new Firestore paths. Only adds a `scripts/draft-seed.ts` or equivalent.
- **Evaluation corpus:** internal use; admin's own judgment. No production traffic needed.
- **Smallest shippable:** a CLI script that takes `{moduleSlug, verticalId}` and prompts the admin, returning a typed seed-template object to paste into the vertical's seed file. ~300 LOC.
- **Risk:** low. Shadow to production runtime.
- **Work:** ~1.5 weeks.

### Medium — AI-assisted partner onboarding content (onboarding-time)

**What it is:** Partner onboarding form asks 3 questions (as today) → AI drafts flow customizations + starter-module items → partner reviews → saves. AI runs once per onboarding; output is static data persisted to Firestore.

- **Success metric:** partner onboarding completion time drops; fewer partners abandon on the "configure your modules" step.
- **Rollback:** feature-flag the AI step off. Partners continue through the current hand-authored starter-block flow.
- **Phase 1–2 invariants:** mostly respected. No orchestrator change, no runtime AI. But adds a new Firestore write path (`partners/{pid}/relayConfig/flowDefinition` and `partners/{pid}/businessModules/{moduleId}/items`) with AI-drafted content. Needs care around Health recompute cascade.
- **Evaluation corpus:** test partners with varied vertical shapes. Production traffic not required; staging environment sufficient.
- **Smallest shippable:** just the starter-module drafting, not flow customization. Partner's flow template stays the curated default; only items in their connected modules get AI-drafted. ~3 weeks scoped to "items only."
- **Risk:** medium. New Firestore write path + AI pipeline + onboarding UI changes; three concerns in one milestone.
- **Work:** ~3 weeks for "items only" minimum; ~5 weeks for full flow-customization scope.

### Broad — AI-in-orchestrator for novel intents (runtime)

**What it is:** Orchestrator detects an unmatched intent (classifier returns null, no service-break hit) → AI proposes block selection from the partner's catalog → caches decision → renders. Runtime impact: direct.

- **Success metric:** "unmatched-intent" count drops; user re-prompts decrease.
- **Rollback:** feature-flag the AI path off. Orchestrator reverts to the current "fallback-first" behavior.
- **Phase 1–2 invariants:** **violated.** The Phase 1 hard rule "no AI in the hot path" was chosen specifically to keep latency + cost predictable. This candidate reopens that decision. Would also require new session-state fields to track AI-proposed decisions vs classifier decisions.
- **Evaluation corpus:** needs production-shaped traffic to evaluate meaningfully. Staging corpora don't cover the intent long-tail.
- **Smallest shippable:** cache-heavy mode — AI proposes once per (partner, intent-signature) pair; cached forever. But that still means first-turn latency added for every novel intent. ~6 weeks minimum.
- **Risk:** high. Hot-path discipline reopened, cost model uncertain, session-state growth. Reopens Phase 2 Adjustment 5 ("no new session fields").
- **Work:** ~6 weeks to first-ship, 2+ months to stabilize.

## Comparison table

| Dimension | Narrow | Medium | Broad |
|---|---|---|---|
| Runtime AI calls | 0 | 0 (onboarding-time only) | 1+ per novel intent |
| Phase 1–2 invariants | Preserved | Preserved | **Violated** (Adjustment 5 + hot-path) |
| Rollback complexity | Trivial (delete script) | Feature flag | Feature flag + state migration |
| Evaluation needs | Internal only | Staging sufficient | Production traffic required |
| New Firestore paths | 0 | 2 per partner | Partner-specific cache writes |
| Work to first-ship | ~1.5 weeks | ~3 weeks | ~6 weeks |
| Work to stable | ~1.5 weeks | ~5 weeks | ~2 months |
| Risk level | Low | Medium | High |
| Unblocked by observation closure? | Yes | Yes | **No** (needs production traffic) |

## Recommendation

**Narrow.** Ship AI-assisted seed drafting as an admin build-tool. Three reasons:

1. **No production traffic, no onboarding data yet.** Medium and Broad both depend on evaluation data we don't have. Narrow is the only candidate whose evaluation criteria are satisfiable in Phase 3 conditions.
2. **Phase 1–2 invariants held cleanly through Phase 2.** Session 3 retro confirmed Adjustment 5 (no new session fields) held across 4 engines. Medium doesn't cleanly violate it but Broad does. The cost of defending the invariant through another expansion is well-understood; the cost of reopening is not.
3. **Narrow is separable from X05.** X05 gating cutover can proceed without X04; if Narrow ships first, X05 runs against cleaner seed data; if X05 ships first, Narrow still lands clean. Medium and Broad both couple with X05 ("what happens when AI-drafted content fails Health checks?") which adds sequencing complexity.

## Evaluation criteria for Narrow

If Narrow ships:
- **Admin adoption:** admin runs the tool for ≥ 3 new seed templates in the first month
- **Quality:** ≥ 50% of AI-drafted items survive admin review without substantive edits (not just re-naming)
- **No partner-side regressions:** partners using AI-drafted-then-admin-approved seeds render the same Health signal as hand-authored seeds (verifiable via Phase C tests run against both)

If those criteria fail: revert; document why; defer to Phase 4 with whatever the specific failure was.

## What this scope does NOT include

- **No runtime AI.** Orchestrator stays pure-classifier + deterministic selection.
- **No partner-facing AI UI.** Tool is admin-only.
- **No new session-state fields.** Adjustment 5 preserved.
- **No flow-template generation.** Only seed items; flow templates stay curated.
- **No auto-apply.** Admin must explicitly commit AI output; nothing bypasses review.
- **No model selection / prompt-tuning work.** First ship uses the default model at the time; tuning is a Phase 4 concern if Narrow succeeds.

## Work sequencing for Narrow

Suggested P3.M08 shape:
1. Define a typed `SeedDraftRequest` and `SeedDraftResponse` schema
2. Build a CLI script that takes module slug + vertical id + optional seed-style hints
3. Make the script output a TypeScript source block the admin pastes into `src/lib/relay/seed-templates/<engine>/<module>.ts`
4. Dry-run on each of the 5 engines' existing seeds; compare AI-drafted vs hand-authored quality
5. Ship as internal tooling; no admin-UI surface in the first milestone

~1.5 weeks, separable from the other Phase 3 milestones.
