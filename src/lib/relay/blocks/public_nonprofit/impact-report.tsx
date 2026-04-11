'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { BarChart3, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_impact_report',
  family: 'transparency',
  label: 'Impact Report',
  description: '3-stat hero grid, key outcomes checklist, next-year goal',
  applicableCategories: ['nonprofit', 'charity', 'foundation', 'government'],
  intentTriggers: {
    keywords: ['impact', 'report', 'outcomes', 'results', 'metrics', 'annual report'],
    queryPatterns: ['what impact *', 'show me your results', 'how many people *'],
    dataConditions: ['has_impact_data'],
  },
  dataContract: {
    required: [
      { field: 'stats', type: 'tags', label: 'Key Stats' },
    ],
    optional: [
      { field: 'outcomes', type: 'tags', label: 'Key Outcomes' },
      { field: 'nextGoal', type: 'text', label: 'Next Year Goal' },
      { field: 'period', type: 'text', label: 'Reporting Period' },
    ],
  },
  variants: ['default'],
  sampleData: {
    stats: [
      { label: 'People Served', value: '12,450' },
      { label: 'Programs Run', value: '34' },
      { label: 'Funds Raised', value: '$2.1M' },
    ],
    outcomes: ['Reduced food insecurity by 18%', 'Opened 3 new community centers', 'Trained 800+ job seekers'],
    nextGoal: 'Serve 15,000 residents by 2027',
    period: 'FY 2025',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function ImpactReportBlock({ data, theme }: BlockComponentProps) {
  const stats: Array<{ label: string; value: string }> = data.stats || [];
  const outcomes: string[] = data.outcomes || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={12} color={theme.accent} />
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Impact Report</span>
        </div>
        {data.period && <span style={{ fontSize: 8, color: theme.t4 }}>{data.period}</span>}
      </div>
      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`, borderBottom: `1px solid ${theme.bdr}` }}>
          {stats.map((s, i) => (
            <div key={i} style={{ padding: '10px 12px', textAlign: 'center', borderRight: i < stats.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>{s.value}</div>
              <div style={{ fontSize: 8, color: theme.t3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {outcomes.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: data.nextGoal ? `1px solid ${theme.bdr}` : 'none' }}>
          {outcomes.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
              <CheckCircle size={10} color={theme.green} />
              <span style={{ fontSize: 10, color: theme.t2 }}>{o}</span>
            </div>
          ))}
        </div>
      )}
      {data.nextGoal && (
        <div style={{ padding: '8px 12px', background: theme.accentBg }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.accent }}>Next Goal: </span>
          <span style={{ fontSize: 9, color: theme.t2 }}>{data.nextGoal}</span>
        </div>
      )}
    </div>
  );
}
