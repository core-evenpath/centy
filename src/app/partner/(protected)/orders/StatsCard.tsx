'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatsColor = 'gray' | 'yellow' | 'purple' | 'blue' | 'green';

const COLOR_CLASSES: Record<StatsColor, string> = {
  gray: 'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
};

interface Props {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: StatsColor;
}

export default function StatsCard({
  label,
  value,
  icon,
  color = 'gray',
}: Props) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn('p-2 rounded-lg', COLOR_CLASSES[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
