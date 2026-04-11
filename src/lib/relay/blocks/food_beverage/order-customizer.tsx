'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { SlidersHorizontal, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_order_customizer',
  family: 'ordering',
  label: 'Order Customizer',
  description: 'Portion size selector, add-on checkboxes, special instructions, running total',
  applicableCategories: ['food_beverage', 'restaurant', 'cafe', 'cloud_kitchen'],
  intentTriggers: {
    keywords: ['customize', 'add-ons', 'extras', 'portion', 'size', 'special request'],
    queryPatterns: ['customize my *', 'add extra *', 'can I get * on the side'],
    dataConditions: ['has_selected_item'],
  },
  dataContract: {
    required: [
      { field: 'itemName', type: 'text', label: 'Item Name' },
      { field: 'basePrice', type: 'currency', label: 'Base Price' },
    ],
    optional: [
      { field: 'portions', type: 'tags', label: 'Portion Sizes' },
      { field: 'addOns', type: 'tags', label: 'Add-Ons' },
      { field: 'instructions', type: 'textarea', label: 'Special Instructions' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    itemName: 'Margherita Pizza', basePrice: 14,
    portions: [{ label: 'Regular', extra: 0 }, { label: 'Large', extra: 4, selected: true }, { label: 'Family', extra: 8 }],
    addOns: [{ label: 'Extra Cheese', price: 2, selected: true }, { label: 'Jalapeños', price: 1, selected: false }, { label: 'Truffle Oil', price: 3, selected: false }],
    instructions: '',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toFixed(2); }

export default function OrderCustomizerBlock({ data, theme }: BlockComponentProps) {
  const portions: Array<Record<string, any>> = data.portions || [];
  const addOns: Array<Record<string, any>> = data.addOns || [];
  const selectedPortion = portions.find(p => p.selected) || portions[0];
  const portionExtra = selectedPortion?.extra || 0;
  const addOnTotal = addOns.filter(a => a.selected).reduce((s, a) => s + (a.price || 0), 0);
  const total = (data.basePrice || 0) + portionExtra + addOnTotal;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <SlidersHorizontal size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Customize: {data.itemName}</span>
      </div>
      {portions.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Portion Size</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {portions.map((p, i) => (
              <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, textAlign: 'center', cursor: 'pointer', background: p.selected ? theme.accentBg : theme.bg, border: `1px solid ${p.selected ? theme.accent : theme.bdr}` }}>
                <div style={{ fontSize: 10, fontWeight: p.selected ? 700 : 500, color: p.selected ? theme.accent : theme.t2 }}>{p.label}</div>
                <div style={{ fontSize: 9, color: theme.t4, marginTop: 2 }}>{p.extra === 0 ? 'Base' : `+${fmt(p.extra)}`}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {addOns.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Add-Ons</div>
          {addOns.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${a.selected ? theme.accent : theme.bdr}`, background: a.selected ? theme.accent : theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {a.selected && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ flex: 1, fontSize: 11, color: theme.t1 }}>{a.label}</span>
              <span style={{ fontSize: 10, color: theme.t3 }}>+{fmt(a.price)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Total</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(total)}</span>
      </div>
    </div>
  );
}
