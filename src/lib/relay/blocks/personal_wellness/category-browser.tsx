'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Grid3X3, Sparkles } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_category_browser',
  family: 'catalog',
  label: 'Category Browser',
  description: 'Visual grid of service categories (Hair, Nails, Spa, etc) with item counts',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage', 'skincare'],
  intentTriggers: {
    keywords: ['categories', 'browse', 'explore', 'types', 'menu'],
    queryPatterns: ['what categories *', 'show categories', 'browse services'],
    dataConditions: ['has_categories'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'categories', type: 'tags', label: 'Categories' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    categories: [
      { name: 'Hair', emoji: '💇', count: 24 },
      { name: 'Nails', emoji: '💅', count: 18 },
      { name: 'Spa & Massage', emoji: '🧖', count: 15 },
      { name: 'Skincare', emoji: '✨', count: 12 },
      { name: 'Waxing', emoji: '🪒', count: 8 },
      { name: 'Lashes & Brows', emoji: '👁', count: 10 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function CategoryBrowserBlock({ data, theme }: BlockComponentProps) {
  const cats: Array<Record<string, any>> = data.categories || [];
  if (!cats.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Grid3X3 size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No categories</div>
    </div>
  );

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Sparkles size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Browse Categories</span>
      </div>
      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {cats.map((c, i) => (
          <div key={i} style={{ background: theme.bg, borderRadius: 8, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', border: `1px solid ${theme.bdr}` }}>
            <div style={{ fontSize: 20 }}>{c.emoji || '✦'}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1, marginTop: 4 }}>{c.name}</div>
            {c.count != null && <div style={{ fontSize: 8, color: theme.t4, marginTop: 2 }}>{c.count} services</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
