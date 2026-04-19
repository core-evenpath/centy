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
 * X05 Health gating cutover (introduced in P3.M01, flipped in
 * P3.M01-flip during Phase 3 Session 2).
 *
 * `false` → shadow mode: Health computes and writes but never blocks
 *           a save or runtime response. This is the pre-cutover
 *           behavior preserved through Phases 1 and 2.
 *
 * `true`  → gating mode: red-Health blocks saves per the gating
 *           policy in `src/lib/relay/health/gating.ts`. Wired into
 *           callers during P3.M05.
 *
 * Default: `false`. Session 1 (P3.M01) ships the infrastructure; no
 * caller consumes `decideHealthGate` yet. Session 2 (P3.M01-flip)
 * is the atomic flip-to-true PR; Session 2 (P3.M05) wires the policy
 * into save-path callers.
 */
export const HEALTH_GATING_ENABLED = false;
