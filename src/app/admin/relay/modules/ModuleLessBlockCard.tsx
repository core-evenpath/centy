'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockModuleBinding } from '@/lib/relay/module-analytics-types';
import EngineChips from './EngineChips';

// ── Module-less block card ──────────────────────────────────────────
//
// Compact card for blocks whose `module === null`. They intentionally
// don't bind a module — the `noModuleReason` on the block definition
// explains why (see ModuleLessSection for the grouping + explainer).
// This card is presentational only; the reason surrounds the card at
// section level rather than repeating on each one.

export default function ModuleLessBlockCard({
  block,
}: {
  block: BlockModuleBinding;
}) {
  const unjustified = !block.noModuleReason;
  return (
    <Card className={unjustified ? 'border-amber-200 bg-amber-50/40' : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">
            {block.blockLabel}
            {unjustified && (
              <span
                className="ml-2 text-[10px] text-amber-700 font-semibold"
                title="This block has no module and no noModuleReason declared"
              >
                UNJUSTIFIED
              </span>
            )}
          </CardTitle>
          <div className="flex flex-wrap gap-1 justify-end">
            {block.verticals.slice(0, 2).map((v) => (
              <Badge key={v} variant="outline" className="text-[10px]">
                {v}
              </Badge>
            ))}
            {block.verticals.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{block.verticals.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="text-[11px] text-muted-foreground">
          Family: <code className="px-1 bg-slate-100 rounded">{block.blockFamily}</code>
        </div>
        <EngineChips engines={block.engines} />
      </CardContent>
    </Card>
  );
}
