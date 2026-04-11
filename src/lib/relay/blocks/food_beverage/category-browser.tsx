'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { LayoutGrid, ChevronRight } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_category_browser',
  family: 'menu',
  label: 'Category Browser',
  description: 'Visual grid of menu sections with item counts',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'cloud_kitchen', 'bakery'],
  intentTriggers: {
    keywords: ['categories', 'sections', 'menu sections', 'starters', 'mains', 'desserts'],
    queryPatterns: ['show menu categories', 'what sections *', 'browse by category'],
    dataConditions: ['has_categories'],
  },
  dataContract: {
    required: [
      { field: 'categories', type: 'tags', label: 'Menu Categories' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Header Title' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Our Menu',
    categories: [
      { name: 'Starters', count: 12, emoji: '🥗' },
      { name: 'Mains', count: 18, emoji: '🍽️' },
      { name: 'Pasta & Risotto', count: 8, emoji: '🍝' },
      { name: 'Grills', count: 10, emoji: '🥩' },
      { name: 'Desserts', count: 9, emoji: '🍰' },
      { name: 'Beverages', count: 24, emoji: '🍹' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function CategoryBrowserBlock({ data, theme }: BlockComponentProps) {
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
            <div style={{ fontSize: 20 }}>{cat.emoji || '🍴'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{cat.name}</div>
              <div style={{ fontSize: 9, color: theme.t4, marginTop: 1 }}>{cat.count} items</div>
            </div>
            <ChevronRight size={12} color={theme.t4} />
          </div>
        ))}
      </div>
    </div>
  );
}
