# Test Chat Emission — Retrospective

Session: two-commit bundle restoring Test Chat block emission for
Brew & BonBon Cafe (and, by implication, every cafe-vertical partner).
Branch: `claude/partner-relay-test-chat-emission` (off `main` at
`dec0c838`).
Baseline throughout: tsc 276.

## 1. Commits shipped

| SHA | Commit | tsc | tests |
|---|---|---|---|
| `db84fd1d` | `[test-chat-emission] parser: iterate all candidate parts` | 276 | 726 |
| `72e7e964` | `[test-chat-emission] buildBlockData: cafe discovery blocks` | 276 | 732 |

**2 commits.** tsc held at 276 every commit. Tests 715 → 732 (+17).

## 2. Cafe blocks shipped vs deferred

| Block | Ship / defer | Reason |
|---|---|---|
| `menu_item` | **Ship** | Items-array shape. Superset of `ProductCardPreviewData.items`. Preferred slugs `['menu_items', 'menu', 'dishes']`. MiniMenuItemCard extended to accept data prop; visual-only fields (cal, spice, tags, img) fall back to defaults. |
| `drink_menu` | **Ship** | Items-array shape. Preferred slugs `['drinks', 'beverages', 'drink_menu', 'menu_items']` — `menu_items` at the tail so cafe partners with a single unified menu module still render drinks via that path. ABV conditionally hidden when absent. |
| `category_browser` | **Defer** (halt condition) | Needs category-name + item-count aggregation. Today's `partners/{pid}/businessModules/{mod}/items` schema doesn't expose it. Inventing a roll-up mid-session is out of scope. `buildBlockData` returns undefined; preview renders design sample. |
| `dietary_filter` | **Defer** (halt condition) | Needs partner-defined dietary-tag taxonomy. No schema today. Same deferral reasoning. |

Test coverage for deferred blocks asserts `undefined` return — regression
signal for a future session that extends schema.

## 3. Audit-framework update — live verification is now a required gate

Prior retros (`partner-relay-followup-retro.md` §Part 2) flagged that
code-only audits can miss emission-layer failures. Specifically: PR #196
shipped a Layer C fix with 8 passing unit tests but did not resolve the
operator-visible symptom because Layer C was never reached — the parser
upstream was silently dropping structured output. Unit tests alone can't
catch that shape of break.

**New rule for emission-layer work** (orchestrator, parser, block-data
builder, widget render path): a live-verification screenshot is a
required done-criteria item before PR opens. Evidence must show:

1. A populated block rendered in Test Chat
2. Real items from the partner's `businessModules` (not design sample
   placeholders, not empty, not prose-only)
3. For the specific partner / vertical the symptom was reported on

If verification fails, do NOT open PR. Surface runtime logs
(`/api/relay/chat` grep for `"non-text parts"` and
`"Failed to get partner block"`), document what rendered, and
escalate to the next suspect layer (typically the partner-prefs
filter, which code-audit alone cannot resolve).

This gate is **intentionally additional process** — prior sessions
passed tests but failed symptoms. One extra screenshot step is cheap
insurance against the "green tests, broken product" failure mode.

## 4. Live verification status — **AWAITING OPERATOR**

**PR NOT opened.** Branch pushed; Vercel will build a preview
automatically. Operator steps:

1. Wait for Vercel preview on this branch to go Ready
2. Open preview → log in as Brew & BonBon Cafe admin
3. Navigate to `/partner/relay` Test Chat
4. Send cafe-appropriate prompt (e.g. "show menu")
5. **Required screenshot evidence:** `menu_item` or `drink_menu` block
   rendered with real partner items
6. Attach screenshot to this retro under §5 before opening PR

If verification fails: logs, H3 escalation, no PR.

## 5. Live verification evidence

_To be filled by operator before PR opens._

- [ ] Vercel preview URL: ___
- [ ] Screenshot path: ___
- [ ] Partner used: Brew & BonBon Cafe
- [ ] Prompt sent: ___
- [ ] Block rendered: ___ (expected: `menu_item` or `drink_menu`)
- [ ] Items visible in block match `partners/{pid}/businessModules/*/items`: Y/N
- [ ] Non-empty, non-design-sample: Y/N

If any **N**: capture logs and hand back.

## 6. H3 operator action items (if verification fails)

Per the Phase 2 probe report, H3 was inconclusive from code audit alone:
partner-prefs filter at `loadBlocksSignal` (blocks.ts) is permissive
when `hasPrefs === false` and deny-by-default when any entry exists.

**If Commit 1 + Commit 2 land but block still doesn't emit:**

