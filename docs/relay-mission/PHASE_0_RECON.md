# Phase 0 — Mission Recon Report

**Date:** 2026-04-21
**Branch:** claude/beautiful-austin-4094ee
**Baseline:** tsc = 100 (main repo) · tests = not runnable in worktree (vitest absent from worktree node_modules — worktree artifact, not a code issue)
**Signal:** AMBER

---

## Summary

The README's central claim — hop 04 MISSING is the load-bearing gap, MR-1 should build the relay-side writer — **holds up completely**. No relay indexer was found anywhere. Hop 04 is confirmed MISSING.

Two claims require correction before MR-1 starts:

1. **Hop 02 gap is more specific than stated.** Admin `/admin/relay/flows` writes to `systemFlowTemplates` Firestore collection. The orchestrator reads from `partners/{pid}/relayConfig/flowDefinition`. These collections are **completely disconnected** — no code path moves an admin template to the orchestrator. The partner flow editor (`savePartnerFlowAction`) DOES write to the path the orchestrator reads, so the partner-level override works. MR-3 is not a "verify precedence" session — it's a design decision: how should admin-level templates propagate to the orchestrator?

2. **Hop 06 is more complete than stated.** `src/lib/relay/orchestrator/signals/rag.ts` already contains a full, working retrieval call: it queries `centy_documents` with `where: { partnerId: ctx.partnerId }` and k=4. It returns `reason: 'empty-result'` for all non-thesis partners because hop 04 is missing. MR-2's scope is narrower than the README implies — the wiring already exists; it needs to be validated, not built.

One baseline discrepancy: tsc count in main repo is **100**, not 276 as `docs/engine-cutover-phase3/tuning.md` documents. The improvement happened during Phase 3/4 work. The tuning.md anchor needs updating but that's outside this session's scope.

---

## Findings by hop

### Hop 01 — PARTNER onboarding (claim: OK)
**Status:** not investigated
**Evidence:** No contradicting evidence found in grep sweeps. Code paths (`deriveEnginesFromFunctionId`, `engine-recipes.ts`) were not read in full. Accepting claim as likely correct; no MR-1 dependency.

### Hop 02 — ADMIN flow definition (claim: HALF)
**Status:** confirmed HALF, but gap is more specific than described
**Evidence:**

Admin editor write path (`flow-engine-actions.ts:476`):
```
adminDb.collection('systemFlowTemplates').doc(templateId).set(record)
```

Orchestrator read path (`signals/flow.ts:55-70`):
```
db.collection('partners').doc(partnerId)
  .collection('relayConfig').doc('flowDefinition').get()
```

Orchestrator fallback chain (from `signals/flow.ts` lines 80–101):
1. `partners/{pid}/relayConfig/flowDefinition` (if exists and engine matches)
2. Engine-specific hardcoded templates: `getBookingFlowTemplate` → `getCommerceFlowTemplate` → `getLeadFlowTemplate` → `getEngagementFlowTemplate` → `getInfoFlowTemplate`
3. Legacy `getFlowTemplateForFunction(functionId)`

**`systemFlowTemplates` is never in this chain.** Confirmed by:
```
grep -rn "systemFlowTemplates" src/lib/relay/orchestrator/
# → (no output)
```

Partner-level write path (`flow-engine-actions.ts:64-92`, `savePartnerFlowAction`):
```
adminDb.collection('partners').doc(partnerId)
  .collection('relayConfig').doc('flowDefinition').set(flowData)
```
This writes to the path the orchestrator DOES read — partner override works.

**Precedence today:**
- Partner-level flow (`/partner/relay/flows`) → `partners/{pid}/relayConfig/flowDefinition` → orchestrator reads it ✓
- Admin-level flow (`/admin/relay/flows`) → `systemFlowTemplates` → orchestrator ignores it ✗

**MR-3 scope implication:** This is not a "trace and verify" session. The admin template path is structurally disconnected. MR-3 needs to decide: (a) should the admin create templates that partners then adopt, or (b) should a system-level override apply globally? This is a design decision before any code change.

### Hop 03 — PARTNER data entry (claim: OK)
**Status:** confirmed (with a nuance)
**Evidence:**
- `createModuleItemAction` (`modules-actions.ts:812`) and `updateModuleItemAction` (`:891`) write to `partners/{pid}/businessModules/{mid}/items`
- Both compute a `ragText` field via `generateRAGText()` (`lib/modules/utils.ts:172`) and store it inline on the Firestore item document
- `ragText` is a **plain text field on the Firestore document**, not a vector index entry. The orchestrator does not read it (`grep -rn "ragText" src/lib/relay/orchestrator/` → no output)
- `saveBusinessPersonaAction` (`business-persona-actions.ts:266`) writes directly to the partner doc, no indexer hook

