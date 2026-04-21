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

_(No sessions yet — MR-1 not started.)_

---

## Speculative-From footer convention

Every commit produced under this mission should carry:

```
Speculative-From: docs/relay-mission/README.md
```

If the commit was driven by a more specific doc (e.g. an MR strategy doc or session retro), prefer that over README.md. The point is traceability — a reviewer pulling up the diff should be able to read the originating brief.
