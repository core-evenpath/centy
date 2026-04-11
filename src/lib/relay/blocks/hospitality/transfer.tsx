'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_transfer',
  family: 'form',
  label: 'Airport Transfer',
  description: 'Vehicle type selector for airport pickup with pricing',
  applicableCategories: ['hospitality', 'hotels', 'resorts'],
  intentTriggers: {
    keywords: ['transfer', 'airport', 'pickup', 'shuttle', 'taxi', 'transport'],
    queryPatterns: ['airport transfer', 'pickup from airport', 'how to get there'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'options', type: 'tags', label: 'Vehicle Options' },
      { field: 'selected', type: 'text', label: 'Selected Vehicle' },
    ],
  },
  variants: ['default'],
  sampleData: {
    options: [
      { type: 'Standard Sedan', capacity: '3 pax · 2 bags', price: 45, time: '35 min' },
      { type: 'Premium SUV', capacity: '5 pax · 4 bags', price: 75, time: '35 min' },
      { type: 'Luxury Van', capacity: '8 pax · 8 bags', price: 120, time: '35 min' },
    ],
    selected: 'Premium SUV',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n; }

export default function TransferBlock({ data, theme }: BlockComponentProps) {
  const options: Array<Record<string, any>> = data.options || [];
  const selected = data.selected || '';

  if (!options.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Car size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Airport Transfer</span>
      </div>
      {options.map((t, i) => {
        const isSelected = t.type === selected;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < options.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: isSelected ? theme.accentBg : 'transparent', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? `5px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, flexShrink: 0, boxSizing: 'border-box' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400, color: theme.t1 }}>{t.type}</div>
              <div style={{ fontSize: 8, color: theme.t4 }}>{t.capacity} · {t.time}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent }}>{fmt(t.price)}</span>
          </div>
        );
      })}
      <div style={{ padding: '8px 12px' }}>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          Book Transfer — {fmt(options.find(o => o.type === selected)?.price || options[0]?.price || 0)}
        </button>
      </div>
    </div>
  );
}
