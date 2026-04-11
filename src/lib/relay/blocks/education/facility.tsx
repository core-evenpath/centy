'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Building2, ExternalLink } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_facility',
  family: 'info',
  label: 'Campus / Facility',
  description: 'Campus photo grid placeholders, facility list with virtual tour link',
  applicableCategories: ['education', 'coaching', 'training', 'academy', 'school'],
  intentTriggers: {
    keywords: ['campus', 'facility', 'infrastructure', 'lab', 'library', 'tour', 'location'],
    queryPatterns: ['campus tour', 'show facilities', 'where is the campus', 'what facilities *'],
    dataConditions: ['has_facility'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'name', type: 'text', label: 'Campus Name' },
      { field: 'address', type: 'text', label: 'Address' },
      { field: 'facilities', type: 'tags', label: 'Facility List' },
      { field: 'tourUrl', type: 'url', label: 'Virtual Tour Link' },
      { field: 'images', type: 'images', label: 'Campus Photos' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Centy Academy — Koramangala', address: '3rd Block, Koramangala, Bangalore 560034',
    facilities: ['Smart Classrooms', 'Computer Lab', 'Library', 'Cafeteria', 'Parking', 'Wi-Fi Campus'],
    tourUrl: 'https://example.com/tour',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function FacilityBlock({ data, theme }: BlockComponentProps) {
  const facilities: string[] = data.facilities || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 52, borderRadius: i === 0 ? '10px 0 0 0' : i === 2 ? '0 10px 0 0' : 0, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color={theme.t4} />
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.name || 'Campus'}</div>
        {data.address && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{data.address}</div>}
        {facilities.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap' }}>
            {facilities.map(f => <span key={f} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t2, border: `1px solid ${theme.bdr}` }}>{f}</span>)}
          </div>
        )}
        {data.tourUrl && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 600, color: theme.accent, cursor: 'pointer' }}>
            <ExternalLink size={10} /> Take a Virtual Tour
          </div>
        )}
      </div>
    </div>
  );
}
