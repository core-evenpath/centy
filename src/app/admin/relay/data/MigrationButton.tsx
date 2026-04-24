'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Database } from 'lucide-react';
import {
  migrateSystemModulesToRelaySchemasAction,
  type RelaySchemaMigrationResult,
} from '@/actions/relay-schema-migration';

// ── /admin/relay/data: schema migration button ──────────────────────
//
// One-click re-runnable copy from `systemModules` (shared) into
// `relaySchemas` (dedicated Relay storage). Shows the last result
// inline so admins can verify what moved. Idempotent — safe to click
// as many times as needed during the PR E2 → PR E4 cutover window.

export default function MigrationButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RelaySchemaMigrationResult | null>(
    null,
  );

  const run = async () => {
    setIsRunning(true);
    try {
      const res = await migrateSystemModulesToRelaySchemasAction();
      setLastResult(res);
      if (res.success) {
        toast.success(
          `Migrated ${res.migrated.length} schema${res.migrated.length === 1 ? '' : 's'}` +
            (res.skipped.length > 0 ? ` (${res.skipped.length} skipped)` : ''),
        );
      } else {
        toast.error(res.error ?? 'Migration failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-xl">
          <strong className="text-foreground">Schema migration (PR E2).</strong>{' '}
          Copies Relay-bound schemas from <code>systemModules</code> into the dedicated{' '}
          <code>relaySchemas</code> collection. Idempotent — re-run any time during the
          cutover. Reads still come from <code>systemModules</code> until PR E3 lands.
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
            <Database className="h-3.5 w-3.5" />
          )}
          {isRunning ? 'Migrating…' : 'Migrate schemas'}
        </button>
      </div>

      {lastResult && (
        <div className="text-[11px] text-muted-foreground">
          {lastResult.migrated.length > 0 && (
            <div>
              <span className="font-semibold text-foreground">Migrated:</span>{' '}
              {lastResult.migrated.map((m, i) => (
                <span key={m.targetSlug}>
                  {i > 0 && ', '}
                  <code>{m.sourceSlug}</code> → <code>{m.targetSlug}</code>
                  {' '}({m.schemaFieldCount} fields)
                </span>
              ))}
            </div>
          )}
          {lastResult.skipped.length > 0 && (
            <div>
              <span className="font-semibold text-amber-800">Skipped:</span>{' '}
              {lastResult.skipped.map((s, i) => (
                <span key={s.sourceSlug}>
                  {i > 0 && '; '}
                  <code>{s.sourceSlug}</code> — {s.reason}
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
