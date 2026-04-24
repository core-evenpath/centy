'use client';

import Link from 'next/link';
import { AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockModuleBinding } from '@/lib/relay/module-analytics-types';
import BlockReadsChips from './BlockReadsChips';

export default function DarkBlockCard({
  block,
}: {
  block: BlockModuleBinding;
}) {
  const moduleSlug = block.moduleSlug ?? '';
  const hasDrift = (block.driftFields?.length ?? 0) > 0;
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
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
          Needs{' '}
          <code className="px-1 bg-amber-100 rounded">{moduleSlug}</code>{' '}
          module with data
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Reads
          </div>
          <BlockReadsChips reads={block.reads} driftFields={block.driftFields} />
        </div>

        {hasDrift && (
          <p className="text-[11px] text-amber-800 bg-amber-100 border border-amber-300 rounded px-2 py-1">
            {block.driftFields!.length} field{block.driftFields!.length === 1 ? '' : 's'}{' '}
            also missing from the module schema — not just empty.
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/admin/modules?slug=${moduleSlug}`}>
              <Package className="h-3 w-3 mr-1" />
              View Module
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
