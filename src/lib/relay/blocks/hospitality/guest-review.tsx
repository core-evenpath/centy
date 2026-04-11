'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, ThumbsUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_guest_review',
  family: 'engagement',
  label: 'Guest Reviews',
  description: 'Scored guest reviews with category breakdowns',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb'],
  intentTriggers: {
    keywords: ['reviews', 'rating', 'feedback', 'guest experience', 'testimonials'],
    queryPatterns: ['what do guests say', 'how are the reviews', 'rating for *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'overallScore', type: 'rating', label: 'Overall Score' },
      { field: 'totalReviews', type: 'number', label: 'Total Reviews' },
      { field: 'categories', type: 'tags', label: 'Score Categories' },
      { field: 'reviews', type: 'tags', label: 'Recent Reviews' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    overallScore: 4.6, totalReviews: 842,
    categories: [{ label: 'Cleanliness', score: 4.8 }, { label: 'Location', score: 4.7 }, { label: 'Service', score: 4.5 }, { label: 'Value', score: 4.3 }],
    reviews: [
      { name: 'Sarah M.', score: 5, text: 'Stunning ocean views. Staff was incredibly attentive.', date: '2 weeks ago', verified: true },
      { name: 'James K.', score: 4, text: 'Great location and clean rooms. Breakfast could be better.', date: '1 month ago', verified: true },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function GuestReviewBlock({ data, theme }: BlockComponentProps) {
  const score = data.overallScore || 4.5;
  const total = data.totalReviews || 0;
  const categories: Array<{ label: string; score: number }> = data.categories || [];
  const reviews: Array<Record<string, any>> = data.reviews || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent }}>{score.toFixed(1)}</div>
        <div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.round(score) ? theme.amber : 'none'} color={s <= Math.round(score) ? theme.amber : theme.t4} />)}
          </div>
          {total > 0 && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{total.toLocaleString()} guest reviews</div>}
        </div>
      </div>
      {categories.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          {categories.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: theme.t3, width: 70 }}>{c.label}</span>
              <div style={{ flex: 1, height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${(c.score / 5) * 100}%`, height: '100%', background: theme.accent, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1, width: 22, textAlign: 'right' }}>{c.score}</span>
            </div>
          ))}
        </div>
      )}
      {reviews.map((r, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < reviews.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{r.name}</span>
              {r.verified && <span style={{ fontSize: 7, color: theme.green, fontWeight: 600 }}>✓ Verified</span>}
            </div>
            <span style={{ fontSize: 8, color: theme.t4 }}>{r.date}</span>
          </div>
          <div style={{ display: 'flex', gap: 1, marginBottom: 3 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} fill={s <= r.score ? theme.amber : 'none'} color={s <= r.score ? theme.amber : theme.t4} />)}
          </div>
          <div style={{ fontSize: 10, color: theme.t2, lineHeight: 1.4 }}>{r.text}</div>
        </div>
      ))}
    </div>
  );
}
