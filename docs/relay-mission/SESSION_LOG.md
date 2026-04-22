# Relay Mission — Session Log

> Append-only. One block per session. **Never edit prior entries.**
>
> See [`README.md`](./README.md) for the mission, pipeline, and MR plan.

## Session entry template

Copy this block at the top of a new session, fill in at session close.

```markdown
## [YYYY-MM-DD] MR-N Session N — <one-line goal>

**MR targeted:** MR-1 / MR-2 / MR-3 / MR-4 / MR-5
**Milestones attempted:** M0X, M0Y
**Milestones shipped:** M0X (commit sha) · M0Y (commit sha)
**tsc before → after:** 276 → 276
**Tests before → after:** 531 passing → NNN passing
**Hops touched:** 04, 06

### What shipped
- One line per commit

### Hop status changes
- Hop 04: MISSING → HALF (item indexer wired for `moduleItems`)
- Hop 06: HALF → HALF (orchestrator call site added but not flipped yet)

### Halts / scope surprises
- [if any] Found X, halted, added to Freeze List / punted to follow-up

### What's next
- MR-1.M03 (persona indexer) ready for next session
- Open question: should persona chunks include the business tone notes? → flagged in MR-1/strategy.md

### Links
- PR: #NNN
- Retro (if substantive): docs/relay-mission/MR-N/session-N-retro.md
```

---

## Session history

> Newest at top. Prepend new sessions above existing entries.

## [2026-04-22] Tactical — product_card ← moduleItems (Test Chat)

**MR targeted:** none (tactical fix; parallel to MR-1/MR-2 critical path)
**Milestones attempted:** structured product_card data parity with CatalogCards renderer
**Milestones shipped:** tactical commit (TBD sha)
**tsc before → after:** 276 → 276
**Tests before → after:** 752 → 758 (+6)
**Hops touched:** 07 (HALF → HALF, structured path improved)

### What shipped
- `src/lib/relay/admin-block-data.ts` — `buildProductCard` now emits both admin-preview fields (desc / badge / reviews) AND interactive-renderer fields (id / moduleSlug / subtitle / badges[] / reviewCount / currency / originalPrice / imageUrl). Top-level `moduleSlug` added to the result.
- `src/app/admin/relay/blocks/previews/_preview-props.ts` — `ProductCardPreviewData` extended to allow the CatalogCards-compatible fields (all optional; admin path unchanged).
- `src/lib/relay/__tests__/admin-block-data-products.test.ts` — 6 new tests covering id propagation, per-item + top-level moduleSlug, desc→subtitle / badge→badges[] / reviews→reviewCount duplication, currency + originalPrice + imageUrl emission, images[0] fallback, graceful missing-field handling.

### Why this session existed
Test Chat routes `product_card` through `BlockRenderer` → `CatalogCards`, not the admin `MiniProductCard` design preview. Those two components read different field names from the same item shape (`subtitle` vs `desc`, `badges[]` vs `badge`, `reviewCount` vs `reviews`), and CatalogCards also requires `id` for the expand/add-to-cart lookup in `BlockRenderer.tsx:82`. Pre-fix the interactive path rendered partial data and add-to-cart was a dead click. This closes the structured path without touching MR-1/MR-2.

### Hop status changes
- Hop 07: HALF → HALF (structured path more robust; unstructured still pending MR-2.M02)

### Phase 0 verifications
- Q1 (loader existence): `buildBlockData` + `buildProductCard` already existed in `src/lib/relay/admin-block-data.ts`. **Case B** — extend in place, don't create parallel path.
- Q2 (buildBlockData dispatch): synchronous, at `admin-block-data.ts:32`. Async commerce loaders wire AFTER via `orchestrator/index.ts:346-382`. Kept the synchronous dispatch — no async read needed (modules already loaded by `loadPartnerSignal`).
- Q3 (order-tracker-data.ts): exists at `src/lib/relay/commerce/order-tracker-data.ts`. Not used as template this session — the fix is inside the existing synchronous `buildProductCard`, not a new async loader.
- Q4 (ModuleItem shape): `src/lib/modules/types.ts:230` — `id`, `name`, `description`, `price`, `currency`, `compareAtPrice`, `images: string[]`, `thumbnail?`, `isActive`, `isFeatured`. Used the real field names in the mapping.
- Q5 (module slug discovery): `loadPartnerSignal` already enumerates `partners/{pid}/modules/*` with active items via `getPartnerModulesAction` + `getModuleItemsAction({isActive:true})`. `pickModuleByPurpose` picks by preferred slug list (`['products','catalog','inventory']` for `product_card`). No new discovery code needed.
- Q6 (renderer contract): `BlockRenderer.tsx:66-104` → `CatalogCards` reads `id`, `name`, `price`, `currency`, `subtitle`, `tagline`, `badges[]`, `reviewCount`; `onAddToCart` at line 82 reads `it.moduleSlug || block.moduleSlug || 'products'`. Pre-fix none of these were emitted.

