'use client';

// ── Sample-data CTA (Phase 5 + 5b) ──────────────────────────────────
//
// Two states based on the partner's auto-seed flag:
//
//   samplesState === 'active'   → "Clear sample data" (destructive)
//   samplesState === 'cleared'  → "Restore sample data" (additive)
//   samplesState === 'never'    → no CTA (auto-seed will run on
//                                 the next mount and flip state to
//                                 'active')
//
// Marker-based clear preserves partner edits — only items tagged
// `_seedSource` are removed; items the partner authored or edited
// stay untouched.

import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
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
  restoreSamplesAction,
  type ClearAllVerticalSamplesResult,
  type RestoreSamplesResult,
} from '@/actions/partner-relay-data';

interface Props {
  partnerId: string;
  userId: string;
  /** Current state of the auto-seed flag — drives Clear vs Restore. */
  samplesState?: 'never' | 'active' | 'cleared';
  /** Notify the page after a successful clear so item counts refresh. */
  onCleared?: (result: ClearAllVerticalSamplesResult) => void;
  /** Notify the page after a successful restore. */
  onRestored?: (result: RestoreSamplesResult) => void;
}

export function ClearSampleCTA({
  partnerId,
  userId,
  samplesState,
  onCleared,
  onRestored,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 'never' state: no button — auto-seed handles initial population.
  if (samplesState === 'never') return null;

  const isCleared = samplesState === 'cleared';

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

  const handleRestore = async () => {
    setBusy(true);
    try {
      const res = await restoreSamplesAction(partnerId, userId);
      if (!res.success) {
        toast.error(res.error || 'Could not restore sample data');
        return;
      }
      const created = res.totalItemsCreated ?? 0;
      const kept = res.schemasAlreadyHadItems ?? 0;
      if (created > 0) {
        toast.success(
          `Restored ${created} sample item${created === 1 ? '' : 's'}.${
            kept > 0 ? ` ${kept} schema${kept === 1 ? '' : 's'} already had data.` : ''
          }`,
        );
      } else if (kept > 0) {
        toast.message(`All ${kept} schemas already have data.`);
      } else {
        toast.message('Nothing to restore.');
      }
      onRestored?.(res);
    } catch (err: any) {
      toast.error(err?.message || 'Could not restore sample data');
    } finally {
      setBusy(false);
    }
  };

  // ── Restore (when cleared) ───────────────────────────────────────
  if (isCleared) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={busy}
        className="text-xs h-8 gap-1.5"
        title="Bring back the auto-seeded sample items. Your edits stay."
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {busy ? 'Restoring…' : 'Restore sample data'}
      </Button>
    );
  }

  // ── Clear (when active) ──────────────────────────────────────────
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
                    auto-seeded sample items (Margherita Pizza, Aperol Spritz,
                    Window table, etc.).
                  </li>
                  <li>
                    <strong className="text-foreground">Keeps</strong>: items
                    you’ve added or edited yourself.
                  </li>
                  <li>
                    You can bring samples back any time with{' '}
                    <em>Restore sample data</em>.
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
            <Button variant="destructive" onClick={handleClear} disabled={busy}>
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
