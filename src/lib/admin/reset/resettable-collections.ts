// Admin reset — resettable-collection allow-list.
//
// Hardcoded list of collections the /admin/system/reset page can
// operate on. Adding a collection is a code change reviewable by
// diff — not configuration, not discovery. Unknown collection ids
// are refused at the action layer.
//
// Grounded in docs/engine-cutover-phase3/q10-service-audit.md:
// - Health snapshots (relayEngineHealth) are the primary reset target
//   for Phase 3 validation (P3.M06 runs fresh-Health verification).
// - Partner block prefs (relayBlockConfigs subcollection) need reset
//   between Phase 3 orchestrator changes to avoid stale binding state.
// - Preview/sandbox sessions accumulate during Preview Copilot runs;
//   reset keeps preview-only state from polluting validation.
// - Module items reset supports M15-style re-seed without manual work.
// - System-reset audit collection logs all of the above; NOT itself
//   resettable (that would orphan its own history).
//
// Collections Q10 audit did NOT flag stay off the list. Adding later
// is one commit; adding speculatively now creates test surface we'd
// have to maintain for uncertain benefit.

import type { Engine } from '@/lib/relay/engine-types';

export type ResetVerb =
  | 'recompute'   // delete the snapshot; next read recomputes
  | 'clear'      // batch delete matching docs; no auto-regenerate
  | 'invalidate' // delete cache docs; next read repopulates from source
  | 'delete';    // batch delete matching docs (same mechanic as clear,
                 // distinct verb so audit log differentiates wipe purpose)

export type ResetScope =
  | 'per-partner'  // filter.partnerId required
  | 'per-engine'   // filter.engine required
  | 'per-module'   // filter.moduleSlug required
  | 'per-session'  // filter.dateRangeFrom/To supported for time-windowed session reset
  | 'global';      // unscoped reset allowed (requires env flag)

export interface ResettableCollection {
  /** Stable identifier used in URLs + API. */
  id: string;
  /** Firestore collection path. May contain `{partnerId}` placeholders for subcollections. */
  collection: string;
  /** Human-readable name for the UI. */
  label: string;
  /** One-sentence description of what "reset" means for this collection. */
  description: string;
  /** Semantic action — drives UI button text + audit differentiation. */
  verb: ResetVerb;
  /** Which filters are mandatory. If unscoped=true is used, these are waived (env-gated). */
  requiredScopes: ResetScope[];
  /** Which filters are supported but optional. */
  optionalScopes: ResetScope[];
  /**
   * Post-reset hint for the UI. `trigger-recompute` means: the collection's
   * consumer will auto-regenerate the data on next read (e.g., Health
   * snapshots). The reset action itself does not invoke this; it's a
   * UI/runbook hint.
   */
  postResetAction?: 'trigger-recompute';
}

export const RESETTABLE_COLLECTIONS: ResettableCollection[] = [
  {
    id: 'relay-engine-health',
    collection: 'relayEngineHealth',
    label: 'Relay Engine Health snapshots',
    description: 'Delete Health snapshots for a partner/engine; next read triggers recompute via relay-health-actions.',
    verb: 'recompute',
    requiredScopes: ['per-partner'],
    optionalScopes: ['per-engine'],
    postResetAction: 'trigger-recompute',
  },
  {
    id: 'relay-block-configs',
    collection: 'partners/{partnerId}/relayConfig',
    label: 'Partner block configurations',
    description: 'Clear per-partner block prefs (isVisible + fieldBindings). Partner must re-configure via /admin/relay/blocks. Excludes flowDefinition doc.',
    verb: 'clear',
    requiredScopes: ['per-partner'],
    optionalScopes: [],
  },
  {
    id: 'relay-sessions',
    collection: 'relaySessions',
    label: 'Conversation sessions',
    description: 'Clear conversation history docs. Live sessions surface a warning in dry-run when the filter dateRange is within 24h.',
    verb: 'clear',
    requiredScopes: ['per-partner'],
    optionalScopes: ['per-session'],
  },
  {
    id: 'preview-sessions',
    collection: 'relaySessions',
    label: 'Preview Copilot sessions (sandbox)',
    description: 'Clear sandbox sessions with the preview_ conversationId prefix. Leaves production sessions untouched. Safe to run anytime.',
    verb: 'clear',
    requiredScopes: [],
    optionalScopes: ['per-partner'],
  },
  {
    id: 'partner-module-items',
    collection: 'partners/{partnerId}/businessModules/{moduleId}/items',
    label: 'Partner module items',
    description: 'Delete items within a specific partner + module combo. Operators re-seed via M15 applySeedTemplate after reset.',
    verb: 'delete',
    requiredScopes: ['per-partner', 'per-module'],
    optionalScopes: [],
  },
];

/**
 * Look up a collection by stable id. Returns undefined for anything
 * outside the allow-list; no fallback.
 */
export function getResettableCollection(id: string): ResettableCollection | undefined {
  return RESETTABLE_COLLECTIONS.find((c) => c.id === id);
}

/**
 * Ids of all collections on the allow-list. Handy for UI iteration
 * and test-coverage assertions.
 */
export function listResettableCollectionIds(): string[] {
  return RESETTABLE_COLLECTIONS.map((c) => c.id);
}

// ── Explicitly non-resettable ──────────────────────────────────────
//
// For the record, collections the Q10 audit + architectural review
// determined should NOT be resettable via this tool:
//
// - partners/{partnerId} root doc: resetting would orphan
//   subcollection data; use a different dedicated-deletion flow
// - partners/{partnerId}/businessPersona: onboarding state, not
//   operational state
// - systemResetAudit: the record of resets; resetting the audit is
//   destroying evidence
// - systemModules / moduleAssignments: system-level config, not
//   partner operational data
//
// Adding any of these later is a single-line code change AFTER a
// written justification — don't relax this list accidentally.

/**
 * Engine tag passthrough — re-exported for consumer types that need
 * to reference the Engine union without importing from engine-types
 * directly.
 */
export type { Engine };
