'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_job_tracker',
  family: 'operations',
  label: 'Job Tracker',
  description: 'Live 5-step pipeline with technician ETA',
  applicableCategories: ['home_property', 'home_services', 'repair', 'maintenance'],
  intentTriggers: {
    keywords: ['track', 'status', 'eta', 'where', 'progress', 'job status'],
    queryPatterns: ['where is my technician', 'job status', 'track my *', 'eta for *'],
    dataConditions: ['has_active_job'],
  },
  dataContract: {
    required: [
      { field: 'currentStep', type: 'number', label: 'Current Step' },
    ],
    optional: [
      { field: 'technicianName', type: 'text', label: 'Technician' },
      { field: 'eta', type: 'text', label: 'ETA' },
      { field: 'serviceName', type: 'text', label: 'Service' },
      { field: 'jobId', type: 'text', label: 'Job ID' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    currentStep: 2, technicianName: 'Mike R.', eta: '15 min',
    serviceName: 'Plumbing Repair', jobId: 'JOB-4821',
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 30,
};

const STEPS = ['Confirmed', 'Dispatched', 'En Route', 'In Progress', 'Complete'];

export default function JobTrackerBlock({ data, theme }: BlockComponentProps) {
  const current = data.currentStep ?? 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{data.serviceName || 'Service'}</div>
          {data.jobId && <div style={{ fontSize: 8, color: theme.t4 }}>{data.jobId}</div>}
        </div>
        {data.eta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: theme.greenBg, padding: '3px 8px', borderRadius: 6 }}>
            <Clock size={9} color={theme.green} />
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.green }}>ETA {data.eta}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((step, i) => {
            const done = i <= current;
            const active = i === current;
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && (
                  <div style={{ position: 'absolute', top: 7, right: '50%', width: '100%', height: 2, background: done ? theme.accent : theme.bdr, zIndex: 0 }} />
                )}
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? theme.accent : theme.bg, border: active ? `2px solid ${theme.accent}` : done ? 'none' : `2px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxSizing: 'border-box' }}>
                  {done && <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : '#fff' }} />}
                </div>
                <div style={{ fontSize: 7, color: active ? theme.accent : done ? theme.t2 : theme.t4, fontWeight: active ? 700 : 400, marginTop: 4, textAlign: 'center' }}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>
      {data.technicianName && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={10} color={theme.accent} />
          <span style={{ fontSize: 9, color: theme.t2 }}><strong>{data.technicianName}</strong> is {STEPS[current]?.toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}
