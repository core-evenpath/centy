'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Star, MessageCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_feedback',
  family: 'social_proof',
  label: 'Community Feedback',
  description: 'Public-sector criteria bars, department-tagged feedback cards',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['feedback', 'review', 'rating', 'satisfaction', 'opinion', 'testimonial'],
    queryPatterns: ['what do residents think *', 'community feedback *', 'satisfaction rating *'],
    dataConditions: ['has_feedback'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'criteria', type: 'tags', label: 'Rating Criteria' },
      { field: 'reviews', type: 'tags', label: 'Feedback Cards' },
      { field: 'overallScore', type: 'rating', label: 'Overall Score' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    overallScore: 4.2,
    criteria: [
      { label: 'Responsiveness', score: 4.5 },
      { label: 'Clarity', score: 4.0 },
      { label: 'Accessibility', score: 3.8 },
      { label: 'Helpfulness', score: 4.4 },
    ],
    reviews: [
      { name: 'Alex P.', department: 'Permits', score: 5, text: 'Smooth online process. Got my permit in 3 days.', date: '1 week ago' },
      { name: 'Rena K.', department: 'Parks & Rec', score: 4, text: 'Great programs for kids. More weekend hours would help.', date: '2 weeks ago' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function FeedbackBlock({ data, theme }: BlockComponentProps) {
  const criteria: Array<{ label: string; score: number }> = data.criteria || [];
  const reviews: Array<Record<string, any>> = data.reviews || [];
  const overall = data.overallScore;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <MessageCircle size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Community Feedback</span>
        {overall && <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, marginLeft: 'auto' }}>{overall.toFixed(1)}</span>}
      </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{r.name}</span>
              {r.department && <span style={{ fontSize: 7, color: theme.accent, background: theme.accentBg, padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>{r.department}</span>}
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
