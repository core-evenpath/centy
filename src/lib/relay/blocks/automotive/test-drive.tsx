'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car, ShieldCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_test_drive',
  family: 'booking',
  label: 'Test Drive Booking',
  description: 'Vehicle context with stock #, date/time selector, no-obligation badge',
  applicableCategories: ['automotive', 'dealership', 'cars', 'vehicles'],
  intentTriggers: {
    keywords: ['test drive', 'try', 'drive', 'demo', 'appointment'],
    queryPatterns: ['can I test drive *', 'schedule a test drive', 'I want to drive *'],
    dataConditions: ['has_vehicle_detail'],
  },
  dataContract: {
    required: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
    ],
    optional: [
      { field: 'stockNo', type: 'text', label: 'Stock #' },
      { field: 'dates', type: 'tags', label: 'Available Dates' },
      { field: 'times', type: 'tags', label: 'Available Times' },
      { field: 'imageUrl', type: 'image', label: 'Vehicle Image' },
    ],
  },
  variants: ['default'],
  sampleData: {
    vehicleLabel: '2024 Toyota Camry XSE', stockNo: 'STK-48291',
    dates: ['Sat 12', 'Sun 13', 'Mon 14', 'Tue 15'],
    times: ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM'],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

export default function TestDriveBlock({ data, theme }: BlockComponentProps) {
  const dates: string[] = data.dates || [];
  const times: string[] = data.times || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Car size={12} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Test Drive</span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: theme.green, fontWeight: 600 }}><ShieldCheck size={9} />No obligation</span>
      </div>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{data.vehicleLabel}</div>
        {data.stockNo && <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>Stock #{data.stockNo}</div>}
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, textTransform: 'uppercase' }}>Preferred Date</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
          {dates.map((d, i) => (
            <div key={d} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: i === 0 ? theme.accent : theme.bg, color: i === 0 ? '#fff' : theme.t2, border: i === 0 ? 'none' : `1px solid ${theme.bdr}` }}>{d}</div>
          ))}
        </div>
        <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, textTransform: 'uppercase' }}>Time Slot</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 10 }}>
          {times.map((t, i) => (
            <div key={t} style={{ padding: '5px 0', borderRadius: 6, fontSize: 9, textAlign: 'center', fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', background: i === 0 ? theme.accentBg2 : theme.bg, color: i === 0 ? theme.accent : theme.t2, border: `1px solid ${i === 0 ? theme.accent : theme.bdr}` }}>{t}</div>
          ))}
        </div>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Book Test Drive</button>
      </div>
    </div>
  );
}
