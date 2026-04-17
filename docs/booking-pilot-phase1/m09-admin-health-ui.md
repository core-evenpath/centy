# M09 — Admin UI: `/admin/relay/health`

**Files:**
- `src/app/admin/relay/health/page.tsx`
- `src/app/admin/relay/health/components/{HealthMatrix,IssueDrillDown,FixProposalCard}.tsx`
- Extend `actions/relay-health-actions.ts` from M07 with `applyFixProposal`

**Goal:** Per-partner × engine Health matrix with drill-down and one-click fix proposals.

## Matrix

- Row per engine. Cell shows status dot, issue count, fixable count.
- Engines the partner doesn't have render inactive (em-dash, **not** "0").

## Drill-down sections (collapsible, expanded if ≥ 1 issue)

- Missing stages
- Orphan blocks
- Orphan flow targets
- Unresolved bindings (with fix proposals)
- Empty modules (with link to M15 seed flow)

## `applyFixProposal`

```ts
export async function applyFixProposal(
  partnerId: string,
  engine: Engine,
  proposal: FixProposal,
): Promise<{ ok: boolean; error?: string }> {
  // Dispatch by proposal.kind:
  //   'bind-field'      → module binding mutation
  //   'enable-block'    → partnerBlockPrefs write
  //   'connect-flow'    → flow edit
  //   'populate-module' → no-op here, links to M15 seed UI
  // After mutation: invalidate caches, recomputeEngineHealth
}
```

- Auto-refresh Health every 60s (cache-served).
- "Open Preview Copilot" button placeholder (wired in M13).

## Acceptance

- [ ] Matrix renders for any partner; inactive rows for unowned engines
- [ ] Drill-down counts match the `EngineHealthDoc`
- [ ] At least one Apply-fix flow works end-to-end (button → mutation → recompute → issue disappears)
- [ ] Failed Apply-fix surfaces the error inline; underlying state unchanged
- [ ] Auto-refresh cache hit > 80% over 5 minutes
- [ ] No write surface beyond `applyFixProposal`

## Escalation triggers

- A fix-proposal kind needs a server action that doesn't exist
- Admin shell rejects the new route

## Commit

`[booking-pilot M09] admin health page: matrix, drill-down, apply-fix`
