'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  NO_MODULE_REASON_LABELS,
  type NoModuleReason,
} from '@/app/admin/relay/blocks/previews/_schema-contract';
import type { BlockModuleBinding } from '@/lib/relay/module-analytics-types';
import ModuleLessBlockCard from './ModuleLessBlockCard';

// ── Module-less blocks, grouped by reason ───────────────────────────
//
// Blocks with `module === null` fall in here. Today's UI was lumping
// them into the "Connected" tab (since !isDark) which is misleading —
// they're not connected to anything. Grouping by `noModuleReason`
// turns this surface into "all the blocks that intentionally
// bypass the module system, and why" — which is actually useful.
//
// Each reason renders as its own section with a short explainer so
// admins understand the invariant without hunting through the schema
// contract.

interface Props {
  blocks: BlockModuleBinding[];
}

const REASON_ORDER: NoModuleReason[] = [
  'design_only',
  'conversation',
  'ai_generated',
  'checkout',
  'navigation',
];

// One-liner explanation for each bucket — mirrors the doc-comments
// on the NoModuleReason union in _schema-contract.ts.
const REASON_EXPLAINERS: Record<NoModuleReason, string> = {
  design_only:
    'No data contract yet. Renders with built-in design samples; safe to ship without partner data.',
  conversation:
    'Text-only surface — welcomes, Q&A, static copy. Nothing structured to store.',
  ai_generated:
    'Content assembled on the fly from conversation state (trackers, dashboards, calculators).',
  checkout:
    'Owns its own transactional protocol (cart, bookings, orders). Data flows through engine state, not a module.',
  navigation:
    'Renders from partner settings (contact card, service area). Partner-settings-backed, not a module.',
};

export default function ModuleLessSection({ blocks }: Props) {
  const grouped = useMemo(() => {
    const byReason = new Map<NoModuleReason | '__unjustified__', BlockModuleBinding[]>();
    for (const block of blocks) {
      const key = block.noModuleReason ?? '__unjustified__';
      if (!byReason.has(key)) byReason.set(key, []);
      byReason.get(key)!.push(block);
    }
    return byReason;
  }, [blocks]);

  if (blocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No module-less blocks in the current filter.
        </CardContent>
      </Card>
    );
  }

  const unjustified = grouped.get('__unjustified__') ?? [];

  return (
    <div className="space-y-6">
      {unjustified.length > 0 && (
        <section>
          <header className="mb-2">
            <h3 className="text-sm font-semibold text-amber-900">
              Unjustified — {unjustified.length}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              These blocks have <code className="px-1 bg-slate-100 rounded">module: null</code>{' '}
              but no <code className="px-1 bg-slate-100 rounded">noModuleReason</code>.
              Annotate them in the block registry so future drift analysis treats
              them as intentional rather than broken.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unjustified.map((block) => (
              <ModuleLessBlockCard key={block.blockId} block={block} />
            ))}
          </div>
        </section>
      )}

      {REASON_ORDER.map((reason) => {
        const bucket = grouped.get(reason) ?? [];
        if (bucket.length === 0) return null;
        return (
          <section key={reason}>
            <header className="mb-2">
              <h3 className="text-sm font-semibold">
                {NO_MODULE_REASON_LABELS[reason]} — {bucket.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {REASON_EXPLAINERS[reason]}
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bucket.map((block) => (
                <ModuleLessBlockCard key={block.blockId} block={block} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
