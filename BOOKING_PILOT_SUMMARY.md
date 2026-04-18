# Booking Pilot — Phase 1 Final Summary

Relay Engine Architecture — Phase 1 (Booking) complete, shadow-mode,
deployable. Produced across multiple sessions; this document consolidates
what shipped, how it behaves, what to verify before calling it "done done,"
and what Phase 2 inherits.

---

## What shipped

### The engine vocabulary (M01–M03, foundation)
- `Engine` and `BlockTag` types with guards (M01)
- Schema extensions on `UnifiedBlockConfig`, `FlowDefinition`, `Partner`, `RelaySession` — all optional, zero existing-partner impact (M02)
- `FUNCTION_TO_ENGINES` recipe: 142 / 142 `BUSINESS_FUNCTIONS` entries; `deriveEnginesFromFunctionId` + `getPartnerEngines` accessors (M03)

### Booking-engine coverage (M04–M07)
- 37 blocks tagged: 31 booking + 6 shared, across 7 verticals (hospitality, healthcare, personal_wellness, travel_transport, events_entertainment, food_beverage, automotive) (M04)
- 5 booking flow templates (hotel, clinic-appointment, wellness-appointment, ticketing, airport-transfer) — 51 functionId mappings covering all 49 booking-primary functionIds (M05)
- Pure Health checker: 7 modules (field-health, block-health, stage-health, fix-proposals, engine-health, types, index) with deterministic output + one `Date.now()` call; 32 tests covering all 6 failure modes (M06)
- Shadow-mode Health storage: cached reads (30s TTL), `triggerHealthRecompute` save-hook helper, in-memory Firestore stub for unit tests (M07)

### Runtime wiring (M10–M12)
- Intent engineHint: 6 lexicons × {strong, weak}, word-boundary classifier with service-overlay tiebreaker (M10 + M10-tune)
- Session sticky `activeEngine`: pure `selectActiveEngine` with 4 reason outcomes; merge-set `setActiveEngine` persistence (M11)
- Orchestrator engine-scoped policy: per-turn engine resolution, scoped flow + blocks signals, degraded mode on red Health, mandatory per-turn telemetry log (M12)

### Admin surfaces (M08, M09, M13, M14)
- `/admin/relay/blocks` — engine tabs + Booking stage-ordered pipeline with Health dots (M08)
- `/admin/relay/health` — engine × partner matrix, collapsible drill-down, one-click Apply-fix for `bind-field` (M09)
- `/admin/relay/health/preview` — Preview Copilot panel, 40 scripted scenarios, sandbox isolation via `preview_` conversationIds + `OrchestratorContext.preview` flag (M13)
- `/admin/onboarding/relay` — 3-question deterministic recipe picker, curated starter blocks per functionId, flow-template cloning with re-onboarding guard (M14)

