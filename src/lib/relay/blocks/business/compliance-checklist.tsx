'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardCheck, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_compliance_checklist',
  family: 'operations',
  label: 'Compliance Checklist',
  description: 'Step-by-step regulatory checklist with progress fraction',
  applicableCategories: ['business', 'professional', 'legal', 'finance', 'healthcare', 'real_estate'],
  intentTriggers: {
    keywords: ['compliance', 'regulatory', 'checklist', 'requirements', 'audit', 'steps'],
    queryPatterns: ['compliance status', 'what do I still need', 'regulatory steps', 'audit checklist'],
    dataConditions: ['has_compliance'],
  },
  dataContract: {
    required: [
      { field: 'steps', type: 'tags', label: 'Steps' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Checklist Title' },
      { field: 'regulation', type: 'text', label: 'Regulation Name' },
    ],
  },
  variants: ['default'],
  sampleData: {
    title: 'SOC 2 Readiness',
    regulation: 'SOC 2 Type II',
    steps: [
      { name: 'Risk assessment completed', done: true },
      { name: 'Access controls documented', done: true },
      { name: 'Encryption policy in place', done: true },
      { name: 'Incident response plan', done: false },
      { name: 'Vendor assessment', done: false },
      { name: 'Penetration test scheduled', done: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 120,
};

export default function ComplianceChecklistBlock({ data, theme }: BlockComponentProps) {
  const steps: Array<Record<string, any>> = data.steps || [];
  if (!steps.length) return null;
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ClipboardCheck size={12} color={theme.accent} />
            <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>{data.title || 'Compliance Checklist'}</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.accent }}>{done}/{steps.length}</span>
        </div>
        {data.regulation && <div style={{ fontSize: 8, color: theme.t4, marginBottom: 4 }}>{data.regulation}</div>}
        <div style={{ height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? theme.green : theme.accent, borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < steps.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            {s.done
              ? <CheckCircle size={14} color={theme.green} />
              : <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${theme.t4}` }} />
            }
            <span style={{ fontSize: 10, color: s.done ? theme.t3 : theme.t1, fontWeight: s.done ? 400 : 500, textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
