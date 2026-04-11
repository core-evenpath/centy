'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, ThumbsUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_review',
  family: 'social_proof',
  label: 'Customer Reviews',
  description: 'Auto-specific criteria bars, purchase/service-tagged reviews',
  applicableCategories: ['automotive', 'dealership', 'service_center'],
  intentTriggers: {
    keywords: ['reviews', 'ratings', 'feedback', 'testimonials', 'experience'],
    queryPatterns: ['what do customers say', 'reviews for *', 'how are your ratings'],
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
    overallScore: 4.7, totalReviews: 1283,
    categories: [
      { label: 'Sales Experience', score: 4.8 }, { label: 'Service Quality', score: 4.6 },
      { label: 'Pricing Fairness', score: 4.5 }, { label: 'Communication', score: 4.9 },
    ],
    reviews: [
      { name: 'David L.', score: 5, text: 'Great no-pressure buying experience. Got a fair price on my trade-in too.', date: '1 week ago', tag: 'Purchase', verified: true },
      { name: 'Maria S.', score: 4, text: 'Quick oil change and they caught a recall. Waiting area was comfortable.', date: '3 weeks ago', tag: 'Service', verified: true },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function AutoReviewBlock({ data, theme }: BlockComponentProps) {
  const score = data.overallScore || 4.5, total = data.totalReviews || 0;
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
          {total > 0 && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{total.toLocaleString()} reviews</div>}
        </div>
      </div>
      {categories.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          {categories.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: theme.t3, width: 90 }}>{c.label}</span>
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
              {r.tag && <span style={{ fontSize: 7, fontWeight: 600, color: theme.accent, background: theme.accentBg, padding: '1px 4px', borderRadius: 3 }}>{r.tag}</span>}
              {r.verified && <span style={{ fontSize: 7, color: theme.green, fontWeight: 600 }}>✓</span>}
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
