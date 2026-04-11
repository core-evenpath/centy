'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_tour_package',
  family: 'catalog',
  label: 'Tour / Trip Package',
  description: 'Travel package cards with destination, duration, category, pricing, ratings',
  applicableCategories: ['travel', 'tours', 'transport', 'agencies', 'holidays'],
  intentTriggers: {
    keywords: ['tour', 'package', 'trip', 'holiday', 'vacation', 'travel deal'],
    queryPatterns: ['show me tours', 'travel packages *', 'trip to *', 'holiday deals'],
    dataConditions: ['has_packages'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Package Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'destination', type: 'text', label: 'Destination' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'category', type: 'text', label: 'Category' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Bali Explorer', destination: 'Bali, Indonesia', duration: '7 nights', category: 'Beach', price: 1299, rating: 4.8, badge: 'Best Seller' },
      { name: 'Swiss Alps Retreat', destination: 'Interlaken, Switzerland', duration: '5 nights', category: 'Adventure', price: 2450, rating: 4.6 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function TourPackageBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <MapPin size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No packages available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, display: 'flex', gap: 10, padding: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <MapPin size={20} color={theme.t4} />
            {p.badge && <div style={{ position: 'absolute', top: -4, right: -8, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 6 }}>{p.badge}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{p.name}</div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{p.destination}{p.duration ? ` · ${p.duration}` : ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              {p.category && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{p.category}</span>}
              {p.rating && <span style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 1 }}><Star size={8} fill={theme.amber} color={theme.amber} /><span style={{ color: theme.t2, fontWeight: 600 }}>{p.rating}</span></span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(p.price)}</span>
                <span style={{ fontSize: 8, color: theme.t4 }}>per person</span>
              </div>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>View</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
