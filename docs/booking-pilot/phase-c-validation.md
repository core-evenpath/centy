# Phase C — Validation

Run in order. Record results in `BOOKING_PILOT_PROGRESS.md`.

---

## C1. Unit tests — green across

- `lib/relay/engine-recipes` (M03)
- `lib/relay/health/*` (M06)
- `lib/relay/session-store` (M11)
- `lib/relay/intent-engine` (M10)
- `lib/relay/orchestrator/policy` (M12)
- `lib/relay/engine-keywords` (M10)

Coverage ≥ 70% for `lib/relay/health/*` and `lib/relay/engine-recipes` (escalation trigger if not — see `reporting-dod.md`).

---

## C2. Integration tests

1. Boot a test partner with `functionId: 'hotels_resorts'` and **no `engines` field** → `getPartnerEngines(partner)` returns `['booking', 'service']`.
2. Run a 5-turn conversation → `activeEngine` is `booking` throughout, block catalog stays engine-scoped (assert catalog size < 30).
3. Inject the user message `"track my reservation"` → `activeEngine` switches to `service` on that turn.

---

## C3. Smoke tests (3 existing test partners)

Pick one hotel, one clinic, one salon. For each:

- Compute Health in shadow mode → log result.
- Run the full Preview Copilot script suite for the matching sub-vertical → verify zero orchestrator errors and zero missing-block fallbacks.
- Compare against pre-change baseline and record:
  - Response latency (p50, p95)
  - Block-catalog size
  - Gemini prompt token count

Record all numbers in `BOOKING_PILOT_PROGRESS.md`.

---

## C4. Regression check (non-booking partners)

Pick 3 partners in non-booking verticals (ecommerce, financial, nonprofit). Verify:

- `/partner/relay` still functions end-to-end.
- Their Health is **not** computed (no engine enabled → no write).
- No new errors appear in orchestrator logs.

A single regression here is a blocker. Stop and escalate.

---

## C5. Performance budget

- Engine-scoped catalog must reduce Gemini prompt tokens for booking partners by **≥ 40%** vs the pre-change baseline captured in C3.
- If not met: investigate, do **not** proceed to Definition of Done. Escalate via `BOOKING_PILOT_QUESTIONS.md`.

---

## Sign-off

- All five C-gates recorded in `BOOKING_PILOT_PROGRESS.md` with measured numbers and pass/fail.
- Commit: `[booking-pilot C] validation gates: unit + integration + smoke + regression + perf`.
