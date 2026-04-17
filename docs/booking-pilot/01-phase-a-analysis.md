# Phase A — Analysis (deliver before any implementation)

**Deliverable:** `docs/booking-pilot-analysis.md` (new file at this path).
**Commit this document before writing any production code.**

Answer every question with concrete file paths, line numbers, and code excerpts.

---

## A1. Block inventory

- List every block file under `lib/relay/blocks/` and `src/app/admin/relay/blocks/previews/` whose content is Booking-native (hospitality rooms, healthcare appointment, personal_wellness appointment + class-schedule, travel_transport ticket-booking + transfer-booking + airport_transfer, events_entertainment availability, food_beverage table-reservation, hotel check-in, etc.).
- For each, record: file path, block id, current `stage`, current `family`, `fields_req`, `moduleBinding` (if any), `status`.
- Identify cross-engine / shared candidates (`testimonials`, `contact`, `greeting`, etc.) — they will receive `engines: ['shared']` in M04.

## A2. Current block registry shape

- Document the auto-generated registry at `src/app/admin/relay/blocks/previews/_registry-data.ts`: its generation source, the shape of `ServerBlockData`, how `ALL_BLOCKS_DATA`, `ALL_SUB_VERTICALS_DATA`, `SHARED_BLOCK_IDS_DATA` are assembled.
- Note whether the generator script is committed and how to re-run it.

## A3. Flow engine current state

- Locate all flow-related code: `lib/flow-engine.ts`, `lib/flow-templates.ts`, `lib/types-flow-engine.ts`, `lib/relay/flow-to-blocks.ts`, `lib/relay/orchestrator/signals/flow.ts`, and any `flowDefinitions` Firestore collection reads.
- Document: how a flow is defined today, how stages relate to blocks, what a `FlowEngineDecision` looks like, and where `suggestedBlockIds` originates.

## A4. Module ↔ block coupling inventory

- For each booking block identified in A1, map its `moduleBinding.sourceCollection` to the corresponding system module slug in `lib/modules/` or the `systemModules` collection.
- Identify Booking modules that have no partner-facing seed data path today (these become seed-template deliverables in M15).

## A5. Partner config resolution

- Trace the exact path from subdomain to `PartnerSignal` in the orchestrator: `lib/relay-subdomain.ts` → `lib/relay/orchestrator/signals/partner.ts` → `functionId` resolution.
- Note the current shape of the partners Firestore doc and where block preferences live.

## A6. Gap analysis table

Produce a table with columns: `Area` | `Exists today` | `Needs change` | `Needs new` | `Estimated risk`.

One row per logical component:

- Engine enum
- Block `engines` field
- Flow `engine` field
- Partner `engines` field
- Session `activeEngine` field
- Health checker (pure functions)
- Health collection (`relayEngineHealth/{partnerId}_{engine}`)
- Intent `engineHint`
- Admin engine-tab UI (`/admin/relay/blocks`)
- Admin Health page (`/admin/relay/health`)
- Preview Copilot scripts
- Onboarding recipe picker
- Drafting seed templates
- Generic CSV module import (replacing hotel-only)

---

## Acceptance for Phase A

- `docs/booking-pilot-analysis.md` exists at the repo root's `docs/` directory.
- All six questions answered with file paths + excerpts.
- Gap table has ≥14 rows.
- Commit message: `[booking-pilot A] analysis doc: block inventory, flow state, gaps`.
- Do **not** proceed to M01 until this is committed and you have confidence in the functionId → engines mapping. If more than 20% of mappings are uncertain, stop and escalate (see `reporting-dod.md`).
