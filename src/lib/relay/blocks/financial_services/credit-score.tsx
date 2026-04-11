'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Gauge, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_credit_score',
  family: 'credit',
  label: 'Credit Health',
  description: 'Score gauge representation, trend indicator, 4-factor breakdown',
  applicableCategories: ['financial_services', 'banking', 'lending', 'credit'],
  intentTriggers: {
    keywords: ['credit score', 'credit health', 'FICO', 'credit report', 'score'],
    queryPatterns: ['what is my credit score', 'check my credit', 'credit health *'],
    dataConditions: ['has_credit_score'],
  },
  dataContract: {
    required: [
      { field: 'score', type: 'number', label: 'Credit Score' },
    ],
    optional: [
      { field: 'rating', type: 'text', label: 'Rating Label' },
      { field: 'change', type: 'number', label: 'Score Change' },
      { field: 'factors', type: 'tags', label: 'Score Factors' },
      { field: 'updatedAt', type: 'text', label: 'Last Updated' },
    ],
  },
  variants: ['default'],
  sampleData: {
    score: 742, rating: 'Very Good', change: 12,
    factors: [
      { label: 'Payment History', pct: 95, status: 'good' },
      { label: 'Credit Utilization', pct: 28, status: 'good' },
      { label: 'Credit Age', pct: 70, status: 'fair' },
      { label: 'Credit Mix', pct: 60, status: 'fair' },
    ],
    updatedAt: 'Apr 8, 2026',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

function sColor(s: number, t: any) { return s >= 740 ? t.green : s >= 670 ? t.amber : t.red; }

export default function CreditScoreBlock({ data, theme }: BlockComponentProps) {
  const { score = 0, rating = '', change = 0, updatedAt } = data;
  const factors: Array<Record<string, any>> = data.factors || [];
  const color = sColor(score, theme);
  const pct = Math.min(((score - 300) / 550) * 100, 100);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 12px 8px', textAlign: 'center', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
          <Gauge size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Credit Score</span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, color }}>{score}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 4 }}>{rating}</div>
        <div style={{ height: 6, background: theme.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: theme.t4 }}><span>300</span><span>850</span></div>
        {change !== 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 4 }}>
            <TrendingUp size={9} color={change > 0 ? theme.green : theme.red} />
            <span style={{ fontSize: 9, fontWeight: 600, color: change > 0 ? theme.green : theme.red }}>{change > 0 ? '+' : ''}{change} pts</span>
            {updatedAt && <span style={{ fontSize: 8, color: theme.t4 }}>{updatedAt}</span>}
          </div>
        )}
      </div>
      {factors.length > 0 && <div style={{ padding: '8px 12px' }}>
        {factors.map(f => (
          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: theme.t3, width: 90 }}>{f.label}</span>
            <div style={{ flex: 1, height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${f.pct}%`, height: '100%', background: f.status === 'good' ? theme.green : theme.amber, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 8, fontWeight: 600, color: f.status === 'good' ? theme.green : theme.amber, width: 30, textAlign: 'right' }}>{f.pct}%</span>
          </div>
        ))}
      </div>}
    </div>
  );
}
