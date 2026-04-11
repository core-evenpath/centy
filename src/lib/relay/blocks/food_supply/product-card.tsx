'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Package, ShieldCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_product_card',
  family: 'catalog',
  label: 'Product Card',
  description: 'Wholesale product with origin, unit size, MOQ, SKU, certification badges',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm', 'produce'],
  intentTriggers: {
    keywords: ['product', 'item', 'sku', 'wholesale', 'catalog', 'browse'],
    queryPatterns: ['show me *', 'what products *', 'browse catalog *'],
    dataConditions: ['has_products'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Product Name' },
      { field: 'unitPrice', type: 'currency', label: 'Unit Price' },
    ],
    optional: [
      { field: 'sku', type: 'text', label: 'SKU' },
      { field: 'origin', type: 'text', label: 'Origin' },
      { field: 'unitSize', type: 'text', label: 'Unit Size' },
      { field: 'moq', type: 'number', label: 'Min Order Qty' },
      { field: 'certifications', type: 'tags', label: 'Certifications' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Organic Roma Tomatoes', unitPrice: 28.50, sku: 'TOM-ROM-5KG', origin: 'California', unitSize: '5 kg case', moq: 20, certifications: ['USDA Organic', 'GAP'] },
      { name: 'Atlantic Salmon Fillet', unitPrice: 62.00, sku: 'SAL-ATL-2KG', origin: 'Norway', unitSize: '2 kg pack', moq: 10, certifications: ['MSC'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function ProductCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} color={theme.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{item.name}</div>
            <div style={{ fontSize: 9, color: theme.t4, marginTop: 2 }}>{item.sku}{item.origin ? ` · ${item.origin}` : ''}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>${item.unitPrice}</span>
              {item.unitSize && <span style={{ fontSize: 9, color: theme.t3 }}>/ {item.unitSize}</span>}
            </div>
            {item.moq && <div style={{ fontSize: 9, color: theme.t3, marginTop: 3 }}>MOQ: {item.moq} units</div>}
            {item.certifications?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {item.certifications.map((c: string) => (
                  <span key={c} style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: theme.greenBg, color: theme.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ShieldCheck size={7} /> {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
