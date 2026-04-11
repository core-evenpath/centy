'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, MessageSquare } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_diner_review',
  family: 'social_proof',
  label: 'Diner Reviews',
  description: 'F&B-specific criteria bars and meal-tagged reviews',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'fine_dining', 'bakery'],
  intentTriggers: {
    keywords: ['reviews', 'ratings', 'feedback', 'what people say', 'testimonials'],
    queryPatterns: ['show reviews', 'what do diners say', 'how are the reviews', 'rating for *'],
    dataConditions: ['has_reviews'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'overallRating', type: 'rating', label: 'Overall Rating' },
      { field: 'totalReviews', type: 'number', label: 'Total Reviews' },
      { field: 'criteria', type: 'tags', label: 'Rating Criteria' },
      { field: 'reviews', type: 'tags', label: 'Reviews' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    overallRating: 4.5, totalReviews: 328,
    criteria: [{ label: 'Food Quality', score: 4.7 }, { label: 'Service', score: 4.4 }, { label: 'Ambiance', score: 4.6 }, { label: 'Value', score: 4.2 }],
    reviews: [
      { name: 'Priya S.', score: 5, text: 'The truffle risotto was divine. Best Italian in the city.', meal: 'Dinner', date: '1 week ago' },
      { name: 'Tom L.', score: 4, text: 'Great brunch spot. Eggs Benedict was perfect, but slow service on weekends.', meal: 'Brunch', date: '2 weeks ago' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function DinerReviewBlock({ data, theme }: BlockComponentProps) {
  const score = data.overallRating || 0;
  const total = data.totalReviews || 0;
  const criteria: Array<{ label: string; score: number }> = data.criteria || [];
  const reviews: Array<Record<string, any>> = data.reviews || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent }}>{score.toFixed(1)}</div>
        <div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.round(score) ? theme.amber : 'none'} color={s <= Math.round(score) ? theme.amber : theme.t4} />)}
          </div>
          {total > 0 && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{total.toLocaleString()} diner reviews</div>}
        </div>
      </div>
      {criteria.length > 0 && (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          {criteria.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: theme.t3, width: 75 }}>{c.label}</span>
              <div style={{ flex: 1, height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${(c.score / 5) * 100}%`, height: '100%', background: theme.accent, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1, width: 22, textAlign: 'right' }}>{c.score}</span>
            </div>
          ))}
        </div>
      )}
      {reviews.map((r, i) => (
        <div key={i} style={{ padding: '8px 14px', borderBottom: i < reviews.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{r.name}</span>
              {r.meal && <span style={{ fontSize: 7, color: theme.accent, background: theme.accentBg, padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>{r.meal}</span>}
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
