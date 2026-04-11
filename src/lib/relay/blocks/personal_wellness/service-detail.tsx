'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Heart, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_service_detail',
  family: 'catalog',
  label: 'Service Detail',
  description: 'Full service view with benefits list, duration, pressure level, and treatment area',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage', 'skincare'],
  intentTriggers: {
    keywords: ['details', 'about', 'benefits', 'treatment info', 'service info'],
    queryPatterns: ['tell me about *', 'what does * include', 'details on *'],
    dataConditions: ['has_service_detail'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Service Name' },
    ],
    optional: [
      { field: 'description', type: 'textarea', label: 'Description' },
      { field: 'benefits', type: 'tags', label: 'Benefits' },
      { field: 'duration', type: 'number', label: 'Duration (min)' },
      { field: 'pressure', type: 'text', label: 'Pressure Level' },
      { field: 'area', type: 'text', label: 'Treatment Area' },
      { field: 'price', type: 'currency', label: 'Price' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Hot Stone Massage', description: 'Heated basalt stones melt tension while therapist works deep muscle layers.', benefits: ['Relieves muscle tension', 'Improves circulation', 'Reduces stress'], duration: 75, pressure: 'Medium-Firm', area: 'Full Body', price: 150,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function ServiceDetailBlock({ data, theme }: BlockComponentProps) {
  const benefits: string[] = data.benefits || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.t1 }}>{data.name}</div>
        {data.description && <div style={{ fontSize: 10, color: theme.t2, marginTop: 4, lineHeight: 1.5 }}>{data.description}</div>}
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', gap: 12, borderBottom: `1px solid ${theme.bdr}` }}>
        {data.duration && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color={theme.accent} />
            <span style={{ fontSize: 9, color: theme.t2 }}>{data.duration} min</span>
          </div>
        )}
        {data.pressure && <span style={{ fontSize: 9, color: theme.t2 }}>Pressure: <b>{data.pressure}</b></span>}
        {data.area && <span style={{ fontSize: 9, color: theme.t2 }}>Area: <b>{data.area}</b></span>}
      </div>
      {benefits.length > 0 && (
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Benefits</div>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Heart size={9} color={theme.green} />
              <span style={{ fontSize: 10, color: theme.t2 }}>{b}</span>
            </div>
          ))}
        </div>
      )}
      {data.price && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>${data.price}</span>
          <button style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>Book Now</button>
        </div>
      )}
    </div>
  );
}
