'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, MessageSquare } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_buyer_review',
  family: 'social_proof',
  label: 'Buyer Reviews',
  description: 'B2B reviews with supply-chain criteria bars',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm'],
  intentTriggers: {
    keywords: ['reviews', 'feedback', 'rating', 'testimonial', 'buyers', 'reputation'],
    queryPatterns: ['what do buyers say *', 'reviews for *', 'supplier ratings *'],
    dataConditions: ['has_reviews'],
  },
  dataContract: {
    required: [
      { field: 'reviews', type: 'tags', label: 'Reviews' },
    ],
    optional: [
      { field: 'overallRating', type: 'rating', label: 'Overall Rating' },
      { field: 'criteria', type: 'tags', label: 'Criteria Ratings' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    overallRating: 4.6,
    criteria: [
      { label: 'Product Quality', score: 4.8 },
      { label: 'On-time Delivery', score: 4.5 },
      { label: 'Packaging', score: 4.4 },
      { label: 'Communication', score: 4.7 },
    ],
    reviews: [
      { buyer: 'Fresh Eats Co.', rating: 5, comment: 'Consistently excellent produce. Never had a quality issue.', date: 'Mar 2026' },
      { buyer: 'Bay Area Bistro Group', rating: 4, comment: 'Good quality, occasional delays in peak season.', date: 'Feb 2026' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function BuyerReviewBlock({ data, theme }: BlockComponentProps) {
  const reviews: Array<Record<string, any>> = data.reviews || [];
  const criteria: Array<Record<string, any>> = data.criteria || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <MessageSquare size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Buyer Reviews</span>
        {data.overallRating && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={10} fill={theme.amber} color={theme.amber} />
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>{data.overallRating}</span>
          </span>
        )}
      </div>
      {criteria.length > 0 && (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          {criteria.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < criteria.length - 1 ? 4 : 0 }}>
              <span style={{ fontSize: 8, color: theme.t3, width: 90, flexShrink: 0 }}>{c.label}</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: theme.bg, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(c.score / 5) * 100}%`, borderRadius: 3, background: theme.accent }} />
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.t1, width: 20, textAlign: 'right' }}>{c.score}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '4px 14px 8px' }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < reviews.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{r.buyer}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} fill={s <= r.rating ? theme.amber : 'none'} color={s <= r.rating ? theme.amber : theme.t4} />)}
              </div>
            </div>
            {r.comment && <div style={{ fontSize: 9, color: theme.t2, marginTop: 3, lineHeight: 1.4 }}>{r.comment}</div>}
            {r.date && <div style={{ fontSize: 7, color: theme.t4, marginTop: 2 }}>{r.date}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
