'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Clock, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_wait_time',
  family: 'operations',
  label: 'Wait Time Display',
  description: 'Department wait times list with queue position, color-coded urgency',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital', 'urgent_care'],
  intentTriggers: {
    keywords: ['wait', 'queue', 'how long', 'wait time', 'busy', 'estimated'],
    queryPatterns: ['how long is the wait', 'wait time for *', 'how busy *'],
    dataConditions: ['has_wait_times'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'departments', type: 'tags', label: 'Departments' },
      { field: 'yourPosition', type: 'number', label: 'Your Queue Position' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    departments: [
      { name: 'Emergency', waitMin: 45, patients: 12, urgency: 'high' },
      { name: 'Urgent Care', waitMin: 20, patients: 5, urgency: 'medium' },
      { name: 'Lab / Blood Draw', waitMin: 10, patients: 3, urgency: 'low' },
      { name: 'Radiology', waitMin: 30, patients: 7, urgency: 'medium' },
    ],
    yourPosition: 3,
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 60,
};

export default function WaitTimeBlock({ data, theme }: BlockComponentProps) {
  const depts: Array<Record<string, any>> = data.departments || [];
  if (!depts.length) return null;

  const urgColor = (u: string) => u === 'high' ? theme.red : u === 'medium' ? theme.amber : theme.green;
  const urgBg = (u: string) => u === 'high' ? theme.redBg : u === 'medium' ? theme.amberBg : theme.greenBg;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Current Wait Times</span>
        </div>
        {data.yourPosition && (
          <span style={{ fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: theme.accentBg, color: theme.accent }}>You: #{data.yourPosition}</span>
        )}
      </div>
      {depts.map((d, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < depts.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: urgColor(d.urgency), flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: theme.t1 }}>{d.name}</div>
            <div style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <Users size={7} />{d.patients} waiting
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: urgColor(d.urgency) }}>{d.waitMin}<span style={{ fontSize: 8, fontWeight: 400 }}> min</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