Nuance: the `ragText` inline field is a pre-computed text blob stored on items (not vectorized). It's not retrievable via the RAG path. MR-1 must create a separate vector indexing step.

### Hop 04 — PLATFORM retrieval indexing (claim: MISSING) ⭐ LOAD-BEARING
**Status:** confirmed MISSING
**Evidence:**

`indexPdfFile` callers (only thesis-docs):
```
src/app/api/thesis-docs/rag/route.ts:9,90    ← indexPdfFile
src/app/api/thesis-docs/save/route.ts:12,234  ← indexPdfFile
src/ai/fireRagSetup.ts:45                    ← definition
```

`centy_documents` / `firestoreRetriever` writers (only thesis-docs + read in orchestrator):
```
src/ai/fireRagSetup.ts:12                    ← RAGINDEX_COLLECTION_NAME = "centy_documents"
src/app/api/thesis-docs/rag/route.ts:56,91   ← write
src/app/api/thesis-docs/save/route.ts:235    ← write
src/app/api/thesis-docs/delete/route.ts:50   ← delete
src/app/api/mission-control/diagnose/route.ts ← read (admin diagnostic)
src/lib/relay/orchestrator/signals/rag.ts:79 ← READ (retriever, gets empty results)
```

Other embedding paths:
- `src/ai/fireRagSetup.ts:14,86,94,112,146` — all within `indexPdfFile` / `indexToFirestore`, thesis-docs only
- `src/lib/gemini-service.ts:259` — `generateEmbedding()` called only from `partnerhub-actions.ts:115`, writes an `embedding` field inline on `partners/{pid}/hubDocuments/{docId}` — NOT `centy_documents`, NOT used by orchestrator

Indexer-pattern functions found:
```
src/ai/fireRagSetup.ts:45  indexPdfFile    ← thesis only
src/ai/fireRagSetup.ts:75  indexToFirestore ← called only by indexPdfFile
```
No `indexModuleItem`, `indexBusinessPersona`, or relay-equivalent exists anywhere.

Module/persona write hooks (B.2, B.3):
- `createModuleItemAction` — writes item + inline `ragText` field; no indexer call
- `updateModuleItemAction` — same; no indexer call
- `saveBusinessPersonaAction` — writes to partner doc; no indexer call

Doc upload paths (B.4):
- `src/app/api/vault/upload/route.ts` — calls `uploadFileToVault`, no RAG indexing
- `partnerhub-actions.ts:115` — embeds hubDocuments inline (not `centy_documents`)
- `relay-knowledge-actions.ts` — manages `excludedVaultDocIds` config list only; no indexing

Third-party integrations (B.5):
- Shopify (`shopify-actions.ts`) — no embedding references
- WhatsApp, Telegram webhook routes — no embedding references

**Conclusion:** Hop 04 is confirmed MISSING exactly as described. No relay-side writer to `centy_documents` exists anywhere in the codebase. The `ragText` inline field on module items is a red herring — it is not vectorized and the orchestrator ignores it. MR-1 can start as planned.

### Hop 05 — CUSTOMER turn in (claim: OK)
**Status:** not investigated
**Evidence:** `src/app/api/relay/chat/route.ts` exists. Not read in full. No contradicting evidence. Accepting claim.

### Hop 06 — ORCHESTRATOR compose (claim: HALF)
**Status:** confirmed HALF, but more complete than described
**Evidence:**

Full RAG call site at `src/lib/relay/orchestrator/signals/rag.ts`:
```typescript
// line 79
const retriever = firestoreRetriever(RAGINDEX_COLLECTION_NAME);
const docs = await ai.retrieve({
  retriever,
  query: lastMsg,
  options: { k: TOP_K, where: { partnerId: ctx.partnerId } },
});
```

Conditions for `ragUsed=true` (from `rag.ts:21-50`):
- `intent` is one of: `inquiry`, `complaint`, `returning`, `location`, `contact`
- OR message contains any of: `how do you`, `what is your`, `what are your`, `do you`, `are you`, `can i`, `policy`, `hours`, `refund`, `shipping`, `warranty`, `return`

