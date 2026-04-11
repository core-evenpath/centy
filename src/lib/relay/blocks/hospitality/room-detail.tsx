'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Bed, Heart, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_room_detail',
  family: 'detail',
  label: 'Room Detail',
  description: 'Full room view with gallery, amenities grid, policies, booking CTA',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb'],
  intentTriggers: {
    keywords: ['details', 'tell me more', 'room info', 'about this room', 'features'],
    queryPatterns: ['tell me about *', 'more about *', 'what does * include'],
    dataConditions: ['has_room_detail'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Room Name' },
      { field: 'rate', type: 'currency', label: 'Nightly Rate' },
    ],
    optional: [
      { field: 'category', type: 'text', label: 'Category' },
      { field: 'bedType', type: 'text', label: 'Bed Config' },
      { field: 'size', type: 'text', label: 'Size' },
      { field: 'floor', type: 'text', label: 'Floor' },
      { field: 'amenities', type: 'tags', label: 'Room Amenities' },
      { field: 'originalRate', type: 'currency', label: 'Original Rate' },
      { field: 'policies', type: 'tags', label: 'Policies' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'premium', 'compact'],
  sampleData: {
    name: 'Deluxe Ocean View Suite', category: 'Premium Room', bedType: 'King bed', size: '42m²', floor: 'Floor 8-12',
    rate: 289, originalRate: 340, amenities: ['Ocean View', 'AC', 'WiFi', 'Breakfast', 'Rain Shower', 'Minibar'],
    policies: ['Free cancellation 48h', 'No prepayment', 'Best price guarantee'],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function RoomDetailBlock({ data, theme }: BlockComponentProps) {
  const discount = data.originalRate && data.originalRate > data.rate ? Math.round(((data.originalRate - data.rate) / data.originalRate) * 100) : 0;
  const amenities: string[] = data.amenities || [];
  const policies: string[] = data.policies || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ height: 80, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.accent}40)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bed size={28} color={theme.accent} />
        {data.category && <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 6px', borderRadius: 4 }}>{data.category}</div>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.name || 'Room'}</div>
        <div style={{ fontSize: 10, color: theme.t3, marginTop: 2 }}>
          {[data.bedType, data.size, data.floor].filter(Boolean).join(' · ')}
        </div>
        {amenities.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
            {amenities.map(a => <span key={a} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t2, border: `1px solid ${theme.bdr}` }}>{a}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 8 }}>
          {data.originalRate > data.rate && <span style={{ fontSize: 10, color: theme.t4, textDecoration: 'line-through' }}>{fmt(data.originalRate)}</span>}
          <span style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>{fmt(data.rate || 0)}</span>
          <span style={{ fontSize: 9, color: theme.t4 }}>/night</span>
          {discount > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: theme.green, marginLeft: 'auto' }}>Save {discount}%</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Book This Room</button>
          <button style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.bdr}`, background: theme.surface, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Heart size={12} color={theme.t3} />
          </button>
        </div>
        {policies.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.bdr}`, flexWrap: 'wrap' }}>
            {policies.map(p => <span key={p} style={{ fontSize: 8, color: theme.t3, display: 'flex', alignItems: 'center', gap: 2 }}><Check size={8} color={theme.green} />{p}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
