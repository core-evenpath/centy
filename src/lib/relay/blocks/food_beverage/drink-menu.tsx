'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Wine, GlassWater } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_drink_menu',
  family: 'beverage',
  label: 'Drink / Beverage Menu',
  description: 'Cocktails/wine/beer list with ABV, tasting notes, per-glass pricing',
  applicableCategories: ['food_beverage', 'restaurant', 'bar', 'fine_dining', 'cafe'],
  intentTriggers: {
    keywords: ['drinks', 'cocktails', 'wine', 'beer', 'beverages', 'bar menu'],
    queryPatterns: ['drink menu *', 'wine list', 'what cocktails *', 'beverage options'],
    dataConditions: ['has_drink_menu'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Drink Items' },
    ],
    optional: [
      { field: 'category', type: 'text', label: 'Drink Category' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    category: 'Wines & Cocktails',
    items: [
      { name: 'Negroni Classico', type: 'Cocktail', abv: '24%', price: 16, notes: 'Gin, Campari, sweet vermouth' },
      { name: 'Sancerre Blanc', type: 'Wine', abv: '13%', price: 14, priceBottle: 52, notes: 'Crisp, mineral, citrus notes' },
      { name: 'Asahi Super Dry', type: 'Beer', abv: '5%', price: 8, notes: 'Light, clean, refreshing lager' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toFixed(2); }

export default function DrinkMenuBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <GlassWater size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No drinks available</div>
    </div>
  );

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {data.category && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wine size={14} color={theme.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.category}</span>
        </div>
      )}
      {items.map((drink, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{drink.name}</span>
              {drink.type && <span style={{ fontSize: 8, color: theme.accent, background: theme.accentBg, padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>{drink.type}</span>}
            </div>
            {drink.notes && <div style={{ fontSize: 9, color: theme.t3, marginTop: 3, fontStyle: 'italic' }}>{drink.notes}</div>}
            {drink.abv && <div style={{ fontSize: 8, color: theme.t4, marginTop: 2 }}>ABV {drink.abv}</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{fmt(drink.price)}</div>
            {drink.priceBottle && <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>Bottle {fmt(drink.priceBottle)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
