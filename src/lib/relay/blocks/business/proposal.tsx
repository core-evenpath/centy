'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_proposal',
  family: 'engagement',
  label: 'Proposal Summary',
  description: 'Formal engagement proposal with phased pricing, timeline, and total fee',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['proposal', 'quote', 'estimate', 'engagement', 'offer', 'pricing breakdown'],
    queryPatterns: ['send me a proposal', 'pricing breakdown', 'what will it cost', 'formal quote'],
    dataConditions: ['has_proposal'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Proposal Title' },
      { field: 'phases', type: 'tags', label: 'Phases' },
      { field: 'totalFee', type: 'currency', label: 'Total Fee' },
    ],
    optional: [
      { field: 'clientName', type: 'text', label: 'Client Name' },
      { field: 'validUntil', type: 'date', label: 'Valid Until' },
      { field: 'timeline', type: 'text', label: 'Total Timeline' },
    ],
  },
  variants: ['default', 'detailed'],
  sampleData: {
    title: 'E-Commerce Platform Redesign',
    clientName: 'Acme Corp', timeline: '12 weeks', validUntil: '2026-05-01',
    phases: [
      { name: 'Discovery & Audit', duration: '2 weeks', fee: 6000 },
      { name: 'UX/UI Design', duration: '4 weeks', fee: 14000 },
      { name: 'Development & QA', duration: '6 weeks', fee: 22000 },
    ],
    totalFee: 42000,
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ProposalBlock({ data, theme }: BlockComponentProps) {
  const phases: Array<Record<string, any>> = data.phases || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', background: theme.accentBg, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <FileText size={12} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Proposal</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{data.title}</div>
        <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>
          {data.clientName && <span>{data.clientName} · </span>}{data.timeline}
          {data.validUntil && <span style={{ marginLeft: 8, color: theme.t4 }}>Valid until {data.validUntil}</span>}
        </div>
      </div>
      <div style={{ padding: '8px 12px' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < phases.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{p.name}</div>
              {p.duration && <div style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}><Clock size={8} />{p.duration}</div>}
            </div>
            {p.fee != null && <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{fmt(p.fee)}</span>}
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px', borderTop: `2px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.bg }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t2 }}>Total Fee</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(data.totalFee || 0)}</span>
      </div>
    </div>
  );
}
