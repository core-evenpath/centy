'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Flame, Leaf } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_menu_item',
  family: 'menu',
  label: 'Menu Item Card',
  description: 'Food/drink item with dietary tags, spice level, calorie count, pricing',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'cloud_kitchen', 'bakery'],
  intentTriggers: {
    keywords: ['menu', 'dish', 'food', 'eat', 'order', 'items', 'browse'],
    queryPatterns: ['show me the menu', 'what do you serve', 'food options', '* dishes'],
    dataConditions: ['has_menu_items'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Item Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'description', type: 'text', label: 'Description' },
      { field: 'calories', type: 'number', label: 'Calories' },
      { field: 'spiceLevel', type: 'number', label: 'Spice Level (1-5)' },
      { field: 'dietaryTags', type: 'tags', label: 'Dietary Tags' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
      { field: 'badge', type: 'text', label: 'Badge' },
    ],
  },
  variants: ['default', 'compact', 'vegetarian'],
  sampleData: {
    items: [
      { name: 'Truffle Mushroom Risotto', price: 18.5, description: 'Arborio rice, porcini, parmesan', calories: 520, spiceLevel: 1, dietaryTags: ['Vegetarian', 'GF'], badge: 'Chef Pick' },
      { name: 'Spicy Lamb Rogan Josh', price: 22, description: 'Slow-braised lamb, Kashmiri spices', calories: 640, spiceLevel: 4, dietaryTags: ['Halal'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toFixed(2); }

export default function MenuItemBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Leaf size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No menu items available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{item.name}</span>
              {item.badge && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 5px', borderRadius: 4 }}>{item.badge}</span>}
            </div>
            {item.description && <div style={{ fontSize: 10, color: theme.t3, marginTop: 2 }}>{item.description}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(item.price)}</span>
              {item.calories && <span style={{ fontSize: 9, color: theme.t4 }}>{item.calories} cal</span>}
              {item.spiceLevel > 0 && (
                <div style={{ display: 'flex', gap: 1 }}>
                  {Array.from({ length: item.spiceLevel }).map((_, s) => <Flame key={s} size={9} color={theme.red} fill={theme.red} />)}
                </div>
              )}
            </div>
            {item.dietaryTags?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {item.dietaryTags.map((t: string) => (
                  <span key={t} style={{ fontSize: 8, color: theme.green, background: theme.greenBg, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', alignSelf: 'center' }}>Add</button>
        </div>
      ))}
    </div>
  );
}
