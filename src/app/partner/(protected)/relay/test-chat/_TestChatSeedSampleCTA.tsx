'use client';

// ── Seed Sample Data CTA (PR fix-20) ────────────────────────────────
//
// Replaces the prior sample/live toggle. Clicking persists sample
// items into every schema in the partner's vertical so test-chat
// renders against real data and /partner/relay/data shows item
// counts. Idempotent — schemas with existing items are left alone.
//
// Three states:
//   • Idle    — "Generate sample data" button
//   • Loading — disabled with spinner
//   • Done    — green badge with summary; can re-trigger to fill any
//               schemas that were skipped first time.

import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  seedAllVerticalSchemasAction,
  type SeedAllVerticalSchemasResult,
} from '@/actions/partner-relay-data';

interface Props {
  partnerId: string;
  userId: string;
  /** Called after a successful seed so callers can refresh dependent
   *  data (block previews, schema list, etc). */
  onSeeded?: (result: SeedAllVerticalSchemasResult) => void;
}

export function TestChatSeedSampleCTA({ partnerId, userId, onSeeded }: Props) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<SeedAllVerticalSchemasResult | null>(null);

  const handleSeed = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await seedAllVerticalSchemasAction(partnerId, userId);
      setLast(res);
      if (!res.success) {
        toast.error(res.error || 'Could not seed sample data');
        return;
      }
      const created = res.totalItemsCreated ?? 0;
      const seeded = res.schemasSeeded ?? 0;
      const had = res.schemasAlreadyHadItems ?? 0;
      if (created > 0) {
        toast.success(
          `Seeded ${created} item${created === 1 ? '' : 's'} across ${seeded} schema${seeded === 1 ? '' : 's'}.${had > 0 ? ` ${had} already had data.` : ''}`,
        );
      } else if (had > 0) {
        toast.message(`All ${had} vertical schemas already have data.`);
      } else {
        toast.message('Nothing to seed — no schemas in your vertical.');
      }
      onSeeded?.(res);
    } catch (err: any) {
      toast.error(err?.message || 'Could not seed sample data');
    } finally {
      setBusy(false);
    }
  };

  // Done state with a summary chip + a "Re-seed" affordance.
  if (last && last.success && (last.totalSchemas ?? 0) > 0) {
    const total = last.totalSchemas ?? 0;
    const created = last.schemasSeeded ?? 0;
    const had = last.schemasAlreadyHadItems ?? 0;
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {created} of {total} schemas seeded
          {had > 0 && (
            <span className="opacity-70">· {had} kept</span>
          )}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={handleSeed}
          className="text-xs h-8"
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Re-seeding…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Re-seed
            </>
          )}
        </Button>
      </div>
    );
  }

  // Failure state — show error inline, allow retry.
  if (last && !last.success) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900">
          <AlertCircle className="h-3.5 w-3.5" />
          {last.error}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={handleSeed}
          className="text-xs h-8"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Retry'
          )}
        </Button>
      </div>
    );
  }

  // Idle: the primary CTA.
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={handleSeed}
      title="Populate every schema in your vertical with 3 sample items each. Idempotent — your existing data is left alone."
    >
      {busy ? (
        <>
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          Seeding…
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Generate sample data
        </>
      )}
    </Button>
  );
}
