# /partner/relay Follow-up — Retrospective

Session: bundled M03-Registry + TestChatProducts diagnosis + fix.
Branch: `claude/partner-relay-followup` (off `main` at `19d95e95`).
Baseline throughout: tsc 276.

## 1. Commits shipped

| SHA | Commit | tsc | tests |
|---|---|---|---|
| `fc709e3e` | `[follow-up M03-Registry] booking_confirmation + space_confirmation data loaders` | 276 | 707 |
| `faddaacb` | `[follow-up TestChatProducts-audit] /partner/relay Test Chat product list diagnosis` | 276 | 707 |
| `173079ec` | `[follow-up TestChatProducts] Layer C — purpose-aware module selection in buildProductCard` | 276 | 715 |

**3 commits.** tsc held at 276 every commit. Tests 692 → 715 (+23).

## 2. Part 1 — M03-Registry summary

Block-registry audit findings:
- **Neither** `booking_confirmation` nor `space_confirmation` was
  registered. Both are load-bearing for their engines (per Phase 3 +
  Phase 4 retros), so registration was the right call — not scope
  expansion.
- Registered as shared blocks (cross-vertical), `engines: ['service']`,
  stage `followup`. Sibling treatment to existing `order_confirmation`.
- Both shared/index.ts entries + the generator script's hardcoded
  SHARED_BLOCKS_DATA list updated. Registry regenerated.

Data loaders ship as direct clones of `loadOrderTrackerData`:
- `src/lib/relay/booking/booking-confirmation-data.ts` reads
  `partners/{pid}/relayBookings`
- `src/lib/relay/space/space-confirmation-data.ts` reads
  `partners/{pid}/relayReservations`

Orchestrator wiring uses three parallel branches under a single
contactId-resolution gate. **Generic block-data registry abstraction
explicitly NOT extracted** — three loaders is below the
"≥5 or variation" trigger from Phase 4 retro §abstraction-decision.

## 3. Part 2 — TestChatProducts root cause + fix

**Root cause: Layer C — `buildProductCard` purpose-blind module selection.**

The function picked the first non-empty module in the array. Combined
with `getPartnerModulesAction`'s `createdAt desc` ordering, this
meant the newest non-empty module won — regardless of whether it
was a product catalog, service catalog, FAQ list, or anything else.

Five distinct block ids (`product_card`, `ecom_product_card`, `menu`,
`fb_menu`, `services`) all dispatched to the same purpose-blind
builder.

**Fix:** per-block preferred-slug mapping passed via blockId.
`pickModuleByPurpose(modules, blockId)` consults
`PRODUCT_BLOCK_PREFERRED_SLUGS` first; falls back to first-with-items
only when no preferred match (preserves single-module + bespoke-slug
partners).

Scope: bounded, ~30 LOC + mapping table + 8 regression tests. No
cascade across layers.

## 4. Layer findings — full picture

| Layer | Finding | Owns the bug? |
|---|---|---|
| A — Module storage | `partners/{pid}/businessModules/{moduleId}/items`; UI write + orchestrator read same path | No |
| B — Partner signal | `MAX_MODULES = 10`, `createdAt desc` ordering, `pageSize: 20`, `isActive: true` filter | Secondary surface (not the reported symptom) |
| C — `buildBlockData` | `buildProductCard` picks first-non-empty regardless of purpose | **YES** |
| D — Catalog filter | Symptom is "wrong list" (block selected) not "no block" — D not implicated | No |
| E — Render path | `TestChatBlockPreview` correctly forwards `blockData` to `BlockRenderer` | No |
| F — Seed vs turn | Both call same `buildBlockData()`; symptom consistent across entry points | No |

Audit is comprehensive evidence; if the operator's reproduction
matches Layer C's predicted root cause, the fix lands cleanly.
Verification protocol included in audit doc §verification.

## 5. Three data loaders — abstraction decision still defer

After M03-Registry shipped, the codebase has **three** parallel
block-data loaders:
- `loadOrderTrackerData` (Phase 2)
- `loadBookingConfirmationData` (this session)
- `loadSpaceConfirmationData` (this session)

Same shape, same anon-friendly degradation, same contact-scoped
query pattern. The temptation to extract a `loadConfirmationData`
generic is real.

**Decision: still defer.** Same reasoning as Phase 4 retro
§abstraction-decision applied to the commit-gate triple:

