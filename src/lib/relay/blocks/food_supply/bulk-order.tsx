'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShoppingCart, Plus } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_bulk_order',
  family: 'ordering',
  label: 'Bulk Order Builder',
  description: 'Multi-item quantity builder with tier pricing and subtotal',
  applicableCategories: ['food_supply', 'wholesale', 'distributor'],
  intentTriggers: {
    keywords: ['order', 'bulk', 'quantity', 'add', 'cart', 'purchase'],
    queryPatterns: ['place an order *', 'I need * cases', 'order * units'],
    dataConditions: ['has_order_items'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Order Items' },
    ],
    optional: [
      { field: 'currency', type: 'text', label: 'Currency' },
    ],
  },
  variants: ['default'],
  sampleData: {
    currency: 'USD',
    items: [
      { name: 'Roma Tomatoes 5kg', qty: 40, unitPrice: 26.00, tier: '50+' },
      { name: 'Baby Spinach 1kg', qty: 80, unitPrice: 8.50, tier: '50+' },
      { name: 'Atlantic Salmon 2kg', qty: 15, unitPrice: 62.00, tier: '10+' },
    ],
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 0,
};

export default function BulkOrderBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  const cur = data.currency || 'USD';
  const subtotal = items.reduce((s, it) => s + (it.qty || 0) * (it.unitPrice || 0), 0);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShoppingCart size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Bulk Order</span>
        <span style={{ fontSize: 9, color: theme.t4, marginLeft: 'auto' }}>{items.length} items</span>
      </div>
      <div style={{ padding: '6px 14px' }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{it.name}</div>
              {it.tier && <span style={{ fontSize: 8, color: theme.green, background: theme.greenBg, padding: '1px 4px', borderRadius: 3 }}>Tier: {it.tier}</span>}
            </div>
            <div style={{ fontSize: 9, color: theme.t3, textAlign: 'right', minWidth: 40 }}>x{it.qty}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textAlign: 'right', minWidth: 55 }}>${(it.qty * it.unitPrice).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.bg }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: theme.t2 }}>Subtotal</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>${subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
