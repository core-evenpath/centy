'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Package, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_event_package',
  family: 'packages',
  label: 'Event Package',
  description: 'Bundled service with guest capacity, coverage hours, vendor count, savings',
  applicableCategories: ['events', 'entertainment', 'wedding', 'corporate', 'party'],
  intentTriggers: {
    keywords: ['package', 'bundle', 'all-in-one', 'combo', 'deal'],
    queryPatterns: ['show packages', 'what packages *', 'bundle for *'],
    dataConditions: ['has_packages'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Package Name' },
      { field: 'price', type: 'currency', label: 'Package Price' },
    ],
    optional: [
      { field: 'guestCapacity', type: 'number', label: 'Guest Capacity' },
      { field: 'hours', type: 'number', label: 'Coverage Hours' },
      { field: 'vendorCount', type: 'number', label: 'Vendors Included' },
      { field: 'savings', type: 'currency', label: 'Savings' },
      { field: 'includes', type: 'tags', label: 'Included Services' },
      { field: 'popular', type: 'toggle', label: 'Popular' },
    ],
  },
  variants: ['default', 'compact', 'premium'],
  sampleData: {
    items: [
      { name: 'Essential', price: 4500, guestCapacity: 100, hours: 6, vendorCount: 3, includes: ['Photography', 'DJ', 'Florals'] },
      { name: 'Premium', price: 8900, guestCapacity: 200, hours: 10, vendorCount: 6, savings: 1200, includes: ['Photography', 'Video', 'DJ', 'Florals', 'Catering', 'Decor'], popular: true },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function EventPackageBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: p.popular ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, position: 'relative' }}>
          {p.popular && <div style={{ position: 'absolute', top: -8, left: 14, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>Most Popular</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{p.name}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(p.price)}</span>
              {p.savings && <div style={{ fontSize: 8, color: theme.green, fontWeight: 600 }}>Save {fmt(p.savings)}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 9, color: theme.t3 }}>
            {p.guestCapacity && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Users size={9} />Up to {p.guestCapacity}</span>}
            {p.hours && <span>{p.hours} hrs coverage</span>}
            {p.vendorCount && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Package size={9} />{p.vendorCount} vendors</span>}
          </div>
          {p.includes?.length > 0 && (
            <div style={{ display: 'flex', gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
              {p.includes.map((s: string) => <span key={s} style={{ fontSize: 7, padding: '2px 5px', borderRadius: 4, background: theme.bg, color: theme.t3 }}>{s}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
