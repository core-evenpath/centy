'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  generateAndEnrichVerticalAction,
  type VerticalEnrichResult,
} from '@/actions/relay-schema-bulk';
import { RELAY_VERTICALS, type RelayVertical } from '@/lib/relay/relay-verticals';

// ── Bulk generate-and-enrich (PR-fix-1 + PR-fix-8) ──────────────────
//
// One-click bootstrap. Two modes:
//
//   - Single vertical: pick one, click Run. Server action enriches
//     every schema in that vertical (deterministic seed + Gemini
//     auto-accept). ~30-90s per click.
//
//   - "All verticals" (PR-fix-8): runs each vertical sequentially
//     CLIENT-side, calling the per-vertical action 15 times in a
//     loop. Surfaces per-vertical progress as it goes so admin
//     sees forward motion. Total time: ~7-22 min worst case;
//     stays well under any single server-action timeout because
//     each call is independently scoped.
//
// Results from each completed vertical accumulate in the result
// panel below the dropdown so admin can verify what landed.

const ALL_VERTICALS_KEY = '__all__';
type VerticalChoice = RelayVertical | typeof ALL_VERTICALS_KEY;

const VERTICAL_LABELS: Record<RelayVertical, string> = {
  automotive: 'Automotive',
  business: 'Business / Professional Services',
  ecommerce: 'E-commerce',
  education: 'Education',
  events_entertainment: 'Events & Entertainment',
  financial_services: 'Financial Services',
  food_beverage: 'Food & Beverage',
  food_supply: 'Food Supply',
  healthcare: 'Healthcare',
  home_property: 'Home & Property',
  hospitality: 'Hospitality',
  personal_wellness: 'Personal Wellness',
  public_nonprofit: 'Public / Nonprofit',
  travel_transport: 'Travel & Transport',
  shared: 'Shared (cross-vertical)',
};

interface AllVerticalsProgress {
  total: number;
  completed: number;
  current: RelayVertical | null;
  results: VerticalEnrichResult[];
}

