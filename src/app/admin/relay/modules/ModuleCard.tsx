'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModuleBlockUsage } from '@/lib/relay/module-analytics-types';

export default function ModuleCard({ module }: { module: ModuleBlockUsage }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: module.moduleColor }}
            />
            {module.moduleName}
          </CardTitle>
          <Link
            href={`/admin/modules/${module.moduleId}`}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Open ${module.moduleName} in admin modules`}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {module.itemCount} items across {module.partnerCount} partner
          {module.partnerCount === 1 ? '' : 's'}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Powers these blocks:
          </p>
          <div className="flex flex-wrap gap-1">
            {module.connectedBlocks.map((b) => (
              <Badge key={b.blockId} variant="secondary" className="text-xs">
                {b.blockLabel}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
