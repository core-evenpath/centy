'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CalendarDays, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_appointment',
  family: 'booking',
  label: 'Appointment Scheduler',
  description: 'Date/time slot picker UI with provider context',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital', 'dental'],
  intentTriggers: {
    keywords: ['appointment', 'schedule', 'book', 'visit', 'slot', 'available'],
    queryPatterns: ['schedule an appointment', 'book a visit', 'available times *'],
    dataConditions: ['has_provider'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'providerName', type: 'text', label: 'Provider Name' },
      { field: 'date', type: 'date', label: 'Selected Date' },
      { field: 'slots', type: 'tags', label: 'Available Slots' },
      { field: 'selectedSlot', type: 'text', label: 'Selected Slot' },
      { field: 'visitType', type: 'text', label: 'Visit Type' },
    ],
  },
  variants: ['default'],
  sampleData: {
    providerName: 'Dr. Sarah Chen', date: '2026-04-15', visitType: 'Follow-up',
    slots: ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'],
    selectedSlot: '10:30 AM',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function AppointmentBlock({ data, theme }: BlockComponentProps) {
  const slots: string[] = data.slots || [];
  const selected = data.selectedSlot || '';

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <CalendarDays size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Book Appointment</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {data.providerName && (
          <div style={{ padding: '6px 8px', background: theme.bg, borderRadius: 6, marginBottom: 8, fontSize: 10, fontWeight: 600, color: theme.t1 }}>
            {data.providerName}{data.visitType ? ` · ${data.visitType}` : ''}
          </div>
        )}
        {data.date && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</label>
            <div style={{ marginTop: 3, padding: '6px 8px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays size={10} color={theme.t4} />{data.date}
            </div>
          </div>
        )}
        {slots.length > 0 && (
          <div>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available Times</label>
            <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {slots.map(t => (
                <div key={t} style={{ padding: '6px 8px', borderRadius: 6, border: t === selected ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: t === selected ? theme.accentBg : theme.surface, fontSize: 9, fontWeight: t === selected ? 600 : 400, color: t === selected ? theme.accent : theme.t2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={8} />{t}
                </div>
              ))}
            </div>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
          Confirm Appointment
        </button>
      </div>
    </div>
  );
}
