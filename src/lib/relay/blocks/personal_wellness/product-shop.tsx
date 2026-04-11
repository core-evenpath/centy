'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShoppingBag, Droplets } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_product_shop',
  family: 'retail',
  label: 'Retail Products',
  description: 'Skincare and hair product cards with brand, size, and pricing',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'skincare'],
  intentTriggers: {
    keywords: ['products', 'shop', 'skincare', 'retail', 'buy', 'shampoo'],
    queryPatterns: ['shop products', 'recommended products *', 'skincare routine'],
    dataConditions: ['has_products'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Product Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'brand', type: 'text', label: 'Brand' },
      { field: 'size', type: 'text', label: 'Size' },
      { field: 'category', type: 'text', label: 'Category' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Hydrating Serum', brand: 'Derma Lab', size: '30ml', price: 48, category: 'Skincare' },
      { name: 'Repair Shampoo', brand: 'Olaplex', size: '250ml', price: 32, category: 'Hair Care' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ProductShopBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <ShoppingBag size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No products available</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: 56, background: `linear-gradient(135deg, ${theme.bg}, ${theme.accentBg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={18} color={theme.t4} />
          </div>
          <div style={{ padding: '6px 8px' }}>
            {p.brand && <div style={{ fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.brand}</div>}
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1, marginTop: 1 }}>{p.name}</div>
            {p.size && <div style={{ fontSize: 8, color: theme.t3, marginTop: 1 }}>{p.size}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{fmt(p.price)}</span>
              <button style={{ fontSize: 7, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
