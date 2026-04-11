'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CreditCard, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_product_card',
  family: 'catalog',
  label: 'Financial Product',
  description: 'Savings, loan, or card product with rate/APY, minimums, apply CTA',
  applicableCategories: ['financial_services', 'banking', 'credit_unions', 'fintech'],
  intentTriggers: {
    keywords: ['savings', 'loan', 'credit card', 'product', 'account', 'APY', 'rate'],
    queryPatterns: ['show me products', 'what accounts *', 'best savings *', 'card options'],
    dataConditions: ['has_products'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Product Name' },
      { field: 'rate', type: 'number', label: 'Rate / APY' },
    ],
    optional: [
      { field: 'type', type: 'select', label: 'Product Type', options: ['savings', 'loan', 'card', 'cd'] },
      { field: 'rateLabel', type: 'text', label: 'Rate Label' },
      { field: 'minDeposit', type: 'currency', label: 'Minimum Deposit' },
      { field: 'annualFee', type: 'currency', label: 'Annual Fee' },
      { field: 'features', type: 'tags', label: 'Features' },
      { field: 'badge', type: 'text', label: 'Badge' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'High-Yield Savings', type: 'savings', rate: 4.75, rateLabel: 'APY', minDeposit: 500, features: ['No monthly fee', 'FDIC insured', 'Mobile deposit'], badge: 'Best Rate' },
      { name: 'Platinum Rewards Card', type: 'card', rate: 19.99, rateLabel: 'APR', annualFee: 0, features: ['2% cashback', 'No foreign fees'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function ProductCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <CreditCard size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No products available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            {p.type === 'card' ? <CreditCard size={18} color={theme.accent} /> : <TrendingUp size={18} color={theme.accent} />}
            {p.badge && <div style={{ position: 'absolute', top: -4, right: -10, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 6 }}>{p.badge}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>{p.rate}%</span>
              <span style={{ fontSize: 9, color: theme.t3 }}>{p.rateLabel || 'APY'}</span>
            </div>
            {(p.minDeposit || p.annualFee !== undefined) && (
              <div style={{ fontSize: 9, color: theme.t4, marginTop: 2 }}>
                {p.minDeposit ? `Min $${p.minDeposit.toLocaleString()}` : ''}{p.annualFee !== undefined ? `${p.minDeposit ? ' · ' : ''}$${p.annualFee} annual fee` : ''}
              </div>
            )}
            {p.features?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                {p.features.slice(0, 3).map((f: string) => <span key={f} style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: theme.greenBg, color: theme.green }}>{f}</span>)}
              </div>
            )}
            <button style={{ marginTop: 6, fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 14px', borderRadius: 6, cursor: 'pointer' }}>Apply Now</button>
          </div>
        </div>
      ))}
    </div>
  );
}
