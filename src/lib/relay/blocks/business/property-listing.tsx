'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Maximize } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_property_listing',
  family: 'real_estate',
  label: 'Property Listing',
  description: 'Commercial/residential listing with area, price per sqft, and tour CTA',
  applicableCategories: ['business', 'real_estate', 'commercial', 'residential', 'property'],
  intentTriggers: {
    keywords: ['property', 'listing', 'office', 'space', 'rent', 'lease', 'buy', 'sqft'],
    queryPatterns: ['show me properties', 'available spaces', 'listings near *', 'office space *'],
    dataConditions: ['has_properties'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Property Title' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'location', type: 'text', label: 'Location' },
      { field: 'area', type: 'number', label: 'Area (sqft)' },
      { field: 'pricePerSqft', type: 'currency', label: 'Price per sqft' },
      { field: 'type', type: 'select', label: 'Type', options: ['Commercial', 'Residential', 'Mixed-Use'] },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'features', type: 'tags', label: 'Features' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { title: 'Downtown Office Suite', price: 5200, location: '123 Main St, Floor 8', area: 2400, pricePerSqft: 2.17, type: 'Commercial', badge: 'New', features: ['Parking', 'Fiber', '24/7 Access'] },
      { title: 'Creative Loft Space', price: 3800, location: '45 Arts District', area: 1800, pricePerSqft: 2.11, type: 'Mixed-Use', features: ['High Ceilings', 'Natural Light'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function PropertyListingBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [data];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{p.title}</div>
                {p.location && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={8} />{p.location}</div>}
              </div>
              {p.badge && <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 6px', borderRadius: 6 }}>{p.badge}</span>}
            </div>
          </div>
          <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(p.price)}</div>
                <div style={{ fontSize: 8, color: theme.t4 }}>/month</div>
              </div>
              {p.area && (
                <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 1, height: 24, background: theme.bdr }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1, display: 'flex', alignItems: 'center', gap: 3 }}><Maximize size={9} />{p.area.toLocaleString()}</div>
                    <div style={{ fontSize: 8, color: theme.t4 }}>sqft{p.pricePerSqft ? ` · ${fmt(p.pricePerSqft)}/sqft` : ''}</div>
                  </div>
                </div>
              )}
            </div>
            <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Schedule Tour</button>
          </div>
          {p.features?.length > 0 && (
            <div style={{ padding: '6px 12px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {p.features.map((f: string) => <span key={f} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t3, border: `1px solid ${theme.bdr}` }}>{f}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
