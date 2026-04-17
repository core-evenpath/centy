# 00 — Context (read before anything else)

## 1. Mission

Ship Phase 0 (schema foundation + backward compatibility) and Phase 1 (Booking engine end-to-end) of the Relay Engine Architecture. **Deterministic code only. No new AI model calls anywhere.**

At the end of this task, a partner whose `businessPersona.identity.businessCategories[0].functionId` resolves to a booking-native vertical (e.g., `hotels_resorts`) must:

- Run `/partner/relay` against an engine-scoped orchestrator pipeline
- Have Health computed and written in shadow mode
- Surface in `/admin/relay/blocks` (Booking tab), `/admin/relay/health` (Health view), and Preview Copilot
- Show **zero regression** for any partner in any other vertical

## 2. Context — what's being built

Multi-tenant conversational commerce platform called **Relay**. Three authoring layers + one new validation layer:

- `/admin/relay/blocks` — UI vocabulary (**what** can be shown)
- `/admin/relay/flows` — decision logic (**when/why** to show it)
- `/admin/modules` — content source (**what data** fills it)
- `/admin/relay/health` — **new** — whether the above three are coherently connected

Full engine model: `commerce`, `booking`, `lead`, `engagement`, `info`, `service` + `shared` block tag. **This task implements only Booking.** Other engines get schema fields but no blocks tagged, no flows authored, no UI surface — inert until later phases.

**Why this exists.** Without engine-scoping, 200+ blocks across 13 verticals present as an undifferentiated catalog to Gemini (accuracy + latency hit) and to partners (onboarding hit). Engine-scoping narrows per-turn catalog from ~100+ to ~15–25 for a Booking partner and makes "is this partner ready?" a checkable contract.

## 3. Hard rules — non-negotiable

1. **No new AI calls.** Existing Gemini/Anthropic usage in the orchestrator stays as-is. Do not add model calls to admin assists, Health, onboarding, drafting, or Preview Copilot. Seed templates and canonical scripts are authored content, not prompts.
2. **Backward compatibility required.** Every production partner without engine fields must continue functioning. All new schema fields optional with deterministic fallbacks. `getPartnerEngines(partner)` returns explicit `partner.engines` when set, else derives from `functionId`.
3. **Additive schema only.** No destructive migrations. No required new fields. `tsc --noEmit` must pass at every commit.
4. **Shadow-mode Health.** Computes and writes to Firestore but never gates publishing in admin and never blocks the runtime response. Gating flips in a later phase.
5. **Booking-only tagging.** Do not add `engines: [...]` to non-Booking blocks in this task.
6. **Do not delete `lib/relay-block-taxonomy.ts`.** Mark deprecated via header comment; leave in place for backward compat.

## 4. Operating principles

- **Analyze before you implement.** Phase A must complete and commit before any production-code milestone.
- **One milestone per commit.** `[booking-pilot Mxx] <short summary>`. Update `BOOKING_PILOT_PROGRESS.md` after each milestone.
- **Pause on ambiguity.** Append to `BOOKING_PILOT_QUESTIONS.md` and stop. Do not assume.
- **Never rewrite established files silently.** Log and pause.
- **Root-cause fixes only.** Don't skip, stub, or relax a test; fix the cause.
- **No dependency additions without justification.** New packages need a progress-doc line explaining why existing code can't do the job.

## 5. Reporting protocol

Maintain four files at the repository root:

| File                              | Created          | Updated through     | Purpose                                  |
| --------------------------------- | ---------------- | ------------------- | ---------------------------------------- |
| `docs/booking-pilot-analysis.md`  | Phase A          | Phase A only        | One-time analysis deliverable            |
| `BOOKING_PILOT_PROGRESS.md`       | Phase A          | Every milestone     | Append-only log, one block per milestone |
| `BOOKING_PILOT_QUESTIONS.md`      | First escalation | Every escalation    | Append-only with resolution notes        |
| `BOOKING_PILOT_SUMMARY.md`        | After Phase C    | Once, at end        | Final report                             |

### Per-milestone progress block

```markdown
## M## — <Title>
- Status: done | blocked | deferred
- Commit: <sha>
- Files changed: <count>, LOC: +<added>/-<removed>
- Tests: <passed>/<total>
- Notes: <surprising, risky, or deferred items>
- Deviations from spec: <any, with rationale> | none
```

### Per-question entry

```markdown
## Q## — <Short title>
- Raised in: M## | Phase A | Phase C
- Date: YYYY-MM-DD
- Trigger: <which escalation rule fired>
- Question: <full question with code excerpts>
- Status: open | resolved
- Blocks: <which milestone(s) cannot proceed>

### Resolution (added when answered)
- Decision: <what was decided>
- Action taken: <what changed>
```

Append-only. Never edit prior entries — append a new block or resolution note.