1. **Inspect Firestore paths manually:**
   - `partners/{brewAndBonbon_pid}/relayConfig/blocks/entries/*`
   - `partners/{brewAndBonbon_pid}/relayConfig/*` (flat fallback for
     partners that pre-date the nested-entries layout)
2. **Check for docs covering** `menu_item`, `drink_menu` with
   `isVisible: true`.
3. **If docs exist but don't include these blockIds:** partner prefs
   are filtering the cafe blocks OUT of the catalog before Gemini sees
   them. Fix = add the blockId entries to the partner's `relayConfig`
   OR flip the filter policy (unlisted = allow when `hasPrefs` is true)
   — the latter is a semantics change that requires an ADR.
4. **If docs don't exist at all (`hasPrefs === false`):** filter is
   permissive; H3 is cleared; the break is somewhere else still.
   Re-open audit against runtime logs.

## 7. Test delta

| Layer | Tests added | Files |
|---|---|---|
| Parser (Commit 1) | +11 | `src/lib/relay/orchestrator/__tests__/extract-all-text.test.ts` (new) |
| buildBlockData (Commit 2) | +6 | `src/lib/relay/__tests__/admin-block-data-products.test.ts` (extended) |
| **Total** | **+17** | 715 → 732 |

Task prompt required ≥8; shipped 17.

## 8. Discipline check

- ✅ Phase 2 probe report cited in both commit bodies (audit-before-fix
     discipline carried from PR #196's pattern)
- ✅ Branched off fresh main (not stacked)
- ✅ No changes to Layer C / `pickModuleByPurpose` (owned by PR #196)
- ✅ No generic response-part abstraction extracted (1 consumer;
     other `response.text` callsites in the repo are distinct SDK
     surfaces with different contracts — not the same abstraction
     opportunity)
- ✅ No flow-template edits (`food-delivery.ts` `blockTypes` unchanged;
     `product_card` remains correctly excluded from cafe vertical)
- ✅ No schema invention for deferred blocks — halt condition fired
     cleanly, returns undefined, preview falls back to design sample
- ✅ tsc held at 276 every commit
- ✅ Speculative-From footers reference ADR + prior retro sections +
     PR #196 + Phase 2 probe report
- ✅ No "while I'm here" expansion — backlog items explicitly remain
     backlog

## 9. ADR §Follow-ups debt — SIXTH RETRO FLAG

**⚠️ `docs/engine-architecture.md §8 invariant #4` update is now
flagged by SIX retros:**

1. `partner-relay-phase-1-retro.md` §6
2. `partner-relay-phase-2-retro.md` §11
3. `partner-relay-phase-3-retro.md` §9
4. `partner-relay-phase-4-retro.md` §9
5. `partner-relay-followup-retro.md` §6
6. **This retro (§9)** — sixth flag

**Phase 3 cutover Session 3 M07 is overdue.** Strong recommendation
from this session's retro: prioritize M07 before any next
functional-engine session. The debt is visible across every
partner-relay retro now; shipping one more functional phase without
clearing it is the process failure mode.

## 10. Deferred items — `PHASE_4_BACKLOG.md`

Adding / re-flagging from this session:

1. **`category_browser` data builder** — requires category-aggregation
   schema extension or a roll-up helper. Revisit when a cafe partner
   ships with >1 category and UX surfaces the need.
2. **`dietary_filter` data builder** — requires partner-defined dietary
   taxonomy schema. Revisit when allergen/dietary filtering becomes a
   partner-requested feature.
3. **Other cafe blocks not yet audited** — `daily_specials`,
   `combo_meal`, `nutrition`, `menu_detail` — food-delivery.ts stages
   beyond `fd_discovery` may surface similar issues. Audit when the
   next stage is exercised in Test Chat.
4. **Audit other vertical flow templates** against `buildBlockData`'s
   switch — the cafe mismatch may not be unique. Hospitality `room_card`,
   healthcare appointment blocks, etc. should be checked. Follow-up
   session after M07 lands.
5. **H3 partner-prefs inspection** (operator action; see §6).
6. **ADR §Follow-ups engine-architecture.md §8** — flagged six times;
   owned by Session 3 M07.

## 11. Session close — PR pending operator verification

2 commits shipped, 17 tests added, tsc clean. Branch pushed.

**Before PR opens:** operator fills §5 with live verification
evidence. If evidence matches expectation, draft PR opens with this
retro's path in the description. If not, logs + H3 inspection are
the next step.

Until §5 is filled, this session is **complete-but-gated**.
