// Admin reset — filter model + validation.
//
// Filters are what make a reset "scoped." Every call to the reset
// actions carries a ResetFilter that the action validates against
// the collection's requiredScopes + optionalScopes (from MR01
// resettable-collections.ts).
//
// Unscoped resets (filter.unscoped === true) require the env flag
// RESET_ALLOW_UNSCOPED=true, enforced at the action layer (MR04).
// This module does NOT check the env flag — it only validates that
// EITHER required scopes are present OR unscoped is explicitly set.
// The env gate is a separate concern tested in the action layer.

import type { Engine } from '@/lib/relay/engine-types';
import type { ResettableCollection } from './resettable-collections';

export interface ResetFilter {
  partnerId?: string;
  engine?: Engine;
  moduleSlug?: string;
  /** ISO date (YYYY-MM-DD or full ISO datetime). */
  dateRangeFrom?: string;
  /** ISO date. */
  dateRangeTo?: string;
  /** Explicit opt-in for "reset all". Requires RESET_ALLOW_UNSCOPED=true at the action layer. */
  unscoped?: boolean;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

// ── Partner-id shape guard ──────────────────────────────────────
// Partner ids in the system are alphanumeric + hyphen + underscore,
// non-empty, reasonable length. Reject anything that could inject
// into a Firestore path.
const PARTNER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

// ── Module slug shape guard ─────────────────────────────────────
// Same alphabet; module slugs flow through seed-template ids and
// module assignments.
const MODULE_SLUG_RE = /^[a-z0-9_]{1,64}$/;

// ── ISO date guard (lenient — accepts date-only or datetime) ────
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Validate a filter against a collection's scope requirements.
 *
 * Returns `{ valid: true }` on success or `{ valid: false, errors: [...] }`
 * with every failure enumerated (not early-exit — operators get the
 * full list in one call).
 */
export function validateFilterForCollection(
  collection: ResettableCollection,
  filter: ResetFilter,
): ValidationResult {
  const errors: string[] = [];

  // Shape guards on provided fields — run always, regardless of
  // unscoped mode. Garbage input is always rejected.
  if (filter.partnerId !== undefined && !PARTNER_ID_RE.test(filter.partnerId)) {
    errors.push(`partnerId malformed: ${JSON.stringify(filter.partnerId)}`);
  }
  if (filter.moduleSlug !== undefined && !MODULE_SLUG_RE.test(filter.moduleSlug)) {
    errors.push(`moduleSlug malformed: ${JSON.stringify(filter.moduleSlug)}`);
  }
  if (filter.dateRangeFrom !== undefined && !ISO_DATE_RE.test(filter.dateRangeFrom)) {
    errors.push(`dateRangeFrom not ISO: ${JSON.stringify(filter.dateRangeFrom)}`);
  }
  if (filter.dateRangeTo !== undefined && !ISO_DATE_RE.test(filter.dateRangeTo)) {
    errors.push(`dateRangeTo not ISO: ${JSON.stringify(filter.dateRangeTo)}`);
  }

  // Date-range partial check: if either end is set, both should be set.
  const fromSet = filter.dateRangeFrom !== undefined;
  const toSet = filter.dateRangeTo !== undefined;
  if (fromSet !== toSet) {
    errors.push('dateRangeFrom and dateRangeTo must both be set or both omitted');
  }
  if (fromSet && toSet && filter.dateRangeFrom! > filter.dateRangeTo!) {
    errors.push('dateRangeFrom must be ≤ dateRangeTo');
  }

  // Unscoped short-circuit: if operator explicitly ticked unscoped,
  // skip the required-scopes check. Env gate enforced at action layer.
  if (filter.unscoped === true) {
    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  // Required-scope checks.
  for (const scope of collection.requiredScopes) {
    switch (scope) {
      case 'per-partner':
        if (!filter.partnerId) {
          errors.push(
            `collection ${collection.id} requires per-partner scope (set filter.partnerId or filter.unscoped=true)`,
          );
        }
        break;
      case 'per-engine':
        if (!filter.engine) {
          errors.push(
            `collection ${collection.id} requires per-engine scope (set filter.engine or filter.unscoped=true)`,
          );
        }
        break;
      case 'per-module':
        if (!filter.moduleSlug) {
          errors.push(
            `collection ${collection.id} requires per-module scope (set filter.moduleSlug or filter.unscoped=true)`,
          );
        }
        break;
      case 'per-session':
        // per-session is never "required" — it's always optional in
        // the allow-list. If it appears in requiredScopes that's a
        // configuration drift; surface it.
        errors.push(
          `collection ${collection.id} has per-session in requiredScopes — should be in optionalScopes`,
        );
        break;
      case 'global':
        // global as requiredScope is nonsensical; noop, optional only.
        break;
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Convenience: build the set of filter fields that are actually
 * populated. Used by UI to show "you filtered by X" summaries.
 */
export function describeFilter(filter: ResetFilter): string[] {
  const parts: string[] = [];
  if (filter.unscoped) parts.push('UNSCOPED');
  if (filter.partnerId) parts.push(`partner=${filter.partnerId}`);
  if (filter.engine) parts.push(`engine=${filter.engine}`);
  if (filter.moduleSlug) parts.push(`module=${filter.moduleSlug}`);
  if (filter.dateRangeFrom && filter.dateRangeTo) {
    parts.push(`dateRange=${filter.dateRangeFrom}..${filter.dateRangeTo}`);
  }
  return parts;
}
