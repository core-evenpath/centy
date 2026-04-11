'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CalendarCheck, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_appointment',
  family: 'booking',
  label: 'Appointment Booking',
  description: 'Staff preference selector, time slot grid, and confirmation CTA',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage'],
  intentTriggers: {
    keywords: ['book', 'appointment', 'schedule', 'reserve', 'time slot'],
    queryPatterns: ['book an appointment', 'available times *', 'schedule with *'],
    dataConditions: ['has_availability'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'service', type: 'text', label: 'Service Name' },
      { field: 'stylist', type: 'text', label: 'Preferred Stylist' },
      { field: 'date', type: 'date', label: 'Date' },
      { field: 'slots', type: 'tags', label: 'Available Slots' },
      { field: 'selectedSlot', type: 'text', label: 'Selected Slot' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    service: 'Deep Tissue Massage', stylist: 'Maria Santos', date: '2026-04-14',
    slots: ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM'],
    selectedSlot: '10:30 AM',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

export default function AppointmentBlock({ data, theme }: BlockComponentProps) {
  const slots: string[] = data.slots || [];
  const selected = data.selectedSlot || '';

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <CalendarCheck size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Book Appointment</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        {data.service && <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{data.service}</div>}
        <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>
          {data.stylist && <>with {data.stylist}</>}{data.date && <> · {data.date}</>}
        </div>
      </div>
      {slots.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: theme.t3, marginBottom: 6 }}>Available Times</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {slots.map(sl => {
              const isSel = sl === selected;
              return (
                <div key={sl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 4px', borderRadius: 6, fontSize: 9, fontWeight: isSel ? 600 : 400, color: isSel ? '#fff' : theme.t2, background: isSel ? theme.accent : theme.bg, border: `1px solid ${isSel ? theme.accent : theme.bdr}`, cursor: 'pointer' }}>
                  <Clock size={8} />
                  {sl}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ padding: '8px 12px' }}>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          Confirm Appointment
        </button>
      </div>
    </div>
  );
}
