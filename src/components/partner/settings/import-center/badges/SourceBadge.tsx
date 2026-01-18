'use client';

import React from 'react';
import { Search, Globe, Pencil } from 'lucide-react';

interface SourceBadgeProps {
  source: 'google' | 'website' | 'custom' | 'manual';
  size?: 'xs' | 'sm' | 'md';
}

export function SourceBadge({ source, size = 'sm' }: SourceBadgeProps) {
  const showLabel = size !== 'xs';

  if (source === 'google') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Search className="w-3 h-3" />
        {showLabel && 'Google'}
      </span>
    );
  }

  if (source === 'website') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <Globe className="w-3 h-3" />
        {showLabel && 'Website'}
      </span>
    );
  }

  // custom or manual
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
      <Pencil className="w-3 h-3" />
      {showLabel && 'Custom'}
    </span>
  );
}
