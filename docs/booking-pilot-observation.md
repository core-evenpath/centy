# Booking Pilot — Observation Log

Window start: _<to fill in when `phase-c` merges to main>_
Window end (earliest): _<+ 7 days>_
Phase 2 pre-flight unblocks when: (a) 7 days elapsed, (b) watch-list metrics within expected ranges, (c) no unresolved incidents, (d) reviewer sign-off below.

---

## Watch list

### Health write frequency
- Expected: steady state after 24h; per-partner write rate stable, not monotonically growing (would indicate an infinite loop in the save-hook).
- Where to check: Firestore console → `relayEngineHealth` collection → filter `partnerId == <sample>`.
- Observations:
  - _day 1:_
  - _day 2:_
  - _day 3:_
  - _day 4:_
  - _day 5:_
  - _day 6:_
  - _day 7:_

### Red-Health partner count
- Expected: small (≤ 5% of booking partners). Large count means the Health checker is false-positive-prone and we should tune before Phase 2.
- Where to check: `/admin/relay/health` matrix, count partners with red status across booking row.
- Observations:
  - _day 1 count:_
  - _day 3 count:_
  - _day 7 count:_
- Threshold action: if > 20% red at day 3, pause Phase 2 pre-flight; open a ticket to tune the M06 checker's thresholds.

### Telemetry completeness
- Expected: every orchestrator turn emits a structured log line containing: `partnerId`, `conversationId`, `activeEngine`, `switchedFrom`, `selectionReason`, `catalogSize`, `catalogSizeBeforeEngineFilter`, `healthStatus`, `degraded`, `partnerEnginesCount`, `engineHint`, `engineConfidence`.
- Where to check: Vercel logs / log aggregator, filter for `[relay][turn]`.
- Observations: _append on any missing-field detection_
- Threshold action: if any field drops out, it's a M12 regression — file a bug and hold Phase 2.

### `/partner/relay` error rate (booking partners)
- Expected: same as pre-pilot baseline or lower. Critically NOT regressed.
- Where to check: Vercel runtime logs + any existing error-monitoring surface.
- Observations:
  - _day 1 error rate:_
  - _day 3 error rate:_
  - _day 7 error rate:_
- Threshold action: if regressed, revert the most-recently-merged booking-pilot PR and investigate.

### Preview Copilot usage (operator adoption)
- Expected: > 0 runs by day 3. Trend up through the week indicates adoption.
- Where to check: Firestore `relayConversations` docs with id prefixed `preview_*`, or telemetry log filtered on preview conversation ids.
- Observations:
  - _total runs by day 3:_
  - _total runs by day 7:_
- Not a gate — just a signal for Phase 2's C3 scripts-per-engine sizing.

### Non-booking partner regression
- Expected: zero partner-visible behavior change for non-booking partners (ecommerce, finance, nonprofit, etc.).
- Where to check: sample 3 non-booking partners' chat transcripts or `/partner/relay` sessions post-merge.
- Observations: _append if any anomaly reported_
- Threshold action: any regression is a hard stop; revert phase-c immediately.

---

## Incidents

_Append any partner-reported issue, unexpected telemetry pattern, or operator complaint here. Include: date, partner id, description, severity, resolution._

- _(none yet)_

---

## Sign-off for Phase 2

All items must be checked and signed before Phase 2 pre-flight begins.

- [ ] 7 days elapsed since `phase-c` merged to main
- [ ] Health write frequency stable (no runaway growth)
- [ ] Red-Health partner count ≤ 5% of booking partners
- [ ] Telemetry completeness verified (no missing fields across a sampled day)
- [ ] `/partner/relay` error rate unchanged or lower
- [ ] Non-booking partners show zero regression
- [ ] No unresolved incidents in this log

**Reviewer sign-off:**

- Reviewer: _<name>_
- Date: _<date>_
- Notes: _<any Phase 2 pre-flight inputs surfaced during observation, e.g., lexicon gaps, generic-feeling degraded-mode responses, unexpected catalog sizes>_

Once all seven checkboxes are ticked and this section signed: Phase 2 pre-flight may begin. Its first gate will verify this document was filled in.
