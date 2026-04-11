'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, Thermometer } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_product_detail',
  family: 'catalog',
  label: 'Product Detail',
  description: 'Full spec sheet with case size, shelf life, storage temp, grade, tier pricing',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm', 'produce'],
  intentTriggers: {
    keywords: ['details', 'specs', 'specification', 'shelf life', 'storage', 'grade'],
    queryPatterns: ['tell me more about *', 'product details *', 'specs for *'],
    dataConditions: ['has_product_detail'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Product Name' },
    ],
    optional: [
      { field: 'sku', type: 'text', label: 'SKU' },
      { field: 'caseSize', type: 'text', label: 'Case Size' },
      { field: 'shelfLife', type: 'text', label: 'Shelf Life' },
      { field: 'storageTemp', type: 'text', label: 'Storage Temp' },
      { field: 'grade', type: 'text', label: 'Grade' },
      { field: 'tierPricing', type: 'tags', label: 'Tier Pricing' },
      { field: 'description', type: 'textarea', label: 'Description' },
    ],
  },
  variants: ['default'],
  sampleData: {
    name: 'Organic Roma Tomatoes', sku: 'TOM-ROM-5KG', caseSize: '5 kg (approx. 40 ct)',
    shelfLife: '14 days', storageTemp: '2-4 C', grade: 'Grade A',
    description: 'Hand-picked vine-ripened Roma tomatoes from certified organic farms.',
    tierPricing: [
      { min: 1, max: 49, price: 28.50 }, { min: 50, max: 199, price: 26.00 }, { min: 200, max: null, price: 23.50 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function ProductDetailBlock({ data, theme }: BlockComponentProps) {
  const tiers: Array<Record<string, any>> = data.tierPricing || [];
  const specs = [
    { label: 'Case Size', value: data.caseSize },
    { label: 'Shelf Life', value: data.shelfLife },
    { label: 'Storage', value: data.storageTemp },
    { label: 'Grade', value: data.grade },
  ].filter(s => s.value);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileText size={12} color={theme.accent} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.name}</span>
        {data.sku && <span style={{ fontSize: 9, color: theme.t4, marginLeft: 'auto' }}>{data.sku}</span>}
      </div>
      {data.description && <div style={{ padding: '8px 14px', fontSize: 10, color: theme.t2, lineHeight: 1.5 }}>{data.description}</div>}
      {specs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: theme.bdr, margin: '0 14px 10px', borderRadius: 6, overflow: 'hidden' }}>
          {specs.map(s => (
            <div key={s.label} style={{ background: theme.bg, padding: '6px 8px' }}>
              <div style={{ fontSize: 7, color: theme.t4, textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1, marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                {s.label === 'Storage' && <Thermometer size={8} color={theme.accent} />}{s.value}
              </div>
            </div>
          ))}
        </div>
      )}
      {tiers.length > 0 && (
        <div style={{ padding: '0 14px 10px' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: theme.t3, marginBottom: 4 }}>Volume Pricing</div>
          {tiers.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: i === 0 ? theme.accentBg : 'transparent', borderRadius: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: theme.t2 }}>{t.min}{t.max ? `-${t.max}` : '+'} units</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>${t.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
