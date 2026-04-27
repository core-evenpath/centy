'use client';

// ── Clear sample data CTA (Phase 5) ─────────────────────────────────
//
// Replaces the previous "Generate sample data" affordance on
// /partner/relay/data. Sample data is now hard-coded — auto-seeded
// on first visit by `autoSeedSamplesIfNeededAction`, gated by a
// partner-doc flag so re-runs are no-ops.
//
// This component renders the partner's only sample-data control:
// a destructive "Clear sample data" button. Clears tagged
// (`_seedSource`) items only — partner edits survive.

import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  clearAllVerticalSamplesAction,
  type ClearAllVerticalSamplesResult,
} from '@/actions/partner-relay-data';

interface Props {
  partnerId: string;
  /** Notify the page after a successful clear so item counts refresh. */
  onCleared?: (result: ClearAllVerticalSamplesResult) => void;
}

export function ClearSampleCTA({ partnerId, onCleared }: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClear = async () => {
    setBusy(true);
    try {
      const res = await clearAllVerticalSamplesAction(partnerId);
      if (!res.success) {
        toast.error(res.error || 'Could not clear sample data');
        return;
      }
      const total = res.totalDeleted ?? 0;
      if (total > 0) {
        toast.success(
          `Cleared ${total} sample item${total === 1 ? '' : 's'}. Your edits stayed.`,
        );
      } else {
        toast.message('Nothing to clear — no auto-seeded samples found.');
      }
      onCleared?.(res);
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Could not clear sample data');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        className="text-xs h-8 gap-1.5"
        title="Remove all auto-seeded sample items. Anything you've edited stays."
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear sample data
      </Button>

      <Dialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Clear sample data?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-1" asChild>
              <div className="text-sm space-y-2">
                <p>
                  This removes every item we auto-seeded across your content
                  types so you can start with a clean slate.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Removes</strong>:
                    auto-seeded sample items (e.g. Margherita Pizza, Aperol
                    Spritz, Window Table for 2).
                  </li>
                  <li>
                    <strong className="text-foreground">Keeps</strong>: items
                    you’ve added or edited yourself.
                  </li>
                  <li>
                    Sample data won’t come back automatically. You can add new
                    items via <em>Add item</em> on each tile.
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear sample data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
