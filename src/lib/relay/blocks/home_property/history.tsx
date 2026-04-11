'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { History, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_history',
  family: 'tracking',
  label: 'Service History',
  description: 'Past jobs list with date, technician, cost, completion status',
  applicableCategories: ['home_property', 'home_services', 'maintenance', 'repair'],
  intentTriggers: {
    keywords: ['history', 'past', 'previous', 'completed', 'jobs', 'records'],
    queryPatterns: ['past services', 'service history', 'previous jobs', 'completed work'],
    dataConditions: ['has_history'],
  },
  dataContract: {
    required: [
      { field: 'jobs', type: 'tags', label: 'Past Jobs' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    jobs: [
      { service: 'AC Repair', date: 'Mar 12, 2026', technician: 'Mike R.', cost: 245, status: 'completed' },
      { service: 'Drain Cleaning', date: 'Jan 08, 2026', technician: 'Sarah L.', cost: 120, status: 'completed' },
      { service: 'Electrical Inspection', date: 'Nov 22, 2025', technician: 'Tom K.', cost: 180, status: 'completed' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function HistoryBlock({ data, theme }: BlockComponentProps) {
  const jobs: Array<Record<string, any>> = data.jobs || [];
  if (!jobs.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <History size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No service history</div>
    </div>
  );

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <History size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Service History</span>
        <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{jobs.length} jobs</span>
      </div>
      {jobs.map((j, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < jobs.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} color={j.status === 'completed' ? theme.green : theme.t4} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{j.service}</div>
            <div style={{ fontSize: 8, color: theme.t4 }}>{j.date} · {j.technician}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{fmt(j.cost)}</div>
            <div style={{ fontSize: 7, fontWeight: 600, color: j.status === 'completed' ? theme.green : theme.amber, textTransform: 'uppercase' }}>{j.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
