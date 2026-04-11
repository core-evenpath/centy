'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Receipt, Award } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_fee_structure',
  family: 'pricing',
  label: 'Fee Structure',
  description: 'Itemized fee table with total and scholarship indicator',
  applicableCategories: ['education', 'coaching', 'training', 'academy', 'school'],
  intentTriggers: {
    keywords: ['fees', 'pricing', 'cost', 'tuition', 'payment', 'charges', 'scholarship'],
    queryPatterns: ['how much does * cost', 'fee structure', 'tuition fees', 'pricing for *'],
    dataConditions: ['has_fees'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Fee Items' },
    ],
    optional: [
      { field: 'total', type: 'currency', label: 'Total' },
      { field: 'scholarship', type: 'text', label: 'Scholarship' },
      { field: 'currency', type: 'text', label: 'Currency Symbol' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { label: 'Tuition Fee', amount: 45000 },
      { label: 'Lab & Materials', amount: 5000 },
      { label: 'Examination Fee', amount: 2000 },
      { label: 'Library Access', amount: 1500 },
    ],
    total: 53500, scholarship: 'Merit scholarship — up to 25% off',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function FeeStructureBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  const total = data.total || items.reduce((s: number, i: any) => s + (i.amount || 0), 0);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${theme.bdr}` }}>
        <Receipt size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fee Structure</span>
      </div>
      <div style={{ padding: '6px 12px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <span style={{ fontSize: 10, color: theme.t2 }}>{item.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{fmt(item.amount)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: 4, borderTop: `2px solid ${theme.bdr}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(total)}</span>
        </div>
      </div>
      {data.scholarship && (
        <div style={{ padding: '6px 12px', background: theme.greenBg, display: 'flex', alignItems: 'center', gap: 5, borderTop: `1px solid ${theme.bdr}` }}>
          <Award size={10} color={theme.green} />
          <span style={{ fontSize: 9, color: theme.green, fontWeight: 600 }}>{data.scholarship}</span>
        </div>
      )}
    </div>
  );
}
