// Runtime feature flags for the Relay engine.
//
// Each flag is a `const` boolean so dead-code elimination handles the
// off case. Flip flag values in atomic single-constant PRs — never
// mix a flag flip with other code changes in the same commit.
//
// Convention:
// - One named export per flag, ALL_CAPS_SNAKE_CASE
// - JSDoc above the flag describes both states + the milestone it
//   was introduced in / will be flipped in
// - No dynamic flag resolution (env, remote config, etc.) here. Add
//   another module if runtime config becomes necessary.

/**
 * X05 Health gating cutover (introduced in P3.M01, flipped to true in
 * P3.M01-flip during Phase 3 Session 2).
 *
 * `false` → shadow mode: Health computes and writes but never blocks
 *           a save or runtime response.
 *
 * `true`  → gating mode: red-Health blocks saves per the gating
 *           policy in `src/lib/relay/health/gating.ts`. Wired into
 *           save-path callers in P3.M05 via `evaluatePartnerSaveGate`.
 *
 * Current value: `true` (P3.M01-flip). Rollback = flip back to `false`
 * in a single-constant PR; no state migration needed.
 */
export const HEALTH_GATING_ENABLED = true;
