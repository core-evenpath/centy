# M09 — Admin UI: `/admin/relay/health` page

## Files

- `src/app/admin/relay/health/page.tsx` (new)
- Supporting components under `src/app/admin/relay/health/_components/`
- Extend `actions/relay-health-actions.ts` from M07 with list/query actions as needed

## What to build

- **Matrix view:** rows = partners, columns = engines. Cell shows the engine's current Health status (green/amber/red) for that partner.
- **Drill-down panel** (opened by clicking a cell):
  - `orphanBlocks`
  - `orphanFlowTargets`
  - `unresolvedBindings`
  - `emptyModules`
- **"Apply fix" buttons** on each `FixProposal`: one click invokes the appropriate underlying mutation (module binding change, flow edit, etc.) and re-runs Health.

## Do not

- Invoke AI models to describe or propose fixes. Fix proposals are already produced deterministically in M06.
- Allow "Apply fix" for anything that is ambiguous — only apply when the proposal has a clear target and type-compatible field.

## Acceptance

- Page loads for any partner.
- Clicking a cell opens the drill-down with live data from `relayEngineHealth/*`.
- Clicking "Apply fix" produces the proposed change, persists it, and re-runs Health; the cell reflects the new status without a full page refresh.
- Manual verification against a hotel test partner (green case and one injected broken case).

## Commit

`[booking-pilot M09] admin health page: matrix, drill-down, apply-fix`
