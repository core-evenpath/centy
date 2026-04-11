'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { LayoutGrid, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_seating_chart',
  family: 'planning',
  label: 'Seating Layout',
  description: 'Table/section assignments with guest counts per zone',
  applicableCategories: ['events', 'entertainment', 'wedding', 'corporate', 'gala', 'banquet'],
  intentTriggers: {
    keywords: ['seating', 'table', 'layout', 'floor plan', 'arrangements', 'sections'],
    queryPatterns: ['seating chart', 'table layout', 'where are guests seated'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'zones', type: 'tags', label: 'Seating Zones' },
      { field: 'totalGuests', type: 'number', label: 'Total Guests' },
      { field: 'totalTables', type: 'number', label: 'Total Tables' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    totalGuests: 180, totalTables: 20,
    zones: [
      { name: 'Head Table', tables: 1, guests: 12, color: '#c2410c' },
      { name: 'Family', tables: 4, guests: 40, color: '#d97706' },
      { name: 'Friends', tables: 8, guests: 80, color: '#16a34a' },
      { name: 'Colleagues', tables: 5, guests: 40, color: '#2563eb' },
      { name: 'Open', tables: 2, guests: 8, color: '#78716c' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function SeatingChartBlock({ data, theme }: BlockComponentProps) {
  const zones: Array<Record<string, any>> = data.zones || [];
  const totalGuests = data.totalGuests || zones.reduce((s: number, z: any) => s + (z.guests || 0), 0);
  const totalTables = data.totalTables || zones.reduce((s: number, z: any) => s + (z.tables || 0), 0);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <LayoutGrid size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Seating Layout</span>
        <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{totalTables} tables · {totalGuests} guests</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        {zones.map((z, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < zones.length - 1 ? 6 : 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: z.color || theme.accent, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 10, fontWeight: 500, color: theme.t1 }}>{z.name}</span>
            <span style={{ fontSize: 9, color: theme.t3 }}>{z.tables} tbl</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.t2, width: 50, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}><Users size={8} />{z.guests}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '6px 12px', borderTop: `1px solid ${theme.bdr}`, background: theme.bg }}>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          {zones.map((z, i) => (
            <div key={i} style={{ flex: z.guests || 1, background: z.color || theme.accent, height: '100%' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
