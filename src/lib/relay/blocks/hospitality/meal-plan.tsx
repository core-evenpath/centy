'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Utensils, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_meal_plan',
  family: 'catalog',
  label: 'Meal Plan Selector',
  description: 'RO / BB / HB / AI meal plan radio selector with pricing',
  applicableCategories: ['hospitality', 'hotels', 'resorts', 'bnb'],
  intentTriggers: {
    keywords: ['meals', 'breakfast', 'dinner', 'all inclusive', 'half board', 'dining', 'food'],
    queryPatterns: ['meal options', 'is breakfast included', 'dining plans'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'plans', type: 'tags', label: 'Meal Plans' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    plans: [
      { code: 'RO', label: 'Room Only', desc: 'No meals included', price: 0 },
      { code: 'BB', label: 'Bed & Breakfast', desc: 'Daily breakfast buffet', price: 25, popular: true },
      { code: 'HB', label: 'Half Board', desc: 'Breakfast + dinner', price: 55 },
      { code: 'AI', label: 'All Inclusive', desc: 'All meals + drinks', price: 95 },
    ],
    selected: 'BB',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return n === 0 ? 'Included' : '+$' + n + '/night'; }

export default function MealPlanBlock({ data, theme }: BlockComponentProps) {
  const plans: Array<Record<string, any>> = data.plans || [];
  const selected = data.selected || (plans.find((p: any) => p.popular)?.code) || plans[0]?.code;

  if (!plans.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Utensils size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Meal Plans</span>
      </div>
      {plans.map((p, i) => {
        const isSelected = p.code === selected;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < plans.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: isSelected ? theme.accentBg : 'transparent', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? `5px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, flexShrink: 0, boxSizing: 'border-box' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400, color: theme.t1 }}>{p.label}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: theme.t4, background: theme.bg, padding: '1px 4px', borderRadius: 3 }}>{p.code}</span>
                {p.popular && <span style={{ fontSize: 7, fontWeight: 600, color: '#fff', background: theme.accent, padding: '1px 4px', borderRadius: 3 }}>Popular</span>}
              </div>
              <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{p.desc}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: p.price === 0 ? theme.green : theme.accent }}>{fmt(p.price)}</span>
          </div>
        );
      })}
    </div>
  );
}
