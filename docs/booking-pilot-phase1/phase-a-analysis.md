# Phase A — Analysis (do this first)

Produce `docs/booking-pilot-analysis.md` with concrete file paths, line numbers, and code excerpts answering A1–A6 below. **Commit before writing any production code. No M01+ work begins until Phase A is merged.**

Cite as `path/to/file.ts:123`. Use code-block excerpts for non-trivial claims.

---

## A1 — Block inventory

List every block file that is a Booking candidate. For each: file path, block id, current `stage`, current `family`, `fields_req`, `fields_opt`, `moduleBinding`, `status`. Produce a separate list for `shared`-tag candidates (greeting, contact, suggestions, nudge, promo, testimonials, location, info, quick_actions). Use **exact registered ids**, not descriptive names.

## A2 — Block registry shape

Document the auto-generated registry at `src/app/admin/relay/blocks/previews/_registry-data.ts`: generation source, `ServerBlockData` shape, how `ALL_BLOCKS_DATA` / `ALL_SUB_VERTICALS_DATA` / `SHARED_BLOCK_IDS_DATA` are assembled, whether the generator script is committed, whether `engines[]` will need generator changes.

## A3 — Flow engine current state

Locate and document: `lib/flow-engine.ts`, `lib/flow-templates.ts`, `lib/types-flow-engine.ts`, `lib/relay/flow-to-blocks.ts`, `lib/relay/orchestrator/signals/flow.ts`, any Firestore flow collection. Answer: current `FlowDefinition` shape, how stages map to suggested blocks, what `FlowEngineDecision` looks like, whether `engine` already exists in any form, how flow templates key today.

## A4 — Module ↔ block coupling

For each Booking block from A1 with a `moduleBinding`: map `sourceCollection` to system module slug, locate Zod schema, identify Booking modules with no partner-facing seed-data path. Table format:

| Block id | sourceCollection | Module slug | Schema location | Has seed path? |

## A5 — Partner config resolution

Trace runtime path: subdomain → partner doc → `functionId` → modules → block prefs. Document partner doc shape (engine-relevant fields). Note any field-name collision with `engines[]`.

## A6 — Gap analysis

Single table: `Area | Exists today | Needs change | Needs new | Estimated risk`. Rows must include:

- engine enum
- `Block.engines`
- `Flow.engine`
- `Partner.engines`
- `Session.activeEngine`
- recipe table
- Booking block tags
- Booking flow templates
- Health checker
- Health storage
- Health write hooks
- admin engine tabs
- admin Health page
- intent `engineHint`
- session `activeEngine` logic
- orchestrator engine-scoped policy
- Preview Copilot
- onboarding picker
- seed templates
- CSV import generalization

Risk: low/medium/high with one-sentence rationale.

---

## Phase A acceptance

- [ ] `docs/booking-pilot-analysis.md` committed
- [ ] Every claim cited with `path:line`
- [ ] Gap table complete
- [ ] No production code modified
- [ ] Commit: `[booking-pilot phase-a] analysis`

## Phase A escalation triggers (pause if)

- Block registry generator missing or unlocatable
- Firestore flow collection inconsistent across partners
- Booking blocks already have `engines` from prior work
- `partner.engines` or `session.activeEngine` already used for unrelated purposes
- Appendix C mappings disagree with `BUSINESS_FUNCTIONS`
