'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { DollarSign, TrendingDown } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_wholesale_pricing',
  family: 'pricing',
  label: 'Wholesale Pricing',
  description: 'Tiered pricing table with volume brackets and percentage savings',
  applicableCategories: ['food_supply', 'wholesale', 'distributor'],
  intentTriggers: {
    keywords: ['pricing', 'price', 'tiers', 'volume', 'discount', 'wholesale'],
    queryPatterns: ['what are the prices *', 'volume pricing *', 'bulk discount *'],
    dataConditions: ['has_pricing_tiers'],
  },
  dataContract: {
    required: [
      { field: 'productName', type: 'text', label: 'Product Name' },
      { field: 'tiers', type: 'tags', label: 'Pricing Tiers' },
    ],
    optional: [
      { field: 'basePrice', type: 'currency', label: 'Base Price' },
      { field: 'unit', type: 'text', label: 'Unit' },
    ],
  },
  variants: ['default'],
  sampleData: {
    productName: 'Organic Roma Tomatoes', basePrice: 32.00, unit: 'case',
    tiers: [
      { min: 1, max: 24, price: 32.00, savings: 0 },
      { min: 25, max: 99, price: 28.50, savings: 11 },
      { min: 100, max: 499, price: 26.00, savings: 19 },
      { min: 500, max: null, price: 23.50, savings: 27 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function WholesalePricingBlock({ data, theme }: BlockComponentProps) {
  const tiers: Array<Record<string, any>> = data.tiers || [];
  if (!tiers.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <DollarSign size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{data.productName}</span>
        {data.unit && <span style={{ fontSize: 9, color: theme.t4, marginLeft: 'auto' }}>per {data.unit}</span>}
      </div>
      <div style={{ padding: '6px 14px' }}>
        <div style={{ display: 'flex', padding: '4px 0', borderBottom: `1px solid ${theme.bdr}` }}>
          <span style={{ flex: 2, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase' }}>Volume</span>
          <span style={{ flex: 1, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', textAlign: 'right' }}>Price</span>
          <span style={{ width: 50, fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', textAlign: 'right' }}>Savings</span>
        </div>
        {tiers.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: i < tiers.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <span style={{ flex: 2, fontSize: 10, color: theme.t1, fontWeight: 500 }}>{t.min}{t.max ? `-${t.max}` : '+'} units</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: theme.accent, textAlign: 'right' }}>${t.price}</span>
            <span style={{ width: 50, textAlign: 'right' }}>
              {t.savings > 0 ? (
                <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: theme.greenBg, color: theme.green, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <TrendingDown size={7} />{t.savings}%
                </span>
              ) : <span style={{ fontSize: 8, color: theme.t4 }}>Base</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
