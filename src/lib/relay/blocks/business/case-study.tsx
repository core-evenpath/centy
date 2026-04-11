'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { TrendingUp, Building2 } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_case_study',
  family: 'proof',
  label: 'Case Study / Portfolio',
  description: 'Past engagement card with client industry, challenge, and result metrics',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['case study', 'portfolio', 'results', 'past work', 'success', 'examples', 'proof'],
    queryPatterns: ['show me examples', 'past projects', 'client results', 'case studies'],
    dataConditions: ['has_case_studies'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Project Title' },
      { field: 'industry', type: 'text', label: 'Client Industry' },
    ],
    optional: [
      { field: 'challenge', type: 'textarea', label: 'Challenge' },
      { field: 'result', type: 'text', label: 'Key Result' },
      { field: 'metrics', type: 'tags', label: 'Result Metrics' },
      { field: 'clientName', type: 'text', label: 'Client Name' },
      { field: 'duration', type: 'text', label: 'Engagement Duration' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { title: 'Digital Transformation', industry: 'Healthcare', challenge: 'Legacy systems causing 40% data lag', result: '3x faster processing', metrics: [{ label: 'Revenue', value: '+42%' }, { label: 'Efficiency', value: '+65%' }], duration: '6 months' },
      { title: 'Market Entry Strategy', industry: 'FinTech', challenge: 'Zero brand awareness in APAC', result: '12 enterprise clients in Q1', metrics: [{ label: 'Pipeline', value: '$2.4M' }, { label: 'CAC', value: '-38%' }], duration: '4 months' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 600,
};

export default function CaseStudyBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [data];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((cs, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Building2 size={10} color={theme.accent} />
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.accent }}>{cs.industry}</span>
              {cs.duration && <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{cs.duration}</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{cs.title}</div>
            {cs.challenge && <div style={{ fontSize: 9, color: theme.t3, marginTop: 3, lineHeight: 1.4 }}>{cs.challenge}</div>}
          </div>
          {cs.result && (
            <div style={{ padding: '8px 12px', background: theme.greenBg, display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${theme.bdr}` }}>
              <TrendingUp size={11} color={theme.green} />
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.green }}>{cs.result}</span>
            </div>
          )}
          {cs.metrics?.length > 0 && (
            <div style={{ padding: '8px 12px', display: 'flex', gap: 12 }}>
              {cs.metrics.map((m: any) => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{m.value}</div>
                  <div style={{ fontSize: 8, color: theme.t4 }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
