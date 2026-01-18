'use client';

import React from 'react';
import { Star, Award } from 'lucide-react';
import { StarRating } from '../shared';
import type { EnrichedTestimonial } from '../types';

interface ReviewTestimonialRowProps {
  testimonial: EnrichedTestimonial;
}

export function ReviewTestimonialRow({ testimonial }: ReviewTestimonialRowProps) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        {testimonial.rating && <StarRating rating={testimonial.rating} />}
        <span className="text-xs text-slate-500">— {testimonial.author || 'Anonymous'}</span>
        {testimonial.highlighted && (
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        )}
      </div>
      <p className="text-sm text-slate-700 line-clamp-2">&quot;{testimonial.quote}&quot;</p>
      {testimonial.outcome && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium mt-1">
          <Award className="w-3 h-3" /> {testimonial.outcome}
        </span>
      )}
    </div>
  );
}
