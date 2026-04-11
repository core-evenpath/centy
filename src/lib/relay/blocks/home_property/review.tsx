'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, ThumbsUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_review',
  family: 'social_proof',
  label: 'Customer Reviews',
  description: 'Home-service criteria bars with service-type-tagged reviews',
  applicableCategories: ['home_property', 'home_services', 'repair', 'maintenance'],
  intentTriggers: {
    keywords: ['reviews', 'rating', 'feedback', 'testimonials', 'stars'],
    queryPatterns: ['what do customers say', 'how are reviews', 'customer ratings'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'overallScore', type: 'rating', label: 'Overall Score' },
      { field: 'totalReviews', type: 'number', label: 'Total Reviews' },
      { field: 'criteria', type: 'tags', label: 'Criteria Scores' },
      { field: 'reviews', type: 'tags', label: 'Reviews' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    overallScore: 4.7, totalReviews: 1283,
    criteria: [{ label: 'Punctuality', score: 4.8 }, { label: 'Quality', score: 4.7 }, { label: 'Cleanliness', score: 4.6 }, { label: 'Value', score: 4.5 }],
    reviews: [
      { name: 'David R.', score: 5, text: 'Plumber arrived on time and fixed the leak fast.', serviceType: 'Plumbing', date: '1 week ago' },
      { name: 'Lisa M.', score: 4, text: 'Good AC tune-up. Explained everything clearly.', serviceType: 'HVAC', date: '3 weeks ago' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function ReviewBlock({ data, theme }: BlockComponentProps) {
  const score = data.overallScore || 4.5;
  const total = data.totalReviews || 0;
  const criteria: Array<{ label: string; score: number }> = data.criteria || [];
  const reviews: Array<Record<string, any>> = data.reviews || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent }}>{score.toFixed(1)}</div>
        <div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.round(score) ? theme.amber : 'none'} color={s <= Math.round(score) ? theme.amber : theme.t4} />)}
          </div>
          {total > 0 && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{total.toLocaleString()} reviews</div>}
        </div>
      </div>
      {criteria.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          {criteria.map(c => (
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
              {r.serviceType && <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{r.serviceType}</span>}
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
