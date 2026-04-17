# Phase C — Validation

Run after M15. Five layers, **in order**. Each must pass before the next.

---

## C1 — Unit tests

`npm test` green. Required-green files:

- `engine-types` (M01)
- `engine-recipes` (M03)
- `booking-flow-templates` (M05)
- `health/*` (M06)
- `engine-keywords` (M10)
- `intent-engine-engine-hint` (M10)
- `engine-selection` (M11)
- `session-active-engine` (M11)
- `onboarding-recipe` (M14)
- All seed-validation tests (M15)

Coverage targets:

- `lib/relay/health/**` ≥ 80%
- `lib/relay/engine-recipes` ≥ 80%
- `lib/relay/engine-selection` ≥ 90%

---

## C2 — Integration

### C2.1 — Backward compat
Test partner with `functionId: 'hotels_resorts'` and no `engines` field → `getPartnerEngines` returns `['booking', 'service']`; orchestrator runs engine-scoped without touching the partner doc.

### C2.2 — Sticky multi-turn
Hotel conversation, 5 turns:
1. "what rooms" → `booking`
2. "see suite" → `booking` sticky
3. "what's the price" → `booking` sticky
4. "do you have parking" → `booking` sticky
5. "track my reservation from last week" → `service` switch

### C2.3 — Catalog scoping
Capture Gemini prompt block-catalog size for one turn. **≤ 25 blocks.** Compare to pre-M12 baseline. **Reduction ≥ 40%.**

---

## C3 — Smoke (3 real test partners)

Hotel, clinic, salon test partners. Per partner:

- Compute Health (shadow mode)
- Run all 8 sub-vertical scripts
- Assert:
  - 0 orchestrator errors
  - ≥ 6 / 8 scripts produce the expected block
  - Median per-turn latency same or lower than baseline

---

## C4 — Regression (3 non-Booking partners)

Ecommerce, financial, nonprofit. 3-turn conversation each. Verify:

- Response shape unchanged
- No orchestrator errors
- **Zero Health writes** for these partners (their engines aren't booking)

---

## C5 — Performance budget

For the hotel test partner from C2.3:

- Median input prompt tokens down ≥ 40% vs baseline
- p95 down ≥ 30%
- No output-quality regression (cross-check with C3 results)

If C5 fails: investigate bloat (extra block descriptions, redundant flow context) → tune catalog builder → if still failing after one round, **escalate** (rule #7).

---

## Sign-off

- All five C-gates recorded in `BOOKING_PILOT_PROGRESS.md` with measured numbers and pass/fail.
- Commit: `[booking-pilot phase-c] validation gates: unit + integration + smoke + regression + perf`.
- Only after Phase C passes and every box in [dod.md](dod.md) is checked, produce [`BOOKING_PILOT_SUMMARY.md`](final-summary.md).
