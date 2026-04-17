# M13 — Preview Copilot: scripted scenarios

**Files:**
- `lib/relay/preview/{booking-scripts,script-runner}.ts`
- `actions/relay-preview-actions.ts`
- `src/app/admin/relay/health/preview/{PreviewPanel,ScriptPicker,TurnView}.tsx`

**Goal:** Scripted (not generated) customer journeys runnable against the live orchestrator from inside `/admin/relay/health`.

## Scripts

Author **8 scripts per sub-vertical** (hotel, clinic, wellness, ticketing, airport-transfer = **40 total**), each covering one of:

1. Greeting + browse
2. Specific availability
3. Comparison
4. Booking flow
5. Add-on
6. Service-overlay break
7. Cancel flow
8. Sub-vertical edge case

Scripts are **static plain text**. No templating, no random values, no time-dependence.

```ts
interface PreviewScript {
  id: string;
  engine: Engine;
  subVertical: string;
  label: string;
  description: string;
  turns: Array<{ role: 'user'; content: string }>;
}
```

## Runner

```ts
export async function runPreviewScript(
  partnerId: string,
  script: PreviewScript,
): Promise<PreviewTurnResult[]> {
  // Sandboxed conversationId: `preview_${partnerId}_${script.id}_${nonce}`
  // For each turn: call production orchestrate() with accumulated messages
  // Capture { blockId, text, suggestions, activeEngine, catalogSize, errors }
  // Cleanup sandbox session afterward
}
```

**Sandbox sessions must not pollute production state.** If side-effect actions (cart, booking-hold, payment init) can't be guarded by a preview-mode flag, **escalate** (rule #9).

## UI

- Panel inside `/admin/relay/health` (the M09 "Open Preview Copilot" button is now active for partners with Booking enabled).
- ScriptPicker grouped by sub-vertical → "Run script" → per-turn rendering with block id, active engine, catalog size, response text, errors.
- "Re-run" replays for a stability check.

## Acceptance

- [ ] 40 scripts across 5 sub-verticals (8 each)
- [ ] All user messages static (grep-verifiable: no template strings with variables)
- [ ] Runner uses production `orchestrate()`, not a copy
- [ ] Sandbox doesn't pollute production sessions (verified by post-run Firestore read)
- [ ] Same script + same config → identical block ids per turn
- [ ] Red-Health partner runs in degraded mode without crash

## Escalation triggers

- Sandbox side effects unsuppressable
- Orchestrator cannot be invoked from a server action

## Commit

`[booking-pilot M13] preview copilot: scripted booking scenarios + admin panel (sandboxed)`
