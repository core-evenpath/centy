'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ListChecks, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_treatment_plan',
  family: 'care',
  label: 'Treatment Plan',
  description: 'Step-by-step care timeline with completed/active/upcoming milestone dots',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital'],
  intentTriggers: {
    keywords: ['treatment', 'plan', 'care plan', 'timeline', 'milestones', 'recovery'],
    queryPatterns: ['my treatment plan', 'what are the next steps', 'care timeline *'],
    dataConditions: ['has_treatment_plan'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'planName', type: 'text', label: 'Plan Name' },
      { field: 'steps', type: 'tags', label: 'Treatment Steps' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    planName: 'Knee Replacement Recovery',
    steps: [
      { label: 'Pre-op Assessment', date: 'Mar 28', status: 'completed' },
      { label: 'Surgery', date: 'Apr 2', status: 'completed' },
      { label: 'Physical Therapy', date: 'Apr 10', status: 'active' },
      { label: 'Follow-up Visit', date: 'Apr 24', status: 'upcoming' },
      { label: 'Full Recovery', date: 'Jun 1', status: 'upcoming' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function TreatmentPlanBlock({ data, theme }: BlockComponentProps) {
  const steps: Array<Record<string, any>> = data.steps || [];
  if (!steps.length) return null;

  const dotColor = (s: string) => s === 'completed' ? theme.green : s === 'active' ? theme.accent : theme.t4;
  const dotBg = (s: string) => s === 'completed' ? theme.greenBg : s === 'active' ? theme.accentBg : theme.bg;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ListChecks size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.planName || 'Treatment Plan'}</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
            {i < steps.length - 1 && <div style={{ position: 'absolute', left: 7, top: 16, width: 2, bottom: 0, background: theme.bdr }} />}
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: dotBg(step.status), border: `2px solid ${dotColor(step.status)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              {step.status === 'completed' && <CheckCircle size={10} color={theme.green} />}
              {step.status === 'active' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} />}
            </div>
            <div style={{ flex: 1, paddingTop: 1 }}>
              <div style={{ fontSize: 10, fontWeight: step.status === 'active' ? 700 : 500, color: step.status === 'upcoming' ? theme.t4 : theme.t1 }}>{step.label}</div>
              <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{step.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
