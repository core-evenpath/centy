'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calculator, Truck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_quote_builder',
  family: 'logistics',
  label: 'Quote / Rate Calculator',
  description: 'Service type selector, route, weight, speed tiers with pricing',
  applicableCategories: ['transport', 'logistics', 'courier', 'shipping', 'freight'],
  intentTriggers: {
    keywords: ['quote', 'rate', 'estimate', 'shipping cost', 'freight rate', 'calculator'],
    queryPatterns: ['how much to ship *', 'get a quote', 'shipping rate *', 'freight estimate'],
    dataConditions: ['has_route'],
  },
  dataContract: {
    required: [
      { field: 'from', type: 'text', label: 'Origin' },
      { field: 'to', type: 'text', label: 'Destination' },
    ],
    optional: [
      { field: 'weight', type: 'text', label: 'Weight' },
      { field: 'serviceType', type: 'select', label: 'Service Type', options: ['Parcel', 'Pallet', 'Container'] },
      { field: 'tiers', type: 'tags', label: 'Speed Tiers' },
    ],
  },
  variants: ['default'],
  sampleData: {
    from: 'New York', to: 'London', weight: '12 kg', serviceType: 'Parcel',
    tiers: [
      { speed: 'Express', days: '2-3 days', price: 185, badge: 'Fastest' },
      { speed: 'Standard', days: '5-7 days', price: 92 },
      { speed: 'Economy', days: '10-14 days', price: 48 },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 120,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function QuoteBuilderBlock({ data, theme }: BlockComponentProps) {
  const tiers: Array<Record<string, any>> = data.tiers || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calculator size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Rate Quote</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Truck size={10} color={theme.t4} />
        <span style={{ fontSize: 9, color: theme.t2 }}>{data.from}</span>
        <span style={{ fontSize: 9, color: theme.t4 }}>&#8594;</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{data.to}</span>
        {data.weight && <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{data.weight}</span>}
        {data.serviceType && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{data.serviceType}</span>}
      </div>
      {tiers.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < tiers.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{t.speed}</span>
              {t.badge && <span style={{ fontSize: 7, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 4px', borderRadius: 3 }}>{t.badge}</span>}
            </div>
            <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{t.days}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{fmt(t.price)}</span>
          </div>
          <button style={{ fontSize: 8, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '4px 8px', borderRadius: 5, cursor: 'pointer' }}>Select</button>
        </div>
      ))}
    </div>
  );
}