export default function VerticalEnrichButton() {
  const router = useRouter();
  const [choice, setChoice] = useState<VerticalChoice>(ALL_VERTICALS_KEY);
  const [isRunning, setIsRunning] = useState(false);
  const [singleResult, setSingleResult] = useState<VerticalEnrichResult | null>(null);
  const [allProgress, setAllProgress] = useState<AllVerticalsProgress | null>(null);

  const runSingle = async (v: RelayVertical) => {
    setIsRunning(true);
    setSingleResult(null);
    setAllProgress(null);
    try {
      const res = await generateAndEnrichVerticalAction(v);
      setSingleResult(res);
      if (res.success) {
        const totalAi = res.schemas.reduce((sum, s) => sum + s.aiFields, 0);
        toast.success(
          `${VERTICAL_LABELS[v]}: enriched ${res.schemas.length} schema${
            res.schemas.length === 1 ? '' : 's'
          } with ${totalAi} AI field${totalAi === 1 ? '' : 's'}`,
        );
      } else {
        toast.error(res.error ?? 'Bulk enrichment failed');
      }
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? 'Bulk enrichment failed');
    } finally {
      setIsRunning(false);
    }
  };

  const runAll = async () => {
    setIsRunning(true);
    setSingleResult(null);
    setAllProgress({
      total: RELAY_VERTICALS.length,
      completed: 0,
      current: RELAY_VERTICALS[0],
      results: [],
    });
    const results: VerticalEnrichResult[] = [];
    try {
      for (let i = 0; i < RELAY_VERTICALS.length; i++) {
        const v = RELAY_VERTICALS[i];
        setAllProgress({
          total: RELAY_VERTICALS.length,
          completed: i,
          current: v,
          results: [...results],
        });
        try {
          const res = await generateAndEnrichVerticalAction(v);
          results.push(res);
        } catch (e: any) {
          // Surface the failure but don't abort the whole run —
          // remaining verticals can still complete.
          results.push({
            success: false,
            vertical: v,
            schemas: [],
            error: e?.message ?? 'unknown',
          });
        }
      }
      setAllProgress({
        total: RELAY_VERTICALS.length,
        completed: RELAY_VERTICALS.length,
        current: null,
        results,
      });

      const okCount = results.filter((r) => r.success).length;
      const totalSchemas = results.reduce((sum, r) => sum + r.schemas.length, 0);
      const totalAi = results.reduce(
        (sum, r) => sum + r.schemas.reduce((s, sc) => s + sc.aiFields, 0),
        0,
      );
      toast.success(
        `Done: ${okCount}/${RELAY_VERTICALS.length} verticals, ${totalSchemas} schemas, ${totalAi} AI fields`,
      );
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  };

  const run = () => {
    if (choice === ALL_VERTICALS_KEY) runAll();
    else runSingle(choice);
  };

  const isAllMode = choice === ALL_VERTICALS_KEY;

  return (
    <section className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-xl">
          <strong className="text-foreground">Generate + Enrich.</strong>{' '}
          Pick a scope, click Run. For every schema in scope: deterministic
          seed regenerates from the block registry, Gemini suggests
          industry-standard fields, accepted suggestions auto-append. Single
          vertical ~30-90s. All verticals ~7-22 min (15 sequential server
          calls; safe to navigate away — completed verticals persist).
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={choice}
            onValueChange={(v) => setChoice(v as VerticalChoice)}
            disabled={isRunning}
          >
            <SelectTrigger className="h-8 w-[260px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VERTICALS_KEY}>
                ⚡ All verticals (run sequentially)
              </SelectItem>
              <SelectSeparator />
              {RELAY_VERTICALS.map((v) => (
                <SelectItem key={v} value={v}>
                  {VERTICAL_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={run}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isRunning ? (isAllMode ? 'Running all…' : 'Running…') : 'Generate + Enrich'}
          </button>
        </div>
      </div>

      {/* All-verticals progress */}
      {allProgress && (
        <div className="text-[11px] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              All verticals — {allProgress.completed}/{allProgress.total}
              {allProgress.current && isRunning && (
                <span className="text-muted-foreground ml-1.5">
                  · processing <code>{allProgress.current}</code>…
                </span>
              )}
              {!isRunning && allProgress.completed === allProgress.total && (
                <span className="ml-1.5 text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> complete
                </span>
              )}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-foreground/40 transition-all"
              style={{
                width: `${(allProgress.completed / allProgress.total) * 100}%`,
              }}
            />
          </div>
          {allProgress.results.length > 0 && (
            <ul className="space-y-0.5 pl-3 text-muted-foreground mt-2">
              {allProgress.results.map((r) => {
                const totalAi = r.schemas.reduce((s, sc) => s + sc.aiFields, 0);
                return (
                  <li key={r.vertical}>
                    {r.success ? (
                      <>
                        <CheckCircle2 className="inline h-3 w-3 text-emerald-600 mr-1" />
                        <strong className="text-foreground">{VERTICAL_LABELS[r.vertical]}</strong>{' '}
                        — {r.schemas.length} schema{r.schemas.length === 1 ? '' : 's'},{' '}
                        {totalAi} AI field{totalAi === 1 ? '' : 's'}
                      </>
                    ) : (
                      <span className="text-red-700">
                        <strong>{VERTICAL_LABELS[r.vertical]}</strong> — error: {r.error}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Single-vertical result (backwards compat with PR-fix-1 UX) */}
      {singleResult && (
        <div className="text-[11px] text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground">
            {VERTICAL_LABELS[singleResult.vertical]} —{' '}
            {singleResult.schemas.length} schema
            {singleResult.schemas.length === 1 ? '' : 's'}:
          </div>
          <ul className="space-y-0.5 pl-3">
            {singleResult.schemas.map((s) => (
              <li key={s.slug}>
                <code>{s.slug}</code> —{' '}
                {s.error ? (
                  <span className="text-red-700">error: {s.error}</span>
                ) : (
                  <>
                    {s.deterministicFields} seed + {s.aiFields} AI ={' '}
                    <strong>{s.deterministicFields + s.aiFields}</strong> fields
                    {s.seededFromDefaults && (
                      <span
                        className="ml-1.5 text-amber-700"
                        title="Consumer blocks had no reads[] annotated — seeded with universal defaults. AI did most of the work."
                      >
                        (default seed)
                      </span>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
