'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, Quote } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_client_review',
  family: 'proof',
  label: 'Client Reviews',
  description: 'B2B testimonials with criteria bars and role + company context',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['reviews', 'testimonials', 'feedback', 'clients say', 'social proof'],
    queryPatterns: ['what do clients say', 'client reviews', 'testimonials', 'show reviews'],
    dataConditions: ['has_reviews'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'overallScore', type: 'rating', label: 'Overall Score' },
      { field: 'totalReviews', type: 'number', label: 'Total Reviews' },
      { field: 'criteria', type: 'tags', label: 'Rating Criteria' },
      { field: 'reviews', type: 'tags', label: 'Reviews' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    overallScore: 4.8, totalReviews: 56,
    criteria: [{ label: 'Communication', score: 4.9 }, { label: 'Expertise', score: 4.8 }, { label: 'Delivery', score: 4.7 }, { label: 'Value', score: 4.6 }],
    reviews: [
      { name: 'Lisa Tran', role: 'VP Product', company: 'Nexus Health', score: 5, text: 'Transformed our product strategy. Delivered ahead of schedule.' },
      { name: 'Mark Ellis', role: 'CEO', company: 'Spark Finance', score: 5, text: 'Exceptional strategic depth. Worth every dollar.' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function ClientReviewBlock({ data, theme }: BlockComponentProps) {
  const score = data.overallScore || 0;
  const criteria: Array<{ label: string; score: number }> = data.criteria || [];
  const reviews: Array<Record<string, any>> = data.reviews || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {score > 0 && (
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: theme.accent }}>{score.toFixed(1)}</div>
          <div>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} fill={s <= Math.round(score) ? theme.amber : 'none'} color={s <= Math.round(score) ? theme.amber : theme.t4} />)}
            </div>
            {data.totalReviews > 0 && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{data.totalReviews} client reviews</div>}
          </div>
        </div>
      )}
      {criteria.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          {criteria.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: theme.t3, width: 80 }}>{c.label}</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Quote size={9} color={theme.t4} />
            <span style={{ fontSize: 10, color: theme.t2, fontStyle: 'italic', lineHeight: 1.4 }}>{r.text}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{r.name}</span>
            <span style={{ fontSize: 8, color: theme.t4 }}>{r.role}{r.company ? `, ${r.company}` : ''}</span>
            <div style={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} fill={s <= (r.score || 0) ? theme.amber : 'none'} color={s <= (r.score || 0) ? theme.amber : theme.t4} />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
