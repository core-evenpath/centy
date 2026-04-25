'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineGaps } from '@/lib/relay/module-analytics-types';

// ── Pipeline health (PR fix-9) ──────────────────────────────────────
//
// Surfaces actionable issues found by the analytics action so admin
// sees what's broken at a glance. Each row is one type of gap with
// a count + (where useful) a list of slugs that triggered it.
//
// Rows hide when their count is 0 — a fully-healthy pipeline shows
// the all-green state instead of a wall of "0 missing / 0 empty"
// entries that don't carry signal.

interface Props {
  gaps: PipelineGaps;
  /** Total schema count for the "all green" baseline copy. */
  totalSchemas: number;
}

interface GapRow {
  label: string;
  count: number;
  hint: string;
  detail?: string[];
}

export default function PipelineHealthCard({ gaps, totalSchemas }: Props) {
  const rows: GapRow[] = [
    {
      label: 'Missing schemas',
      count: gaps.missingSchemas.length,
      hint: 'Block.module references a slug that has no relaySchemas doc. Run "Generate + Enrich" to create them.',
      detail: gaps.missingSchemas.slice(0, 5),
    },
    {
      label: 'Empty schemas',
      count: gaps.emptySchemas.length,
      hint: 'Schema doc exists but has 0 fields. Re-run "Generate + Enrich" or edit the schema directly.',
      detail: gaps.emptySchemas.slice(0, 5),
    },
    {
      label: 'Orphan schemas',
      count: gaps.orphanSchemas.length,
      hint: 'Schema docs that no block in the registry references. Safe to delete via "Clear all schemas" if you want a fresh start.',
      detail: gaps.orphanSchemas.slice(0, 5),
    },
    {
      label: 'Drift',
      count: gaps.driftBlocks,
      hint: 'Blocks reading fields not in their schema. Filter to "Drift" on the Blocks tab to fix.',
    },
    {
      label: 'Unbound blocks',
      count: gaps.unboundBlocks,
      hint: 'Blocks admin has explicitly disconnected from their family schema. Review on the Blocks tab if unintended.',
    },
  ];

  const hasIssues = rows.some((r) => r.count > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {hasIssues ? (
            <AlertTriangle
              className="h-4 w-4 text-amber-500"
              aria-label="Pipeline has issues"
            />
          ) : (
            <CheckCircle2
              className="h-4 w-4 text-emerald-500"
              aria-label="Pipeline healthy"
            />
          )}
          Pipeline health
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasIssues ? (
          <p className="text-sm text-muted-foreground">
            All clear. {totalSchemas} schema{totalSchemas === 1 ? '' : 's'} present, no
            missing / empty / orphan / drift / unbound issues detected.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows
              .filter((r) => r.count > 0)
              .map((r) => (
                <li
                  key={r.label}
                  className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {r.label}{' '}
                      <span className="text-amber-800 font-semibold">({r.count})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.hint}</p>
                    {r.detail && r.detail.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.detail.map((slug) => (
                          <Link
                            key={slug}
                            href={`/admin/relay/data/${slug}`}
                            className="inline-flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[11px] hover:bg-muted transition-colors"
                          >
                            <code>{slug}</code>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </Link>
                        ))}
                        {r.count > r.detail.length && (
                          <span className="text-[11px] text-muted-foreground self-center">
                            +{r.count - r.detail.length} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
