'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Activity, AlertTriangle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_nutrition',
  family: 'info',
  label: 'Nutrition Info',
  description: 'Calorie ring chart representation, macro breakdown bars, allergen icons',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'health_food', 'cloud_kitchen'],
  intentTriggers: {
    keywords: ['nutrition', 'calories', 'macros', 'protein', 'carbs', 'fat', 'allergen'],
    queryPatterns: ['nutrition info for *', 'how many calories *', 'macros for *', 'allergens in *'],
    dataConditions: ['has_nutrition_data'],
  },
  dataContract: {
    required: [
      { field: 'calories', type: 'number', label: 'Calories' },
    ],
    optional: [
      { field: 'protein', type: 'number', label: 'Protein (g)' }, { field: 'carbs', type: 'number', label: 'Carbs (g)' },
      { field: 'fat', type: 'number', label: 'Fat (g)' }, { field: 'fiber', type: 'number', label: 'Fiber (g)' },
      { field: 'allergens', type: 'tags', label: 'Allergens' }, { field: 'itemName', type: 'text', label: 'Item Name' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    itemName: 'Grilled Salmon Bowl', calories: 520,
    protein: 38, carbs: 45, fat: 18, fiber: 6,
    allergens: ['Fish', 'Soy', 'Sesame'],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function NutritionBlock({ data, theme }: BlockComponentProps) {
  const cal = data.calories || 0;
  const macros = [
    { label: 'Protein', value: data.protein, color: theme.accent, max: 50 }, { label: 'Carbs', value: data.carbs, color: theme.amber, max: 80 },
    { label: 'Fat', value: data.fat, color: theme.red, max: 40 }, { label: 'Fiber', value: data.fiber, color: theme.green, max: 20 },
  ].filter(m => m.value);
  const allergens: string[] = data.allergens || [];
  const circ = 2 * Math.PI * 32, offset = circ - (Math.min((cal / 2000) * 100, 100) / 100) * circ;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity size={12} color={theme.accent} />
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>{data.itemName ? `Nutrition: ${data.itemName}` : 'Nutrition Info'}</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: macros.length > 0 ? `1px solid ${theme.bdr}` : 'none' }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width={72} height={72} viewBox="0 0 72 72">
            <circle cx={36} cy={36} r={32} fill="none" stroke={theme.bdr} strokeWidth={6} />
            <circle cx={36} cy={36} r={32} fill="none" stroke={theme.accent} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.t1 }}>{cal}</div>
            <div style={{ fontSize: 7, color: theme.t4 }}>kcal</div>
          </div>
        </div>
        {macros.length > 0 && (
          <div style={{ flex: 1 }}>
            {macros.map(m => (
              <div key={m.label} style={{ marginBottom: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: theme.t3 }}>{m.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{m.value}g</span>
                </div>
                <div style={{ height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%`, height: '100%', background: m.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {allergens.length > 0 && (
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <AlertTriangle size={10} color={theme.red} />
          <span style={{ fontSize: 9, fontWeight: 700, color: theme.red }}>Allergens:</span>
          {allergens.map(a => <span key={a} style={{ fontSize: 9, color: theme.red, background: theme.redBg, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{a}</span>)}
        </div>
      )}
    </div>
  );
}
