# Relay — Mission & Pipeline

> **The mission.** `/admin/relay/flows` drives a flows-based conversation in `/partner/relay`, grounded in RAG over the partner's real data.
> Every workstream serves this or waits behind it.

**Status:** MR-1 not started · last updated 2026-04-21
**Owner:** [assign]
**Critical path:** MR-1 → MR-2 → MR-3 → MR-4 → MR-5 → then unfreeze P3.S3 / P5 / P7

---

## Read This Before Starting Any Session

Whether you're a human engineer or Claude Code: **this document is the source of truth for what Relay is trying to be.** Sessions that ship tech-debt cleanup without touching one of the 8 mission-pipeline hops have drifted. Scope discipline is the single biggest lever on getting to the finish line.

**Before you pick up any task:**

1. Read this document top to bottom (≈5 minutes).
2. Check the **[Current Status](#current-status)** table — what's the next mission milestone?
3. If your task isn't in the **[Mission Phases](#mission-phases)** list, stop and flag it. Either it maps to a hop (then slot it into an MR), or it belongs on the **[Freeze List](#freeze-list--out-of-scope)**.
4. Look at **[Related Documents](#related-documents)** — especially `docs/booking-pilot/00-context.md` for operating principles and `docs/engine-cutover-phase3/tuning.md` for baseline discipline.

**At session close**, append to [`SESSION_LOG.md`](./SESSION_LOG.md) and update the Current Status table below if a hop changed state.

---

## Mission Criteria

All three must be met. No two out of three.

### 1. FLOWS
Admin edits a flow in `/admin/relay/flows`, saves, and the orchestrator uses it on the next turn. Stage transitions fire from intent triggers defined in the saved flow — not from the hardcoded templates in `lib/flow-templates`. Same for partner-level overrides at `partners/{pid}/relayConfig/flowDefinition`.

### 2. RAG
Partner data is indexed into a retrievable store. When a visitor asks about a product, policy, or FAQ, the orchestrator retrieves grounded context from that partner's data and the response reflects it. Three sources must be indexed: `moduleItems`, `businessPersona`, and partner-uploaded docs (hubDocuments / vaultFiles).

### 3. REAL
Seeded demos don't count. The acceptance test is a real partner (`functionId: 'ecommerce_d2c'`), real SKUs, real FAQs, at least one uploaded PDF, and a 20-question eval with ≥80% grounded responses and zero policy hallucinations.

---

## The 8-Hop Pipeline

Every turn from partner data entry to customer response flows through these 8 hops. For the mission to be met, every hop works end-to-end with real data.

| # | Actor | What happens | Status | Code path |
|---|-------|--------------|--------|-----------|
| 01 | PARTNER · onboarding | Pick `functionId` → `deriveEnginesFromFunctionId()` → modules auto-enabled | **OK** | `src/app/admin/onboarding/relay/*`, `lib/relay/engine-recipes.ts` |
| 02 | ADMIN · flow definition | `/admin/relay/flows` saves a `SystemFlowTemplate` to Firestore | **HALF** | `src/app/admin/relay/flows/*`, `actions/flow-engine-actions.ts` |
| 03 | PARTNER · data entry | Fill `moduleItems`, write `BusinessPersona`, upload docs | **OK** | `/partner/relay/modules`, `/partner/settings`, `/partner/core` |
| 04 | PLATFORM · **retrieval indexing** | Module items + persona + docs → vector store | **MISSING** | `src/ai/fireRagSetup.ts` exists, no relay-side writer |
| 05 | CUSTOMER · turn in | Widget sends `POST /api/relay/chat` → `orchestrate()` | **OK** | `src/app/api/relay/chat/route.ts`, `lib/relay/orchestrator` |
| 06 | ORCHESTRATOR · compose | Flow stage + intent + RAG + block selection + `buildBlockData` | **HALF** | `lib/relay/orchestrator/*` |
| 07 | CUSTOMER · block renders | `BlockRenderer` paints block with populated data + callbacks | **HALF** | `components/relay/blocks/BlockRenderer.tsx` |
| 08 | FEEDBACK · verification | Test Chat signals panel + conversations tab | **OK** | `TestChatSignalsPanel.tsx`, `/admin/relay/health` |

### Why HALF for hop 02
The admin flow editor and partner flow editor both work in isolation. **The gap is structural, not precedence:** admin saves to `systemFlowTemplates`, while the orchestrator reads `partners/{pid}/relayConfig/flowDefinition` — different collections. Admin edits do not propagate to any partner unless that partner has explicitly created an override (most haven't). Evidence: [`PHASE_0_RECON.md`](./PHASE_0_RECON.md). MR-3 needs a design decision before it's a build (see MR-3.M00).

### Why MISSING for hop 04 — the load-bearing gap
The RAG infrastructure exists (`firestoreRetriever`, `gemini-embedding-001`, `centy_documents` vector collection). But its only writer today is `/api/thesis-docs/save` for the financial advisory feature. **Nothing writes module items, business persona, or partner-uploaded docs into the retrieval store for Relay.** So `signals.ragUsed=false` for every non-thesis partner — the response falls back to generic text or empty block data. This is why partners report "the chat doesn't know my products" after filling their catalog.

### Why HALF for hop 06
The retrieval call already exists at `src/lib/relay/orchestrator/signals/rag.ts:79` — `loadRagSignal` does a full partner-scoped retrieval. It currently returns `empty-result` because hop 04 has nothing indexed for non-thesis partners. **The mechanism is working; the data isn't there.** MR-2 extends this call with three source kinds (items / persona / docs) rather than rebuilding. Evidence: [`PHASE_0_RECON.md`](./PHASE_0_RECON.md).

### Why HALF for hop 07
Structured blocks pulling from `moduleItems` by direct query work (the TestChatProducts fix closed that). **Unstructured answers** (FAQ, policy, doc-grounded) don't, because the retrieval path has no data.

---

## Current Status

Session-by-session hop status. Update in place at session close.

| Hop | Last status | Last changed | By (MR) | Notes |
|-----|-------------|--------------|---------|-------|
| 01  | OK | pre-P3 | Engine recipes | Stable |
| 02  | HALF | 2026-04-21 | Phase 0 recon | Disconnected collections — MR-3 design decision needed (see MR-3.M00) |
| 03  | OK | Phase 2 | Partner toolkit | Stable |
| 04  | MISSING | never wired | — | **MR-1 target** |
| 05  | OK | pre-P3 | Subdomain path works | Embed path separate (P5, out of mission scope) |
| 06  | HALF | 2026-04-21 | Phase 0 recon | `loadRagSignal` exists and retrieves — returns empty until hop 04 indexes data. MR-2 extends with source kinds |
| 07  | HALF | Phase 4 | TestChatProducts fix landed structured path | Unstructured waits on hop 4 |
| 08  | OK | Phase 2 | Test Chat signals work | Prod conversation tab doesn't render signals — non-mission |

---

## Mission Phases

Five phases. Each milestone (Mn) is session-sized (~2–3h). **Order is a strict critical path.** Don't parallelise until MR-1 and MR-2 are green.

### MR-1 — The partner-data indexer *(hop 4)*
**Goal:** Build the writer that puts module items, business persona, and partner docs into the retrieval store. The single most load-bearing piece.
**Effort:** ~3 sessions, ~7h.

- **M01 — Retrieval strategy decision doc.** Hybrid vs pure vector. For structured data (items: name, price, tags) pure vector underperforms; hybrid (keyword filter + embedding rerank) is right. Lock the choice.
  - Deliverable: `docs/relay-mission/MR-1/strategy.md`
- **M02 — Item indexer: `indexModuleItem(partnerId, moduleId, itemId)`.** On write/update of `moduleItems/items/*`, project item → searchable doc (name, description, tags, category, price). Write to new collection `relayRetrieval/{partnerId}/items` with structured fields + embedding. Hook into `updateModuleItemAction` / `createModuleItemAction`.
  - Files: `src/lib/relay/retrieval/index-items.ts` · extend `actions/modules-actions.ts`
- **M03 — Persona indexer: `indexBusinessPersona(partnerId)`.** On save of `businessPersona`, chunk FAQs, policies, identity description, tone notes. Embed each chunk. Write to `relayRetrieval/{partnerId}/persona`. Hook into `saveBusinessPersonaAction`.
  - Files: `src/lib/relay/retrieval/index-persona.ts` · extend `actions/business-persona-actions.ts`
- **M04 — Doc indexer.** Reuse existing `indexPdfFile()` from `fireRagSetup.ts`. When a partner uploads a relay-context PDF, index to `relayRetrieval/{partnerId}/docs`. Keep thesis-docs collection isolated.
  - Files: `src/app/api/relay/upload-doc/route.ts` (new)
- **M05 — Backfill script.** One-shot CLI that iterates all active partners and indexes their existing module items + persona. Idempotent; safe to re-run.
  - Files: `scripts/backfill-relay-retrieval.ts`

**Exit criteria:** For a partner with filled data, `relayRetrieval/{pid}/items` has one doc per item, `…/persona` has N chunks, and (if uploads exist) `…/docs` has chunks. No orchestrator changes yet — just the writers.

### MR-2 — Wire the retriever into the orchestrator *(hop 6)*
**Goal:** Make `orchestrate()` actually use the retrieval store. Make signals fidelity match reality.
**Effort:** ~1–2 sessions, ~3h.
**Depends on:** MR-1 complete.

- **M01 — Extend `loadRagSignal` with source kinds.** Current implementation at `src/lib/relay/orchestrator/signals/rag.ts:79` returns a single-stream result. Extend signature to accept `kind: 'items' | 'persona' | 'docs'` and return a per-kind breakdown. Prefer extension over wrapping — the call site already exists and has a working contract.
  - Files: `src/lib/relay/orchestrator/signals/rag.ts` · touch only what's needed
- **M02 — Orchestrator integration.** Replace the current RAG step in `orchestrate()` with `retrievePartnerContext` calls — one per relevant kind per turn. Pass `items` results into `buildBlockData`; pass `persona` + `docs` results into the LLM prompt.
  - Files: `src/lib/relay/orchestrator/*`
- **M03 — Signals fidelity.** `signals.ragUsed=true` when any retrieval happened. `ragSources` = count of retrieved chunks. New field: `ragSourceBreakdown: { items, persona, docs }`. Surface in `TestChatSignalsPanel`.
  - Files: `src/lib/relay/orchestrator/types.ts` · `components/partner/relay/test-chat/TestChatSignalsPanel.tsx`
- **M04 — Graceful zero-result path.** If retrieval returns nothing relevant, orchestrator falls back to a contact / nudge block ("I don't know that yet — want me to connect you with the team?") rather than hallucinating. Q10 contact-fallback rule from Phase 3 pre-flight applies here.
  - Files: `src/lib/relay/orchestrator/compose.ts`

**Exit criteria:** A Test Chat turn on a partner with indexed data shows `ragUsed: true` in the signals panel, `ragSources > 0`, and the response contains tokens that demonstrably came from the indexed content (not hallucination).

### MR-3 — Connect admin flows to orchestrator *(hop 2)*
**Goal:** Design and implement how admin-edited system templates reach the orchestrator. Phase 0 confirmed they're currently in disconnected collections — this MR closes the gap.
**Effort:** ~1–2 sessions, ~3h.
**Depends on:** nothing; can run parallel to MR-1 if a second stream is available.

- **M00 — Flow propagation design decision.** Admin saves to `systemFlowTemplates`; orchestrator reads `partners/{pid}/relayConfig/flowDefinition`. These are disconnected collections — Phase 0 confirmed this. Decide between:
  - **Option A** — copy on admin save (fan out to every matching partner; overwrites partner customisations)
  - **Option B** — fallback at orchestrator read (partner override first, system template as default; preserves customisations, smallest change)
  - **Option C** — merge/resolver (compose system + partner as delta; most correct, most complex)

  Deliverable: `docs/relay-mission/MR-3/flow-propagation-design.md`. Lock the choice before M01 starts.

- **M01 — Trace: admin save → Firestore → orchestrator read.** Edit the `ecommerce_d2c` flow in admin. Change one intent trigger (e.g. add "gift" to discovery). Save. Confirm the Firestore doc reflects it. Confirm the next Test Chat turn uses the new trigger.
- **M02 — Identify & close the fall-through.** If the orchestrator ignores Firestore and uses `getFlowTemplateForFunction()` hardcoded, that's the bug. Fix: orchestrator prefers Firestore, falls back to hardcoded only when unset.
  - Files: likely `src/lib/relay/orchestrator/flow-loader.ts` (verify precedence)
- **M03 — Partner override verification.** Same exercise for `partners/{pid}/relayConfig/flowDefinition`. Partner flow editor exists at `/partner/relay/flows` — confirm saved partner flow beats the system flow at orchestration time.

**Exit criteria:** A regression test in `actions/flow-engine-actions.test.ts` that asserts: edit flow → save → orchestrate → reads the edit.

### MR-4 — Real partner, real data, 20-question eval *(all hops)*
**Goal:** The acceptance test. This is what "mission met" looks like.
**Effort:** ~2 sessions, ~5h.
**Depends on:** MR-1, MR-2, MR-3 all green.

- **M01 — Create real eval partner.** Real `functionId: 'ecommerce_d2c'`. Add 12 real SKUs with names, prices, tags (region, roast, flavour notes). Write BusinessPersona: 5 FAQs, shipping policy, returns policy, one "brewing tips" write-up. Upload one real PDF (product catalog).
  - Fixture: `fixtures/eval-partner-sundara.json`
- **M02 — 20-question eval script.** Mix of structured (product lookup, price, availability), unstructured (policy, FAQ), mixed (compare two products, suggest for a use case). Expected outcomes per question. Script runs against actual `/api/relay/chat`.
  - Files: `scripts/eval-relay-20q.ts` · `fixtures/eval-questions.json`
- **M03 — Run, measure, fix, re-run.** Target: ≥16/20 grounded responses, 0 hallucinations on policy questions. Every failure root-causes to one of the 8 hops. Fix first-failure hop, re-run. Two sessions budgeted for iteration.
  - Output: `docs/relay-mission/MR-4/eval-v1.md` — results + failure analysis

**Exit criteria:** `eval-v1.md` shows ≥16/20 grounded, 0 policy hallucinations, and a commit flipping the "mission status" in this doc's header.

### MR-5 — Operational durability *(hop 4 sustain)*
**Goal:** Index-on-write is not enough. Items change, personas update, docs re-upload. Keep the indexer honest over time.
**Effort:** ~1 session, ~2.5h.
**Depends on:** MR-1, MR-2.

- **M01 — Delete & update paths.** When an item is deleted/deactivated, remove its chunks. When persona is edited, invalidate & re-index. Failure modes surface as `signals.retrievalStale`.
- **M02 — Admin retrieval inspector.** New tab in `/admin/relay/health`: "Retrieval" — per partner, show N indexed items / persona chunks / doc chunks with last-updated timestamps. Surfaces "partner added items 3 days ago but only 10 are indexed" as a concrete warning.
- **M03 — Backfill-on-read safety net.** If `retrievePartnerContext` returns empty but the partner has items, trigger an async backfill + log the incident. Every partner is auto-healing.

**Exit criteria:** A partner deletes an item, next turn doesn't surface it. A partner edits a FAQ, the new version is retrievable within 30s.

---

## Freeze List — Out of Scope

Until **MR-4 is green**, nothing below touches any hop of the mission pipeline. If a session starts on any of these before then, scope has drifted. Add the item to this list with a one-line rationale before continuing.

- **Phase 3 Session 3** — M07 (docs consolidate), M08 (X04 Narrow CLI), M09 (observation closure sign-off). *Zero mission hops. Freeze until MR-4 complete.*
- **Phase 5 — production embed** (`widget.js` bundle, `relayWidgets` writer, domain allowlist, rate limits). *Important for GA, irrelevant for the mission. Subdomain path is enough for verification.*
- **Phase 7 — render path consolidation** (legacy `BlockResolution` removal, Test Chat / widget tree unification). *Pure refactor.*
- **New engine milestones** — commerce M06+, info M05+, booking M08+. *Five engines already activated.*
- **Generic-abstraction refactors** of the three block-data loaders, module-collection unification. *Phase 4 retro rule already locked this.*
- **UI stubs** — Module Settings save, Item Detail editor, partner flow editor polish. *P8 items.*
- **Marketing / embed-URL normalisation.** *Can wait.*

### Phase 3 Session 2 — tactical exception
Session 2 prompt is drafted (~2.5h: M05 permissive-fallback cleanup + M01-flip + M06 validation). Two options:

- **Option A:** Ship Session 2 first, then pivot to MR-1.
- **Option B:** Pivot to MR-1 now, ship Session 2 after MR-1 (recommended).

The fallback simplification in M05 may overlap with MR-2's graceful zero-result path. Sequencing it *after* MR-1 means M05 can assume the retrieval path exists rather than designing for its absence.

---

## Session Protocol

### Start of session checklist
- [ ] Read this document top to bottom
- [ ] Verify assigned task matches an MR milestone
- [ ] If no match, halt and add to Freeze List with rationale
- [ ] Check [`SESSION_LOG.md`](./SESSION_LOG.md) — what did the last session ship?
- [ ] Verify `tsc` baseline (≤100 per `docs/engine-cutover-phase3/tuning.md`)
- [ ] Verify `npm test -- --run` green

### During session
- Follow one-milestone-per-commit discipline per `docs/booking-pilot/00-context.md`
- On uncertainty, halt and surface — don't guess
- Root-cause only — no `@ts-ignore`, no skipped tests
- If scope expansion emerges mid-session, stop and flag. Don't "while-I'm-here"

### End of session checklist
- [ ] Update the **Current Status** table if a hop changed state
- [ ] Append a session entry to [`SESSION_LOG.md`](./SESSION_LOG.md) (template at top of that file)
- [ ] If a new out-of-scope item emerged, add to Freeze List with one-line rationale
- [ ] If MR exit criteria met, flip the MR status in the header at the top of this file
- [ ] Commit with `Speculative-From: docs/relay-mission/README.md` footer

---

## Finish Line

An admin edits a stage in `/admin/relay/flows` — adds "gift" to the *discovery* stage's intent triggers for `ecommerce_d2c`. Hits save. Opens a fresh `/partner/relay` Test Chat as Sundara Coffee. Types *"looking for a gift for a coffee lover"*. The orchestrator transitions straight to discovery, retrieves the Ethiopian Yirgacheffe and a gift-packaging FAQ from the partner's indexed data, renders a `product_card` grounded in the real SKU plus a nudge referring to the real gift-wrap policy. `TestChatSignalsPanel` shows `ragUsed: true`, `ragSourceBreakdown: { items: 1, persona: 1, docs: 0 }`. Nothing is hallucinated. Everything is real.

That moment is the mission. Five MRs get you there. ~22h of focused session time. No more drift.

---

## Related Documents

Referenced from this doc. Read as needed, in this order of priority:

**Operating principles**
- [`docs/booking-pilot/00-context.md`](../booking-pilot/00-context.md) — pause-on-ambiguity, one-milestone-per-commit, root-cause-only
- [`docs/engine-cutover-phase3/tuning.md`](../engine-cutover-phase3/tuning.md) — baseline discipline, session template, tsc anchor (100)

**What's been shipped**
- [`docs/engine-cutover-phase3/plan.md`](../engine-cutover-phase3/plan.md) — Phase 3 milestones (M01–M09)
- [`docs/engine-cutover-phase3/session-1-retro.md`](../engine-cutover-phase3/session-1-retro.md) — Phase 3 Session 1 outcome
- [`docs/phase-4/partner-relay-phase-4-retro.md`](../phase-4/partner-relay-phase-4-retro.md) — M03 deferrals, abstraction rules
- [`docs/admin-reset-runbook.md`](../admin-reset-runbook.md) — admin reset page usage

**Decisions**
- [`docs/engine-cutover-phase3/q10-service-audit.md`](../engine-cutover-phase3/q10-service-audit.md) — contact-fallback rule (applied in MR-2.M04)
- [`docs/engine-cutover-phase3/observation-closure.md`](../engine-cutover-phase3/observation-closure.md) — Model B evidence framework
- [`docs/engine-cutover-phase3/x04-scope-decision.md`](../engine-cutover-phase3/x04-scope-decision.md) — Narrow CLI scope
- [`docs/engine-cutover-phase3/x05-timing-decision.md`](../engine-cutover-phase3/x05-timing-decision.md) — X05 before X04, flag staging

**Companion documents in this folder**
- [`SESSION_LOG.md`](./SESSION_LOG.md) — append-only per-session history
- `MR-1/strategy.md` (created during MR-1.M01) — retrieval architecture decision
- `MR-4/eval-v1.md` (created during MR-4.M03) — 20-question eval results

---

## Changelog

Append-only. One entry per substantive update to this doc.

| Date | Author | Change |
|------|--------|--------|
| 2026-04-21 | [assign] | Initial version. 8-hop pipeline, 5 MRs, freeze list. Status baseline: MR-1 not started, hop 04 MISSING is the load-bearing gap. |
| 2026-04-21 | Claude (Phase 0) | Corrected hop 02 explanation: admin writes `systemFlowTemplates`, orchestrator reads `partners/{pid}/relayConfig/flowDefinition` — disconnected. Corrected hop 06: retrieval call already exists in `signals/rag.ts`; gets empty-result. MR-2 scope narrowed accordingly. |
| 2026-04-21 | Claude (MR-1.M01) | Refined hop 02 / hop 06 per Phase 0 recon. Hop 02 gap is structural (disconnected collections), not precedence. Hop 06's `loadRagSignal` exists and works — the data, not the mechanism, is missing. MR-2 shrunk from "build abstraction" to "extend existing" (~3h). MR-3 renamed + gained M00 design decision (Options A/B/C). tsc anchor 276 → 100 in tuning.md and session protocol. |
