'use client';

import React from 'react';
import { Quote, BarChart3 } from 'lucide-react';
import { TestimonialCard } from '../cards';
import type { EnrichedTestimonial } from '../types';

interface TestimonialsTabProps {
  testimonials: EnrichedTestimonial[];
  onToggleTestimonial: (id: string) => void;
  onHighlightTestimonial: (id: string) => void;
  onSelectPositive: () => void;
  onFeatureBest: () => void;
}

export function TestimonialsTab({
  testimonials,
  onToggleTestimonial,
  onHighlightTestimonial,
  onSelectPositive,
  onFeatureBest,
}: TestimonialsTabProps) {
  const selectedTestimonials = testimonials.filter((t) => t.selected);
  const highlightedTestimonials = testimonials.filter((t) => t.highlighted);
  const positiveTestimonials = testimonials.filter((t) => t.sentiment === 'positive');
  const testimonialsWithOutcome = testimonials.filter((t) => t.outcome);

  // Calculate average rating
  const ratingsWithValue = testimonials.filter((t) => t.rating);
  const avgRating =
    ratingsWithValue.length > 0
      ? (ratingsWithValue.reduce((a, t) => a + (t.rating || 0), 0) / ratingsWithValue.length).toFixed(
          1
        )
      : 'N/A';

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-xl text-slate-900">Testimonials</h2>
              <p className="text-slate-500">
                {selectedTestimonials.length} selected • {highlightedTestimonials.length}{' '}
                highlighted
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onSelectPositive}
                className="px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200"
              >
                Select Positive
              </button>
              <button
                onClick={onFeatureBest}
                className="px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200"
              >
                Feature Best
              </button>
            </div>
          </div>

          {/* Testimonials List */}
          {testimonials.length > 0 ? (
            <div className="space-y-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  onToggle={onToggleTestimonial}
                  onHighlight={onHighlightTestimonial}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Quote className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No testimonials imported yet</p>
              <p className="text-sm">Import from Google or your website to see reviews here</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Analysis */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white h-fit">
        <BarChart3 className="w-8 h-8 mb-3" />
        <h3 className="font-bold mb-3">Analysis</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Avg Rating</span>
            <span className="font-bold text-amber-400">{avgRating}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Positive</span>
            <span className="font-bold text-emerald-400">{positiveTestimonials.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">With Outcomes</span>
            <span className="font-bold text-purple-400">{testimonialsWithOutcome.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
