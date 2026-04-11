'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, ShieldCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_application',
  family: 'onboarding',
  label: 'Quick Application',
  description: 'Streamlined apply form preview with product context and soft-pull trust badges',
  applicableCategories: ['financial_services', 'banking', 'lending', 'fintech'],
  intentTriggers: {
    keywords: ['apply', 'application', 'sign up', 'open account', 'get started'],
    queryPatterns: ['how do I apply', 'start application', 'open a * account'],
    dataConditions: ['has_product_context'],
  },
  dataContract: {
    required: [
      { field: 'productName', type: 'text', label: 'Product Name' },
    ],
    optional: [
      { field: 'rate', type: 'number', label: 'Rate' },
      { field: 'rateLabel', type: 'text', label: 'Rate Label' },
      { field: 'fields', type: 'tags', label: 'Form Fields' },
      { field: 'badges', type: 'tags', label: 'Trust Badges' },
    ],
  },
  variants: ['default'],
  sampleData: {
    productName: 'High-Yield Savings', rate: 4.75, rateLabel: 'APY',
    fields: ['Full Name', 'Email', 'SSN (last 4)', 'Annual Income'],
    badges: ['No hard credit pull', 'FDIC Insured', '2-min approval'],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function ApplicationBlock({ data, theme }: BlockComponentProps) {
  const fields: string[] = data.fields || [];
  const badges: string[] = data.badges || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <FileText size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Application</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ padding: '6px 8px', background: theme.bg, borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.productName}</span>
          {data.rate && <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{data.rate}% <span style={{ fontSize: 8, fontWeight: 400, color: theme.t3 }}>{data.rateLabel || 'APY'}</span></span>}
        </div>
        {fields.map((f, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f}</label>
            <div style={{ marginTop: 2, padding: '7px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4 }}>Enter {f.toLowerCase()}</div>
          </div>
        ))}
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            {badges.map(b => (
              <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 7, padding: '2px 5px', borderRadius: 4, background: theme.greenBg, color: theme.green }}>
                <ShieldCheck size={8} />{b}
              </span>
            ))}
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Submit Application</button>
      </div>
    </div>
  );
}
