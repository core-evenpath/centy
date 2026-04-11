'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_availability',
  family: 'booking',
  label: 'Availability Calendar',
  description: 'Monthly calendar grid with open/booked dates for event vendors',
  applicableCategories: ['events', 'entertainment', 'wedding', 'photography', 'catering', 'dj', 'venues'],
  intentTriggers: {
    keywords: ['available', 'dates', 'calendar', 'open dates', 'booked', 'schedule'],
    queryPatterns: ['are you available *', 'open dates in *', 'availability for *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'monthLabel', type: 'text', label: 'Month' },
      { field: 'bookedDates', type: 'tags', label: 'Booked Dates' },
      { field: 'openDates', type: 'tags', label: 'Open Dates' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: { monthLabel: 'June 2026', bookedDates: [5, 6, 12, 13, 19, 20, 26], openDates: [7, 14, 21, 27, 28] },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

export default function AvailabilityBlock({ data, theme }: BlockComponentProps) {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const month = data.monthLabel || 'June 2026';
  const booked: number[] = data.bookedDates || [];
  const open: number[] = data.openDates || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calendar size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Availability</span>
        <span style={{ fontSize: 9, color: theme.t3, marginLeft: 'auto' }}>{month}</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
          {days.map(d => <div key={d} style={{ fontSize: 8, color: theme.t4, textAlign: 'center', fontWeight: 600 }}>{d}</div>)}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i < 2 ? null : i - 1;
            const isBooked = day !== null && booked.includes(day);
            const isOpen = day !== null && open.includes(day);
            return (
              <div key={i} style={{ fontSize: 9, textAlign: 'center', padding: '4px 0', borderRadius: 4, color: isBooked ? theme.red : isOpen ? theme.green : day ? theme.t1 : 'transparent', background: isBooked ? theme.redBg : isOpen ? theme.greenBg : 'transparent', fontWeight: isBooked || isOpen ? 600 : 400 }}>
                {day || '.'}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 8, color: theme.t3, paddingTop: 4, borderTop: `1px solid ${theme.bdr}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.green }} />Open</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.red }} />Booked</span>
        </div>
      </div>
    </div>
  );
}
