'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Shield, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_maintenance_plan',
  family: 'subscription',
  label: 'Maintenance Plan',
  description: 'Tier comparison with visit frequency, response time, parts coverage',
  applicableCategories: ['home_property', 'home_services', 'maintenance', 'hvac'],
  intentTriggers: {
    keywords: ['plan', 'subscription', 'maintenance', 'annual', 'membership', 'coverage'],
    queryPatterns: ['maintenance plans', 'annual plan *', 'do you have plans', 'membership options'],
    dataConditions: ['has_plans'],
  },
  dataContract: {
    required: [
      { field: 'plans', type: 'tags', label: 'Plans' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    plans: [
      { name: 'Basic', price: 19, frequency: '1 visit/year', responseTime: '48 hrs', partsCoverage: false, recommended: false },
      { name: 'Standard', price: 39, frequency: '2 visits/year', responseTime: '24 hrs', partsCoverage: true, recommended: true },
      { name: 'Premium', price: 69, frequency: '4 visits/year', responseTime: '4 hrs', partsCoverage: true, recommended: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n + '/mo'; }

export default function MaintenancePlanBlock({ data, theme }: BlockComponentProps) {
  const plans: Array<Record<string, any>> = data.plans || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Shield size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Maintenance Plans</span>
      </div>
      {plans.map((p, i) => (
        <div key={i} style={{ padding: '10px 12px', borderBottom: i < plans.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: p.recommended ? theme.accentBg : 'transparent', position: 'relative' }}>
          {p.recommended && <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '1px 5px', borderRadius: 4 }}>Best Value</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{p.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(p.price)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.t2 }}>
              <Check size={9} color={theme.green} />{p.frequency}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.t2 }}>
              <Check size={9} color={theme.green} />{p.responseTime} response
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: p.partsCoverage ? theme.t2 : theme.t4 }}>
              <Check size={9} color={p.partsCoverage ? theme.green : theme.t4} />Parts {p.partsCoverage ? 'included' : 'not included'}
            </div>
          </div>
          <button style={{ width: '100%', padding: 7, borderRadius: 6, border: p.recommended ? 'none' : `1px solid ${theme.bdr}`, background: p.recommended ? theme.accent : theme.surface, color: p.recommended ? '#fff' : theme.t2, fontSize: 9, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            Choose {p.name}
          </button>
        </div>
      ))}
    </div>
  );
}
