'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Filter, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_dietary_filter',
  family: 'preferences',
  label: 'Dietary Filter',
  description: 'Multi-select dietary tag filter with matched-item count',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'cloud_kitchen', 'bakery'],
  intentTriggers: {
    keywords: ['dietary', 'vegan', 'vegetarian', 'gluten free', 'halal', 'allergy', 'filter'],
    queryPatterns: ['filter by *', 'show vegan *', 'gluten free options', 'do you have halal'],
    dataConditions: ['has_dietary_options'],
  },
  dataContract: {
    required: [
      { field: 'filters', type: 'tags', label: 'Dietary Filters' },
    ],
    optional: [
      { field: 'totalItems', type: 'number', label: 'Total Menu Items' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    totalItems: 64,
    filters: [
      { label: 'Vegetarian', count: 22, active: false },
      { label: 'Vegan', count: 14, active: true },
      { label: 'Gluten-Free', count: 18, active: false },
      { label: 'Halal', count: 30, active: false },
      { label: 'Nut-Free', count: 42, active: false },
      { label: 'Dairy-Free', count: 16, active: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function DietaryFilterBlock({ data, theme }: BlockComponentProps) {
  const filters: Array<Record<string, any>> = data.filters || [];
  const activeCount = filters.filter(f => f.active).length;
  const matchedCount = activeCount > 0 ? filters.filter(f => f.active).reduce((min, f) => Math.min(min, f.count), Infinity) : data.totalItems || 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={12} color={theme.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>Dietary Preferences</span>
        </div>
        <span style={{ fontSize: 9, color: theme.accent, fontWeight: 600 }}>{matchedCount} items match</span>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {filters.map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
            background: f.active ? theme.accentBg : theme.bg,
            border: `1px solid ${f.active ? theme.accent : theme.bdr}`,
          }}>
            {f.active && <Check size={10} color={theme.accent} strokeWidth={3} />}
            <span style={{ fontSize: 10, fontWeight: f.active ? 600 : 400, color: f.active ? theme.accent : theme.t2 }}>{f.label}</span>
            <span style={{ fontSize: 8, color: theme.t4 }}>({f.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
