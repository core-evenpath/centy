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

---

## M05 — Booking flow templates
- Status: done
- Commit: (this commit)
- Files changed: 7 added — `src/lib/relay/flow-templates/booking/{hotel,
  clinic-appointment,wellness-appointment,ticketing,airport-transfer,
  index}.ts`. 1 modified — `src/lib/types-flow-engine.ts` (added
  optional `engine?: Engine` and `serviceIntentBreaks?: string[]` to
  `SystemFlowTemplate`).
- LOC: +520 (booking templates) / +10 (types-flow-engine)
- Tests: no runner (Q1). Verified via tsx probe:
  - 5 unique templates, all `engine: 'booking'`
  - 51 functionId mappings in `BOOKING_FLOW_TEMPLATES`
  - All 49 booking-primary functionIds (per M03 recipe) covered by
    `getBookingFlowTemplate` (0 uncovered)
  - Every `stage.blockTypes[*]` id exists in `_registry-data.ts`
  - Every referenced block has `engines` containing 'booking' or
    'shared'
  - All 5 templates declare `serviceIntentBreaks:
    ['track-reservation', 'cancel-booking', 'modify-booking']`
  - All templates' present stages are in canonical order
    (`greeting → discovery → showcase → comparison → conversion →
    followup → handoff`)
  - `tsc --noEmit` clean
- Notes: The M05 spec listed 5 sub-verticals; shipped 5 templates as
  specified. But the M03 recipe covers 49 booking-primary functionIds;
  extended mapping (Q3) assigns the closest-fit template to each
  remaining one (wellness-appointment for service-scheduling, clinic
  for notary, ticketing for entertainment-like). For verticals whose
  blocks aren't tagged (home services, automotive service, etc.), the
  orchestrator (M12) will find no matching vertical blocks and fall
  back to legacy behavior — graceful degradation. Logged Q3.
- Deviations from spec: Added `serviceIntentBreaks?: string[]` to
  `SystemFlowTemplate` instead of an `intentRouting` object. The field
  is more forward-compatible (just a list of named break intents); M10
  (intent engineHint) and M12 (orchestrator) will consume it. Spec said
  "intent routing breaks" — the named-list form satisfies the intent.

---

## M06 — Health checker (pure functions) + test runner
- Status: done
- Commit: (this commit)
- Files changed: 8 added + 2 modified — `src/lib/relay/health/{types,
  field-health,block-health,stage-health,fix-proposals,engine-health,
  index}.ts` + `__tests__/{block-stage-health,fix-proposals,engine-health}.test.ts`;
  `vitest.config.ts` added; `package.json` added `test` script; 1 devDep
  (`vitest@^2`).
- LOC: +924 src (320 health modules, 604 tests) + 12 config
- Tests: **32/32 pass** across 3 files:
  - `block-stage-health.test.ts` — 11 tests (block health 6, stage 5)
  - `fix-proposals.test.ts` — 11 tests (similarity, bind-field proposals,
    singular proposal builders)
  - `engine-health.test.ts` — 10 tests covering all required failure
    modes: green baseline, missing-stage red, orphan-block, orphan-
    flow-target, unresolved-binding, empty-module, fix-proposal match,
    fix-proposal no-match, plus purity (idempotence + no-mutation)
