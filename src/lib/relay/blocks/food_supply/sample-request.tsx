'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Gift, BadgeCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_sample_request',
  family: 'sales',
  label: 'Sample Request',
  description: 'Product sample selector with free-for-qualified-buyers badge',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm'],
  intentTriggers: {
    keywords: ['sample', 'try', 'taste', 'free', 'trial', 'test'],
    queryPatterns: ['can I get a sample *', 'request sample *', 'try before *'],
    dataConditions: ['has_sample_products'],
  },
  dataContract: {
    required: [
      { field: 'products', type: 'tags', label: 'Available Samples' },
    ],
    optional: [
      { field: 'qualified', type: 'toggle', label: 'Qualified Buyer' },
      { field: 'maxSamples', type: 'number', label: 'Max Samples' },
    ],
  },
  variants: ['default'],
  sampleData: {
    qualified: true, maxSamples: 3,
    products: [
      { name: 'Organic Roma Tomatoes', size: '1 kg sample', available: true },
      { name: 'Heirloom Carrot Mix', size: '500g sample', available: true },
      { name: 'Baby Arugula', size: '250g sample', available: false },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 300,
};

export default function SampleRequestBlock({ data, theme }: BlockComponentProps) {
  const products: Array<Record<string, any>> = data.products || [];
  if (!products.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Gift size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Request Samples</span>
        {data.qualified && (
          <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: theme.greenBg, color: theme.green, display: 'flex', alignItems: 'center', gap: 2 }}>
            <BadgeCheck size={8} /> Free for You
          </span>
        )}
      </div>
      {data.maxSamples && <div style={{ padding: '4px 14px', fontSize: 9, color: theme.t3 }}>Select up to {data.maxSamples} samples</div>}
      <div style={{ padding: '4px 14px 10px' }}>
        {products.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < products.length - 1 ? `1px solid ${theme.bdr}` : 'none', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: p.available ? theme.t1 : theme.t4 }}>{p.name}</div>
              <div style={{ fontSize: 8, color: theme.t4 }}>{p.size}</div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: p.available ? 'pointer' : 'default', background: p.available ? theme.accent : theme.bg, color: p.available ? '#fff' : theme.t4, border: p.available ? 'none' : `1px solid ${theme.bdr}` }}>
              {p.available ? 'Request' : 'Unavailable'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
