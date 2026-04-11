'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Bed, Users, Wifi, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_room_card',
  family: 'catalog',
  label: 'Room / Unit Card',
  description: 'Browsable room card with bed type, rate, occupancy, amenities',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb'],
  intentTriggers: {
    keywords: ['rooms', 'browse', 'availability', 'stay', 'accommodation', 'suite'],
    queryPatterns: ['show me rooms', 'what rooms *', 'do you have *', 'room options'],
    dataConditions: ['has_rooms'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Room Name' },
      { field: 'rate', type: 'currency', label: 'Nightly Rate' },
    ],
    optional: [
      { field: 'bedType', type: 'text', label: 'Bed Type' },
      { field: 'size', type: 'text', label: 'Room Size' },
      { field: 'maxGuests', type: 'number', label: 'Max Guests' },
      { field: 'amenities', type: 'tags', label: 'Amenities' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'originalRate', type: 'currency', label: 'Original Rate' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact', 'premium'],
  sampleData: {
    items: [
      { name: 'Deluxe Ocean View', bedType: 'King', size: '42m²', rate: 289, originalRate: 340, maxGuests: 2, amenities: ['Ocean View', 'AC', 'WiFi', 'Breakfast'], badge: 'Most Popular', rating: 4.7 },
      { name: 'Garden Suite', bedType: 'Twin', size: '38m²', rate: 219, maxGuests: 2, amenities: ['Garden', 'AC', 'WiFi'], rating: 4.4 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function RoomCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Bed size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No rooms available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((r, i) => {
        const discount = r.originalRate && r.originalRate > r.rate ? Math.round(((r.originalRate - r.rate) / r.originalRate) * 100) : 0;
        return (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 10, padding: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <Bed size={20} color={theme.t4} />
              {r.badge && <div style={{ position: 'absolute', top: -4, right: -8, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 6 }}>{r.badge}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{r.name}</div>
              <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{r.bedType}{r.size ? ` · ${r.size}` : ''}{r.maxGuests ? ` · Max ${r.maxGuests}` : ''}</div>
              {r.amenities?.length > 0 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {r.amenities.slice(0, 4).map((a: string) => <span key={a} style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: theme.bg, color: theme.t3 }}>{a}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(r.rate)}</span>
                  {r.originalRate && r.originalRate > r.rate && <span style={{ fontSize: 9, color: theme.t4, textDecoration: 'line-through' }}>{fmt(r.originalRate)}</span>}
                  <span style={{ fontSize: 8, color: theme.t4 }}>/night</span>
                  {discount > 0 && <span style={{ fontSize: 8, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 4px', borderRadius: 3 }}>-{discount}%</span>}
                </div>
                <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Book</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
