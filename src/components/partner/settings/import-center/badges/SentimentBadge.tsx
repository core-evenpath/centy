'use client';

import React from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative';
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  if (sentiment === 'positive') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <ThumbsUp className="w-3 h-3" />
      </span>
    );
  }

  if (sentiment === 'negative') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <ThumbsDown className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <Minus className="w-3 h-3" />
    </span>
  );
}