- Per-loader collection name + result key + filter shape varies
  enough that a generic would either need a config object (less
  ergonomic than 3 explicit loaders) or a higher-order function
  (less greppable for "where does X data come from")
- The orchestrator wiring is 3 if/else branches — not 30
- The data shapes per loader are consumed by distinct preview
  components with their own typed props

**Revisit trigger:** ≥5 loaders OR a 4th surfaces a variation
(e.g. cross-collection aggregation, or a per-loader cache layer).
Until then, three readable parallel loaders is the right shape.

## 6. ADR §Follow-ups status — FIVE retros pending

`docs/engine-architecture.md §8 invariant #4` update is now flagged
by:
1. `partner-relay-phase-1-retro.md` §6
2. `partner-relay-phase-2-retro.md` §11
3. `partner-relay-phase-3-retro.md` §9
4. `partner-relay-phase-4-retro.md` §9
5. **This retro (§6)** — fifth flag

Recommend operator action: prioritize Phase 3 cutover Session 3 M07
before next functional-engine session. The pointer debt is now
visible across the entire `/partner/relay` history.

## 7. Operator action items

Both newly-shipped data loaders need composite Firestore indexes
in production before they fire under real traffic:

```
Collection: partners/{partnerId}/relayBookings
Fields: contactId (ASC), createdAt (DESC)

Collection: partners/{partnerId}/relayReservations
Fields: contactId (ASC), createdAt (DESC)
```

Mock tests pass without; real Firestore will reject the queries.

(Phase 2 already needed `partners/{pid}/orders` index;
operator-checklist now totals three indexes for the M03 block family.)

## 8. Backlog seeds surfaced

Adding to `PHASE_4_BACKLOG.md`:

1. **Layer B MAX_MODULES=10 cap could starve products module #11+.**
   Partners with many modules where the products module is older
   than the 10 newest miss it entirely. Fix shape: prioritize active
   commerce modules in the slice OR raise the cap. Phase 4+ if
   real-partner reports surface.

2. **Bespoke slug support for product blocks.** Partners using
   slugs outside the preferred list (`inventory_v2`, `goods`, etc.)
   hit the fallback path. Could expand `PRODUCT_BLOCK_PREFERRED_SLUGS`
   over time as patterns emerge — currently fallback is graceful.

3. **`relay*` collection-name cleanup ADR** — Phase 2 used `orders`,
   Phases 3/4 used `relay*` prefix. Inconsistency carries across
   booking-confirmation + space-confirmation queries this session.
   Future cleanup ADR if naming becomes a hot spot.

## 9. Discipline check

- ✅ Phase 4 + ADR + Phases 0-3 all merged to main before Part 1
- ✅ Branched off fresh main (not stacked)
- ✅ Audit commit landed before fix commit (Part 2)
- ✅ Audit doc cites Layer C with code-location evidence
- ✅ Three parallel loaders shipped, no abstraction extraction
- ✅ Three commit-gate consumers preserved as-is, no abstraction
     extraction (Phase 4 retro decision still holds)
- ✅ Anon path tested for both new M03 loaders
- ✅ Cross-contact + cross-partner isolation tested
- ✅ tsc ≤ 276 every commit (caught + fixed a tsc drift to 278
     during ComponentType variance issue; resolved by widening prop
     type to `BlockPreviewProps['data']`)
- ✅ Speculative-From footers reference ADR + prior retro sections
- ✅ Layer-local fix; no cascade
- ✅ No "while I'm here" expansion

## 10. Session close

Two partner-relay loose ends closed:
- M03 deferrals from Phase 3 + Phase 4 retros — done
- Operator-reported Test Chat product list mismatch — diagnosed +
  fixed

The functional-engine arc (Identity → Commerce → Booking → Space)
plus their respective confirmation/tracker blocks is now end-to-end
complete in code. Pending Phase 3 cutover Session 3 (M07 docs
consolidation) is now the priority blocker — flagged by **five**
retros. After M07 ships, `engine-architecture.md` becomes the
canonical doc and the partner-relay surface is fully documented.

**Next session candidates (operator's call):**
1. **Phase 3 cutover Session 3** (M08 X04 + M07 docs consolidation +
   M09 observation closure) — finally satisfies the §Follow-ups
   pointer; ~2.5h
2. Operator-driven verification of the TestChatProducts fix on a
   real seeded partner — confirms the audit's predicted root cause
3. Backlog item triage if a specific item escalates

Branch pushed and ready for draft PR when called.
