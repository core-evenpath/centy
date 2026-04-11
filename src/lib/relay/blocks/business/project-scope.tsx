'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardList, CheckSquare } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_project_scope',
  family: 'engagement',
  label: 'Project Scope',
  description: 'Scope document with deliverables checklist, timeline, and budget estimate',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['scope', 'deliverables', 'timeline', 'budget', 'project plan', 'SOW'],
    queryPatterns: ['what is the scope', 'project deliverables', 'what will I get', 'scope of work'],
    dataConditions: ['has_scope'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Project Title' },
      { field: 'deliverables', type: 'tags', label: 'Deliverables' },
    ],
    optional: [
      { field: 'timeline', type: 'text', label: 'Timeline' },
      { field: 'budget', type: 'currency', label: 'Budget Estimate' },
      { field: 'status', type: 'select', label: 'Status', options: ['draft', 'pending', 'approved'] },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Brand Refresh & Launch Campaign',
    deliverables: ['Brand audit report', 'Visual identity system', 'Messaging framework', 'Launch campaign plan', 'Social media templates'],
    timeline: '8 weeks', budget: 24000, status: 'pending',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 120,
};

export default function ProjectScopeBlock({ data, theme }: BlockComponentProps) {
  const deliverables: string[] = data.deliverables || [];
  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: theme.bg, color: theme.t3 },
    pending: { bg: theme.amberBg, color: theme.amber },
    approved: { bg: theme.greenBg, color: theme.green },
  };
  const sc = statusColors[data.status] || statusColors.draft;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClipboardList size={14} color={theme.accent} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{data.title}</div>
          {data.timeline && <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>Timeline: {data.timeline}</div>}
        </div>
        {data.status && <span style={{ fontSize: 8, fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 6px', borderRadius: 4 }}>{data.status}</span>}
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Deliverables</div>
        {deliverables.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: i < deliverables.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <CheckSquare size={11} color={theme.t4} />
            <span style={{ fontSize: 10, color: theme.t2 }}>{d}</span>
          </div>
        ))}
      </div>
      {data.budget && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: theme.t3 }}>Estimated Budget</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>${data.budget.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
