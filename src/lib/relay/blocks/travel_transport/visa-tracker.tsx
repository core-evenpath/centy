'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_visa_tracker',
  family: 'documents',
  label: 'Visa Application Tracker',
  description: 'Multi-step visa application pipeline with reference number and ETA',
  applicableCategories: ['travel', 'immigration', 'visa_services', 'agencies'],
  intentTriggers: {
    keywords: ['visa', 'application', 'status', 'passport', 'immigration'],
    queryPatterns: ['visa status', 'where is my visa', 'application update', 'track visa'],
    dataConditions: ['has_visa_application'],
  },
  dataContract: {
    required: [{ field: 'status', type: 'text', label: 'Current Status' }],
    optional: [
      { field: 'refNumber', type: 'text', label: 'Reference Number' },
      { field: 'applicant', type: 'text', label: 'Applicant Name' },
      { field: 'country', type: 'text', label: 'Destination Country' },
      { field: 'eta', type: 'text', label: 'Estimated Completion' },
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
    ],
  },
  variants: ['default'],
  sampleData: {
    refNumber: 'VSA-2026-48291', applicant: 'James Wilson', country: 'Japan',
    eta: 'Apr 18, 2026', status: 'Biometrics Complete',
    steps: [
      { label: 'Submitted', done: true },
      { label: 'Documents Verified', done: true },
      { label: 'Biometrics Complete', done: true },
      { label: 'Under Review', done: false },
      { label: 'Decision', done: false },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

export default function VisaTrackerBlock({ data, theme }: BlockComponentProps) {
  const steps: Array<{ label: string; done: boolean }> = data.steps || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FileText size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Visa Application</span>
        </div>
        {data.refNumber && <span style={{ fontSize: 8, color: theme.t4, fontFamily: 'monospace' }}>{data.refNumber}</span>}
      </div>
      {(data.applicant || data.country) && (
        <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between' }}>
          {data.applicant && <span style={{ fontSize: 9, color: theme.t2 }}>{data.applicant}</span>}
          {data.country && <span style={{ fontSize: 9, fontWeight: 600, color: theme.accent }}>{data.country}</span>}
        </div>
      )}
      {steps.length > 0 && (
        <div style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {steps.map((s, i) => {
              const isCurrent = s.done && (i === steps.length - 1 || !steps[i + 1].done);
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {i > 0 && <div style={{ position: 'absolute', top: 7, right: '50%', width: '100%', height: 2, background: s.done ? theme.accent : theme.bdr }} />}
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: s.done ? theme.accent : theme.bg, border: s.done ? 'none' : `2px solid ${theme.bdr}`, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>&#10003;</span>}
                  </div>
                  <span style={{ fontSize: 7, color: isCurrent ? theme.accent : theme.t4, fontWeight: isCurrent ? 700 : 400, marginTop: 4, textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {data.eta && (
        <div style={{ padding: '6px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={9} color={theme.t4} />
          <span style={{ fontSize: 8, color: theme.t3 }}>Estimated completion:</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.green }}>{data.eta}</span>
        </div>
      )}
    </div>
  );
}
