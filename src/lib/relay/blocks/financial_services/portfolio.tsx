'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { PieChart, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_portfolio',
  family: 'wealth',
  label: 'Portfolio Summary',
  description: 'Total value, YTD return, asset allocation bar with per-class returns',
  applicableCategories: ['financial_services', 'wealth_management', 'investing', 'fintech'],
  intentTriggers: {
    keywords: ['portfolio', 'investments', 'allocation', 'returns', 'wealth', 'assets'],
    queryPatterns: ['show my portfolio', 'how are my investments', 'asset allocation'],
    dataConditions: ['has_portfolio'],
  },
  dataContract: {
    required: [
      { field: 'totalValue', type: 'currency', label: 'Total Value' },
    ],
    optional: [
      { field: 'ytdReturn', type: 'number', label: 'YTD Return %' },
      { field: 'ytdAmount', type: 'currency', label: 'YTD Return $' },
      { field: 'allocations', type: 'tags', label: 'Asset Allocations' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    totalValue: 284750, ytdReturn: 8.3, ytdAmount: 21842,
    allocations: [
      { name: 'US Equities', pct: 45, returnPct: 12.1, color: '#3b82f6' },
      { name: 'Int\'l Equities', pct: 20, returnPct: 6.8, color: '#8b5cf6' },
      { name: 'Bonds', pct: 25, returnPct: 3.2, color: '#06b6d4' },
      { name: 'Alternatives', pct: 10, returnPct: 5.5, color: '#f59e0b' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function PortfolioBlock({ data, theme }: BlockComponentProps) {
  const { totalValue = 0, ytdReturn = 0, ytdAmount = 0 } = data;
  const allocations: Array<Record<string, any>> = data.allocations || [];
  const positive = ytdReturn >= 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <PieChart size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Portfolio Summary</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.t1 }}>{fmt(totalValue)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <TrendingUp size={10} color={positive ? theme.green : theme.red} />
          <span style={{ fontSize: 10, fontWeight: 600, color: positive ? theme.green : theme.red }}>{positive ? '+' : ''}{ytdReturn}% YTD</span>
          {ytdAmount > 0 && <span style={{ fontSize: 9, color: theme.t4 }}>({positive ? '+' : ''}{fmt(ytdAmount)})</span>}
        </div>
      </div>
      {allocations.length > 0 && (
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            {allocations.map((a, i) => <div key={i} style={{ width: `${a.pct}%`, background: a.color || theme.accent, height: '100%' }} />)}
          </div>
          {allocations.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: a.color || theme.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: theme.t2, flex: 1 }}>{a.name}</span>
              <span style={{ fontSize: 9, color: theme.t3 }}>{a.pct}%</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: a.returnPct >= 0 ? theme.green : theme.red }}>{a.returnPct >= 0 ? '+' : ''}{a.returnPct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
