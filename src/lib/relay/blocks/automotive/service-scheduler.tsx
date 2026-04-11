'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar, Car } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_service_scheduler',
  family: 'booking',
  label: 'Service Scheduler',
  description: 'Vehicle + service context, date strip, time grid, drop-off preference',
  applicableCategories: ['automotive', 'service_center', 'mechanic', 'dealership'],
  intentTriggers: {
    keywords: ['schedule', 'appointment', 'book service', 'drop off', 'service date'],
    queryPatterns: ['schedule service', 'book an appointment', 'when can I bring *'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'serviceName', type: 'text', label: 'Service Name' },
    ],
    optional: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
      { field: 'dates', type: 'tags', label: 'Available Dates' },
      { field: 'times', type: 'tags', label: 'Available Times' },
      { field: 'dropOff', type: 'select', label: 'Drop-off Preference', options: ['Wait', 'Drop-off', 'Pickup'] },
    ],
  },
  variants: ['default'],
  sampleData: {
    serviceName: 'Oil & Filter Change', vehicleLabel: '2024 Camry XSE',
    dates: ['Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18'],
    times: ['8:00 AM', '9:30 AM', '11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM'],
    dropOff: 'Wait',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

export default function ServiceSchedulerBlock({ data, theme }: BlockComponentProps) {
  const dates: string[] = data.dates || [];
  const times: string[] = data.times || [];
  const opts = ['Wait', 'Drop-off', 'Pickup'];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calendar size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Schedule Service</span>
      </div>
      {data.vehicleLabel && (
        <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Car size={10} color={theme.t3} />
          <span style={{ fontSize: 9, color: theme.t2 }}>{data.vehicleLabel}</span>
          <span style={{ fontSize: 9, color: theme.t4 }}>· {data.serviceName}</span>
        </div>
      )}
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, textTransform: 'uppercase' }}>Date</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
          {dates.map((d, i) => (
            <div key={d} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: i === 0 ? theme.accent : theme.bg, color: i === 0 ? '#fff' : theme.t2, border: i === 0 ? 'none' : `1px solid ${theme.bdr}` }}>{d}</div>
          ))}
        </div>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, textTransform: 'uppercase' }}>Time</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
          {times.map((t, i) => (
            <div key={t} style={{ padding: '5px 0', borderRadius: 6, fontSize: 9, textAlign: 'center', fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', background: i === 0 ? theme.accentBg2 : theme.bg, color: i === 0 ? theme.accent : theme.t2, border: `1px solid ${i === 0 ? theme.accent : theme.bdr}` }}>{t}</div>
          ))}
        </div>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, textTransform: 'uppercase' }}>Drop-off</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {opts.map(o => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.t2, cursor: 'pointer' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: o === (data.dropOff || 'Wait') ? `4px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, boxSizing: 'border-box' }} />
              {o}
            </label>
          ))}
        </div>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Confirm Appointment</button>
      </div>
    </div>
  );
}
