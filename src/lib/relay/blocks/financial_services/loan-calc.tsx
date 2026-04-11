'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calculator, DollarSign } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_loan_calc',
  family: 'tools',
  label: 'Loan Calculator',
  description: 'Amount, term, APR display with monthly payment and total cost output',
  applicableCategories: ['financial_services', 'banking', 'lending', 'fintech'],
  intentTriggers: {
    keywords: ['loan calculator', 'monthly payment', 'calculate', 'mortgage', 'payment estimator'],
    queryPatterns: ['how much would I pay', 'calculate my loan', 'estimate payment *'],
    dataConditions: ['has_loan_params'],
  },
  dataContract: {
    required: [
      { field: 'amount', type: 'currency', label: 'Loan Amount' },
      { field: 'termMonths', type: 'number', label: 'Term (months)' },
      { field: 'apr', type: 'number', label: 'APR %' },
    ],
    optional: [
      { field: 'monthlyPayment', type: 'currency', label: 'Monthly Payment' },
      { field: 'totalCost', type: 'currency', label: 'Total Cost' },
      { field: 'totalInterest', type: 'currency', label: 'Total Interest' },
    ],
  },
  variants: ['default'],
  sampleData: {
    amount: 25000, termMonths: 60, apr: 6.49,
    monthlyPayment: 489, totalCost: 29340, totalInterest: 4340,
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function LoanCalcBlock({ data, theme }: BlockComponentProps) {
  const { amount = 0, termMonths = 0, apr = 0, monthlyPayment = 0, totalCost = 0, totalInterest = 0 } = data;
  const principalPct = totalCost > 0 ? Math.round((amount / totalCost) * 100) : 80;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calculator size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Loan Calculator</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          {[{ l: 'Amount', v: fmt(amount) }, { l: 'Term', v: `${termMonths} mo` }, { l: 'APR', v: `${apr}%` }].map(r => (
            <div key={r.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>{r.l}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1, marginTop: 2 }}>{r.v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: theme.accentBg, borderRadius: 8, padding: '10px 12px', textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 8, color: theme.t3, textTransform: 'uppercase' }}>Monthly Payment</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: theme.accent, marginTop: 2 }}>{fmt(monthlyPayment)}</div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: theme.bg, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: `${principalPct}%`, height: '100%', background: theme.accent, borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: theme.accent }} />
            <span style={{ fontSize: 8, color: theme.t3 }}>Principal {fmt(amount)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: theme.bg, border: `1px solid ${theme.bdr}` }} />
            <span style={{ fontSize: 8, color: theme.t3 }}>Interest {fmt(totalInterest)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
