'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calculator, DollarSign } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_finance_calc',
  family: 'pricing',
  label: 'Finance Calculator',
  description: 'Loan/lease/cash tabs with down payment, term, APR, monthly estimate',
  applicableCategories: ['automotive', 'dealership', 'cars', 'vehicles'],
  intentTriggers: {
    keywords: ['finance', 'payment', 'lease', 'loan', 'APR', 'monthly', 'afford'],
    queryPatterns: ['what would my payment be', 'finance options', 'can I lease *', 'monthly for *'],
    dataConditions: ['has_vehicle_price'],
  },
  dataContract: {
    required: [
      { field: 'vehiclePrice', type: 'currency', label: 'Vehicle Price' },
    ],
    optional: [
      { field: 'downPayment', type: 'currency', label: 'Down Payment' },
      { field: 'term', type: 'number', label: 'Term (months)' },
      { field: 'apr', type: 'number', label: 'APR %' },
      { field: 'monthlyPayment', type: 'currency', label: 'Monthly Payment' },
      { field: 'selectedTab', type: 'select', label: 'Finance Type', options: ['Loan', 'Lease', 'Cash'] },
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    vehicleLabel: '2024 Toyota Camry XSE', vehiclePrice: 34250, downPayment: 5000,
    term: 60, apr: 4.9, monthlyPayment: 549, selectedTab: 'Loan',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function FinanceCalcBlock({ data, theme }: BlockComponentProps) {
  const tabs = ['Loan', 'Lease', 'Cash'];
  const active = data.selectedTab || 'Loan';
  const rows = [
    { label: 'Vehicle Price', value: fmt(data.vehiclePrice || 0) },
    { label: 'Down Payment', value: fmt(data.downPayment || 0) },
    { label: 'Term', value: `${data.term || 60} months` },
    { label: 'APR', value: `${data.apr || 0}%` },
  ];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calculator size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Payment Calculator</span>
      </div>
      {data.vehicleLabel && <div style={{ padding: '6px 12px', fontSize: 9, color: theme.t3, borderBottom: `1px solid ${theme.bdr}` }}>{data.vehicleLabel}</div>}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.bdr}` }}>
        {tabs.map(t => (
          <div key={t} style={{ flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 9, fontWeight: 600, cursor: 'pointer', color: t === active ? theme.accent : theme.t3, borderBottom: t === active ? `2px solid ${theme.accent}` : '2px solid transparent', background: t === active ? theme.accentBg : 'transparent' }}>{t}</div>
        ))}
      </div>
      <div style={{ padding: '8px 12px' }}>
        {active !== 'Cash' && rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10 }}>
            <span style={{ color: theme.t3 }}>{r.label}</span>
            <span style={{ fontWeight: 600, color: theme.t1 }}>{r.value}</span>
          </div>
        ))}
        {active === 'Cash' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 10 }}>
            <span style={{ color: theme.t3 }}>Total Due</span>
            <span style={{ fontWeight: 600, color: theme.t1 }}>{fmt(data.vehiclePrice || 0)}</span>
          </div>
        )}
      </div>
      {active !== 'Cash' && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${theme.bdr}`, background: theme.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: theme.t3 }}>Est. Monthly</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <DollarSign size={12} color={theme.accent} />
            <span style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>{data.monthlyPayment || 0}</span>
            <span style={{ fontSize: 9, color: theme.t4 }}>/mo</span>
          </div>
        </div>
      )}
    </div>
  );
}
