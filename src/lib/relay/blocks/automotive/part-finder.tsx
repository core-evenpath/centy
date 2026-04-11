'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Search, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_part_finder',
  family: 'parts',
  label: 'Part Finder',
  description: 'Auto parts with fitment compatibility check, OE spec badge, stock status',
  applicableCategories: ['automotive', 'parts', 'accessories', 'dealership'],
  intentTriggers: {
    keywords: ['part', 'parts', 'filter', 'brake', 'battery', 'OEM', 'fitment', 'compatible'],
    queryPatterns: ['find part for *', 'do you have * part', 'parts for *', 'compatible *'],
    dataConditions: ['has_parts'],
  },
  dataContract: {
    required: [
      { field: 'parts', type: 'tags', label: 'Parts List' },
    ],
    optional: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle Fitment' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    vehicleLabel: '2024 Toyota Camry',
    parts: [
      { name: 'Engine Oil Filter', partNo: 'TO-90915-YZZD4', oe: true, price: 12, stock: 'In Stock', fits: true },
      { name: 'Front Brake Pads (Ceramic)', partNo: 'TO-04465-06200', oe: true, price: 74, stock: 'In Stock', fits: true },
      { name: 'Cabin Air Filter', partNo: 'TO-87139-06080', oe: false, price: 18, stock: 'Low Stock', fits: true },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function PartFinderBlock({ data, theme }: BlockComponentProps) {
  const parts: Array<Record<string, any>> = data.parts || [];
  if (!parts.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Search size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Part Finder</span>
        {data.vehicleLabel && <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>Fitment: {data.vehicleLabel}</span>}
      </div>
      {parts.map((p, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < parts.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{p.name}</span>
              {p.oe && <span style={{ fontSize: 7, fontWeight: 700, color: theme.accent, background: theme.accentBg, padding: '1px 4px', borderRadius: 3 }}>OE</span>}
            </div>
            <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{p.partNo}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: p.stock === 'In Stock' ? theme.green : theme.amber, background: p.stock === 'In Stock' ? theme.greenBg : theme.amberBg, padding: '1px 5px', borderRadius: 3 }}>{p.stock}</span>
              {p.fits && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: theme.green }}><CheckCircle size={8} />Fits</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(p.price)}</div>
            <button style={{ fontSize: 8, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', marginTop: 2 }}>Add</button>
          </div>
        </div>
      ))}
    </div>
  );
}
