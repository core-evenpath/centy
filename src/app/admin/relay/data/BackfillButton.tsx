'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import {
  backfillPartnerModuleSlugsAction,
  type RelaySchemaBackfillResult,
} from '@/actions/relay-schema-migration';

// ── /admin/relay/data: partner businessModules slug backfill ────────
//
// Phase 2 of the Relay-schema-separation rollout. Renames every
// partner's `businessModules.moduleSlug` from the pre-migration slug
// (e.g. 'moduleItems') to the canonical Relay slug (e.g. 'items').
// Idempotent — re-run any time during or after cutover.
//
// Read-time normalisation in getSystemModuleAction already covers
// legacy slugs, so this button is cosmetic / cleanup. But it closes
// out the migration by giving every consumer a single canonical slug.

export default function BackfillButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RelaySchemaBackfillResult | null>(
    null,
  );

  const run = async () => {
    setIsRunning(true);
    try {
      const res = await backfillPartnerModuleSlugsAction();
      setLastResult(res);
      if (res.success) {
        const total = res.renamed.reduce((sum, r) => sum + r.docCount, 0);
        toast.success(
          total > 0
            ? `Renamed ${total} partner businessModule${total === 1 ? '' : 's'}`
            : 'No legacy slugs found — partner data already clean',
        );
      } else {
        toast.error(res.error ?? 'Backfill failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Backfill failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-xl">
          <strong className="text-foreground">Partner slug backfill (PR E4).</strong>{' '}
          Rewrites every partner's{' '}
          <code>businessModules.moduleSlug</code> from the pre-migration name
          (<code>moduleItems</code>) to the canonical{' '}
          <code>items</code>. Idempotent. Reads already normalise via{' '}
          <code>RELAY_SCHEMA_SLUG_MAP</code>; this closes out the migration.
        </div>
        <button
          type="button"
          onClick={run}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Users className="h-3.5 w-3.5" />
          )}
          {isRunning ? 'Backfilling…' : 'Backfill partner slugs'}
        </button>
      </div>

      {lastResult && (
        <div className="text-[11px] text-muted-foreground">
          {lastResult.renamed.length > 0 && (
            <div>
              <span className="font-semibold text-foreground">Renamed:</span>{' '}
              {lastResult.renamed.map((r, i) => (
                <span key={r.sourceSlug}>
                  {i > 0 && ', '}
                  <code>{r.sourceSlug}</code> → <code>{r.targetSlug}</code>{' '}
                  ({r.docCount} partner doc{r.docCount === 1 ? '' : 's'})
                </span>
              ))}
            </div>
          )}
          {!lastResult.success && lastResult.error && (
            <div className="text-red-700">
              <span className="font-semibold">Error:</span> {lastResult.error}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
