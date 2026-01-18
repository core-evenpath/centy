'use client';

import React from 'react';
import { SourceBadge } from '../badges';
import type { FieldSource } from '../types';
import type { LucideIcon } from 'lucide-react';

interface ReviewFieldRowProps {
  label: string;
  value: any;
  source?: FieldSource;
  icon?: LucideIcon;
}

export function ReviewFieldRow({ label, value, source, icon: Icon }: ReviewFieldRowProps) {
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900 font-medium">
          {displayValue || <span className="text-slate-400 italic">Not set</span>}
        </p>
      </div>
      {source && source !== 'none' && (
        <SourceBadge source={source as 'google' | 'website' | 'custom'} size="xs" />
      )}
    </div>
  );
}
