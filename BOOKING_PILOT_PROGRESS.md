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

---

## M03 — Engine recipes (FUNCTION_TO_ENGINES + accessors)
- Status: done
- Commit: (this commit)
- Files changed: 1 new file `src/lib/relay/engine-recipes.ts` (~220 LOC).
  Exports `FUNCTION_TO_ENGINES` (142 entries — one per BUSINESS_FUNCTIONS
  row, zero gaps), `deriveEnginesFromFunctionId`, `getPartnerEngines`.
- Tests: no unit runner (see Q1). Verified via an ad-hoc tsx probe:
  - Every taxonomy functionId is covered (142/142, zero extras).
  - All 13 Appendix C booking-native mappings match exactly:
    `hotels_resorts`, `budget_accommodation`, `boutique_bnb`,
    `serviced_apartments`, `vacation_rentals`, `guest_houses`,
    `camping_glamping`, `corporate_housing` (with `lead` for the B2B
    arm), `event_venues` (with `lead`), `ticketing_booking`,
    `airport_transfer`, `cinemas_theaters`, `taxi_ride`.
  - Edge cases: unknown/`null`/empty string all return `[]`.
  - Output order stable — sorted by canonical `ENGINES` tuple position.
- Notes: **Booking-primary mappings are high-confidence** and ship
  correct at this milestone. Non-booking engine membership (commerce,
  lead, engagement, info) is a best-effort first cut and is **data-only**
  until Phase 2 — no runtime reads exercise these tags in Phase 1. Phase
  2's per-engine tuning (M01 of each engine) will revisit these assignments
  with production evidence.
  `getPartnerEngines` reads the firestore partner doc's deep
  `businessPersona.identity.businessCategories[0].functionId` path
  defensively (path-cast) since the Partner type doesn't expose
  `businessPersona` publicly. Path matches
  `orchestrator/signals/partner.ts:31-35`.
- Phase 1 contract: no consumer wired yet (M11/M12 will call
  `getPartnerEngines` at runtime). Zero partner-visible change.

---

## M04 — Tag Booking + shared blocks with `engines[]`
- Status: done
- Commit: (this commit)
- Files changed: 10 — `scripts/extract-block-registry-data.js` (generator
  template + shared-block reconciliation), `_types.ts` (added `engines?:
  BlockTag[]` to `VerticalBlockDef`), 7 vertical `index.tsx` files
  (automotive, events_entertainment, food_beverage, healthcare, hospitality,
  personal_wellness, travel_transport), regenerated `_registry-data.ts`.
- Tests: no runner (Q1). Verified via ad-hoc tsx probe:
  - 6 shared blocks tagged `['shared']`
  - 31 booking blocks tagged `['booking']`
  - 0 blocks tagged for non-booking, non-shared engines
  - Every booking-tagged block has valid `stage` and non-empty `desc`
  - `getAllowedBlocksForFunction('hotels_resorts')` returns 18 blocks, all
    with engine tags (13 booking + 5 shared)
  - `tsc --noEmit` clean
- Notes: Hit two drifts on session resume (see Q2). Fixed the generator's
  shared-block-id divergence inline (reconciled toward unprefixed runtime-
  authoritative ids). A1 analysis doc is stale on specifics (wrong ids,
  missed `venue_space` + `camping_unit`); not updating retroactively —
  M04's actual tagging supersedes A1.
- Deviations from spec: M04 spec said "do not hand-edit `_registry-data.ts`".
  Done — all edits were to sources + generator, with clean regeneration.
  M04 spec listed 35 tagging targets (A1); shipped 37 (6 shared + 31
  booking). The +2 booking are the A1 omissions noted above. Spec itself
  was informed by A1, so the extra tagging is strictly additive and not a
  deviation from spec intent.
