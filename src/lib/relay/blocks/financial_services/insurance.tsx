'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Shield, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_insurance',
  family: 'insurance',
  label: 'Insurance Quote',
  description: '3-tier coverage selector with limits, deductibles, monthly premiums',
  applicableCategories: ['financial_services', 'insurance', 'fintech'],
  intentTriggers: {
    keywords: ['insurance', 'coverage', 'quote', 'premium', 'policy', 'deductible'],
    queryPatterns: ['get a quote', 'insurance options', 'how much is coverage *'],
    dataConditions: ['has_insurance_tiers'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'tiers', type: 'tags', label: 'Coverage Tiers' },
      { field: 'selected', type: 'text', label: 'Selected Tier' },
    ],
  },
  variants: ['default'],
  sampleData: {
    tiers: [
      { name: 'Basic', limit: '100K', deductible: 2500, premium: 89, features: ['Liability', 'Collision'] },
      { name: 'Standard', limit: '300K', deductible: 1000, premium: 149, features: ['Liability', 'Collision', 'Comprehensive', 'Roadside'], popular: true },
      { name: 'Premium', limit: '500K', deductible: 500, premium: 219, features: ['Liability', 'Collision', 'Comprehensive', 'Roadside', 'Rental', 'Gap'] },
    ],
    selected: 'Standard',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function InsuranceBlock({ data, theme }: BlockComponentProps) {
  const tiers: Array<Record<string, any>> = data.tiers || [];
  const selected = data.selected || '';

  if (!tiers.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Shield size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Coverage Options</span>
      </div>
      {tiers.map((t, i) => {
        const isActive = t.name === selected;
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < tiers.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: isActive ? theme.accentBg : 'transparent', cursor: 'pointer', position: 'relative' }}>
            {t.popular && <span style={{ position: 'absolute', top: 4, right: 8, fontSize: 7, fontWeight: 700, color: theme.accent, background: theme.accentBg2, padding: '1px 5px', borderRadius: 4 }}>Popular</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: isActive ? `5px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, flexShrink: 0, boxSizing: 'border-box' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{t.name}</span>
              <span style={{ fontSize: 8, color: theme.t4 }}>Limit {t.limit} · Ded. {fmt(t.deductible)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20 }}>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {(t.features || []).map((f: string) => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 7, color: theme.green }}><CheckCircle size={7} />{f}</span>
                ))}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(t.premium)}<span style={{ fontSize: 8, fontWeight: 400, color: theme.t4 }}>/mo</span></span>
            </div>
          </div>
        );
      })}
      <div style={{ padding: '8px 12px' }}>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Get Quote — {selected}</button>
      </div>
    </div>
  );
}
