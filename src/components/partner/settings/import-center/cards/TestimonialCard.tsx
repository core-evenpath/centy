'use client';

import React from 'react';
import { Check, Star, BadgeCheck, Award } from 'lucide-react';
import { SourceBadge, SentimentBadge } from '../badges';
import { StarRating } from '../shared';
import type { EnrichedTestimonial } from '../types';

interface TestimonialCardProps {
  testimonial: EnrichedTestimonial;
  onToggle: (id: string) => void;
  onHighlight: (id: string) => void;
}

export function TestimonialCard({
  testimonial,
  onToggle,
  onHighlight,
}: TestimonialCardProps) {
  return (
    <div
      className={`rounded-xl border-2 overflow-hidden ${
        testimonial.selected
          ? 'border-emerald-300 bg-emerald-50/30'
          : 'border-slate-200 bg-white opacity-60'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection Checkbox */}
          <button
            onClick={() => onToggle(testimonial.id)}
            className={`mt-1 w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 ${
              testimonial.selected
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-300 hover:border-emerald-400'
            }`}
          >
            {testimonial.selected && <Check className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1">
            {/* Rating & Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {testimonial.rating && <StarRating rating={testimonial.rating} />}
              <SentimentBadge sentiment={testimonial.sentiment} />
              {testimonial.verified && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  <BadgeCheck className="w-3 h-3 inline" />
                </span>
              )}
            </div>

            {/* Quote */}
            <blockquote className="text-slate-700 mb-2 text-sm">
              &quot;{testimonial.quote}&quot;
            </blockquote>

            {/* Outcome Badge */}
            {testimonial.outcome && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold mb-2">
                <Award className="w-3 h-3" /> {testimonial.outcome}
              </div>
            )}

            {/* Author & Highlight */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">
                  — {testimonial.author || 'Anonymous'}
                </span>
                <SourceBadge source={testimonial.source as 'google' | 'website'} size="xs" />
              </div>
              <button
                onClick={() => onHighlight(testimonial.id)}
                className={`p-1.5 rounded-lg ${
                  testimonial.highlighted
                    ? 'text-amber-500 bg-amber-100'
                    : 'text-slate-400 hover:text-amber-500'
                }`}
                title={testimonial.highlighted ? 'Remove highlight' : 'Highlight testimonial'}
              >
                <Star
                  className={`w-4 h-4 ${testimonial.highlighted ? 'fill-current' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
