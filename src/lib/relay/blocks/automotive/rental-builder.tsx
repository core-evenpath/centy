'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Key, ShieldPlus } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_rental_builder',
  family: 'pricing',
  label: 'Rental / Lease Builder',
  description: 'Duration selector, insurance add-ons with pricing, total',
  applicableCategories: ['automotive', 'rental', 'leasing', 'fleet'],
  intentTriggers: {
    keywords: ['rent', 'rental', 'lease', 'short-term', 'daily', 'weekly', 'insurance'],
    queryPatterns: ['rent a *', 'lease options', 'how much to rent *', 'rental rates'],
    dataConditions: ['has_rental_rates'],
  },
  dataContract: {
    required: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
      { field: 'dailyRate', type: 'currency', label: 'Daily Rate' },
    ],
    optional: [
      { field: 'durations', type: 'tags', label: 'Duration Options' },
      { field: 'selectedDays', type: 'number', label: 'Selected Days' },
      { field: 'addOns', type: 'tags', label: 'Insurance Add-ons' },
      { field: 'total', type: 'currency', label: 'Total' },
    ],
  },
  variants: ['default'],
  sampleData: {
    vehicleLabel: '2024 Toyota Corolla', dailyRate: 45, selectedDays: 3,
    durations: [{ label: '1 Day', days: 1 }, { label: '3 Days', days: 3 }, { label: '1 Week', days: 7 }, { label: '1 Month', days: 30 }],
    addOns: [
      { name: 'Basic Coverage', price: 12, selected: true },
      { name: 'Full Coverage', price: 24, selected: false },
      { name: 'Roadside Assist', price: 8, selected: false },
    ],
    total: 171,
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function RentalBuilderBlock({ data, theme }: BlockComponentProps) {
  const durations: Array<Record<string, any>> = data.durations || [];
  const addOns: Array<Record<string, any>> = data.addOns || [];
  const selected = data.selectedDays || 1;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Key size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Rental Builder</span>
        <span style={{ fontSize: 9, color: theme.t3, marginLeft: 'auto' }}>{data.vehicleLabel}</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, textTransform: 'uppercase' }}>Duration</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {durations.map(d => (
            <div key={d.days} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: 'pointer', background: d.days === selected ? theme.accent : theme.bg, color: d.days === selected ? '#fff' : theme.t2, border: d.days === selected ? 'none' : `1px solid ${theme.bdr}` }}>{d.label}</div>
          ))}
        </div>
      </div>
      {addOns.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <ShieldPlus size={9} color={theme.t3} />
            <span style={{ fontSize: 8, fontWeight: 600, color: theme.t3, textTransform: 'uppercase' }}>Add-ons</span>
          </div>
          {addOns.map(a => (
            <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: a.selected ? `none` : `2px solid ${theme.bdr}`, background: a.selected ? theme.accent : theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxSizing: 'border-box' }}>
                {a.selected && <span style={{ color: '#fff', fontSize: 8 }}>✓</span>}
              </div>
              <span style={{ flex: 1, fontSize: 10, color: theme.t2 }}>{a.name}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{fmt(a.price)}/day</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '10px 12px', background: theme.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 8, color: theme.t3 }}>{fmt(data.dailyRate || 0)}/day x {selected} days + add-ons</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>{fmt(data.total || 0)}</div>
      </div>
    </div>
  );
}
