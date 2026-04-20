// P4 Space constants.

/**
 * Per-hold TTL. Same 15min as booking holds (P3). Spaces are
 * date-range reservations (nights, not minutes); if operator
 * feedback warrants a longer window post-launch, tune here.
 */
export const SPACE_HOLD_TTL_MS = 15 * 60 * 1000;

/**
 * Correctness guard matching booking's limit. A session with >5
 * concurrent space holds is almost certainly a bug.
 */
export const MAX_CONCURRENT_SPACE_HOLDS = 5;
