'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Clock, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_local_experiences',
  family: 'catalog',
  label: 'Local Experiences',
  description: 'Nearby tours, activities, and excursions with booking',
  applicableCategories: ['hospitality', 'hotels', 'resorts', 'bnb', 'vacation_rental'],
  intentTriggers: {
    keywords: ['things to do', 'activities', 'tours', 'excursions', 'nearby', 'explore', 'sightseeing'],
    queryPatterns: ['what can I do', 'activities near *', 'tours available', 'things to see'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [{ field: 'items', type: 'tags', label: 'Experiences' }],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Sunset Sailing Cruise', category: 'Water', duration: '3h', price: 85, rating: 4.8, distance: '2 km' },
      { name: 'Old Town Walking Tour', category: 'Culture', duration: '2h', price: 35, rating: 4.6, distance: '1.5 km' },
      { name: 'Mountain Hiking Trail', category: 'Nature', duration: '5h', price: 45, rating: 4.7, distance: '8 km' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n; }

export default function LocalExperiencesBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((exp, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 10, padding: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: `linear-gradient(135deg, ${theme.greenBg}, ${theme.accentBg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={18} color={theme.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{exp.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {exp.category && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{exp.category}</span>}
              {exp.duration && <span style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{exp.duration}</span>}
              {exp.distance && <span style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={8} />{exp.distance}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{fmt(exp.price)}</span>
                <span style={{ fontSize: 8, color: theme.t4 }}>per person</span>
                {exp.rating && <span style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 1 }}><Star size={8} fill={theme.amber} color={theme.amber} /><span style={{ color: theme.t2, fontWeight: 600 }}>{exp.rating}</span></span>}
              </div>
              <button style={{ fontSize: 8, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '4px 10px', borderRadius: 5, cursor: 'pointer' }}>Book</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
