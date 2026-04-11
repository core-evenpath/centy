'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Wrench, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_service_card',
  family: 'catalog',
  label: 'Service Card',
  description: 'Home service card with category, duration, starting price, booking count',
  applicableCategories: ['home_property', 'home_services', 'maintenance', 'repair'],
  intentTriggers: {
    keywords: ['service', 'repair', 'install', 'fix', 'maintenance', 'home service'],
    queryPatterns: ['what services *', 'show me services', 'available services'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Service Name' },
      { field: 'startingPrice', type: 'currency', label: 'Starting Price' },
    ],
    optional: [
      { field: 'category', type: 'text', label: 'Category' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'bookingCount', type: 'number', label: 'Bookings' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
      { field: 'badge', type: 'text', label: 'Badge' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Full AC Tune-Up', category: 'HVAC', duration: '1-2 hrs', startingPrice: 129, bookingCount: 482, badge: 'Popular' },
      { name: 'Drain Cleaning', category: 'Plumbing', duration: '30-60 min', startingPrice: 89, bookingCount: 315 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ServiceCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Wrench size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No services available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, display: 'flex', gap: 10, padding: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <Wrench size={18} color={theme.t4} />
            {s.badge && <div style={{ position: 'absolute', top: -4, right: -8, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 6 }}>{s.badge}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{s.name}</div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>
              {s.category}{s.duration ? ` · ${s.duration}` : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              {s.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: theme.t4 }}><Clock size={8} />{s.duration}</span>}
              {s.bookingCount && <span style={{ fontSize: 8, color: theme.t4 }}>{s.bookingCount.toLocaleString()} bookings</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
              <div>
                <span style={{ fontSize: 8, color: theme.t4 }}>from </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(s.startingPrice)}</span>
              </div>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Book</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
