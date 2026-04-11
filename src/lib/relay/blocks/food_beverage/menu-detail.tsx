'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ChefHat, AlertTriangle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_menu_detail',
  family: 'menu',
  label: 'Menu Item Detail',
  description: 'Full dish view with ingredients, allergens, nutrition highlights, wine pairing',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'fine_dining'],
  intentTriggers: {
    keywords: ['details', 'ingredients', 'allergens', 'nutrition', 'pairing', 'about dish'],
    queryPatterns: ['tell me about *', 'what is in *', 'ingredients for *', 'allergens in *'],
    dataConditions: ['has_selected_item'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Dish Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'description', type: 'textarea', label: 'Description' },
      { field: 'ingredients', type: 'tags', label: 'Ingredients' },
      { field: 'allergens', type: 'tags', label: 'Allergens' },
      { field: 'calories', type: 'number', label: 'Calories' },
      { field: 'protein', type: 'number', label: 'Protein (g)' },
      { field: 'winePairing', type: 'text', label: 'Wine Pairing' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Pan-Seared Chilean Sea Bass', price: 38, description: 'Miso-glazed sea bass on a bed of wilted greens with yuzu beurre blanc.',
    ingredients: ['Sea Bass', 'White Miso', 'Yuzu', 'Butter', 'Spinach', 'Shallots'],
    allergens: ['Fish', 'Dairy', 'Soy'], calories: 480, protein: 36, winePairing: 'Chablis Premier Cru',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toFixed(2); }

export default function MenuDetailBlock({ data, theme }: BlockComponentProps) {
  const allergens: string[] = data.allergens || [];
  const ingredients: string[] = data.ingredients || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.t1 }}>{data.name}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent, marginTop: 4 }}>{fmt(data.price)}</div>
        {data.description && <div style={{ fontSize: 11, color: theme.t2, marginTop: 6, lineHeight: 1.5 }}>{data.description}</div>}
      </div>
      {ingredients.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Ingredients</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ingredients.map((ig: string) => <span key={ig} style={{ fontSize: 9, color: theme.t2, background: theme.bg, padding: '3px 7px', borderRadius: 4, border: `1px solid ${theme.bdr}` }}>{ig}</span>)}
          </div>
        </div>
      )}
      {allergens.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, background: theme.redBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <AlertTriangle size={10} color={theme.red} />
            <span style={{ fontSize: 9, fontWeight: 700, color: theme.red, textTransform: 'uppercase', letterSpacing: 0.5 }}>Allergens</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {allergens.map((a: string) => <span key={a} style={{ fontSize: 9, fontWeight: 600, color: theme.red, background: theme.surface, padding: '3px 7px', borderRadius: 4, border: `1px solid ${theme.red}` }}>{a}</span>)}
          </div>
        </div>
      )}
      <div style={{ padding: '10px 14px', display: 'flex', gap: 16 }}>
        {data.calories && <div><div style={{ fontSize: 9, color: theme.t4 }}>Calories</div><div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.calories}</div></div>}
        {data.protein && <div><div style={{ fontSize: 9, color: theme.t4 }}>Protein</div><div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.protein}g</div></div>}
        {data.winePairing && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChefHat size={12} color={theme.accent} />
            <div><div style={{ fontSize: 8, color: theme.t4 }}>Pairs with</div><div style={{ fontSize: 10, fontWeight: 600, color: theme.accent }}>{data.winePairing}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}
