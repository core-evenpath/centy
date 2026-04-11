'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { LayoutGrid, ChevronRight } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_category_browser',
  family: 'catalog',
  label: 'Category Browser',
  description: 'Visual grid of home service categories with service counts',
  applicableCategories: ['home_property', 'home_services', 'maintenance'],
  intentTriggers: {
    keywords: ['categories', 'browse', 'types', 'plumbing', 'electrical', 'hvac'],
    queryPatterns: ['what categories *', 'show categories', 'browse services', 'types of *'],
    dataConditions: ['has_categories'],
  },
  dataContract: {
    required: [
      { field: 'categories', type: 'tags', label: 'Categories' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Section Title' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Service Categories',
    categories: [
      { name: 'Plumbing', icon: '🔧', count: 24 },
      { name: 'Electrical', icon: '⚡', count: 18 },
      { name: 'HVAC', icon: '❄️', count: 15 },
      { name: 'Painting', icon: '🎨', count: 12 },
      { name: 'Roofing', icon: '🏠', count: 9 },
      { name: 'Landscaping', icon: '🌿', count: 21 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function CategoryBrowserBlock({ data, theme }: BlockComponentProps) {
  const cats: Array<Record<string, any>> = data.categories || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {data.title && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
          <LayoutGrid size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.title}</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: theme.bdr }}>
        {cats.map((c, i) => (
          <div key={i} style={{ background: theme.surface, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              {c.icon || '🏠'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{c.name}</div>
              <div style={{ fontSize: 8, color: theme.t4 }}>{c.count} services</div>
            </div>
            <ChevronRight size={12} color={theme.t4} />
          </div>
        ))}
      </div>
    </div>
  );
}
