'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_venue_card',
  family: 'venues',
  label: 'Venue Card',
  description: 'Event venue with capacity, area, pricing, amenity list',
  applicableCategories: ['events', 'entertainment', 'wedding', 'corporate', 'venues', 'party'],
  intentTriggers: {
    keywords: ['venue', 'location', 'space', 'hall', 'ballroom', 'garden venue'],
    queryPatterns: ['show me venues', 'venue options', 'where can we hold *'],
    dataConditions: ['has_venues'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Venue Name' },
      { field: 'price', type: 'currency', label: 'Rental Price' },
    ],
    optional: [
      { field: 'capacity', type: 'number', label: 'Guest Capacity' },
      { field: 'area', type: 'text', label: 'Area' },
      { field: 'amenities', type: 'tags', label: 'Amenities' },
      { field: 'location', type: 'text', label: 'Location' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'The Grand Terrace', price: 5500, capacity: 250, area: '4,200 sq ft', location: 'Downtown', amenities: ['Outdoor', 'Catering Kitchen', 'Parking', 'AV System'] },
      { name: 'Lakeside Pavilion', price: 3200, capacity: 120, area: '2,800 sq ft', location: 'Waterfront', amenities: ['Waterfront', 'Tents', 'Restrooms'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function VenueCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((v, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={20} color={theme.t4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{v.name}</div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>
              {v.location}{v.area ? ` · ${v.area}` : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 9, color: theme.t3 }}>
              {v.capacity && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Users size={9} />Up to {v.capacity}</span>}
            </div>
            {v.amenities?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                {v.amenities.slice(0, 4).map((a: string) => <span key={a} style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: theme.bg, color: theme.t3 }}>{a}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(v.price)}</span>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Tour</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
