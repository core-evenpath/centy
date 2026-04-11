'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { BarChart3, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_stock_status',
  family: 'inventory',
  label: 'Stock Availability',
  description: 'Real-time stock levels with fill bars and restock ETA',
  applicableCategories: ['food_supply', 'wholesale', 'distributor'],
  intentTriggers: {
    keywords: ['stock', 'availability', 'inventory', 'in stock', 'available', 'restock'],
    queryPatterns: ['is * in stock', 'check availability *', 'when will * be restocked'],
    dataConditions: ['has_inventory'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Stock Items' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Roma Tomatoes 5kg', available: 320, capacity: 500, restockEta: null },
      { name: 'Baby Spinach 1kg', available: 45, capacity: 200, restockEta: 'Apr 14' },
      { name: 'Atlantic Salmon 2kg', available: 0, capacity: 100, restockEta: 'Apr 16' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

export default function StockStatusBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <BarChart3 size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Stock Availability</span>
      </div>
      <div style={{ padding: '6px 14px 10px' }}>
        {items.map((it, i) => {
          const pct = it.capacity > 0 ? Math.round((it.available / it.capacity) * 100) : 0;
          const barColor = pct === 0 ? theme.red : pct < 30 ? theme.amber : theme.green;
          const barBg = pct === 0 ? theme.redBg : pct < 30 ? theme.amberBg : theme.greenBg;
          return (
            <div key={i} style={{ padding: '8px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{it.name}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: barColor }}>{it.available}/{it.capacity}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: barBg, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: barColor, transition: 'width 0.3s' }} />
              </div>
              {it.restockEta && (
                <div style={{ fontSize: 8, color: theme.t4, marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={7} /> Restock: {it.restockEta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
