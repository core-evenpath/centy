'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Users, HandHeart } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_volunteer',
  family: 'community',
  label: 'Volunteer Sign-up',
  description: 'Interest area multi-select tags, availability selector, sign-up CTA',
  applicableCategories: ['nonprofit', 'charity', 'community', 'government'],
  intentTriggers: {
    keywords: ['volunteer', 'sign up', 'help', 'join', 'give time', 'serve'],
    queryPatterns: ['how can I volunteer *', 'I want to help *', 'sign up to volunteer'],
    dataConditions: ['accepts_volunteers'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'interests', type: 'tags', label: 'Interest Areas' },
      { field: 'availability', type: 'tags', label: 'Availability Slots' },
      { field: 'spotsLeft', type: 'number', label: 'Spots Remaining' },
    ],
  },
  variants: ['default'],
  sampleData: {
    interests: ['Tutoring', 'Food Bank', 'Park Clean-Up', 'Event Support', 'Admin', 'Mentoring'],
    availability: ['Weekday Mornings', 'Weekday Evenings', 'Weekends'],
    spotsLeft: 12,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function VolunteerBlock({ data, theme }: BlockComponentProps) {
  const interests: string[] = data.interests || [];
  const availability: string[] = data.availability || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <HandHeart size={14} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Volunteer Sign-up</span>
        {data.spotsLeft != null && <span style={{ fontSize: 9, color: theme.green, marginLeft: 'auto', fontWeight: 600 }}>{data.spotsLeft} spots left</span>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        {interests.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Interests</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {interests.map(t => (
                <span key={t} style={{ fontSize: 9, color: theme.t2, background: theme.bg, border: `1px solid ${theme.bdr}`, padding: '3px 8px', borderRadius: 5, cursor: 'pointer' }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        {availability.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Availability</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {availability.map(a => (
                <div key={a} style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: `1px solid ${theme.bdr}`, fontSize: 9, color: theme.t2, textAlign: 'center', cursor: 'pointer' }}>{a}</div>
              ))}
            </div>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Users size={12} /> Sign Up to Volunteer
        </button>
      </div>
    </div>
  );
}
