# Engine Rollout — Phase 2 Summary

Closed 2026-04-19. Phase 2 shipped the 6-engine architecture end-to-end across 4 engine sessions + gate session + 2 cross-cutting milestones. All deliverables validated by test; zero AI calls added; tsc baseline stable throughout.

> **Erratum (added during Phase 3 pre-flight v3, 2026-04-19):** This summary references a tsc baseline of **401** throughout Phase 2 (see §Type safety below and elsewhere). The true measurement on committed `main` was **276**, not 401. The 401 figure came from a generator bug in `scripts/extract-block-registry-data.js`: the template declared `ServerSubVerticalData` as `{ id, blocks }` but emitted literals carrying `{ id, name, industryId, blocks }`, producing 125 identical TS2353 errors that got counted into the baseline every session. Phase 2's per-session tsc-delta discipline was valid — each session preserved whatever count it observed, and 401 was stable — but the reference number was incorrect. Baseline-investigation session fixed the generator and regenerated `_registry-data.ts`; post-fix baseline is **276**. Phase 3 operates against 276. Full context: `docs/baseline-investigation/outcome.md` + commits `a2dfb85f` (generator fix), `026af78e` (regenerated file), `6b69c688` (redundant-cast cleanup) on `claude/baseline-investigation-fresh`.

---

## What shipped

### 5 primary engines (all complete)

| Engine | Session | Partner-primary fns | Blocks tagged | Flow templates | Preview scripts |
|---|---|---|---|---|---|
| Booking | Phase 1 | 50+ | ~40 | 5 | 40 |
| Commerce | Session 1 | 41 | 31 | 4 | 32 |
| Lead | Session 2 | 48 | 46 | 3 | 24 |
| Engagement | Session 3 | 4 | 11 | 3 | 24 |
| Info | Session 4 | 3 | 6 | 1 | 24 |

### Service overlay (X01)
- 4 blocks tagged during Session 1 (Commerce-adjacent)
- Per-engine Service routing via `serviceIntentBreaks` on each flow template

### Cross-cutting milestones
- **X02 Lineage view** — `src/lib/relay/lineage.ts`: pure analytical reflection over block registry + recipe + flow templates. Shadow-mode (read-only).
- **X03 Multi-engine refinement** — integration test suite exercising sticky + classifier across 5 multi-engine partner shapes.

### Deferred to Phase 3
- **X04 Drafting AI** — per tuning.md §5
- **X05 Gating cutover** — per tuning.md §6

---

## Numbers

### Test trajectory

| Checkpoint | Tests | Delta |
|---|---|---|
| Phase 1 close | 138 | baseline |
| Session 1 (Commerce + X01 + gate) | 213 | +75 |
| Session 2 (Lead) | 285 | +72 |
| Session 3 (Engagement) | 362 | +77 |
| Session 4 (Info) | 424 | +62 |
| X02 (Lineage) | 435 | +11 |
| X03 (Multi-engine) | **448** | **+13** |

**+310 tests added across Phase 2.** All 448 passing.

### Type safety
- **tsc baseline**: 401 throughout Phase 2 (zero new errors).
- Baseline drift discovered during gate session (548 → 401; `.next/types/` cruft); re-measurement discipline adopted.

### Branches pushed
- **48 branches** total across Phase 2 (pre-flight + M0 + commerce 9 + gate 4 + lead 10 + engagement 10 + info 10 + X02 + X03 + this close)

---

## Key architectural outcomes

### Per-engine C5 reduction ranges (replaces playbook's uniform 40% target)

| Engine | Observed | Target |
|---|---|---|
| Booking | ≥ 60% on multi-engine partners | ≥ 60% |
| Commerce | 10-25% | 10-25% |
| Lead | 0-27% (0% on dual-tag-heavy partners; 27% on distinct-booking-surface partners) | Variable |
| Engagement | 0% pure + up to 44% on secondary overlay | 0-15% pure + 30-50% secondary |
| Info | 0-11% pure + 40% on commerce-primary secondary | 0-15% pure + 40%+ on commerce-primary |
| Service | ≥ 60% | ≥ 60% |

**Pattern**: narrow engines (Engagement, Info) converge at 0% on pure partners and 30-50%+ on cross-engine overlay. Wide engines (Booking, Service) always reduce heavily. Dual-tag density determines Lead's range.

**Interpretation A confirmed across all 6 engines**: catalog-size reduction is ONE goal; routing discipline is the primary goal. Both work independently of reduction %.

### Six adjustments from Session 3 playbook — all held across Sessions 3+4