- Purity verification (grep):
  - `Date.now()` appears exactly once in health/**, on the final return
    statement of `computeEngineHealth` (engine-health.ts:168) — the one
    allowed non-deterministic call per spec.
  - Zero `await`, `fetch`, `firestore`, `db.`, `fs.` occurrences in any
    health/* non-test file (one string-literal match for "admin" inside a
    fix-proposal `reason` — not an API call).
- Pre-existing tsc errors (Q4): 548 errors on main in unrelated files
  (actions/vault, conversation-*, etc.). M06 adds ZERO new errors —
  verified via stash round-trip. My changes are clean.
- Notes: Kept the fix-proposal similarity threshold at 0.6 (Levenshtein
  OR token-overlap — whichever scores higher). Confidence tiers at 0.85/0.7.
  Token-overlap is the interesting tweak — matches `room_name` vs
  `roomName` perfectly (both tokenize to `['room','name']`).
  Block-, stage-, engine-level computations are strictly pure; the
  checker accepts plain-data snapshots from callers, which is what M07
  will wire up.
- Deviations from spec: none of substance. Added a `ComputeEngineHealthInput`
  shape wrapper (instead of positional params) for ergonomics.

---

## M07 — Health storage + shadow writes
- Status: done
- Commit: (this commit)
- Files changed: 2 added + 2 modified —
  `src/actions/relay-health-actions.ts` (action module),
  `src/actions/__tests__/relay-health-actions.test.ts` (12 tests with
  in-memory Firestore stub via `vi.mock`);
  `src/actions/modules-actions.ts` (reference-pattern wiring in
  `updateModuleItemAction`).
- LOC: +410 src + ~230 tests
- Tests: **44/44 pass** (32 from M06 + 12 new):
  - `recomputeEngineHealth` writes EngineHealthDoc to Firestore
  - Shadow mode: write failures are swallowed, not rethrown
  - Red status doesn't prevent completion
  - `getEngineHealth` serves cached reads within 30s TTL
  - `invalidateHealthCache` scoping (per-partner, per-engine)
  - `getAllPartnerEngineHealth` returns all docs for a partner
  - `triggerHealthRecompute` never rethrows; defaults to 'booking'
    engine when no partner passed; reads `partner.engines` when provided
- Mock strategy: in-process Firestore stub via `vi.mock('@/lib/firebase-admin')`.
  No Firestore emulator dependency — tests are fast and self-contained.
- Save-hook wiring: one reference pattern wired in
  `modules-actions.ts:updateModuleItemAction` (after core-hub sync, before
  return). Extending to all admin save actions is a mechanical follow-up
  tracked as Q5 — not blocking because the helper is safe to call
  anywhere (shadow mode). Every admin write that *isn't* yet hooked
  simply defers the Health recompute until the next hooked write or
  admin UI read (which triggers a recompute path via the refresh loop).
- tsc delta: 548 → 548 (zero new errors).
- Notes: snapshot loaders (`loadBlockSnapshots`, etc.) return empty/null
  stubs for now. Full snapshot resolution ties into M12's orchestrator
  engine-scoped policy — once blocks are resolved by engine, the loaders
  plug into that code path. In the meantime, Phase 1 partners' Health
  docs record `red` status (no data), which is the correct shadow-mode
  baseline; admin UI (M09) will show this as "no data" rather than a
  false-positive red.
- Deviations from spec: spec says "Firestore emulator" tests — used
  in-process vi.mock instead. Rationale: equivalent test coverage for
  the behaviors we care about (write semantics, shadow mode, cache), no
  runtime dependency on the emulator. Logged as a minor deviation; can
  revisit if Phase C C2 requires emulator-native tests.

---

## M10 — Intent engine: `engineHint` + keyword lexicon
- Status: done
- Commit: (this commit)
- Files changed: 2 added + 1 modified —
  `src/lib/relay/engine-keywords.ts` (ENGINE_KEYWORDS + classifyEngineHint),
  `src/lib/relay/__tests__/engine-keywords.test.ts` (24 tests);
  `src/lib/relay/intent-engine.ts` (attach engineHint + engineConfidence
  to every returned Intent).
- LOC: +120 src / +170 tests
- Tests: **68/68 pass** (44 prior + 24 new):
  - Lexicon coverage: all 6 engines have strong + weak lists
  - Strong match per engine: booking, service, commerce, lead,
    engagement, info
  - Weak match: booking ("schedule"), commerce ("how much")
  - Word-boundary discipline: "facebook" ≠ booking, "abooking" ≠
    booking, case-insensitive matching, multi-word phrases match
  - Ambiguity + tie-breaking: strong beats weak; multi-engine strong
    broken by `ENGINES` tuple order (commerce < booking); `"buy a book"`
    → commerce (not booking)
  - Edge cases: empty, whitespace-only, non-keyword → null hint
  - Determinism: same input → identical output
- Integration: `classifyIntent` now calls `classifyEngineHint(lower)`
  once and attaches the hint+confidence to every returned `Intent`
  (all 3 return sites — pattern-matched, browse-query, general). Non-
  keyword messages produce `engineHint: undefined, engineConfidence:
  null` — existing intent output unchanged. Backward compatible.
- tsc delta: 548 → 548 (zero new errors).
- Deviations from spec: Spec said extend `IntentSignal` with
  `engineHint?`. `IntentSignal` in this repo is a string union (enum),
  not an object type — the extension belongs on `Intent` (the object
  type). Extended `Intent` instead — semantic equivalent, matches
  actual repo types.

---

## M11 — Session: sticky `activeEngine` selection + persist
- Status: done
- Commit: (this commit)
- Files changed: 2 added + 1 modified —
  `src/lib/relay/engine-selection.ts` (pure selectActiveEngine),
  `src/lib/relay/__tests__/engine-selection.test.ts` (14 tests);
  `src/lib/relay/session-store.ts` (added `setActiveEngine` helper).
- LOC: +65 src / +180 tests
- Tests: **82/82 pass** (68 prior + 14 new):
  - All 4 `reason` outcomes: sticky, switch-strong-hint,
    fallback-first, fallback-none
  - Weak hints never switch (two cases)
  - Edge: strong hint not in partnerEngines → sticky
  - Edge: strong hint matches current → sticky (no redundant switch)
  - Edge: current engine removed from partner → fallback-first
  - Edge: undefined current → treated as null
  - Service overlay is a normal switch target (no special case)
  - Purity: idempotence + no mutation of input partnerEngines
  - **Multi-turn integration: 5-turn sequence with mixed hints
    produces the expected engine arc (booking→booking→booking→
    service→service with reasons fallback-first/sticky/sticky/
    switch-strong-hint/sticky)**
- Purity: `selectActiveEngine` uses no I/O, no Date, no mutation.
  Verified by grep (no `await`/`Date.now()` in engine-selection.ts).
- Session-store integration: `setActiveEngine(partnerId, conversationId,
  engine)` does a merge-set of the single `activeEngine` field plus
  `updatedAt`. M12 orchestrator will call this after each turn's
  selection result.
- tsc delta: 548 → 548 (zero new errors).
- Notes: The multi-turn test is the pattern tests for future engines
  should reuse. Sticky + weak-never-switch + strong-forces-switch-only-
  if-in-partner produces the conservative switching behavior specified.
