'use client';

import { CheckCircle, Package, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockModuleBinding } from '@/lib/relay/module-analytics-types';
import BlockReadsChips from './BlockReadsChips';

export default function ConnectedBlockCard({
  block,
}: {
  block: BlockModuleBinding;
}) {
  const hasDrift = (block.driftFields?.length ?? 0) > 0;
  return (
    <Card className={hasDrift ? 'border-amber-200' : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {hasDrift ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : block.moduleConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
            {block.blockLabel}
          </CardTitle>
          <div className="flex flex-wrap gap-1 justify-end">
            {block.verticals.slice(0, 2).map((v) => (
              <Badge key={v} variant="outline">
                {v}
              </Badge>
            ))}
            {block.verticals.length > 2 && (
              <Badge variant="outline">+{block.verticals.length - 2}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="text-sm text-muted-foreground">
          {block.moduleSlug ? (
            <span>
              Module:{' '}
              <code className="px-1 bg-slate-100 rounded">
                {block.moduleSlug}
              </code>
              {block.moduleItemCount !== undefined && (
                <span className="ml-2 text-green-600">
                  ({block.moduleItemCount} items)
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">No module required</span>
          )}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Reads
          </div>
          <BlockReadsChips reads={block.reads} driftFields={block.driftFields} />
        </div>

        {hasDrift && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            {block.driftFields!.length} field{block.driftFields!.length === 1 ? '' : 's'}{' '}
            read by this block don't exist in the module schema. Fix the module
            or update the block's <code>reads</code>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
