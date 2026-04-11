'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_ride_estimate',
  family: 'rides',
  label: 'Ride Estimate',
  description: 'Vehicle tier radio with ETA, capacity, and per-ride pricing',
  applicableCategories: ['transport', 'rides', 'taxi', 'rideshare'],
  intentTriggers: {
    keywords: ['ride', 'cab', 'taxi', 'uber', 'estimate', 'fare'],
    queryPatterns: ['how much for a ride', 'ride to *', 'cab estimate *', 'taxi fare'],
    dataConditions: ['has_ride_options'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'pickup', type: 'text', label: 'Pickup Location' },
      { field: 'dropoff', type: 'text', label: 'Drop-off Location' },
      { field: 'options', type: 'tags', label: 'Vehicle Options' },
      { field: 'selected', type: 'text', label: 'Selected Vehicle' },
    ],
  },
  variants: ['default'],
  sampleData: {
    pickup: 'City Centre', dropoff: 'Airport Terminal 3',
    options: [
      { type: 'Economy', capacity: '4 pax', eta: '3 min', price: 18 },
      { type: 'Comfort', capacity: '4 pax', eta: '5 min', price: 26 },
      { type: 'XL Van', capacity: '6 pax', eta: '8 min', price: 38 },
    ],
    selected: 'Comfort',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

function fmt(n: number) { return '$' + n; }

export default function RideEstimateBlock({ data, theme }: BlockComponentProps) {
  const options: Array<Record<string, any>> = data.options || [];
  const selected = data.selected || '';
  if (!options.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {(data.pickup || data.dropoff) && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Car size={11} color={theme.t1} />
          <span style={{ fontSize: 9, color: theme.t2 }}>{data.pickup}</span>
          <span style={{ fontSize: 9, color: theme.t4 }}>&#8594;</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{data.dropoff}</span>
        </div>
      )}
      {options.map((o, i) => {
        const isSelected = o.type === selected;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < options.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: isSelected ? theme.accentBg : 'transparent', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? `5px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, flexShrink: 0, boxSizing: 'border-box' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400, color: theme.t1 }}>{o.type}</div>
              <div style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{o.capacity}</span>
                <Clock size={8} /><span>{o.eta}</span>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent }}>{fmt(o.price)}</span>
          </div>
        );
      })}
      <div style={{ padding: '8px 12px' }}>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          Request Ride — {fmt(options.find(o => o.type === selected)?.price || options[0]?.price || 0)}
        </button>
      </div>
    </div>
  );
}
