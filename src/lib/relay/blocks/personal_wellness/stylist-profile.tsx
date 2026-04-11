'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { User, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_stylist_profile',
  family: 'people',
  label: 'Stylist / Therapist Profile',
  description: 'Staff card with specialties, session count, and rating',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage'],
  intentTriggers: {
    keywords: ['stylist', 'therapist', 'staff', 'team', 'specialist', 'who'],
    queryPatterns: ['who is *', 'show me stylists', 'available therapists'],
    dataConditions: ['has_staff'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Staff Name' },
    ],
    optional: [
      { field: 'role', type: 'text', label: 'Role' },
      { field: 'specialties', type: 'tags', label: 'Specialties' },
      { field: 'sessions', type: 'number', label: 'Session Count' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
      { field: 'bio', type: 'textarea', label: 'Bio' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Maria Santos', role: 'Senior Stylist', specialties: ['Balayage', 'Color', 'Curly Hair'], sessions: 1240, rating: 4.9 },
      { name: 'David Chen', role: 'Massage Therapist', specialties: ['Deep Tissue', 'Sports'], sessions: 860, rating: 4.8 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function StylistProfileBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || (data.name ? [data] : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={20} color={theme.t4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{s.name}</div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{s.role}</div>
            {s.specialties?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                {s.specialties.map((sp: string) => <span key={sp} style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.accentBg, color: theme.accent }}>{sp}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {s.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={10} fill={theme.amber} color={theme.amber} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{s.rating}</span>
                </div>
              )}
              {s.sessions && <span style={{ fontSize: 9, color: theme.t3 }}>{s.sessions.toLocaleString()} sessions</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
