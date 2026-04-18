# Engine Rollout — Phase 2 Open Questions

Questions, escalations, and ambiguities surfaced during Phase 2 execution.
Format: one entry per block. Status transitions to `resolved` when the
ambiguity is closed out, or `carried forward` when deferred to a later phase.

---

## Q1 — Phase 1 pre-flight evidence files missing    (2026-04-17)

**Status:** **resolved** — Phase 1 completed end-to-end in subsequent sessions. All required artifacts now exist on main:

- `BOOKING_PILOT_SUMMARY.md` ✓
- `BOOKING_PILOT_QUESTIONS.md` ✓ (Q1–Q7 all classified)
- `BOOKING_PILOT_PROGRESS.md` ✓ (with "Phase 1 — Closed" entry)
- `docs/booking-pilot-analysis.md` ✓
- `docs/booking-pilot-observation.md` ✓ (watch list + sign-off checklist)

Phase 1 closed 2026-04-18 via PR #142 + close-out PR on same day. This entry is kept for audit trail.

---

## Q2 — Phase 2 pre-flight started under waived observation window    (2026-04-18)

**Status:** open — carried forward into tuning.md

**Trigger:** Phase 2's Section 2.1 pre-flight gates include "≥ 1 week of shadow-mode Health observation" and "C3 live smoke confirmed by reviewer" — both pending (observation window just started 2026-04-18; earliest completion 2026-04-25). User explicitly requested Phase 2 start now, waiving these gates.

**Implication:** `docs/engine-rollout-phase2/tuning.md` will be derived from static analysis + M12 telemetry code-surface inspection, NOT from production observation data. Specifically:

- **Lexicon refinements** — can only note that M10's service-overlay tiebreaker was added during C2.2 (production evidence of other misfires is zero — no observation data yet).
- **Health threshold tuning** — M06 thresholds (0.6 similarity, amber/red boundaries) have not been run against production partners; tuning recommendations will say "keep as-is, revisit after observation."
- **Sticky engine behavior** — M11's 4-reason outcomes are unit-tested but have not seen real conversational traffic.
- **Drafting AI decision** — no onboarding-friction observations yet; decision will default to "defer to Phase 3" until Phase 2 mid-cycle.
- **Gating cutover decision** — no shadow-mode false-positive rate data; default defer to Phase 3.

**Mitigation:** Phase 2 pre-flight tuning.md will honestly mark observation-dependent conclusions as "unknown; revisit in-phase." Phase 2's own retrospective should flag that observation data landed late.

**Original trigger text (2026-04-17):** kept below for audit trail.

---

## Q1 (original text — 2026-04-17)

**Observed state of the repo (branch `claude/phase-2-engine-rollout-Hr3aW`,
working tree clean):**

| Expected file                          | Present? |
|----------------------------------------|----------|
| `BOOKING_PILOT_SUMMARY.md` (root)      | No       |
| `BOOKING_PILOT_QUESTIONS.md` (root)    | No       |
| `BOOKING_PILOT_PROGRESS.md` (root)     | No       |
| `docs/booking-pilot-analysis.md`       | No       |

Files at repo root matching `*PILOT*` or `*ROLLOUT*`: none.
`docs/engine-rollout-phase2/` does not exist.

**What does exist that may be related (but is NOT the artifact the playbook
requires):**

- `docs/booking-pilot/` directory with per-milestone design notes:
  `00-context.md`, `01-phase-a-analysis.md`, `m01-engine-types.md` …
  `m15-drafting.md`, `phase-c-validation.md`, `reporting-dod.md`.
- Various `DONE*.md` files at repo root (`DONE.md`, `DONE_A.md`,
  `DONE_PHASE1.md`, `DONE_PHASE1_5A.md`, `RELAY_BLOCKS_DONE.md`,
  `RELAY_WIRE_DONE.md`, `Done-Apr16.md`, `done.md`). None of these are the
  expected Phase 1 summary / questions / progress artifacts.

These are *design inputs* for Phase 1, not Phase 1's *outputs* (pilot results,
risk register, open questions, performance measurements). The playbook's
tuning decisions in Section 2.2 — lexicon refinements, Health threshold
tuning, sticky-engine behavior, catalog-size budget, Drafting AI
recommendation, gating cutover recommendation — all require observed Phase 1
evidence. That evidence is not present.

