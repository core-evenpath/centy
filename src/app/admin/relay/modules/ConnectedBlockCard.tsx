'use client';

import { CheckCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BlockModuleBinding } from '@/lib/relay/module-analytics-types';

export default function ConnectedBlockCard({
  block,
}: {
  block: BlockModuleBinding;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {block.moduleConnected ? (
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
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
