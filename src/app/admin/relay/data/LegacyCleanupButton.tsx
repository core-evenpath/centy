'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  deleteLegacyRelaySystemModulesAction,
  type RelaySchemaCleanupResult,
} from '@/actions/relay-schema-migration';

// ── /admin/relay/data: delete legacy systemModules Relay doc ────────
//
// Phase 3 of the Relay-schema-separation rollout. Deletes the legacy
// Relay-bound doc from `systemModules` once it's safe — i.e. the
// schema has been copied to relaySchemas AND every partner has been
// backfilled off the old slug. The server-side action enforces both
// preconditions.
//
// Destructive, so requires a confirmation dialog.

export default function LegacyCleanupButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lastResult, setLastResult] = useState<RelaySchemaCleanupResult | null>(
    null,
  );

  const run = async () => {
    setIsRunning(true);
    try {
      const res = await deleteLegacyRelaySystemModulesAction();
      setLastResult(res);
      if (res.success) {
        toast.success(
          res.deleted.length > 0
            ? `Deleted ${res.deleted.length} legacy systemModules doc${res.deleted.length === 1 ? '' : 's'}`
            : 'Nothing to delete — already cleaned up',
        );
        setIsConfirmOpen(false);
      } else {
        // Precondition failure surfaces the reason in res.error.
        toast.error(res.error ?? 'Cleanup blocked');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Cleanup failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-xl">
          <strong className="text-destructive">
            Delete legacy systemModules (PR E4, destructive).
          </strong>{' '}
          Removes the pre-migration Relay doc from <code>systemModules</code>.
          Blocked unless the schema migration AND partner backfill have both
          completed, so you can't leave partner reads stranded.
        </div>
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Delete legacy doc
        </button>
      </div>

      {lastResult && lastResult.deleted.length > 0 && (
        <div className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Deleted:</span>{' '}
          {lastResult.deleted.map((d, i) => (
            <span key={d.docId}>
              {i > 0 && ', '}
              <code>systemModules/{d.docId}</code> (slug{' '}
              <code>{d.sourceSlug}</code>)
            </span>
          ))}
        </div>
      )}
      {lastResult && !lastResult.success && lastResult.error && (
        <div className="text-[11px] text-red-700">
          <span className="font-semibold">Blocked:</span> {lastResult.error}
        </div>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete legacy systemModules Relay doc?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  This deletes the pre-migration Relay schema doc from{' '}
                  <code>systemModules</code>. After this, the only Relay
                  schema storage is <code>relaySchemas</code>.
                </p>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                  <div>
                    <strong>Safety checks enforced server-side:</strong>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>
                      <code>relaySchemas/items</code> must exist (run the
                      schema migration first)
                    </li>
                    <li>
                      No partner <code>businessModules.moduleSlug</code> may
                      still equal <code>moduleItems</code> (run the partner
                      backfill first)
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  If either check fails the delete is refused with an
                  explanation.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isRunning}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={run} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Yes, delete it'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