### Content (M15)
- 5 seed templates × 5 items each (rooms, amenities, house_rules, local_experiences, meal_plans) — INR currency, empty images, append-only semantics
- Generic CSV import via papaparse — handles BOM, CRLF, quoted fields, multi-select delimiters, field validation
- `hotel-import-service.ts` left intact (different service — Google Places + AI enrichment, not CSV; spec framing didn't match reality)

### Test infrastructure
- Vitest installed (M06 decision); 138 tests across 12 files
- In-memory Firestore stub via `vi.mock('@/lib/firebase-admin')` used by health + Apply-fix + onboarding + seed tests

---

## Phase C results

| Gate | Status | Notes |
|---|---|---|
| C1 unit | **GREEN** | 138/138 pass, coverage > 80% on pure modules |
| C2.1 backward compat | **GREEN** | legacy hotels_resorts partner → `[booking, service]` via M03 |
| C2.2 sticky multi-turn | **GREEN** | 5-turn sequence produces expected engine arc (surfaced M10 bug, fixed inline) |
| C2.3 catalog budget | **GREEN** | hotels_resorts: 18 blocks (≤ 25 budget); 4 other booking primaries all ≤ 25 |
| C2 consistency | **GREEN** | flow templates, starter blocks, preview scripts, seed templates all cross-verified against registry |
| C3 smoke | **DEFERRED** | requires dev-server + seeded test partners; 15-min reviewer check before merge |
| C4 regression | **GREEN** | non-booking partners unchanged; untagged blocks pass through engine filter |
| C5 performance | **PARTIAL** | pre-pilot baseline not captured; 0% reduction for pure-booking partners is correct (no cross-engine noise); Phase 2 multi-engine partners are where reduction will show |

---

## Performance observations (what we can measure statically)

### Catalog sizes by booking sub-vertical

| functionId | booking-scoped catalog | budget |
|---|---|---|
| hotels_resorts | 18 | ≤ 25 ✓ |
| dental_care | 14 | ≤ 25 ✓ |
| hair_beauty | 15 | ≤ 25 ✓ |
| ticketing_booking | 5 | ≤ 25 ✓ |
| airport_transfer | 5 | ≤ 25 ✓ |

Catalog budget is enforced. The 40% prompt-token reduction target from the spec presumed cross-engine partners; that measurement lands in Phase 2 with multi-engine onboardings.

### Telemetry

M12's per-turn structured log emits `activeEngine`, `switchedFrom`, `selectionReason`, `catalogSize`, `catalogSizeBeforeEngineFilter`, `healthStatus`, `degraded`, `partnerEnginesCount`, `engineHint`, `engineConfidence`. Ready for dashboarding in Phase 2.

---

## Risk register (carried forward to Phase 2)

| Item | Severity | Mitigation |
|---|---|---|
| **C3 live smoke not run** | medium | 15-minute reviewer check against dev-server before merging Phase 1 PRs |
| **C5 pre-pilot baseline missing** | low | Phase 2 multi-engine partners will supply the actual measurement path via M12 telemetry |
| **UI visual verification deferred (Q6)** | low | 5 UI milestones compiled, tested, module graph clean; dev-server click-through needed for layout fidelity |
| **M09 `populate-module` stub (Q7)** | low | M15 seed + CSV actions exist; UI wiring is ~1-hour cleanup; `applySeedTemplate` callable from any context |
| **Save-hook full coverage (Q5)** | low | `triggerHealthRecompute` shadow-mode safe to call anywhere; only wired into one reference action (`modules-actions.ts:updateModuleItemAction`); can extend mechanically |
| **Degraded-mode response generics (M12 deviation)** | low | on red Health, orchestrator bypasses Gemini entirely and returns static plain text — safer than a degraded-catalog prompt. Revisit in Phase 2 if partners report too-generic responses |
| **Preview sub-vertical id drift (Q3)** | low | travel_transport / automotive preview sub-vertical ids don't match business-taxonomy functionIds. Pre-existing. Doesn't block Phase 1; Phase 2 should reconcile before adding engines. |
| **Block-tag coverage gap for extended starter sets (Q3)** | low | 15 booking-primary functionIds are in the M05 registry but their source verticals (home services, automotive service, restaurant reservations, notary, entertainment) aren't M04-tagged. Orchestrator falls back to legacy routing for those partners — graceful. Phase 2 tags them properly. |

---

## Open questions

| # | Description | Status |
|---|---|---|
| Q1 | No unit-test runner | RESOLVED (Vitest installed at M06) |
| Q2 | Shared-block drift | RESOLVED (generator reconciled at M04) |
| Q3 | Block-tag coverage gap + preview sub-vertical drift | CARRY-FORWARD to Phase 2 |
| Q4 | Pre-existing 548 tsc errors | KNOWN — zero-delta protocol adopted |
| Q5 | Full save-hook coverage | CARRY-FORWARD — non-blocking |
| Q6 | UI visual verification | CARRY-FORWARD — 15-min reviewer check before merge |
| Q7 | M09 populate-module → M15 wiring | CARRY-FORWARD — non-blocking |

---

## Phase 2 entry criteria

Phase 2 (Engine Rollout) pre-flight gate checklist:

- [x] `BOOKING_PILOT_SUMMARY.md` exists (this document)
- [x] `BOOKING_PILOT_PROGRESS.md` has entries for every milestone
- [x] `BOOKING_PILOT_QUESTIONS.md` has all open items classified (resolved / carry-forward)
- [x] `docs/booking-pilot-analysis.md` exists (Phase A deliverable)
- [ ] ≥ 1 week of shadow-mode Health observation on production — **needs time to elapse after merge**
- [ ] C3 live smoke confirmed by reviewer — **pending**

Phase 2 should start once the C3 live smoke passes and ≥ 1 week of production observation reveals no partner-visible regressions.

---

## What Phase 2 inherits

### Ready to consume
- Engine vocabulary, recipe, session stickiness, orchestrator engine-scoping
- Admin surfaces can be extended per-engine (M08 engine tabs show "Coming soon" for Commerce / Lead / Engagement / Info / Service; activate each as its Phase 2 milestone ships)
- Health checker is engine-agnostic; feeding new engines' canonical stages into `computeEngineHealth({ canonicalStages })` extends it
- Preview Copilot pattern — 8 scripts per sub-vertical is repeatable per engine

### Needs attention in Phase 2 M01
- Phase 2 M01 should start by measuring C5's catalog reduction against a multi-engine test partner (hotel + restaurant). That's the real 40% check.
- Q3's carry-forward: home services / automotive service / restaurant reservations / notary / entertainment need their blocks tagged for booking (mechanical — 8–20 blocks per vertical, following M04's pattern)
- Q6's carry-forward: UI visual fidelity for the 4 admin surfaces (M08, M09, M13, M14) should be confirmed

