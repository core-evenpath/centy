'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardList, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_application_tracker',
  family: 'tracking',
  label: 'Application Tracker',
  description: 'Multi-step status pipeline with reference number and ETA',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['application', 'status', 'track', 'reference', 'pending', 'approved'],
    queryPatterns: ['track my application *', 'status of *', 'where is my application'],
    dataConditions: ['has_application_id'],
  },
  dataContract: {
    required: [
      { field: 'refNumber', type: 'text', label: 'Reference Number' },
      { field: 'currentStep', type: 'text', label: 'Current Step' },
    ],
    optional: [
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
      { field: 'eta', type: 'text', label: 'Estimated Completion' },
      { field: 'applicantName', type: 'text', label: 'Applicant Name' },
    ],
  },
  variants: ['default'],
  sampleData: {
    refNumber: 'APP-2026-04821',
    currentStep: 'Under Review',
    steps: ['Submitted', 'Under Review', 'Approved', 'Issued'],
    eta: 'Apr 18, 2026',
    applicantName: 'Maria Santos',
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 60,
};

export default function ApplicationTrackerBlock({ data, theme }: BlockComponentProps) {
  const steps: string[] = data.steps || ['Submitted', 'Under Review', 'Approved', 'Issued'];
  const currentIdx = steps.indexOf(data.currentStep);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClipboardList size={14} color={theme.accent} />
          <span style={{ fontSize: 10, color: theme.t3 }}>Ref: <strong style={{ color: theme.t1 }}>{data.refNumber}</strong></span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.accent, background: theme.accentBg, padding: '3px 8px', borderRadius: 5 }}>{data.currentStep}</span>
      </div>
      <div style={{ padding: '14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {steps.map((step, i) => {
            const done = i <= currentIdx;
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? theme.accent : theme.bg, border: done ? 'none' : `2px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <Check size={10} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 7, color: done ? theme.t1 : theme.t4, fontWeight: i === currentIdx ? 700 : 400, marginTop: 4, textAlign: 'center' }}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
      {data.eta && (
        <div style={{ padding: '8px 12px', background: theme.bg, borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: theme.t3 }}>Estimated completion</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{data.eta}</span>
        </div>
      )}
    </div>
  );
}
