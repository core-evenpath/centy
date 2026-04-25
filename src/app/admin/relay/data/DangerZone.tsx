'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  clearAllRelaySchemasAction,
  type ClearSchemasResult,
} from '@/actions/relay-schema-clear';

// ── Danger zone: clear all Relay schemas (PR-fix-4) ────────────────
//
// Destructive bulk reset wrapped in deliberate friction so admin
// can't fire it by accident:
//
//   - Visually de-emphasised at the bottom of the page (separate
//     "Danger zone" card, red border, AlertTriangle icon).
//   - Confirmation dialog enumerates exactly what will happen and
//     what breaks until regeneration runs.
//   - Type-to-confirm input — primary button stays disabled until
//     the admin types the exact phrase. Standard pattern for
//     destructive bulk ops on production data.
//   - Live count of schemas-about-to-be-deleted is supplied via
//     props (parent already loaded analytics; no extra DB call).
//   - Post-action panel surfaces the deleted slugs + a one-click
//     "Run Generate + Enrich" pointer to the recovery workflow.

const CONFIRM_PHRASE = 'DELETE ALL SCHEMAS';

interface Props {
  /**
   * Live count from the analytics action so the admin sees the actual
   * blast radius before confirming. Parent passes
   * `data.modules.length` (number of modules == number of schemas).
   */
  schemaCount: number;
}

export default function DangerZone({ schemaCount }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ClearSchemasResult | null>(null);

  const phraseMatches = confirmText.trim() === CONFIRM_PHRASE;

  const reset = () => {
    setConfirmText('');
    setIsRunning(false);
  };

  const close = () => {
    if (isRunning) return;
    reset();
    setIsOpen(false);
  };

  const run = async () => {
    if (!phraseMatches) return;
    setIsRunning(true);
    try {
      const res = await clearAllRelaySchemasAction();
      setLastResult(res);
      if (res.success) {
        toast.success(
          res.deleted > 0
            ? `Cleared ${res.deleted} Relay schema${res.deleted === 1 ? '' : 's'}. Re-run Generate + Enrich to rebuild.`
            : 'Already empty — nothing to clear',
        );
        // Refresh analytics so the page reflects the new (empty) state.
        router.refresh();
        reset();
        setIsOpen(false);
      } else {
        toast.error(res.error ?? 'Clear failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Clear failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex gap-2 max-w-xl">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-semibold text-destructive">
              Danger zone — Clear all Relay schemas
            </div>
            <div className="text-xs text-muted-foreground">
              Wipes every doc in <code>relaySchemas</code>{' '}
              ({schemaCount} schema{schemaCount === 1 ? '' : 's'} today).
              Useful when starting fresh after a registry refactor or
              recovering from drift. Partner test-chat falls back to
              design samples until you re-run "Generate + Enrich" per
              vertical.
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          disabled={schemaCount === 0}
          title={
            schemaCount === 0
              ? 'No schemas to clear'
              : 'Open the destructive-action confirmation dialog'
          }
          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Clear all schemas
        </Button>
      </div>

      {lastResult?.success && lastResult.deleted > 0 && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">
              Cleared {lastResult.deleted} schema
              {lastResult.deleted === 1 ? '' : 's'}.
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Next step: pick a vertical above and click "Generate +
              Enrich" to rebuild from the block registry.
            </div>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(v) => (v ? setIsOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Clear all Relay schemas?
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  This deletes every doc in <code>relaySchemas</code> —{' '}
                  <strong>{schemaCount}</strong> schema
                  {schemaCount === 1 ? '' : 's'} including all fields,
                  categories, AI enrichment history, and provenance
                  metadata.
                </p>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                  <div className="font-semibold text-foreground">
                    What breaks until you regenerate
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>
                      Partner Test Chat falls back to design samples for
                      every block.
                    </li>
                    <li>Drift detection on /admin/relay/data is empty.</li>
                    <li>
                      Schema viewers (<code>/admin/relay/data/[slug]</code>)
                      404 until rebuilt.
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recovery: re-run "Generate + Enrich" per vertical
                  above. Each click rebuilds that vertical's schemas
                  deterministically + with fresh Gemini suggestions.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <label
              htmlFor="clear-confirm"
              className="text-xs font-medium text-foreground"
            >
              Type{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-destructive">
                {CONFIRM_PHRASE}
              </code>{' '}
              to confirm
            </label>
            <Input
              id="clear-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              autoFocus
              disabled={isRunning}
              className={
                phraseMatches ? 'border-destructive focus-visible:ring-destructive' : ''
              }
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={close} disabled={isRunning}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={run}
              disabled={!phraseMatches || isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Yes, clear {schemaCount} schema{schemaCount === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