**Impact:** Pre-flight cannot produce `docs/engine-rollout-phase2/tuning.md`
with integrity. Every section of that document explicitly asks for Phase 1
observations ("Did the Booking + Service keyword lexicons misfire in
production?", "Did the Health checker's red/amber/green boundaries match
operator intuition?", etc.). Without Phase 1 outputs, any tuning document
produced here would be fabricated.

Per the playbook's own hard rule ("If any of these is missing, stop") and
Operating Principle "Pause on ambiguity" and Escalation Trigger #2 ("Spec
ambiguity — design decision not in this prompt or tuning.md, can't derive
from code with high confidence"), I am stopping.

**Possible resolutions — need human decision:**

1. **Locate or provide the Phase 1 artifacts.** They may exist on another
   branch, in a separate location, or with different filenames. If the
   filenames above are wrong, please confirm the correct paths and I will
   resume pre-flight.
2. **Treat `docs/booking-pilot/` + `DONE_PHASE1*.md` as sufficient Phase 1
   input** and relax the pre-flight gate. This requires explicit
   authorization because the tuning document will then be derived from
   design intent only, with no production evidence — which inverts the
   playbook's stated premise.
3. **Run a Phase 1 retrospective pass first** to produce the four missing
   artifacts from whatever operational data is available (logs, telemetry,
   commit history), then begin Phase 2 pre-flight.
4. **Defer Phase 2** until Phase 1 reporting is closed out.

**Action taken so far:**

- Confirmed branch `claude/phase-2-engine-rollout-Hr3aW` exists and working
  tree is clean.
- Verified absence of all four expected Phase 1 files.
- Created this questions file per playbook instruction.
- No code changes made. No `tuning.md` written. No per-engine milestones
  started.

**Awaiting:** human guidance on which resolution path to take.

---

## Q3–Q7 — Phase 1 carry-forwards

**Status:** **carried forward, non-blocking** for Phase 2. Tracked in
Phase 1's `BOOKING_PILOT_QUESTIONS.md` and in `tuning.md` §8 risk
register. Summary:

- **Q3** preview sub-vertical id drift (travel/automotive/food_beverage)
- **Q4** pre-existing tsc error count (401 post-gate-session; previously
  reported as 548 due to `.next/types/` cruft — see Q12)
- **Q5** full save-hook coverage for non-booking admin saves
- **Q6** UI visual verification gap (no Playwright coverage)
- **Q7** M09 populate-module → M15 seed action wiring

None block Lead. Revisit as each engine ships.

---

## Q8 — Commerce preview panel UI import    (2026-04-18)

**Status:** **resolved** — gate session, commit `fbbae94d`.

**Trigger:** commerce.M08 shipped 32 `COMMERCE_PREVIEW_SCRIPTS` but the
admin Preview Copilot panel (`src/app/admin/relay/health/preview/page.tsx`)
only imported `BOOKING_PREVIEW_SCRIPTS`. Commerce partners couldn't run
their own preview scripts from the panel.

**Resolution:** new unified scripts index
(`src/lib/relay/preview/scripts-index.ts`) combining both registries;
engine-gated import in `page.tsx` (commerce scripts appended only when
partner has `commerce` in `getPartnerEngines`); broadened PreviewPanel
to accept `AnyPreviewScript[]`. 6 new tests in `scripts-index.test.ts`.

---

## Q9 — Vitest subcollection mock helper    (2026-04-18)

**Status:** **resolved** — gate session, commit `cba60a4b`.

**Trigger:** M0's `loadPartnerBlockPrefs` calls
`db.collection().doc().collection().get()` (subcollection read). Two
adjacent test files (`relay-health-actions.test.ts`,
`apply-fix-proposal.test.ts`) carried inline mocks that didn't
implement `.doc().collection()`. The try/catch swallowed the TypeError
but a WARN log leaked every run.

**Resolution:** extracted a reusable helper at
`src/__tests__/helpers/firestore-admin-mock.ts` with full nested
subcollection support, `.count()` aggregation, `.where/.limit`,
configurable `throwOnWrite`. Migrated 3 test files; removed ~90 LOC of
duplication; WARN leak eliminated. 7 helper validation tests.

---

## Q10 — Service tagging for non-Commerce blocks    (2026-04-18)

**Status:** open, **intentionally deferred** per-engine as each engine
ships.

**Scope:** X01 this session tagged 4 Commerce-adjacent Service blocks
(order_confirmation, order_tracker, kitchen_queue, fs_order_tracker).
Service-candidate blocks in other verticals remain untagged:
- hospitality: `check_in`
- healthcare: `lab_results`, `prescription`
- personal_wellness: `loyalty_progress`
- public_nonprofit: `application-tracker`
- (further candidates discovered as per-engine work proceeds)

**Action path:** tag Service-candidate blocks during the owning engine's
session (hospitality check_in → Booking engine retrospective;
healthcare lab_results → Info/Lead session; etc.). No dedicated X01
follow-up milestone.

---

## Q11 — Observation window data    (2026-04-18)

**Status:** open, long-running. Revisit mid-Phase-2 per pre-flight
waived-observation caveat (see Q2).

**Scope:** production shadow-mode Health + classifier data needed to
convert speculative tuning items (per `docs/engine-rollout-phase2/tuning.md`)
into confirmed decisions. Earliest meaningful sample:
7 days after phase-c merged (2026-04-25).

---

## Q12 — tsc baseline drift 548 → 401    (2026-04-18)

**Status:** **resolved** — gate session meta-finding.

**Trigger:** Session 1 retro recorded `tsc: 548 → 548`. Gate-session
re-measurement at HEAD (clean working tree) returned **401**. Root
cause: the 548 figure was evidently counted with `.next/types/` cruft
from a stale Next.js build.

**Resolution:** **401 is the correct baseline going forward.** All
future measurement MUST run `rm -rf .next && npx tsc --noEmit` to
avoid this drift. Logged in `tuning.md` §11 "Gate-session meta note."

---

## Q13 — Preview panel Playwright smoke    (2026-04-18)

**Status:** open, **intentionally deferred**. Low priority.

**Trigger:** Q8 resolution touched server + client components; unit
tests confirm the unified index works but actual UI rendering is not
covered. A Playwright smoke would close this gap.

**Action path:** bundle with Phase 3 gating-cutover work (when Health
UI becomes save-blocking, UI verification becomes mandatory). Phase 2
engines can each ship with their own unit-level coverage.

---

## Q14 — n/a (lexicon-stress escalation threshold not exceeded)

**Trigger:** the gate-session playbook instructed "log Q14 and stop" if
Commerce lexicon stress test revealed > 3 failures. Actual: 3 failures,
all fixable with targeted keyword additions. Escalation not triggered.
Fixes shipped in the same commit as the test per playbook discipline.

**No open question here** — this entry exists only to honor the
playbook's numbering.
