'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CalendarCheck, Building2 } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_appointment',
  family: 'booking',
  label: 'Appointment Scheduler',
  description: 'Department selector, date strip, time grid, confirmation CTA',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['appointment', 'book', 'schedule', 'reserve', 'visit', 'meeting'],
    queryPatterns: ['book an appointment *', 'schedule a visit *', 'I need an appointment for *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'departments', type: 'tags', label: 'Departments' },
      { field: 'dates', type: 'tags', label: 'Available Dates' },
      { field: 'times', type: 'tags', label: 'Available Times' },
    ],
  },
  variants: ['default'],
  sampleData: {
    departments: ['Vital Records', 'Tax Assessment', 'Building Permits', 'Business Licensing'],
    dates: ['Apr 14', 'Apr 15', 'Apr 16', 'Apr 17', 'Apr 18'],
    times: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function AppointmentBlock({ data, theme }: BlockComponentProps) {
  const departments: string[] = data.departments || [];
  const dates: string[] = data.dates || [];
  const times: string[] = data.times || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CalendarCheck size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Book Appointment</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {departments.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Department</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {departments.map(d => (
                <span key={d} style={{ fontSize: 9, color: theme.t2, border: `1px solid ${theme.bdr}`, padding: '4px 8px', borderRadius: 5, cursor: 'pointer' }}>
                  <Building2 size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />{d}
                </span>
              ))}
            </div>
          </div>
        )}
        {dates.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</label>
            <div style={{ display: 'flex', gap: 4, marginTop: 4, overflowX: 'auto' }}>
              {dates.map((d, i) => (
                <div key={d} style={{ padding: '6px 10px', borderRadius: 6, border: i === 0 ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: i === 0 ? theme.accentBg : theme.surface, fontSize: 10, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? theme.accent : theme.t2, cursor: 'pointer', whiteSpace: 'nowrap' }}>{d}</div>
              ))}
            </div>
          </div>
        )}
        {times.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 4 }}>
              {times.map(t => (
                <div key={t} style={{ padding: '6px 0', borderRadius: 6, border: `1px solid ${theme.bdr}`, fontSize: 10, color: theme.t2, textAlign: 'center', cursor: 'pointer' }}>{t}</div>
              ))}
            </div>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Confirm Appointment</button>
      </div>
    </div>
  );
}
