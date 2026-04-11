'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_eligibility',
  family: 'tools',
  label: 'Eligibility Checker',
  description: 'Pre-qualification display with instant result and no-credit-impact badge',
  applicableCategories: ['financial_services', 'banking', 'lending', 'fintech'],
  intentTriggers: {
    keywords: ['eligible', 'qualify', 'pre-qualify', 'pre-approval', 'eligibility'],
    queryPatterns: ['am I eligible', 'do I qualify for *', 'pre-qualify me *'], dataConditions: ['has_eligibility_check'],
  },
  dataContract: {
    required: [
      { field: 'productName', type: 'text', label: 'Product Name' },
      { field: 'status', type: 'select', label: 'Status', options: ['eligible', 'not_eligible', 'pending'] },
    ],
    optional: [
      { field: 'approvedAmount', type: 'currency', label: 'Approved Amount' },
      { field: 'approvedRate', type: 'number', label: 'Approved Rate' },
      { field: 'criteria', type: 'tags', label: 'Criteria Met' },
      { field: 'expiresAt', type: 'text', label: 'Offer Expires' },
    ],
  },
  variants: ['default'],
  sampleData: {
    productName: 'Personal Loan', status: 'eligible', approvedAmount: 35000, approvedRate: 6.49,
    criteria: [
      { label: 'Credit Score 670+', met: true },
      { label: 'Income $40K+', met: true },
      { label: 'US Resident', met: true },
      { label: 'No recent bankruptcies', met: true },
    ],
    expiresAt: 'Apr 25, 2026',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function EligibilityBlock({ data, theme }: BlockComponentProps) {
  const { productName, status = 'pending', approvedAmount, approvedRate, expiresAt } = data;
  const criteria: Array<Record<string, any>> = data.criteria || [];
  const ok = status === 'eligible';
  const label = ok ? "You're Pre-Qualified!" : status === 'not_eligible' ? 'Not Eligible' : 'Checking...';

  return (
    <div style={{ background: theme.surface, border: `2px solid ${ok ? theme.green : theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', background: ok ? theme.greenBg : theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {ok ? <CheckCircle size={14} color={theme.green} /> : <ShieldCheck size={14} color={theme.t3} />}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: ok ? theme.green : theme.t1 }}>{label}</div>
            <div style={{ fontSize: 9, color: theme.t3 }}>{productName}</div>
          </div>
        </div>
        <span style={{ fontSize: 7, padding: '2px 5px', borderRadius: 4, background: theme.greenBg, color: theme.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldCheck size={8} />No credit impact
        </span>
      </div>
      {ok && (approvedAmount || approvedRate) && (
        <div style={{ padding: '8px 12px', display: 'flex', gap: 12, borderBottom: `1px solid ${theme.bdr}` }}>
          {approvedAmount && <div>
            <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>Up To</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>${approvedAmount.toLocaleString()}</div>
          </div>}
          {approvedRate && <div>
            <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>Rate From</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{approvedRate}% APR</div>
          </div>}
        </div>
      )}
      {criteria.length > 0 && <div style={{ padding: '8px 12px' }}>
        {criteria.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <CheckCircle size={10} color={c.met ? theme.green : theme.t4} />
            <span style={{ fontSize: 9, color: c.met ? theme.t1 : theme.t4 }}>{c.label}</span>
          </div>
        ))}
      </div>}
      {ok && <div style={{ padding: '6px 12px 10px' }}>
        {expiresAt && <div style={{ fontSize: 8, color: theme.t4, marginBottom: 4, textAlign: 'center' }}>Offer expires {expiresAt}</div>}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Accept & Apply</button>
      </div>}
    </div>
  );
}
