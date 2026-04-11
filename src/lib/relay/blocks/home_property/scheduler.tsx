'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_scheduler',
  family: 'booking',
  label: 'Job Scheduler',
  description: 'Date strip, time window selector, and confirmation CTA',
  applicableCategories: ['home_property', 'home_services', 'maintenance', 'repair'],
  intentTriggers: {
    keywords: ['schedule', 'book', 'appointment', 'date', 'time', 'availability'],
    queryPatterns: ['schedule a *', 'book an appointment', 'when can *', 'next available *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'dates', type: 'tags', label: 'Available Dates' },
      { field: 'selectedDate', type: 'date', label: 'Selected Date' },
      { field: 'selectedWindow', type: 'text', label: 'Selected Window' },
      { field: 'serviceName', type: 'text', label: 'Service' },
    ],
  },
  variants: ['default'],
  sampleData: {
    serviceName: 'AC Tune-Up',
    dates: [
      { label: 'Mon', date: 'Apr 13', available: true },
      { label: 'Tue', date: 'Apr 14', available: true },
      { label: 'Wed', date: 'Apr 15', available: false },
      { label: 'Thu', date: 'Apr 16', available: true },
      { label: 'Fri', date: 'Apr 17', available: true },
    ],
    selectedDate: 'Apr 14',
    selectedWindow: 'Morning',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

const WINDOWS = ['Morning', 'Afternoon', 'Evening'];
const WINDOW_TIMES: Record<string, string> = { Morning: '8am–12pm', Afternoon: '12pm–4pm', Evening: '4pm–7pm' };

export default function SchedulerBlock({ data, theme }: BlockComponentProps) {
  const dates: Array<Record<string, any>> = data.dates || [];
  const selDate = data.selectedDate || '';
  const selWindow = data.selectedWindow || '';

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calendar size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Schedule Service</span>
        {data.serviceName && <span style={{ fontSize: 9, color: theme.t3, marginLeft: 'auto' }}>{data.serviceName}</span>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {dates.map((d, i) => {
            const isSel = d.date === selDate;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: 8, border: isSel ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: isSel ? theme.accentBg : d.available ? theme.surface : theme.bg, opacity: d.available ? 1 : 0.4, cursor: d.available ? 'pointer' : 'default' }}>
                <div style={{ fontSize: 8, color: isSel ? theme.accent : theme.t4, fontWeight: 600 }}>{d.label}</div>
                <div style={{ fontSize: 10, color: isSel ? theme.accent : theme.t1, fontWeight: isSel ? 700 : 500, marginTop: 2 }}>{d.date?.split(' ')[1]}</div>
              </div>
            );
          })}
        </div>
        <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time Window</label>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {WINDOWS.map(w => {
            const isSel = w === selWindow;
            return (
              <div key={w} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8, border: isSel ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: isSel ? theme.accentBg : theme.surface, cursor: 'pointer' }}>
                <div style={{ fontSize: 10, fontWeight: isSel ? 700 : 500, color: isSel ? theme.accent : theme.t1 }}>{w}</div>
                <div style={{ fontSize: 7, color: theme.t4, marginTop: 1 }}>{WINDOW_TIMES[w]}</div>
              </div>
            );
          })}
        </div>
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Clock size={11} /> Confirm Booking
        </button>
      </div>
    </div>
  );
}
