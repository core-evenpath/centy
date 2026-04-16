'use client';

import {
  AlertTriangle,
  CheckCircle,
  Layers,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RelayModuleAnalytics } from '@/lib/relay/module-analytics-types';

interface SummaryCardProps {
  title: string;
  value: number;
  Icon: LucideIcon;
  iconClassName?: string;
  subtitle?: string;
}

function SummaryCard({
  title,
  value,
  Icon,
  iconClassName,
  subtitle,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Icon className={`h-5 w-5 ${iconClassName ?? ''}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SummaryCards({
  data,
}: {
  data: RelayModuleAnalytics;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Blocks"
        value={data.totalBlocks}
        Icon={Layers}
        iconClassName="text-blue-500"
      />
      <SummaryCard
        title="Module-Dependent"
        value={data.blocksWithModules}
        Icon={Package}
        iconClassName="text-purple-500"
      />
      <SummaryCard
        title="Dark Blocks"
        value={data.darkBlockCount}
        Icon={AlertTriangle}
        iconClassName="text-amber-500"
        subtitle="Need data"
      />
      <SummaryCard
        title="System Modules"
        value={data.totalModules}
        Icon={CheckCircle}
        iconClassName="text-green-500"
      />
    </div>
  );
}
