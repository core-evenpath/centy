# Definition of Done

All must be true. If any unchecked, do not write `BOOKING_PILOT_SUMMARY.md`.

## Code & schema

- [ ] All 15 milestones committed with expected commit-message format (`[booking-pilot Mxx] <summary>`)
- [ ] `tsc --noEmit` passes on `main` after final merge
- [ ] No `engines` tags on non-Booking blocks (booking-only constraint upheld)
- [ ] All new schema fields optional; no required-field migrations
- [ ] `lib/relay-block-taxonomy.ts` still present, marked deprecated, not deleted

## Deliverables

- [ ] `docs/booking-pilot-analysis.md` exists and answers A1–A6 ([phase-a-analysis.md](phase-a-analysis.md))
- [ ] `BOOKING_PILOT_PROGRESS.md` has one block per milestone (15) plus Phase A and Phase C entries
- [ ] `BOOKING_PILOT_SUMMARY.md` exists and follows the template in [final-summary.md](final-summary.md)
- [ ] `BOOKING_PILOT_QUESTIONS.md` exists if any escalation occurred; every entry resolved or carried forward with a note

## Validation

- [ ] Phase C all green — C1 unit, C2 integration, C3 smoke, C4 regression, C5 performance ([phase-c-validation.md](phase-c-validation.md))
- [ ] ≥ 3 real test partners onboarded via M14 and running cleanly through Preview Copilot (M13)
- [ ] Zero regressions on 3 non-Booking partners (C4)

## Operational

- [ ] Health computed and stored in shadow mode for all Booking partners
- [ ] Health is not gating any save path or runtime path
- [ ] No new AI calls anywhere in changed code paths (grep for new Gemini/Anthropic imports outside the orchestrator)
- [ ] Per-turn telemetry log emits: `activeEngine`, `catalogSize`, `healthStatus`, `selectionReason` (from M12)

## Final gate

Do not produce `BOOKING_PILOT_SUMMARY.md` until every box above is checked. If any are unverifiable (e.g., a partner can't be onboarded because of infra issues), treat as blocked and escalate via [escalation.md](escalation.md) rule #2.
