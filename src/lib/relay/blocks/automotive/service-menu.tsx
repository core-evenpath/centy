'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Wrench, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_service_menu',
  family: 'service',
  label: 'Service Menu',
  description: 'Maintenance and repair offerings with labor time, parts, category icons',
  applicableCategories: ['automotive', 'service_center', 'mechanic', 'dealership'],
  intentTriggers: {
    keywords: ['service', 'maintenance', 'repair', 'oil change', 'brakes', 'tune-up'],
    queryPatterns: ['what services *', 'service menu', 'how much for *', 'repair options'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'services', type: 'tags', label: 'Services' },
    ],
    optional: [
      { field: 'category', type: 'text', label: 'Category' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    services: [
      { name: 'Oil & Filter Change', category: 'Maintenance', price: 49, laborTime: '30 min', parts: 'OEM Filter + Synthetic Oil' },
      { name: 'Brake Pad Replacement', category: 'Brakes', price: 189, laborTime: '1.5 hrs', parts: 'Ceramic Pads (front)' },
      { name: 'Tire Rotation & Balance', category: 'Tires', price: 39, laborTime: '45 min', parts: null },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ServiceMenuBlock({ data, theme }: BlockComponentProps) {
  const services: Array<Record<string, any>> = data.services || [];
  if (!services.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Wrench size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service Menu</span>
      </div>
      {services.map((s, i) => (
        <div key={i} style={{ padding: '10px 12px', borderBottom: i < services.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              {s.category && <span style={{ fontSize: 8, color: theme.accent, fontWeight: 600, background: theme.accentBg, padding: '1px 5px', borderRadius: 3 }}>{s.category}</span>}
              {s.laborTime && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: theme.t4 }}><Clock size={7} />{s.laborTime}</span>}
            </div>
            {s.parts && <div style={{ fontSize: 8, color: theme.t4, marginTop: 2 }}>Parts: {s.parts}</div>}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent, marginLeft: 8 }}>{fmt(s.price)}</span>
        </div>
      ))}
    </div>
  );
}
