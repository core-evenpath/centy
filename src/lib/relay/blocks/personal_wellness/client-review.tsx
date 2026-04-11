'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, MessageSquare } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_client_review',
  family: 'proof',
  label: 'Client Reviews',
  description: 'Service-tagged reviews with criteria rating bars',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage', 'skincare'],
  intentTriggers: {
    keywords: ['reviews', 'testimonials', 'feedback', 'ratings', 'client says'],
    queryPatterns: ['what do clients say *', 'reviews for *', 'show reviews'],
    dataConditions: [],
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
    overallRating: 4.8, totalReviews: 326,
    criteria: [{ label: 'Skill', score: 4.9 }, { label: 'Ambiance', score: 4.7 }, { label: 'Value', score: 4.6 }],
    reviews: [
      { name: 'Nina T.', score: 5, text: 'Best facial I have ever had. My skin is glowing!', service: 'Hydrafacial', date: '1 week ago' },
      { name: 'Mark R.', score: 4, text: 'Great deep tissue work. Will definitely return.', service: 'Deep Tissue', date: '3 weeks ago' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function ClientReviewBlock({ data, theme }: BlockComponentProps) {
  const rating = data.overallRating || 4.5;
  const total = data.totalReviews || 0;
  const criteria: Array<{ label: string; score: number }> = data.criteria || [];
  const reviews: Array<Record<string, any>> = data.reviews || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: theme.accent }}>{rating.toFixed(1)}</div>
        <div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} fill={s <= Math.round(rating) ? theme.amber : 'none'} color={s <= Math.round(rating) ? theme.amber : theme.t4} />)}
          </div>
          {total > 0 && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{total.toLocaleString()} reviews</div>}
        </div>
      </div>
      {criteria.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          {criteria.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: theme.t3, width: 55 }}>{c.label}</span>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{r.name}</span>
              {r.service && <span style={{ fontSize: 7, color: theme.accent, background: theme.accentBg, padding: '1px 4px', borderRadius: 3 }}>{r.service}</span>}
            </div>
            <span style={{ fontSize: 8, color: theme.t4 }}>{r.date}</span>
          </div>
          <div style={{ display: 'flex', gap: 1, marginBottom: 2 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} fill={s <= r.score ? theme.amber : 'none'} color={s <= r.score ? theme.amber : theme.t4} />)}
          </div>
          <div style={{ fontSize: 10, color: theme.t2, lineHeight: 1.4 }}>{r.text}</div>
        </div>
      ))}
    </div>
  );
}
