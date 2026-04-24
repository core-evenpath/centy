'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Wand2 } from 'lucide-react';
import {
  generateRelaySchemasFromRegistryAction,
  type RelaySchemaGenerationResult,
} from '@/actions/relay-schema-generate';

// ── /admin/relay/data: generate Relay schemas from block registry ───
//
// One-click, idempotent rebuild of the `relaySchemas` collection from
// the block registry's reads[] annotations. Replaces the PR E2-E4
// migration button flow, which assumed `systemModules/moduleItems`
// was the source of truth — the block registry has been the real
// source of truth since PR C.
//
// Re-run any time a block registry change adds / removes fields from
// a schema's consumers; the next generation picks up the new union.

export default function GenerateSchemasButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<RelaySchemaGenerationResult | null>(
    null,
  );

  const run = async () => {
    setIsRunning(true);
    try {
      const res = await generateRelaySchemasFromRegistryAction();
      setLastResult(res);
      if (res.success) {
        toast.success(
          `Generated ${res.generated.length} schema${res.generated.length === 1 ? '' : 's'} from block registry` +
            (res.skipped.length > 0 ? ` (${res.skipped.length} skipped)` : ''),
        );
      } else {
        toast.error(res.error ?? 'Generation failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Generation failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-xl">
          <strong className="text-foreground">Generate Relay schemas.</strong>{' '}
          Rebuilds the <code>relaySchemas</code> collection directly from the block registry's{' '}
          <code>reads[]</code> annotations. Every run overwrites existing docs — single source
          of truth, no drift. Run after adding or removing block fields in the registry.
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
            <Wand2 className="h-3.5 w-3.5" />
          )}
          {isRunning ? 'Generating…' : 'Generate from block registry'}
        </button>
      </div>

      {lastResult && (
        <div className="text-[11px] text-muted-foreground">
          {lastResult.generated.length > 0 && (
            <div>
              <span className="font-semibold text-foreground">Generated:</span>{' '}
              {lastResult.generated.map((g, i) => (
                <span key={g.slug}>
                  {i > 0 && ', '}
                  <code>{g.slug}</code> ({g.fieldCount} field
                  {g.fieldCount === 1 ? '' : 's'} · {g.blockCount} block
                  {g.blockCount === 1 ? '' : 's'})
                </span>
              ))}
            </div>
          )}
          {lastResult.skipped.length > 0 && (
            <div>
              <span className="font-semibold text-amber-800">Skipped:</span>{' '}
              {lastResult.skipped.map((s, i) => (
                <span key={s.slug}>
                  {i > 0 && '; '}
                  <code>{s.slug}</code> — {s.reason}
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
