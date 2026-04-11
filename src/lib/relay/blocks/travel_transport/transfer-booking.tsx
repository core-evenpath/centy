'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car, Plane } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_transfer_booking',
  family: 'booking',
  label: 'Airport Transfer',
  description: 'Flight context, vehicle tier selector, meet-and-greet badges',
  applicableCategories: ['travel', 'transport', 'transfers', 'airports', 'agencies'],
  intentTriggers: {
    keywords: ['airport transfer', 'pickup', 'shuttle', 'meet greet', 'chauffeur'],
    queryPatterns: ['airport transfer *', 'pickup for flight *', 'book a transfer', 'shuttle to airport'],
    dataConditions: ['has_transfer_options'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'flightNo', type: 'text', label: 'Flight Number' },
      { field: 'arrival', type: 'text', label: 'Arrival Time' },
      { field: 'terminal', type: 'text', label: 'Terminal' },
      { field: 'options', type: 'tags', label: 'Vehicle Options' },
      { field: 'selected', type: 'text', label: 'Selected Vehicle' },
    ],
  },
  variants: ['default'],
  sampleData: {
    flightNo: 'SQ 638', arrival: '16:45', terminal: 'Terminal 3',
    options: [
      { type: 'Standard Sedan', capacity: '3 pax · 2 bags', price: 55, meetGreet: false },
      { type: 'Business Class', capacity: '3 pax · 2 bags', price: 85, meetGreet: true },
      { type: 'Luxury Van', capacity: '7 pax · 6 bags', price: 120, meetGreet: true },
    ],
    selected: 'Business Class',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n; }

export default function TransferBookingBlock({ data, theme }: BlockComponentProps) {
  const options: Array<Record<string, any>> = data.options || [];
  const selected = data.selected || '';
  if (!options.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {data.flightNo && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plane size={10} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.accent }}>{data.flightNo}</span>
          {data.arrival && <span style={{ fontSize: 9, color: theme.t3 }}>arriving {data.arrival}</span>}
          {data.terminal && <span style={{ fontSize: 7, fontWeight: 600, color: theme.t3, background: theme.bg, padding: '1px 5px', borderRadius: 3, marginLeft: 'auto' }}>{data.terminal}</span>}
        </div>
      )}
      <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Car size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Airport Transfer</span>
      </div>
      {options.map((o, i) => {
        const isSelected = o.type === selected;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < options.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: isSelected ? theme.accentBg : 'transparent', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? `5px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, flexShrink: 0, boxSizing: 'border-box' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400, color: theme.t1 }}>{o.type}</span>
                {o.meetGreet && <span style={{ fontSize: 7, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 4px', borderRadius: 3 }}>Meet & Greet</span>}
              </div>
              <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{o.capacity}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent }}>{fmt(o.price)}</span>
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
