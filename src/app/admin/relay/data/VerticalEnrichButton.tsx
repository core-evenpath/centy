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

// ── Bulk generate + apply curated (Step 1) ──────────────────────────
//
// One-click bootstrap. Two modes:
//
//   - Single vertical: pick one, click Run. Server action visits each
//     schema in that vertical and either applies the curated TS file
//     (when one exists under src/lib/relay/schema-curations/) or
//     falls back to the deterministic block.reads[] seed. No Gemini.
//
//   - "All verticals": runs each vertical sequentially client-side,
//     calling the per-vertical action once per RELAY_VERTICALS entry.
//     Per-vertical progress streams into the result panel. Each call
//     is bounded — closing the tab stops the next vertical, completed
//     verticals persist.
//
// Results from each completed vertical accumulate in the result panel
// below the dropdown so admin can verify what landed: per-slug source
// (curated vs deterministic) and field count.

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
        const curatedCount = res.schemas.filter((s) => s.source === 'curated').length;
        const detCount = res.schemas.filter((s) => s.source === 'deterministic').length;
        toast.success(
          `${VERTICAL_LABELS[v]}: ${curatedCount} curated · ${detCount} from blocks (${res.schemas.length} total)`,
        );
      } else {
        toast.error(res.error ?? 'Bulk apply failed');
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
      const curatedCount = results.reduce(
        (sum, r) => sum + r.schemas.filter((s) => s.source === 'curated').length,
        0,
      );
      toast.success(
        `Done: ${okCount}/${RELAY_VERTICALS.length} verticals, ${totalSchemas} schemas (${curatedCount} curated)`,
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
          <strong className="text-foreground">Generate + Apply Curated.</strong>{' '}
          Pick a scope, click Run. For every schema in scope: if a curated TS
          file exists under <code>src/lib/relay/schema-curations/</code> it&apos;s
          applied verbatim (admin overrides for{' '}
          <code>contentCategory</code>/<code>name</code>/<code>description</code>{' '}
          survive). Otherwise the deterministic <code>block.reads[]</code> seed
          runs. No Gemini. Closed-list, reviewable, deterministic.
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
                const curated = r.schemas.filter((s) => s.source === 'curated').length;
                return (
                  <li key={r.vertical}>
                    {r.success ? (
                      <>
                        <CheckCircle2 className="inline h-3 w-3 text-emerald-600 mr-1" />
                        <strong className="text-foreground">{VERTICAL_LABELS[r.vertical]}</strong>{' '}
                        — {r.schemas.length} schema{r.schemas.length === 1 ? '' : 's'},{' '}
                        {curated} curated
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

      {/* Single-vertical result */}
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
                    <span
                      className={
                        s.source === 'curated'
                          ? 'text-emerald-700 font-medium'
                          : 'text-amber-700'
                      }
                      title={
                        s.source === 'curated'
                          ? 'Applied from src/lib/relay/schema-curations/'
                          : 'Fallback: deterministic seed from block.reads[]. Add a curation file to upgrade.'
                      }
                    >
                      {s.source}
                    </span>{' '}
                    · <strong>{s.fieldCount}</strong> field
                    {s.fieldCount === 1 ? '' : 's'}
                    {s.preservedAdminMetadata && (
                      <span
                        className="ml-1.5 text-foreground/70"
                        title="Admin overrides for contentCategory, name, or description were preserved over the curation."
                      >
                        (preserved admin meta)
                      </span>
                    )}
                    {s.seededFromDefaults && (
                      <span
                        className="ml-1.5 text-amber-700"
                        title="Consumer blocks had no reads[] annotated — seeded with universal defaults. Curate this slug for richer fields."
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
