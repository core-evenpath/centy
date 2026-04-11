'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CalendarDays, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_table_reservation',
  family: 'booking',
  label: 'Table Reservation',
  description: 'Party size grid, date strip, time slots, seating preference',
  applicableCategories: ['food_beverage', 'restaurant', 'fine_dining', 'cafe'],
  intentTriggers: { keywords: ['reserve', 'reservation', 'book', 'table', 'seating', 'party'], queryPatterns: ['book a table *', 'reserve for *', 'table for *', 'available tables'], dataConditions: ['accepts_reservations'] },
  dataContract: {
    required: [],
    optional: [
      { field: 'partySizes', type: 'tags', label: 'Party Sizes' }, { field: 'dates', type: 'tags', label: 'Available Dates' },
      { field: 'timeSlots', type: 'tags', label: 'Time Slots' }, { field: 'seatingOptions', type: 'tags', label: 'Seating Options' },
      { field: 'selectedParty', type: 'number', label: 'Selected Party Size' }, { field: 'selectedDate', type: 'text', label: 'Selected Date' },
      { field: 'selectedTime', type: 'text', label: 'Selected Time' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    partySizes: [1, 2, 3, 4, 5, 6, 7, 8], selectedParty: 4,
    dates: [{ label: 'Today', date: 'Apr 11' }, { label: 'Tomorrow', date: 'Apr 12' }, { label: 'Sat', date: 'Apr 13' }, { label: 'Sun', date: 'Apr 14' }],
    selectedDate: 'Apr 11', timeSlots: ['12:00', '12:30', '13:00', '18:00', '18:30', '19:00', '19:30', '20:00'],
    selectedTime: '19:00', seatingOptions: ['Indoor', 'Outdoor', 'Bar', 'Private Room'],
  },
  preloadable: false, streamable: false, cacheDuration: 0,
};

export default function TableReservationBlock({ data, theme }: BlockComponentProps) {
  const partySizes: number[] = data.partySizes || [], dates: Array<Record<string, any>> = data.dates || [];
  const timeSlots: string[] = data.timeSlots || [], seating: string[] = data.seatingOptions || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CalendarDays size={14} color={theme.accent} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>Reserve a Table</span>
      </div>
      {partySizes.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} color={theme.t4} /> Party Size</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {partySizes.map(s => (
              <div key={s} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: s === data.selectedParty ? 700 : 500, background: s === data.selectedParty ? theme.accent : theme.bg, color: s === data.selectedParty ? '#fff' : theme.t2, border: `1px solid ${s === data.selectedParty ? theme.accent : theme.bdr}` }}>{s}</div>
            ))}
          </div>
        </div>
      )}
      {dates.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Date</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {dates.map((d, i) => (
              <div key={i} style={{ flex: 1, padding: '6px 4px', borderRadius: 8, textAlign: 'center', cursor: 'pointer', background: d.date === data.selectedDate ? theme.accentBg : theme.bg, border: `1px solid ${d.date === data.selectedDate ? theme.accent : theme.bdr}` }}>
                <div style={{ fontSize: 8, color: d.date === data.selectedDate ? theme.accent : theme.t4 }}>{d.label}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: d.date === data.selectedDate ? theme.accent : theme.t1, marginTop: 1 }}>{d.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {timeSlots.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Time</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {timeSlots.map(t => (
              <div key={t} style={{ padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: t === data.selectedTime ? 700 : 500, background: t === data.selectedTime ? theme.accent : theme.bg, color: t === data.selectedTime ? '#fff' : theme.t2, border: `1px solid ${t === data.selectedTime ? theme.accent : theme.bdr}` }}>{t}</div>
            ))}
          </div>
        </div>
      )}
      {seating.length > 0 && (
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Seating</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {seating.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: i === 0 ? `4px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, boxSizing: 'border-box' }} />
                <span style={{ fontSize: 10, color: i === 0 ? theme.accent : theme.t2 }}>{s}</span>
              </div>))}
          </div></div>
      )}
    </div>
  );
}
