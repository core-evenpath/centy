'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardList, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_app_tracker',
  family: 'tracking',
  label: 'Application Tracker',
  description: '5-step pipeline from Applied to Funded with ref number and ETA',
  applicableCategories: ['financial_services', 'banking', 'lending', 'insurance'],
  intentTriggers: {
    keywords: ['application status', 'track', 'where is my application', 'approval status'],
    queryPatterns: ['check my application', 'application status *', 'when will I hear back'],
    dataConditions: ['has_application'],
  },
  dataContract: {
    required: [
      { field: 'currentStep', type: 'number', label: 'Current Step (0-4)' },
    ],
    optional: [
      { field: 'refNumber', type: 'text', label: 'Reference Number' },
      { field: 'productName', type: 'text', label: 'Product Name' },
      { field: 'eta', type: 'text', label: 'Estimated Completion' },
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
    ],
  },
  variants: ['default'],
  sampleData: {
    refNumber: 'APP-2026-48291', productName: 'Personal Loan', currentStep: 2, eta: 'Apr 14, 2026',
    steps: ['Applied', 'Under Review', 'Approved', 'Docs Signed', 'Funded'],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

const DEFAULT_STEPS = ['Applied', 'Under Review', 'Approved', 'Docs Signed', 'Funded'];

export default function AppTrackerBlock({ data, theme }: BlockComponentProps) {
  const steps: string[] = data.steps || DEFAULT_STEPS;
  const current = data.currentStep ?? 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ClipboardList size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Application Tracker</span>
        </div>
        {data.refNumber && <span style={{ fontSize: 8, color: theme.t4 }}>{data.refNumber}</span>}
      </div>
      {data.productName && (
        <div style={{ padding: '5px 12px', background: theme.bg, fontSize: 9, color: theme.t2 }}>{data.productName}</div>
      )}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {steps.map((s, i) => {
            const done = i <= current;
            const isActive = i === current;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 9, right: '50%', width: '100%', height: 2, background: done ? theme.accent : theme.bdr, zIndex: 0 }} />}
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? theme.accent : theme.surface, border: done ? 'none' : `2px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxSizing: 'border-box' }}>
                  {done && <CheckCircle size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: 7, color: isActive ? theme.accent : theme.t4, fontWeight: isActive ? 700 : 400, marginTop: 4, textAlign: 'center', lineHeight: 1.2 }}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
      {data.eta && (
        <div style={{ padding: '6px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: theme.t3 }}>Estimated completion: <strong style={{ color: theme.accent }}>{data.eta}</strong></span>
        </div>
      )}
    </div>
  );
}
