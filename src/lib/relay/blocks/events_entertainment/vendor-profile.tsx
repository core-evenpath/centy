'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { User, MapPin } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_vendor_profile',
  family: 'people',
  label: 'Vendor Profile',
  description: 'Creative professional with specialties, travel radius, event count',
  applicableCategories: ['events', 'entertainment', 'wedding', 'photography', 'catering', 'dj', 'decor'],
  intentTriggers: {
    keywords: ['vendor', 'about', 'profile', 'who', 'photographer', 'planner', 'caterer'],
    queryPatterns: ['tell me about *', 'who is *', 'vendor profile'],
    dataConditions: ['has_vendor'],
  },
  dataContract: {
    required: [{ field: 'name', type: 'text', label: 'Vendor Name' }],
    optional: [
      { field: 'title', type: 'text', label: 'Title' },
      { field: 'specialties', type: 'tags', label: 'Specialties' },
      { field: 'travelRadius', type: 'text', label: 'Travel Radius' },
      { field: 'eventCount', type: 'number', label: 'Events Completed' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Elena Voss', title: 'Lead Photographer', specialties: ['Weddings', 'Corporate', 'Portraits'], travelRadius: '100 mi', eventCount: 312, rating: 4.9,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function VendorProfileBlock({ data, theme }: BlockComponentProps) {
  const { name, title, specialties = [], travelRadius, eventCount, rating } = data;
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 14, display: 'flex', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <User size={20} color={theme.t4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{name || 'Vendor'}</div>
        {title && <div style={{ fontSize: 10, color: theme.t3, marginTop: 1 }}>{title}</div>}
        {specialties.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
            {specialties.map((s: string) => <span key={s} style={{ fontSize: 7, padding: '2px 5px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{s}</span>)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 7, fontSize: 9, color: theme.t3 }}>
          {travelRadius && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={9} />{travelRadius}</span>}
          {eventCount && <span>{eventCount} events</span>}
          {rating && <span style={{ fontWeight: 600, color: theme.amber }}>★ {rating}</span>}
        </div>
      </div>
    </div>
  );
}
