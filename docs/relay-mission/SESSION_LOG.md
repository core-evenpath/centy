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
