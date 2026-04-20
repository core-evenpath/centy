// P3 Booking constants per ADR-P4-01 §TTL and session invariants.

/**
 * Per-hold TTL. Shorter than cart's 2h — booking holds represent
 * inventory lockout (a slot or room others can't grab), so the
 * lease expires quickly. ADR-P4-01 §TTL names 15min as target.
 */
export const BOOKING_HOLD_TTL_MS = 15 * 60 * 1000;

/**
 * Escape hatch for runaway reducer state. A session with >5
 * concurrent holds is doing something unusual; throw rather than
 * accumulate. Not a business rule — a correctness guard.
 */
export const MAX_CONCURRENT_HOLDS = 5;