### Halts / scope surprises
- Task prompt predicted 762 passing baseline; actual was 752. Recorded and proceeded.
- Task prompt referenced PR #205 / MR-1.M04 on main; actual tip was PR #204 / MR-1.M03. Tactical fix is independent so proceeded.
- Dev env had no `node_modules` — ran `npm ci` before baseline.

### What's next (unchanged — tactical doesn't alter the critical path)
- MR-1.M04 — doc indexer
- MR-1.M05 — backfill script
- MR-2.M02 — multi-kind retrieval in orchestrator

### Links
- PR: #TBD

---

## [2026-04-21] MR-1 Session 3 — persona indexer

**MR targeted:** MR-1
**Milestones attempted:** MR-1.M03
**Milestones shipped:** MR-1.M03 (2503d561)
**tsc before → after:** 276 → 276
**Tests before → after:** 745 → 752 (+7)
**Hops touched:** 04 (HALF → HALF, now covers items + persona)

### What shipped
- `src/lib/relay/retrieval/index-persona.ts` — `indexBusinessPersona` (delete-then-rewrite, 3 chunk kinds)
- `src/lib/relay/retrieval/__tests__/index-persona.test.ts` — 7 behavioural tests
- `src/actions/business-persona-actions.ts` — fire-and-forget hook in `saveBusinessPersonaAction`

### Hop status changes
- Hop 04: HALF → HALF (items + persona indexed; doc indexer pending MR-1.M04)

### Halts / scope surprises
- None. Clean session — M02 pattern applied directly.

### Open operator actions (cumulative)
- [ ] `gcloud` Firestore vector index for `relayRetrieval/{pid}/items` (from MR-1.M02)
- [ ] `gcloud` Firestore vector index for `relayRetrieval/{pid}/persona` (this session):
  ```
  gcloud firestore indexes composite create \
    --collection-group=persona \
    --query-scope=COLLECTION_GROUP \
    --field-config=vector-config='{"dimension":"768","flat":"{}"}',field-path=embedding
  ```

