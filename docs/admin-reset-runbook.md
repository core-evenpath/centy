# Admin Reset — Operator Runbook

Short operator guide for `/admin/system/reset`. Phase 3 validation uses this tool between passes to put test partners into known states.

## When to use this page

- **Phase 3 P3.M06 final validation:** reset a test partner's Health snapshots, trigger a re-read, verify shape
- **Orchestrator regression debugging:** reset block prefs after a change to verify behavior from a clean baseline
- **Preview Copilot housekeeping:** wipe accumulated `preview_` sandbox sessions
- **M15 seed-template re-authoring:** clear partner module items before applying an updated seed template

Do NOT use this page for:
- Customer-facing reset flows — this is internal-only
- Full partner deletion — that's a separate flow, not reset
- Bulk production recovery — restore from Firestore PITR or backups

## Collections available today

5 resettable collections. Unknown collections are refused at the action layer; adding a new collection is a code change in `src/lib/admin/reset/resettable-collections.ts` (reviewable by diff).

| Collection | Verb | Required filter | Notes |
|---|---|---|---|
| Relay Engine Health snapshots | recompute | partner | Optional engine filter. Next Health read regenerates the snapshot via `relay-health-actions`. |
| Partner block configurations | clear | partner | Deletes `partners/{pid}/relayConfig/*` except `flowDefinition`. Partner must re-configure via `/admin/relay/blocks`. |
| Conversation sessions | clear | partner | Optional date-range filter. Warning fires when date range includes the last 24 hours. |
| Preview Copilot sessions (sandbox) | clear | (none) | Safe-by-design — only affects docs with `preview_` conversationId prefix. Optional partner filter. |
| Partner module items | delete | partner + module | Resolves `moduleSlug` → `partnerModuleId` via `moduleAssignments`. Re-seed via `applySeedTemplate` after. |

## Standard operating flow

1. **Open the page** at `/admin/system/reset`. Collection cards are rendered; verb badge shows the semantic action (recompute, clear, invalidate, delete).
2. **Click a collection card** to enter the detail view.
3. **Fill the filter form.** Required fields are labeled `(required)`; optional fields labeled `(optional)`. Changing the filter clears any prior dry-run result — you must re-run dry-run against the new filter.
4. **Click "Dry-run".** The page shows the affected count, sample ids (first 10), any warnings, and the Firestore path. No writes happen.
5. **Review the dry-run result.** If affected count or warnings surprise you, stop and reconsider.
6. **Type the collection id** verbatim in the confirmation input to unlock the Execute button.
7. **Click "Execute reset".** The action runs, writes an audit entry, and shows the result panel with duration + audit id.
8. **For recompute verbs:** the execution panel shows a hint that the next read will regenerate the data. Visit the relevant admin page (e.g., `/admin/relay/health?partnerId=...`) to trigger recompute.

## Unscoped mode (RESET_ALLOW_UNSCOPED)

Unscoped resets (no filter — affects every document in the target collection) are gated by the env flag `RESET_ALLOW_UNSCOPED=true`. When the flag is unset or set to any value other than `"true"`:

- The UI checkbox is disabled with tooltip
- The action layer rejects the request regardless of UI state

Do NOT set this env flag outside dev / staging environments. It's documented here so operators know why the checkbox is disabled.

## Audit log

Every dry-run and every execute writes a `systemResetAudit` entry. The audit stores:

- `collectionId`, `firestorePath` (resolved — with real subcollection ids, not template placeholders)
- `verb` — `'dry-run'` for previews; concrete verb (`recompute`/`clear`/`invalidate`/`delete`) for executions
- `filter` — exact shape operator submitted
- `affectedCount` + `sampleIds`
- `startedAt` / `completedAt` (ms since epoch)
- `confirmedDryRunId` — pointer to the prior preview audit when execute followed a dry-run
- `triggeredBy` (user/session identifier; currently `'admin-ui'` until auth wiring lands)
- `environment` (from `NODE_ENV`)

The audit log is NOT resettable via this page (by design — it's the record of resets, not operational state).

## Phase 3 readiness sequence

End-to-end validation sequence run during MR06 self-test — mirror this during P3.M06 final validation:

1. Pick a test partner (e.g., `p-test-mr06`)
2. Seed known Health state across the engines the partner uses
3. On the page: Collection list → Relay Engine Health snapshots
4. Filter: partner = your test partner
5. Dry-run — verify the expected count (one per engine the partner has)
6. Type the collection id, click Execute
7. Visit `/admin/relay/health?partnerId={pid}` — Health should recompute fresh
8. Verify the post-reset Health shape matches expectations

Automated equivalent: `src/actions/__tests__/admin-reset-self-test.test.ts`.

## Troubleshooting

- **"Filter invalid" with no details**: the UI should enumerate errors in the result panel. If only the top-level message shows, refresh and re-submit.
- **"Unknown collection id"**: the URL or API call is referencing a collection not in the allow-list. Check `src/lib/admin/reset/resettable-collections.ts` for the current list.
- **Execute button stays disabled**: confirmation text must match the collection id exactly, including hyphens.
- **"Partner has no assignment for module"**: the partner doesn't have that module enabled. Assign via `/admin/modules` first if this is unexpected.
- **Dry-run says 0 but the partner has data**: filter probably doesn't match (e.g., wrong engine spelling). Narrow or remove optional filters.
- **Audit entry missing**: audit writes are part of the action flow; if the action returned `ok: true`, the audit was written. If the action returned `ok: false`, no audit entry is written (validation rejected the request before any side effects).

## Source

- Allow-list: `src/lib/admin/reset/resettable-collections.ts`
- Filter model: `src/lib/admin/reset/filter-model.ts`
- Server actions: `src/actions/admin-reset-actions.ts`
- Page: `src/app/admin/system/reset/page.tsx`
- Self-test: `src/actions/__tests__/admin-reset-self-test.test.ts`
