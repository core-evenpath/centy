'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { PartyPopper, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_catering',
  family: 'events',
  label: 'Catering Package',
  description: 'Event catering with per-head pricing, minimum order, inclusions',
  applicableCategories: ['food_beverage', 'restaurant', 'catering', 'events'],
  intentTriggers: {
    keywords: ['catering', 'event', 'party', 'corporate', 'buffet', 'package'],
    queryPatterns: ['catering for *', 'event packages', 'party catering', 'corporate menu'],
    dataConditions: ['has_catering_packages'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Package Name' },
      { field: 'pricePerHead', type: 'currency', label: 'Price Per Head' },
    ],
    optional: [
      { field: 'minGuests', type: 'number', label: 'Minimum Guests' },
      { field: 'inclusions', type: 'tags', label: 'Inclusions' },
      { field: 'description', type: 'text', label: 'Description' },
      { field: 'badge', type: 'text', label: 'Badge' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Silver Package', pricePerHead: 45, minGuests: 20, badge: 'Popular', inclusions: ['3-Course Menu', 'Welcome Drinks', 'Table Setup', 'Service Staff'] },
      { name: 'Gold Package', pricePerHead: 75, minGuests: 15, inclusions: ['5-Course Menu', 'Open Bar 3hrs', 'Table Setup', 'Floral Decor', 'Service Staff', 'DJ Setup'] },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toFixed(0); }

export default function CateringBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || (data.name ? [data] : []);
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((pkg, i) => {
        const inclusions: string[] = pkg.inclusions || [];
        return (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PartyPopper size={14} color={theme.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{pkg.name}</span>
                {pkg.badge && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 5px', borderRadius: 4 }}>{pkg.badge}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>{fmt(pkg.pricePerHead)}<span style={{ fontSize: 9, fontWeight: 400, color: theme.t4 }}>/head</span></div>
              </div>
            </div>
            {pkg.minGuests && (
              <div style={{ padding: '6px 14px', background: theme.amberBg, fontSize: 9, color: theme.amber, fontWeight: 600 }}>
                Minimum {pkg.minGuests} guests
              </div>
            )}
            {inclusions.length > 0 && (
              <div style={{ padding: '10px 14px' }}>
                {inclusions.map((inc, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                    <Check size={10} color={theme.green} />
                    <span style={{ fontSize: 10, color: theme.t2 }}>{inc}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ padding: '8px 14px 12px' }}>
              <button style={{ width: '100%', padding: '8px', borderRadius: 8, background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Enquire Now
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
