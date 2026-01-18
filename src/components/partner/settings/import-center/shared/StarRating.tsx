'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating, size = 'sm' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClass} ${
            s <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );
}
