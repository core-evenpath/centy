'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Receipt, CreditCard } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_bill_pay',
  family: 'billing',
  label: 'Bill Payment',
  description: 'Account context, line-item breakdown, total due, pay CTA',
  applicableCategories: ['government', 'public_services', 'municipal', 'utilities'],
  intentTriggers: {
    keywords: ['bill', 'pay', 'payment', 'balance', 'due', 'utility', 'water', 'tax'],
    queryPatterns: ['pay my bill *', 'how much do I owe', 'view my balance'],
    dataConditions: ['has_account', 'has_balance'],
  },
  dataContract: {
    required: [
      { field: 'accountNumber', type: 'text', label: 'Account Number' },
      { field: 'totalDue', type: 'currency', label: 'Total Due' },
    ],
    optional: [
      { field: 'lineItems', type: 'tags', label: 'Line Items' },
      { field: 'dueDate', type: 'date', label: 'Due Date' },
      { field: 'accountHolder', type: 'text', label: 'Account Holder' },
    ],
  },
  variants: ['default'],
  sampleData: {
    accountNumber: 'WTR-004821',
    accountHolder: 'J. Rodriguez',
    totalDue: 142.50,
    dueDate: 'Apr 30, 2026',
    lineItems: [
      { label: 'Water Service', amount: 68.00 },
      { label: 'Sewer Service', amount: 52.00 },
      { label: 'Storm Drain Fee', amount: 12.50 },
      { label: 'Environmental Surcharge', amount: 10.00 },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function BillPayBlock({ data, theme }: BlockComponentProps) {
  const items: Array<{ label: string; amount: number }> = data.lineItems || [];
  const total = data.totalDue || 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Receipt size={12} color={theme.accent} />
          <div>
            <div style={{ fontSize: 10, color: theme.t3 }}>Account {data.accountNumber}</div>
            {data.accountHolder && <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{data.accountHolder}</div>}
          </div>
        </div>
        {data.dueDate && <span style={{ fontSize: 9, color: theme.amber, fontWeight: 600 }}>Due {data.dueDate}</span>}
      </div>
      {items.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
              <span style={{ fontSize: 10, color: theme.t2 }}>{it.label}</span>
              <span style={{ fontSize: 10, color: theme.t1 }}>${it.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${theme.bdr}` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>Total Due</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>${typeof total === 'number' ? total.toFixed(2) : total}</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <CreditCard size={12} /> Pay Now
        </button>
      </div>
    </div>
  );
}
