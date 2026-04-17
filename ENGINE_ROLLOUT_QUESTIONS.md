# Engine Rollout — Phase 2 Open Questions

Questions, escalations, and ambiguities surfaced during Phase 2 execution.
Format: one entry per block. Status transitions to `resolved` when the
ambiguity is closed out, or `carried forward` when deferred to a later phase.

---

## Q1 — Phase 1 pre-flight evidence files missing    (2026-04-17)

**Status:** open — BLOCKING

**Trigger:** Section 2.1 (Pre-flight / Read Phase 1 outputs). The playbook
instructs:

> Read these files at repo root and absorb every conclusion:
> - `BOOKING_PILOT_SUMMARY.md`
> - `BOOKING_PILOT_QUESTIONS.md`
> - `BOOKING_PILOT_PROGRESS.md`
> - `docs/booking-pilot-analysis.md`
>
> If any of these is missing, **stop**. Phase 2 cannot proceed without
> Phase 1 evidence. Log to `ENGINE_ROLLOUT_QUESTIONS.md` and escalate.

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
