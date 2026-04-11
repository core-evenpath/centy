'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Users, CalendarDays } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_batch_selector',
  family: 'scheduling',
  label: 'Batch / Cohort Selector',
  description: 'Batch picker with dates, times, mode (online/offline), seat availability',
  applicableCategories: ['education', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['batch', 'cohort', 'timing', 'slot', 'batch selection', 'next batch'],
    queryPatterns: ['upcoming batches', 'when does * start', 'available batches', 'next cohort'],
    dataConditions: ['has_batches'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'courseTitle', type: 'text', label: 'Course Title' },
      { field: 'batches', type: 'tags', label: 'Batches' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    courseTitle: 'Full-Stack Web Development',
    batches: [
      { label: 'Batch A — Morning', startDate: 'May 1, 2026', time: '9:00 AM – 12:00 PM', mode: 'Online', seats: 12, totalSeats: 30 },
      { label: 'Batch B — Evening', startDate: 'May 1, 2026', time: '6:00 PM – 9:00 PM', mode: 'Offline', seats: 4, totalSeats: 25 },
      { label: 'Batch C — Weekend', startDate: 'May 3, 2026', time: '10:00 AM – 2:00 PM', mode: 'Online', seats: 20, totalSeats: 30 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function BatchSelectorBlock({ data, theme }: BlockComponentProps) {
  const batches: Array<Record<string, any>> = data.batches || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${theme.bdr}` }}>
        <CalendarDays size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Batch</span>
        {data.courseTitle && <span style={{ fontSize: 9, color: theme.t3, marginLeft: 'auto' }}>{data.courseTitle}</span>}
      </div>
      <div style={{ padding: '6px 12px' }}>
        {batches.map((b, i) => {
          const low = b.seats <= 5;
          return (
            <div key={i} style={{ padding: '8px', borderRadius: 8, border: i === 0 ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: i === 0 ? theme.accentBg : theme.surface, marginBottom: 6, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{b.label}</span>
                <span style={{ fontSize: 8, fontWeight: 600, color: b.mode === 'Online' ? theme.accent : theme.green, background: b.mode === 'Online' ? theme.accentBg : theme.greenBg, padding: '2px 5px', borderRadius: 4 }}>{b.mode}</span>
              </div>
              <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{b.startDate} · {b.time}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Users size={9} color={low ? theme.red : theme.t4} />
                <span style={{ fontSize: 8, fontWeight: 600, color: low ? theme.red : theme.t3 }}>{b.seats} seats left</span>
                <div style={{ flex: 1, height: 3, background: theme.bg, borderRadius: 2, overflow: 'hidden', marginLeft: 4 }}>
                  <div style={{ width: `${((b.totalSeats - b.seats) / b.totalSeats) * 100}%`, height: '100%', background: low ? theme.red : theme.accent, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