Returns `used: false, reason: 'empty-result'` for non-thesis partners (always, since hop 04 is missing).
Returns `used: false, reason: 'skipped-transactional'` for transactional intents (booking, cart, etc.).
Returns `used: false, reason: 'skipped-flag'` if `ctx.skipRag` is set.

`ragText` field NOT used by orchestrator: `grep -rn "ragText" src/lib/relay/orchestrator/` → no output.
`hubDocuments` / `vaultFiles` NOT used by orchestrator: confirmed empty grep.

**MR-2 scope implication:** The retrieval call already exists and is partner-scoped. MR-2 needs to: (1) verify the retrieval actually surfaces items once MR-1 indexes them, (2) add `ragSourceBreakdown` field (currently only `used`, `query`, `chunks`, `reason` exist in `RagSignal`), (3) implement the graceful zero-result path. The "Retriever abstraction" in MR-2.M01 may be narrower than planned — consider whether a new abstraction is needed or whether extending `loadRagSignal` suffices.

### Hop 07 — CUSTOMER block renders (claim: HALF)
**Status:** not investigated
**Evidence:** Consistent with Phase 4 retro findings. No new investigation performed.

### Hop 08 — FEEDBACK verification (claim: OK)
**Status:** not investigated
**Evidence:** No contradicting evidence found. Accepting claim.

---

## Baseline discrepancy

**tsc:**
- `docs/engine-cutover-phase3/tuning.md` documents baseline as **276**
- Actual count in main repo (with node_modules): **100**
- Phase 3/4 work reduced it from 276 → 100
- Worktree shows 358 — worktree artifact (vitest package not in worktree node_modules, causes ~250 false `Cannot find module 'vitest'` errors)
- Recommendation: update `tuning.md` anchor to 100 — but outside Phase 0 scope

**Tests:**
- `npm test` / `npx vitest run` fail in worktree — vitest package not installed in worktree (`node_modules` not present)
- Not a codebase issue; run tests from main repo root
- Count not obtainable this session; deferred to operator

---

## README corrections made

See separate git diff. Two sections updated:

1. **Hop 02 HALF explanation** — Replaced "Unverified: does the orchestrator actually read the saved Firestore flow?" with the confirmed finding: admin saves to `systemFlowTemplates`, orchestrator reads `partners/{pid}/relayConfig/flowDefinition`; these are disconnected. MR-3 scope reframed from "trace and verify" to "design decision + connect admin templates."

2. **Hop 06 HALF explanation** — Replaced vague "RAG grounding doesn't, because hop 4 is missing" with concrete description of `signals/rag.ts` and the existing retrieval call. MR-2 scope narrowed accordingly.

---

## Open questions surfaced

1. **Admin → partner flow propagation design** — The `systemFlowTemplates` collection is structurally separate from what the orchestrator reads. Before MR-3 starts, the operator needs to decide: should an admin template be a per-partner default that gets pushed into `relayConfig/flowDefinition` on assignment, or should a system-level collection become a direct fallback in the orchestrator's chain? This is a product decision, not just a tech decision.

2. **`ragText` inline field — is it intentional?** Module items have a `ragText` field computed and stored but never used by the retrieval path. This may be dead code from an earlier design, or it may be infrastructure for a future "simple keyword search" mode. MR-1 should clarify whether to reuse or ignore it.

3. **Hub document embeddings** — `partnerhub-actions.ts` computes embeddings for `hubDocuments` and stores them inline on the Firestore document. These are NOT in `centy_documents` and NOT used by the relay orchestrator. Should MR-1's doc indexer reuse these embeddings or compute fresh ones via `indexPdfFile`?

4. **`ctx.skipRag` flag** — `loadRagSignal` checks `ctx.skipRag`. Where is this set? Unclear from grep. If it's hardcoded for certain partner types, it could suppress RAG even after MR-1 indexes data.

5. **Partner vs system flow scope** — The partner flow editor at `/partner/relay/flows` writes the right path. Is this UI exposed and functional? If partners have already set `flowDefinition` values, MR-3's scope is much narrower than if the UI has never been used.

---

## Signal to operator

**AMBER** — hop 04 MISSING is confirmed; MR-1 can start as planned. Before MR-3 starts, the admin↔orchestrator flow disconnection needs a design decision (open question 1 above). MR-2's scope is narrower than planned (retrieval call exists; extend don't rebuild). Recommend reviewing the open questions with the operator before MR-1.M01.