| # | Adjustment | Final verdict |
|---|---|---|
| 1 | C5 distribution shape (not single number) | Confirmed across Engagement + Info |
| 2 | Q16 rule (thematic categorization ≤ 2) | Stable across 4 engines (Commerce 2, Lead 2, Engagement 2, Info 1) |
| 3 | Service-exception cap ≤ 5 | 4/5 consumed; slot remaining |
| 4 | Per-block dual-tag justification | Decelerating drift (0→9→4→1 per session); zero triple-tags |
| 5 | No new session fields | Zero across 4 engines |
| 6 | Simpler ≠ lighter | Info was narrowest but shipped full suite |

### 8+1 milestone template validated

M01 through M08 + M08.5 lexicon stress held across all 4 engine sessions (Commerce, Lead, Engagement, Info). Template is the engine-rollout spec going forward.

### Lexicon stress session trend

| Engine | Initial failures | Categories | Fixes |
|---|---|---|---|
| Commerce (gate) | 3 | 2 | 3 |
| Lead | 8 | 2 | 9 |
| Engagement | 3 | 2 | 4 |
| Info | 3 | 1 | 5 |
| **Total Phase 2 lexicon additions** | **17** | — | **21 keywords** |

---

## Questions log — final status

### Resolved
- **Q1** (Phase 1 artifacts) — Phase 1 closed
- **Q8** (Commerce preview panel) — gate session
- **Q9** (Vitest subcollection mock) — gate session
- **Q12** (tsc baseline drift) — gate session
- **Q15** (service-exception cap) — 4/5 held across Phase 2
- **Q16** (lexicon stress threshold) — stable spec across 4 engines
- **Q17** (dual-tag drift) — decelerating; no concern

### Carried forward to Phase 3
- **Q2** (observation window) — still waived
- **Q3-Q7** (Phase 1 non-blocking)
- **Q10** (non-Commerce service tagging — per-engine)
- **Q11** (observation data — long-running)
- **Q13** (Playwright UI smoke — Phase 3 gating cutover prereq)

---

## Phase 2 retrospectives index

- `docs/engine-rollout-phase2/tuning.md` — 14 sections; §§11-14 are per-session findings
- `docs/engine-rollout-phase2/retro-session-1.md` — Commerce + X01
- `docs/engine-rollout-phase2/retro-session-2.md` — Lead
- `docs/engine-rollout-phase2/retro-session-3.md` — Engagement
- `docs/engine-rollout-phase2/retro-session-4.md` — Info
- `docs/engine-rollout-phase2/c5-interpretation-commerce.md` — cross-engine C5 interpretation reference
- `ENGINE_ROLLOUT_PROGRESS.md` — per-milestone progress log (48 blocks)
- `ENGINE_ROLLOUT_QUESTIONS.md` — Q1-Q17 status

---

## Phase 3 readiness

Phase 3 (cutover) preconditions now satisfied OR deferred:

| Condition | Status |
|---|---|
| Snapshot loaders wired | ✓ (M0 Session 1) |
| ≥ 2 engines shipped on prod | ✓ (5 engines + service overlay) |
| ≥ 2 weeks shadow-mode data | Still accumulating; Q11 |
| Health shadow-mode stable | ✓ |
| Per-engine routing via lexicon | ✓ (all 4 engine sessions' M08.5 + X03) |
| Multi-engine stress tested | ✓ (X03) |
| Block lineage tooling | ✓ (X02) |
| Drafting AI decision | Deferred to Phase 3 per tuning §5 |
| Gating cutover decision | Deferred to Phase 3 per tuning §6 |

**Recommendation for Phase 3 kickoff:** observation window (Q11) remains the only strict precondition for X05 gating cutover. Phase 3 session 1 can begin with X04 Drafting AI evaluation in parallel with observation-data collection.

---

## Closing discipline reminders for Phase 3

1. **tsc baseline**: run `rm -rf .next && npx tsc --noEmit` before measurement. Current baseline: 401.
2. **Speculative-From footer**: every tuning-decision commit keeps the reference.
3. **Confirm-by-test**: retrospectives do not confirm speculative items by absence-of-failure.
4. **Q16 rule for lexicon stress**: thematic categorization ≤ 2 categories proceeds, ≥ 3 stops. Applied consistently.
5. **Dual-tag justifications (Adjustment 4)**: every dual-tag gets a single-line comment in source.
6. **In-chat conversion state (Adjustment 5)**: no new session fields unless domain demands it; revisit in Phase 3 if Drafting AI needs state.
7. **C5 is distribution-shape interpretation, not single-number pass/fail** for all remaining measurements.

---

## One-line status

**Phase 2 closed. 5 primary engines + Service overlay + Lineage view + Multi-engine refinement shipped. 448/448 tests, tsc 401, zero AI calls, zero new session fields. Phase 3 can begin when user confirms.**
