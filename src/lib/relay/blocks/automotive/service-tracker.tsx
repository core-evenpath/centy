'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Wrench, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_service_tracker',
  family: 'operations',
  label: 'Service Tracker',
  description: 'Live 5-step pipeline with ETA and technician notes',
  applicableCategories: ['automotive', 'service_center', 'mechanic', 'dealership'],
  intentTriggers: {
    keywords: ['status', 'track', 'progress', 'ready', 'service update', 'ETA'],
    queryPatterns: ['where is my car', 'is my car ready', 'service status', 'how long *'],
    dataConditions: ['has_active_service'],
  },
  dataContract: {
    required: [
      { field: 'currentStep', type: 'number', label: 'Current Step' },
    ],
    optional: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
      { field: 'eta', type: 'text', label: 'ETA' },
      { field: 'techNote', type: 'text', label: 'Technician Note' },
      { field: 'techName', type: 'text', label: 'Technician' },
    ],
  },
  variants: ['default'],
  sampleData: {
    vehicleLabel: '2024 Toyota Camry XSE', currentStep: 2, eta: '~2 hrs',
    steps: ['Checked In', 'Diagnostics', 'In Repair', 'Quality Check', 'Ready'],
    techName: 'Mike R.', techNote: 'Replacing front brake pads. Rotors in good shape.',
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 30,
};

export default function ServiceTrackerBlock({ data, theme }: BlockComponentProps) {
  const steps: string[] = data.steps || ['Checked In', 'Diagnostics', 'In Repair', 'Quality Check', 'Ready'];
  const current = data.currentStep ?? 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Wrench size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Service Tracker</span>
        </div>
        {data.eta && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: theme.accent, fontWeight: 600 }}><Clock size={9} />ETA {data.eta}</span>}
      </div>
      {data.vehicleLabel && <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}`, fontSize: 9, color: theme.t3 }}>{data.vehicleLabel}</div>}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {steps.map((s, i) => {
            const done = i <= current;
            const active = i === current;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 6, right: '50%', width: '100%', height: 2, background: done ? theme.accent : theme.bdr, zIndex: 0 }} />}
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: done ? theme.accent : theme.bg, border: active ? `2px solid ${theme.accent}` : done ? 'none' : `2px solid ${theme.bdr}`, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done && !active && <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 7, color: active ? theme.accent : theme.t4, fontWeight: active ? 700 : 400, marginTop: 4, textAlign: 'center' }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      {(data.techName || data.techNote) && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, background: theme.bg }}>
          {data.techName && <div style={{ fontSize: 8, fontWeight: 600, color: theme.t2, marginBottom: 2 }}>Tech: {data.techName}</div>}
          {data.techNote && <div style={{ fontSize: 9, color: theme.t3, lineHeight: 1.3 }}>{data.techNote}</div>}
        </div>
      )}
    </div>
  );
}
