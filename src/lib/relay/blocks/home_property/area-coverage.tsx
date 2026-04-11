'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Globe } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_area_coverage',
  family: 'info',
  label: 'Service Area',
  description: 'Covered neighborhoods/zip codes list with availability status dots',
  applicableCategories: ['home_property', 'home_services', 'maintenance', 'repair'],
  intentTriggers: {
    keywords: ['area', 'coverage', 'location', 'zip', 'neighborhood', 'serve', 'available'],
    queryPatterns: ['do you serve *', 'service area', 'available in *', 'coverage area'],
    dataConditions: [],
  },
  dataContract: {
    required: [
      { field: 'areas', type: 'tags', label: 'Service Areas' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Title' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Service Coverage',
    areas: [
      { name: 'Downtown', zip: '10001', available: true },
      { name: 'Midtown', zip: '10018', available: true },
      { name: 'Upper East Side', zip: '10021', available: true },
      { name: 'Brooklyn Heights', zip: '11201', available: true },
      { name: 'Long Island City', zip: '11101', available: false },
      { name: 'Jersey City', zip: '07302', available: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function AreaCoverageBlock({ data, theme }: BlockComponentProps) {
  const areas: Array<Record<string, any>> = data.areas || [];
  const available = areas.filter(a => a.available);
  const unavailable = areas.filter(a => !a.available);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Globe size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.title || 'Service Area'}</span>
        <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{available.length} areas covered</span>
      </div>
      <div style={{ padding: '4px 0' }}>
        {areas.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.available ? theme.green : theme.t4, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={9} color={theme.t4} />
              <span style={{ fontSize: 10, fontWeight: 500, color: a.available ? theme.t1 : theme.t4 }}>{a.name}</span>
            </div>
            {a.zip && <span style={{ fontSize: 8, color: theme.t4 }}>{a.zip}</span>}
            <span style={{ fontSize: 7, fontWeight: 600, textTransform: 'uppercase', color: a.available ? theme.green : theme.t4 }}>
              {a.available ? 'Active' : 'Coming soon'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
