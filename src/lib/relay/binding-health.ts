/**
 * Binding Health
 *
 * Pure functions that categorize a field's current binding state, used
 * by the Data Map rows and the per-block field-health strip.
 *
 *   ok       — bound and resolves to a non-empty value
 *   empty    — bound but the resolved value is empty/null
 *   missing  — required but no binding exists (or binding is 'unset')
 *   skipped  — optional and explicitly not connected
 */

import type { DataBinding } from './data-bindings';

export type Health = 'ok' | 'empty' | 'missing' | 'skipped';

export function computeHealth(
  binding: DataBinding | undefined,
  resolvedValue: unknown,
  required: boolean,
): Health {
  const bound = binding && binding.kind !== 'unset';
  if (!bound) return required ? 'missing' : 'skipped';

  if (isEmpty(resolvedValue)) return 'empty';
  return 'ok';
}

export function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

// Convenience: roll up a list of field healths into a block-level
// summary for the banner + card headers.
export function summarizeHealth(healths: Health[]): {
  ok: number;
  empty: number;
  missing: number;
  skipped: number;
  overall: Health;
} {
  const counts = { ok: 0, empty: 0, missing: 0, skipped: 0 };
  for (const h of healths) counts[h]++;
  let overall: Health = 'ok';
  if (counts.missing > 0) overall = 'missing';
  else if (counts.empty > 0) overall = 'empty';
  else if (counts.ok === 0) overall = 'skipped';
  return { ...counts, overall };
}

// Tailwind utility classes, centralized so dot/chip/strip stay aligned.
export const HEALTH_STYLES: Record<Health, { dot: string; label: string; text: string }> = {
  ok:      { dot: 'bg-emerald-500', label: 'Connected',     text: 'text-emerald-700' },
  empty:   { dot: 'bg-amber-500',   label: 'Bound, empty',  text: 'text-amber-700' },
  missing: { dot: 'bg-rose-500',    label: 'Needs a source', text: 'text-rose-700' },
  skipped: { dot: 'bg-slate-300',   label: 'Not connected', text: 'text-slate-500' },
};
