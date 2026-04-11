'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calculator, Plus } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_fee_calculator',
  family: 'pricing',
  label: 'Fee Calculator',
  description: 'Interactive pricing showing scope items to build estimate with total',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['calculator', 'estimate', 'pricing', 'cost', 'build quote', 'configure'],
    queryPatterns: ['how much would * cost', 'build an estimate', 'pricing calculator', 'calculate fee'],
    dataConditions: ['has_pricing_items'],
  },
  dataContract: {
    required: [
      { field: 'lineItems', type: 'tags', label: 'Line Items' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Calculator Title' },
      { field: 'currency', type: 'text', label: 'Currency Symbol' },
      { field: 'discount', type: 'number', label: 'Discount %' },
    ],
  },
  variants: ['default'],
  sampleData: {
    title: 'Project Estimate',
    lineItems: [
      { name: 'Strategy & Discovery', fee: 4000, included: true },
      { name: 'Brand Identity Design', fee: 6500, included: true },
      { name: 'Website Design (5 pages)', fee: 8000, included: true },
      { name: 'Copywriting Package', fee: 3000, included: false },
      { name: 'SEO Audit & Setup', fee: 2500, included: false },
    ],
    discount: 10,
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number, sym: string) { return sym + n.toLocaleString(); }

export default function FeeCalculatorBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.lineItems || [];
  const sym = data.currency || '$';
  const discount = data.discount || 0;
  const subtotal = items.filter(it => it.included).reduce((s, it) => s + (it.fee || 0), 0);
  const discountAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discountAmt;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calculator size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>{data.title || 'Fee Calculator'}</span>
      </div>
      <div style={{ padding: '4px 12px 8px' }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${it.included ? theme.accent : theme.t4}`, background: it.included ? theme.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {it.included && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>&#10003;</span>}
            </div>
            <span style={{ flex: 1, fontSize: 10, color: it.included ? theme.t1 : theme.t3, fontWeight: it.included ? 500 : 400 }}>{it.name}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: it.included ? theme.accent : theme.t4 }}>{fmt(it.fee || 0, sym)}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `2px solid ${theme.bdr}`, background: theme.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.t3, marginBottom: 2 }}>
          <span>Subtotal</span><span>{fmt(subtotal, sym)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.green, marginBottom: 2 }}>
            <span>Discount ({discount}%)</span><span>-{fmt(discountAmt, sym)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t2 }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(total, sym)}</span>
        </div>
      </div>
    </div>
  );
}
