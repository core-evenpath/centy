'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { LayoutGrid, ChevronRight } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_catalog_browser',
  family: 'catalog',
  label: 'Catalog Browser',
  description: 'Category grid with SKU counts per category',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm', 'produce'],
  intentTriggers: {
    keywords: ['categories', 'catalog', 'browse', 'sections', 'departments'],
    queryPatterns: ['show categories', 'browse catalog', 'what do you carry *'],
    dataConditions: ['has_categories'],
  },
  dataContract: {
    required: [
      { field: 'categories', type: 'tags', label: 'Categories' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Header Title' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Product Catalog',
    categories: [
      { name: 'Fresh Produce', skuCount: 142, emoji: '🥬' },
      { name: 'Dairy & Eggs', skuCount: 87, emoji: '🧀' },
      { name: 'Meat & Poultry', skuCount: 63, emoji: '🥩' },
      { name: 'Seafood', skuCount: 48, emoji: '🐟' },
      { name: 'Dry Goods', skuCount: 215, emoji: '🌾' },
      { name: 'Frozen', skuCount: 96, emoji: '🧊' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function CatalogBrowserBlock({ data, theme }: BlockComponentProps) {
  const categories: Array<Record<string, any>> = data.categories || [];
  if (!categories.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {data.title && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <LayoutGrid size={14} color={theme.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.title}</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: theme.bdr }}>
        {categories.map((cat, i) => (
          <div key={i} style={{ background: theme.surface, padding: '14px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 20 }}>{cat.emoji || '📦'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{cat.name}</div>
              <div style={{ fontSize: 9, color: theme.t4, marginTop: 1 }}>{cat.skuCount} SKUs</div>
            </div>
            <ChevronRight size={12} color={theme.t4} />
          </div>
        ))}
      </div>
    </div>
  );
}
