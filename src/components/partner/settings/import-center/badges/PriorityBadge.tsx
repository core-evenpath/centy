'use client';

import React from 'react';

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (priority === 'high') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        High
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        Medium
      </span>
    );
  }

  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
      Low
    </span>
  );
}
