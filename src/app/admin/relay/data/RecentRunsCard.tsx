'use client';

import Link from 'next/link';
import { Sparkles, Wand2, Pencil, Clock3, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RecentRun } from '@/lib/relay/module-analytics-types';

// ── Recent runs (PR fix-9) ──────────────────────────────────────────
//
// "Version history" view per the user's ask. Sources from the
// provenance timestamps already stored on each relaySchemas doc
// (lastEnrichedAt / lastEditedAt / generatedFromRegistryAt) — no
// new collection. Shows the 10 most-recently-touched schemas plus
// what kind of touch it was, so admin sees what's been changing.

interface Props {
  runs: RecentRun[];
}

const KIND_META: Record<
  RecentRun['kind'],
  { label: string; icon: typeof Sparkles; tone: string }
> = {
  enriched: {
    label: 'AI-enriched',
    icon: Sparkles,
    tone: 'text-violet-700 bg-violet-50 border-violet-200',
  },
  edited: {
    label: 'Manually edited',
    icon: Pencil,
    tone: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  generated: {
    label: 'Seed generated',
    icon: Wand2,
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
};

function formatStamp(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const diffMs = Date.now() - t;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < 30 * 1000) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 30 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(t).toLocaleDateString();
}

export default function RecentRunsCard({ runs }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          Recent runs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No recorded runs yet. Run "Generate + Enrich" above to populate
            schemas — each run timestamps its provenance and shows up here.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {runs.map((r) => {
              const meta = KIND_META[r.kind];
              const Icon = meta.icon;
              return (
                <li
                  key={r.slug}
                  className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2"
                >
                  <span
                    className={[
                      'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium shrink-0',
                      meta.tone,
                    ].join(' ')}
                    title={`Latest event on this schema was ${meta.label.toLowerCase()}.`}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <Link
                    href={`/admin/relay/data/${r.slug}`}
                    className="flex-1 min-w-0 group flex items-center gap-2"
                  >
                    <code className="text-sm font-medium truncate group-hover:underline">
                      {r.slug}
                    </code>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {r.fieldCount} field{r.fieldCount === 1 ? '' : 's'}
                      {r.kind === 'enriched' &&
                        r.enrichedFieldCount !== undefined && (
                          <> · +{r.enrichedFieldCount} via AI</>
                        )}
                      {r.kind === 'enriched' && r.model && (
                        <> · {r.model}</>
                      )}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                  <span
                    className="text-[11px] text-muted-foreground shrink-0"
                    title={r.at}
                  >
                    {formatStamp(r.at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