### What's next
- MR-1.M04 — doc indexer: reuse `indexPdfFile`, new `/api/relay/upload-doc` route, `excludedVaultDocIds` guard (strategy open question #1)
- MR-1.M05 — backfill script (iterates all active partners, idempotent re-index)
- MR-2.M02 — multi-kind retrieval in orchestrator (blocked on `firestoreRetriever` name collision fix)

### Links
- PR: #TBD

---

## [2026-04-21] MR-1 Session 2 + MR-2 Session 1 — items retrieval end-to-end vertical slice

**MR targeted:** MR-1, MR-2
**Milestones attempted:** MR-1.M02, MR-2.M01
**Milestones shipped:** MR-1.M02 (6d4790ef) · MR-2.M01 (4865080a) · e2e test (e97583c6)
**tsc before → after:** 100 → 100 (worktree; main confirmed 276 from prior session)
**Tests before → after:** 732 passing → 745 passing (+13)
**Hops touched:** 04 (MISSING → HALF), 06 (HALF → HALF, now scoped to items collection)

### What shipped
- `src/lib/relay/retrieval/index-items.ts` — item indexer: reads `ragText`, embeds via `gemini-embedding-001`, writes to `relayRetrieval/{pid}/items/{itemId}` with structured metadata
- `src/lib/relay/retrieval/__tests__/index-items.test.ts` — 6 unit tests (idempotent, text change, skip empty/inactive/missing)
- `src/actions/modules-actions.ts` — fire-and-forget hook in `createModuleItemAction` + `updateModuleItemAction`
- `src/lib/relay/orchestrator/signals/rag.ts` — `LoadRagSignalOpts` interface + `collectionPath?` param on `loadRagSignal`
- `src/lib/relay/orchestrator/index.ts` — orchestrator passes `relayRetrieval/${ctx.partnerId}/items` to `loadRagSignal`
- `src/lib/relay/orchestrator/signals/__tests__/rag.test.ts` — 4 unit tests (backward compat + scoped path)
- `src/lib/relay/retrieval/__tests__/items-e2e.test.ts` — 3 integration tests proving full pipeline path

### Hop status changes
- Hop 04: MISSING → HALF (item indexer wired; persona + docs indexers still needed for DONE)
- Hop 06: HALF → HALF (orchestrator now queries `relayRetrieval/{pid}/items`; still HALF until persona/docs sources added in MR-2.M02)

### Halts / scope surprises
- None. Session executed cleanly. Firestore vector index for `relayRetrieval` must be created by operator (gcloud command; out of code scope).
- `firestoreRetriever` factory has a hardcoded name "exampleRetriever" — known limitation for multi-kind queries in MR-2.M02; not a blocker for items-only.

### What's next
- MR-1.M03 — persona indexer (`indexBusinessPersona`). D4/D8 handoff unblocks it cold.
- MR-1.M04 — doc indexer (reuse `indexPdfFile`).
- MR-1.M05 — backfill script.
- MR-2.M02 — extend `loadRagSignal` to multi-source (persona + docs). Requires resolving `firestoreRetriever` name conflict for multi-kind in same request.
- **Operator action needed:** create Firestore vector index on `relayRetrieval/{pid}/items` collection field `embedding` (COSINE, 768-dim).

### Links
- PR: #TBD

---

## [2026-04-21] MR-1 Session 1 — M01 retrieval strategy + hygiene refinements

**MR targeted:** MR-1
**Milestones attempted:** MR-1.M01 + hygiene (tuning.md anchor, README refinements)
**Milestones shipped:** MR-1.M01 (commit TBD) · hygiene commit 1 (25e96e8f) · hygiene commit 2 (ce19ff4b)
**tsc before → after:** 100 → 100
**Tests before → after:** not run (docs-only session)
**Hops touched:** documentation only — no hop status changes

### What shipped
- `docs/engine-cutover-phase3/tuning.md` — tsc anchor 276 → 100
- `docs/relay-mission/README.md` — hop 02 / hop 06 descriptions refined; MR-2 effort shrunk; MR-3 renamed + M00 design decision added; tsc references updated; Current Status table updated
- `docs/relay-mission/MR-1/strategy.md` — 9 decisions locked (storage, retrieval strategy, chunking, schemas, interface)

### Hop status changes
- None (documentation session). Hop 02/06 *understanding* refined; *status* unchanged (both still HALF).

### Halts / scope surprises
- Working tree had widespread deletions from prior worktree cleanup. Restored only the three docs files needed; no source file changes made.
- Tests not runnable in this environment (package.json not accessible from cwd after worktree deletion). Baseline tsc confirmed 100 via main repo.

### What's next
- MR-1.M02 — item indexer (`indexModuleItem`). Strategy doc D1/D3/D8 + handoff section unblocks it cold.
- MR-1.M03 — persona indexer. D4/D8 handoff unblocks it.
- Flag for MR-3 operator: M00 design decision (Options A/B/C) is now queued in `docs/relay-mission/README.md`.
- Flag for MR-2 operator: D7 extension surface on `loadRagSignal` is documented in strategy.md.

### Links
- PR: #TBD

---

## [2026-04-21] Phase 0 — Mission recon

**MR targeted:** none (pre-MR reconnaissance)
**Milestones attempted:** Phase 0.A through 0.G
**Milestones shipped:** recon report + 2 README corrections
**tsc before → after:** 100 → 100 (main repo; worktree shows 358 — worktree artifact, vitest not in worktree node_modules)
**Tests before → after:** not runnable in worktree — deferred to operator
**Hops touched:** none (read-only)

### What shipped
- `docs/relay-mission/PHASE_0_RECON.md` created — full evidence file for all 8 hops
- `docs/relay-mission/README.md` updated: 2 corrections (hop 02, hop 06 explanations)

### Hop status changes
- None — all status values held. Corrections were to the *explanations*, not the status labels.

### Halts / scope surprises
- tsc count in main repo is 100, not 276 (tuning.md anchor is stale — improvement from Phase 3/4 work). Noted in recon; tuning.md correction is out of scope for this session.
- Hop 02 gap more structural than expected: admin templates and partner/orchestrator flow are in different Firestore collections with no connection.
- Hop 06 more complete than expected: full retrieval call already exists in `signals/rag.ts`.

### What's next
- **AMBER signal** — MR-1 can start as planned (hop 04 confirmed MISSING).
- Before MR-3 starts: operator needs to make the admin↔orchestrator flow propagation design decision (see PHASE_0_RECON.md open question 1).
- Before MR-2 starts: review whether a new `retrievePartnerContext` abstraction is needed, or extending `loadRagSignal` suffices (PHASE_0_RECON.md open question for hop 06).
- Review `ragText` inline field fate (dead code vs. MR-1 input) before MR-1.M02 starts.

### Links
- PR: #200 (same branch — recon committed to existing worktree branch)

_(No sessions yet — MR-1 not started.)_

---

## Speculative-From footer convention

Every commit produced under this mission should carry:

```
Speculative-From: docs/relay-mission/README.md
```

If the commit was driven by a more specific doc (e.g. an MR strategy doc or session retro), prefer that over README.md. The point is traceability — a reviewer pulling up the diff should be able to read the originating brief.