### Phase 2 non-goals (Phase 1 did NOT do)
- Tag blocks for Commerce, Lead, Engagement, Info engines (each is a Phase 2 engine-rollout milestone)
- Multi-engine partners (the Phase 2 test surface)
- Production Health gating (stays shadow-mode until Phase 2 M02 at earliest)
- X05 gating cutover (Phase 3)
- Drafting AI (Phase 2 X04, conditional)

---

## Retrospective

### What the three-phase execution model did well
- Foundation-first (M01–M03) kept tsc baseline at 548 for the entire pilot — zero regressions attributable to this pilot.
- One-milestone-per-commit made rollback cheap; the health-cache bug caught at Vercel build (PR #135) was a clean 3-file revert.
- Stacked-branch strategy from session 2 onward (M08 → M09 → M13 → M14 → M15 → phase-c) made review manageable — each PR has a focused diff.
- Static acceptance probes (`tsx` scripts for M03, M04, M05, M06, M11, M12, Phase C) caught real drift during authoring — Q2 (generator drift) and the M10 tiebreaker bug both surfaced via static checks, not production logs.
- Resume-safe commits: every session ended at a clean milestone boundary; zero stranded work.

### What slowed down
- Analysis drift between the session's starting assumption and actual repo state (Q2, Q3) needed reconciliation twice. The `docs/booking-pilot-phase1/` specs and `docs/booking-pilot/` specs diverged from the real codebase in small ways (preview sub-vertical ids, generator shared-block ids, Zod-vs-ModuleFieldDefinition).
- Environment constraints: no dev-server / browser / live Firestore in this execution context. Every UI milestone got static correctness + typed interface verification but no visual regression check (Q6).
- The `'use server'` Server-Actions contract bit us once (M07 `invalidateHealthCache` was sync). Pattern: grep for non-async exports in any `'use server'` file before commit. The fix-branch pattern (PR #135) for urgent fixes works well.

### What Phase 2 should know
- **Build verification is mandatory, not optional.** `npm run build` catches the Server Actions contract that `tsc --noEmit` misses.
- **Static probes are cheap and valuable.** Writing a tsx script that verifies cross-milestone invariants (e.g., "every flow template blockType exists in the registry") catches drift before runtime.
- **Stacked branches > many small PRs reviewing individually.** When in doubt stack — the reviewer merges M08 first, then M09 rebases, etc. The final PR (phase-c) carries the summary doc + integration checks.
- **Shadow mode is load-bearing.** Never gated a save, never blocked a response; made every intermediate state safe to ship. Keep shadow mode through Phase 2.
- **Telemetry is the measurement surface.** M12's per-turn log is how Phase 2 measures the 40% reduction target — don't remove any of the telemetry fields; Phase 2 can add more.

---

## Recommended next steps

1. Reviewer runs C3 live smoke (15 minutes, dev-server required) against 3 seeded test partners per the Phase C block.
2. Merge `claude/booking-pilot-m14` → main, then `claude/booking-pilot-m15` → main, then `claude/booking-pilot-phase-c` → main (which carries the M10 tuning + this summary + Phase C log).
3. Observe production Health writes for ≥ 1 week to confirm no partner-visible regressions on the full range of partners.
4. Begin Phase 2 pre-flight — read this summary + the carry-forward Qs + M12 telemetry logs; produce `docs/engine-rollout-phase2/tuning.md` based on real observations.
