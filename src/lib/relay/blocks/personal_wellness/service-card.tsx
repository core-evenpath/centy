'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Sparkles, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_service_card',
  family: 'catalog',
  label: 'Service Card',
  description: 'Treatment or service card with duration, category, pricing, and booking count',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage', 'skincare'],
  intentTriggers: {
    keywords: ['services', 'treatments', 'menu', 'offerings', 'pricing'],
    queryPatterns: ['what services *', 'show me treatments', 'service menu'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Service Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'duration', type: 'number', label: 'Duration (min)' },
      { field: 'category', type: 'text', label: 'Category' },
      { field: 'bookings', type: 'number', label: 'Booking Count' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Deep Tissue Massage', category: 'Massage', price: 120, duration: 60, bookings: 342, badge: 'Popular' },
      { name: 'Classic Facial', category: 'Skincare', price: 85, duration: 45, bookings: 218 },
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
      <Sparkles size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No services available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <Sparkles size={18} color={theme.t4} />
            {s.badge && <div style={{ position: 'absolute', top: -4, right: -8, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 6 }}>{s.badge}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{s.name}</div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>
              {s.category}{s.duration ? ` · ${s.duration} min` : ''}{s.bookings ? ` · ${s.bookings} booked` : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} color={theme.t4} />
                <span style={{ fontSize: 9, color: theme.t3 }}>{s.duration || 60} min</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(s.price)}</span>
                <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Book</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
