'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { PackageCheck, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_combo_meal',
  family: 'marketing',
  label: 'Combo / Meal Deal',
  description: 'Combo components with savings percentage and total',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'cloud_kitchen', 'fast_food'],
  intentTriggers: {
    keywords: ['combo', 'meal deal', 'bundle', 'set meal', 'value meal', 'package'],
    queryPatterns: ['combo meals *', 'any deals *', 'meal deal for *', 'set menu'],
    dataConditions: ['has_combos'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Combo Name' },
      { field: 'comboPrice', type: 'currency', label: 'Combo Price' },
    ],
    optional: [
      { field: 'components', type: 'tags', label: 'Combo Items' },
      { field: 'individualTotal', type: 'currency', label: 'Individual Total' },
      { field: 'description', type: 'text', label: 'Description' },
      { field: 'badge', type: 'text', label: 'Badge' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      {
        name: 'Date Night Combo', comboPrice: 45, individualTotal: 62, badge: 'Best Value',
        components: [{ name: 'Bruschetta', price: 12 }, { name: 'Pasta Carbonara', price: 18 }, { name: 'Tiramisu', price: 14 }, { name: 'House Wine (2)', price: 18 }],
      },
      {
        name: 'Family Feast', comboPrice: 55, individualTotal: 72,
        components: [{ name: 'Garlic Bread', price: 8 }, { name: 'Large Pizza', price: 22 }, { name: 'Pasta Bowl', price: 18 }, { name: 'Soft Drinks (4)', price: 24 }],
      },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toFixed(2); }

export default function ComboMealBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || (data.name ? [data] : []);
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((combo, i) => {
        const savings = combo.individualTotal && combo.individualTotal > combo.comboPrice
          ? Math.round(((combo.individualTotal - combo.comboPrice) / combo.individualTotal) * 100) : 0;
        const components: Array<Record<string, any>> = combo.components || [];
        return (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PackageCheck size={14} color={theme.accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{combo.name}</span>
                {combo.badge && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 5px', borderRadius: 4 }}>{combo.badge}</span>}
              </div>
              {savings > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: theme.green, background: theme.greenBg, padding: '2px 8px', borderRadius: 6 }}>Save {savings}%</span>}
            </div>
            <div style={{ padding: '8px 14px' }}>
              {components.map((c, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                  <Check size={10} color={theme.green} />
                  <span style={{ flex: 1, fontSize: 10, color: theme.t2 }}>{c.name}</span>
                  <span style={{ fontSize: 9, color: theme.t4, textDecoration: 'line-through' }}>{fmt(c.price)}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${theme.bdr}` }}>
              <div>
                {combo.individualTotal && <span style={{ fontSize: 10, color: theme.t4, textDecoration: 'line-through', marginRight: 6 }}>{fmt(combo.individualTotal)}</span>}
                <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(combo.comboPrice)}</span>
              </div>
              <button style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>Add Combo</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
