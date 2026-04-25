'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  generateAndEnrichVerticalAction,
  type VerticalEnrichResult,
} from '@/actions/relay-schema-bulk';
import { RELAY_VERTICALS, type RelayVertical } from '@/lib/relay/relay-verticals';

// ── Per-vertical generate-and-enrich (PR-fix-1) ─────────────────────
//
// One-click bootstrap: pick a vertical, click Run, and every schema
// in that vertical is regenerated from the block registry then
// enriched with Gemini suggestions (auto-accepted into the schema).
//
// Sits on /admin/relay/data alongside the existing
// "Generate from block registry" button. That deterministic seed
// stays available for non-AI bootstrap; this button adds the AI
// pass on top, scoped per vertical so a click stays under ~90s.

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

export default function VerticalEnrichButton() {
  const [vertical, setVertical] = useState<RelayVertical>('automotive');
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<VerticalEnrichResult | null>(null);

  const run = async () => {
    setIsRunning(true);
    setLastResult(null);
    try {
      const res = await generateAndEnrichVerticalAction(vertical);
      setLastResult(res);
      if (res.success) {
        const totalAi = res.schemas.reduce((sum, s) => sum + s.aiFields, 0);
        const totalSchemas = res.schemas.length;
        toast.success(
          `${VERTICAL_LABELS[vertical]}: enriched ${totalSchemas} schema${
            totalSchemas === 1 ? '' : 's'
          } with ${totalAi} AI field${totalAi === 1 ? '' : 's'}`,
        );
      } else {
        toast.error(res.error ?? 'Bulk enrichment failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Bulk enrichment failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-lg border bg-muted/40 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground max-w-xl">
          <strong className="text-foreground">Bulk: generate + enrich a vertical.</strong>{' '}
          Pick a vertical, click Run. For every schema in that vertical: the
          deterministic seed is regenerated from the block registry, then Gemini is
          asked for industry-standard fields, then accepted suggestions are auto-appended
          to the schema. ~30-90s per click.
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={vertical}
            onValueChange={(v) => setVertical(v as RelayVertical)}
            disabled={isRunning}
          >
            <SelectTrigger className="h-8 w-[220px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            {isRunning ? 'Running…' : 'Generate + Enrich'}
          </button>
        </div>
      </div>

      {lastResult && (
        <div className="text-[11px] text-muted-foreground space-y-1">
          <div className="font-semibold text-foreground">
            {VERTICAL_LABELS[lastResult.vertical]} — {lastResult.schemas.length} schema
            {lastResult.schemas.length === 1 ? '' : 's'}:
          </div>
          <ul className="space-y-0.5 pl-3">
            {lastResult.schemas.map((s) => (
              <li key={s.slug}>
                <code>{s.slug}</code> —{' '}
                {s.skipped ? (
                  <span className="text-amber-700">skipped: {s.skipped}</span>
                ) : s.error ? (
                  <span className="text-red-700">error: {s.error}</span>
                ) : (
                  <>
                    {s.deterministicFields} seed + {s.aiFields} AI ={' '}
                    <strong>{s.deterministicFields + s.aiFields}</strong> fields
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
