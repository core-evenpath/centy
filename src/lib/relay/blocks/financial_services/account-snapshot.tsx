'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Wallet, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_account_snapshot',
  family: 'accounts',
  label: 'Account Overview',
  description: 'Multi-account summary with balances, APY, available credit',
  applicableCategories: ['financial_services', 'banking', 'credit_unions', 'fintech'],
  intentTriggers: {
    keywords: ['accounts', 'balance', 'overview', 'summary', 'snapshot', 'my accounts'],
    queryPatterns: ['show my accounts', 'what is my balance', 'account summary'],
    dataConditions: ['has_accounts'],
  },
  dataContract: {
    required: [
      { field: 'accounts', type: 'tags', label: 'Accounts' },
    ],
    optional: [
      { field: 'totalBalance', type: 'currency', label: 'Total Balance' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    totalBalance: 47832.50,
    accounts: [
      { name: 'Checking', number: '••4821', balance: 8420.33, type: 'checking' },
      { name: 'High-Yield Savings', number: '••7193', balance: 32150.00, apy: 4.75, type: 'savings' },
      { name: 'Platinum Card', number: '••3056', balance: -2415.80, available: 17584.20, type: 'credit' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 60,
};

function fmt(n: number) { return (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function AccountSnapshotBlock({ data, theme }: BlockComponentProps) {
  const accounts: Array<Record<string, any>> = data.accounts || [];
  const total = data.totalBalance;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {total !== undefined && (
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Wallet size={11} color={theme.t1} />
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Your Accounts</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(total)}</span>
        </div>
      )}
      {accounts.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: i < accounts.length - 1 ? `1px solid ${theme.bdr}` : 'none', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: a.type === 'credit' ? theme.redBg : theme.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {a.type === 'credit' ? <Wallet size={12} color={theme.red} /> : <TrendingUp size={12} color={theme.accent} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{a.name}</div>
            <div style={{ fontSize: 8, color: theme.t4 }}>{a.number}{a.apy ? ` · ${a.apy}% APY` : ''}{a.available ? ` · ${fmt(a.available)} avail.` : ''}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: a.balance < 0 ? theme.red : theme.t1 }}>{fmt(a.balance)}</span>
        </div>
      ))}
    </div>
  );
}
