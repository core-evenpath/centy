# Booking Pilot — Progress Log

One block per milestone. Format defined in `docs/booking-pilot/reporting-dod.md`.

Work executed on branch `claude/phase-2-engine-rollout-Hr3aW` (branch name
predates the scope decision to build Phase 1 first; see session history).

---

## Phase A — Analysis
- Status: done
- Commit: 5dcf942
- Deliverable: `docs/booking-pilot-analysis.md` (345 lines)
- Notes: Inventory surfaced 35 tagging targets (29 native booking + 6 shared).
  Zero unresolved functionId mappings in the 13-row core recipe (below the
  20% blocker threshold per `01-phase-a-analysis.md`). Found one drift from
  the design context: the registry generator lives at repo-root
  `scripts/extract-block-registry-data.js`, not `src/scripts/`. Corrected in
  the analysis doc.

---

## M01 — Engine type system
- Status: done
- Commit: (this commit)
- Files changed: 3 (`src/lib/relay/engine-types.ts` added;
  `src/lib/relay/types.ts` re-exports; `BOOKING_PILOT_PROGRESS.md`)
- LOC: +40 in engine-types.ts, +7 in types.ts re-exports
- Tests: N/A — no unit-test runner installed (see Q1). Verified via
  `tsc --noEmit` clean and a throwaway import-probe file that exercised
  every exported symbol against the `@/lib/relay/types` path.
- Notes: `ENGINES`, `BLOCK_TAGS`, `Engine`, `BlockTag`, `isEngine`,
  `isBlockTag` all exported from both `@/lib/relay/engine-types` and
  (re-exported) `@/lib/relay/types`. No consumers wired yet; M02 adds the
  first usages via optional schema fields.

---

## M02 — Additive schema fields + Firestore rule
- Status: done
- Commit: (this commit)
- Files changed: 5 — `src/lib/relay/types.ts` (+3 LOC,
  `UnifiedBlockConfig.engines?: BlockTag[]`);
  `src/lib/types-flow-engine.ts` (+3 LOC, `FlowDefinition.engine?: Engine`);
  `src/lib/types.ts` (+5 LOC, `Partner.engines?: Engine[]` +
  `Partner.engineRecipe?: 'auto' | 'custom'`);
  `src/lib/relay/session-types.ts` (+4 LOC,
  `RelaySession.activeEngine?: Engine | null`);
  `firestore.rules` (+12 LOC, explicit deny on
  `relayEngineHealth/{docId}`).
- Tests: `tsc --noEmit` clean for the changed files (only pre-existing
  `baseUrl` deprecation warning, unrelated).
- Notes: All fields optional; zero existing partners, flows, or blocks
  break. Inline `import('./engine-types')` type-only imports avoid
  adding top-level module-graph edges in types-flow-engine.ts and
  types.ts. Firestore rule is belt-and-suspenders — the catch-all
  `{path=**}` at line 820 already denies by default, but an explicit
  rule documents the collection and matches the design spec. No
  emulator rules-test infrastructure exists in this repo; if/when it's
  added, the "admin SDK writes / clients deny" assertion should be
  covered there. Logged as a future enhancement; not blocking.
