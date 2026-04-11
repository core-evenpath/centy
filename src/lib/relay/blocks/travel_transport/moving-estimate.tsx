'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Truck, Package } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_moving_estimate',
  family: 'logistics',
  label: 'Moving Estimate',
  description: 'Room/item inventory, distance, packing add-ons, total estimate',
  applicableCategories: ['transport', 'moving', 'logistics', 'relocation'],
  intentTriggers: {
    keywords: ['moving', 'relocation', 'movers', 'packing', 'furniture'],
    queryPatterns: ['moving estimate *', 'how much to move *', 'relocation quote', 'cost to move *'],
    dataConditions: ['has_inventory'],
  },
  dataContract: {
    required: [
      { field: 'from', type: 'text', label: 'Origin' },
      { field: 'to', type: 'text', label: 'Destination' },
    ],
    optional: [
      { field: 'distance', type: 'text', label: 'Distance' },
      { field: 'rooms', type: 'tags', label: 'Room Inventory' },
      { field: 'addOns', type: 'tags', label: 'Add-ons' },
      { field: 'total', type: 'currency', label: 'Total Estimate' },
    ],
  },
  variants: ['default'],
  sampleData: {
    from: '123 Oak St, Brooklyn', to: '456 Pine Ave, Manhattan', distance: '12 mi',
    rooms: [{ name: 'Living Room', items: 8 }, { name: 'Bedroom', items: 6 }, { name: 'Kitchen', items: 12 }],
    addOns: [{ name: 'Full Packing Service', price: 350 }, { name: 'Furniture Disassembly', price: 120 }],
    total: 1870,
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function MovingEstimateBlock({ data, theme }: BlockComponentProps) {
  const rooms: Array<{ name: string; items: number }> = data.rooms || [];
  const addOns: Array<{ name: string; price: number }> = data.addOns || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Truck size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Moving Estimate</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, color: theme.t2 }}>{data.from}</span>
        <span style={{ fontSize: 9, color: theme.t4 }}>&#8594;</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{data.to}</span>
        {data.distance && <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{data.distance}</span>}
      </div>
      {rooms.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Inventory</div>
          {rooms.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: 9, color: theme.t2, display: 'flex', alignItems: 'center', gap: 4 }}><Package size={8} color={theme.t4} />{r.name}</span>
              <span style={{ fontSize: 8, color: theme.t3 }}>{r.items} items</span>
            </div>
          ))}
        </div>
      )}
      {addOns.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Add-ons</div>
          {addOns.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${theme.accent}`, background: theme.accentBg, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: theme.t2 }}>{a.name}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.accent }}>+{fmt(a.price)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Estimated Total</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(data.total || 0)}</span>
      </div>
    </div>
  );
}
