'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Sparkles, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_service_card',
  family: 'catalog',
  label: 'Service Card',
  description: 'Event service with category, duration, starting price, booking count',
  applicableCategories: ['events', 'entertainment', 'wedding', 'catering', 'dj', 'photography'],
  intentTriggers: {
    keywords: ['services', 'offerings', 'what do you offer', 'packages', 'event services'],
    queryPatterns: ['show me services', 'what services *', 'do you offer *'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Service Name' },
      { field: 'price', type: 'currency', label: 'Starting Price' },
    ],
    optional: [
      { field: 'category', type: 'text', label: 'Category' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'bookings', type: 'number', label: 'Booking Count' },
      { field: 'description', type: 'text', label: 'Description' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Full-Day Photography', category: 'Photography', duration: '8 hrs', price: 2500, bookings: 134, description: 'Complete event coverage with edited gallery' },
      { name: 'Live DJ Set', category: 'Music', duration: '5 hrs', price: 1200, bookings: 89, description: 'Custom playlist, MC duties, sound system included' },
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
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No services listed</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color={theme.t4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{s.name}</span>
              {s.category && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{s.category}</span>}
            </div>
            {s.description && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{s.description}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {s.duration && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: theme.t3 }}><Clock size={8} />{s.duration}</span>}
              {s.bookings && <span style={{ fontSize: 8, color: theme.t4 }}>{s.bookings} booked</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>From {fmt(s.price)}</span>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Inquire</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
