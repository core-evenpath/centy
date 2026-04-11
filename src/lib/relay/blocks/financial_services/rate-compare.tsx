'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { BarChart3, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_rate_compare',
  family: 'tools',
  label: 'Rate Comparison',
  description: 'Our rate vs market average bars with advantage differential',
  applicableCategories: ['financial_services', 'banking', 'lending', 'fintech'],
  intentTriggers: {
    keywords: ['compare rates', 'market rate', 'average', 'how do you compare', 'competitive'],
    queryPatterns: ['how does your rate compare', 'market average *', 'better than *'],
    dataConditions: ['has_rate_comparison'],
  },
  dataContract: {
    required: [
      { field: 'productName', type: 'text', label: 'Product Name' },
      { field: 'ourRate', type: 'number', label: 'Our Rate' },
      { field: 'marketRate', type: 'number', label: 'Market Average' },
    ],
    optional: [
      { field: 'rateLabel', type: 'text', label: 'Rate Label' },
      { field: 'advantage', type: 'text', label: 'Advantage Text' },
      { field: 'source', type: 'text', label: 'Data Source' },
    ],
  },
  variants: ['default'],
  sampleData: {
    productName: 'High-Yield Savings', ourRate: 4.75, marketRate: 3.20,
    rateLabel: 'APY', advantage: '1.55% more than average', source: 'FDIC National Rate, Apr 2026',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function RateCompareBlock({ data, theme }: BlockComponentProps) {
  const { productName, ourRate = 0, marketRate = 0, rateLabel = 'APY', advantage, source } = data;
  const maxRate = Math.max(ourRate, marketRate, 1);
  const diff = (ourRate - marketRate).toFixed(2);
  const isHigherBetter = rateLabel === 'APY';
  const weWin = isHigherBetter ? ourRate > marketRate : ourRate < marketRate;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <BarChart3 size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{productName} — Rate Comparison</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {[{ label: 'Our Rate', value: ourRate, color: theme.accent }, { label: 'Market Avg', value: marketRate, color: theme.t4 }].map(r => (
          <div key={r.label} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: theme.t3 }}>{r.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.value}% {rateLabel}</span>
            </div>
            <div style={{ height: 8, background: theme.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(r.value / maxRate) * 100}%`, height: '100%', background: r.color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
        {weWin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', background: theme.greenBg, borderRadius: 6 }}>
            <TrendingUp size={10} color={theme.green} />
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.green }}>{advantage || `+${diff}% ${rateLabel} advantage`}</span>
          </div>
        )}
        {source && <div style={{ fontSize: 7, color: theme.t4, marginTop: 6, textAlign: 'right' }}>{source}</div>}
      </div>
    </div>
  );
}
