'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Clock, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_schedule_grid',
  family: 'timetable',
  label: 'Schedule / Timetable',
  description: 'Multi-operator schedule with departure/arrival, seat availability, pricing',
  applicableCategories: ['transport', 'buses', 'trains', 'ferries', 'airlines'],
  intentTriggers: {
    keywords: ['schedule', 'timetable', 'departures', 'arrivals', 'bus times', 'train times'],
    queryPatterns: ['show schedule *', 'next departure *', 'timetable for *', 'when does the * leave'],
    dataConditions: ['has_schedule'],
  },
  dataContract: {
    required: [{ field: 'route', type: 'text', label: 'Route' }],
    optional: [
      { field: 'date', type: 'date', label: 'Date' },
      { field: 'services', type: 'tags', label: 'Services' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    route: 'KL Sentral → Penang', date: 'Apr 15, 2026',
    services: [
      { operator: 'ETS Gold', depart: '08:00', arrive: '12:15', seats: 42, price: 28 },
      { operator: 'ETS Platinum', depart: '10:30', arrive: '14:30', seats: 8, price: 38 },
      { operator: 'Intercity', depart: '13:00', arrive: '17:45', seats: 0, price: 22 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

function fmt(n: number) { return '$' + n; }

export default function ScheduleGridBlock({ data, theme }: BlockComponentProps) {
  const services: Array<Record<string, any>> = data.services || [];
  if (!services.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.route}</span>
        </div>
        {data.date && <span style={{ fontSize: 9, color: theme.t3 }}>{data.date}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 0, padding: '4px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        {['Operator', 'Depart', 'Arrive', 'Seats', 'Price'].map(h => (
          <span key={h} style={{ fontSize: 7, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', padding: '2px 4px' }}>{h}</span>
        ))}
      </div>
      {services.map((s, i) => {
        const soldOut = s.seats === 0;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', alignItems: 'center', gap: 0, padding: '6px 12px', borderBottom: i < services.length - 1 ? `1px solid ${theme.bdr}` : 'none', opacity: soldOut ? 0.5 : 1 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1, padding: '0 4px' }}>{s.operator}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1, padding: '0 4px' }}>{s.depart}</span>
            <span style={{ fontSize: 10, color: theme.t2, padding: '0 4px' }}>{s.arrive}</span>
            <span style={{ fontSize: 8, color: s.seats <= 10 && s.seats > 0 ? theme.amber : s.seats === 0 ? theme.red : theme.green, fontWeight: 600, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Users size={8} />{soldOut ? 'Full' : s.seats}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: soldOut ? theme.t4 : theme.accent, padding: '0 4px' }}>{fmt(s.price)}</span>
          </div>
        );
      })}
    </div>
  );
}
