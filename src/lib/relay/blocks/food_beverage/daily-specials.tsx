'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Clock, Sparkles } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_daily_specials',
  family: 'marketing',
  label: 'Daily Specials',
  description: 'Time-limited dishes with original price, savings, limited-quantity badge',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'cloud_kitchen', 'bakery'],
  intentTriggers: {
    keywords: ['specials', 'today', 'daily', 'limited', 'deal', 'offer', 'special'],
    queryPatterns: ['what are today\'s specials', 'any deals *', 'daily offers', 'specials today'],
    dataConditions: ['has_daily_specials'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Special Items' },
    ],
    optional: [
      { field: 'expiresAt', type: 'text', label: 'Expires At' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    expiresAt: 'Until 9 PM tonight',
    items: [
      { name: 'Lobster Thermidor', price: 28, originalPrice: 42, remaining: 5 },
      { name: 'Wagyu Slider Trio', price: 18, originalPrice: 26, remaining: null },
      { name: 'Tiramisu Tower', price: 10, originalPrice: 15, remaining: 3 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 120,
};

function fmt(n: number) { return '$' + n.toFixed(2); }

export default function DailySpecialsBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} color={theme.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>Daily Specials</span>
        </div>
        {data.expiresAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} color={theme.amber} />
            <span style={{ fontSize: 9, color: theme.amber, fontWeight: 600 }}>{data.expiresAt}</span>
          </div>
        )}
      </div>
      {items.map((item, i) => {
        const savings = item.originalPrice && item.originalPrice > item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
        return (
          <div key={i} style={{ padding: '10px 14px', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{item.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(item.price)}</span>
                {item.originalPrice && <span style={{ fontSize: 10, color: theme.t4, textDecoration: 'line-through' }}>{fmt(item.originalPrice)}</span>}
                {savings > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 5px', borderRadius: 4 }}>Save {savings}%</span>}
              </div>
            </div>
            {item.remaining && (
              <div style={{ fontSize: 9, fontWeight: 700, color: theme.red, background: theme.redBg, padding: '3px 8px', borderRadius: 6 }}>
                {item.remaining} left
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
