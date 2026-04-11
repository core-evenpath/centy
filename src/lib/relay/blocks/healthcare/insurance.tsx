'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Shield, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_insurance',
  family: 'billing',
  label: 'Insurance Verification',
  description: 'Plan lookup showing network status, copay, deductible progress bar',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital', 'dental'],
  intentTriggers: {
    keywords: ['insurance', 'coverage', 'copay', 'deductible', 'network', 'plan'],
    queryPatterns: ['do you accept *', 'is * covered', 'verify my insurance', 'what is my copay'],
    dataConditions: ['has_insurance'],
  },
  dataContract: {
    required: [
      { field: 'planName', type: 'text', label: 'Plan Name' },
    ],
    optional: [
      { field: 'carrier', type: 'text', label: 'Carrier' },
      { field: 'memberId', type: 'text', label: 'Member ID' },
      { field: 'inNetwork', type: 'toggle', label: 'In-Network' },
      { field: 'copay', type: 'currency', label: 'Copay' },
      { field: 'deductible', type: 'currency', label: 'Deductible' },
      { field: 'deductibleMet', type: 'currency', label: 'Deductible Met' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    planName: 'Blue Cross PPO Gold', carrier: 'Blue Cross Blue Shield', memberId: 'BCB-9281734',
    inNetwork: true, copay: 30, deductible: 2000, deductibleMet: 1450,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function InsuranceBlock({ data, theme }: BlockComponentProps) {
  const dedPct = data.deductible ? Math.min(100, Math.round(((data.deductibleMet || 0) / data.deductible) * 100)) : 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Shield size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Insurance Verification</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.planName}</div>
        {data.carrier && <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{data.carrier}</div>}
        {data.memberId && <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>ID: {data.memberId}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {data.inNetwork !== undefined && (
            <div style={{ padding: '4px 8px', borderRadius: 6, background: data.inNetwork ? theme.greenBg : theme.redBg, display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle size={9} color={data.inNetwork ? theme.green : theme.red} />
              <span style={{ fontSize: 9, fontWeight: 600, color: data.inNetwork ? theme.green : theme.red }}>{data.inNetwork ? 'In-Network' : 'Out-of-Network'}</span>
            </div>
          )}
          {data.copay !== undefined && (
            <div style={{ padding: '4px 8px', borderRadius: 6, background: theme.bg }}>
              <span style={{ fontSize: 9, color: theme.t2 }}>Copay: </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{fmt(data.copay)}</span>
            </div>
          )}
        </div>
        {data.deductible && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Deductible</span>
              <span style={{ fontSize: 9, color: theme.t2 }}>{fmt(data.deductibleMet || 0)} / {fmt(data.deductible)}</span>
            </div>
            <div style={{ height: 6, background: theme.bg, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${dedPct}%`, height: '100%', background: dedPct >= 100 ? theme.green : theme.accent, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 8, color: theme.t4, marginTop: 2, textAlign: 'right' }}>{dedPct}% met</div>
          </div>
        )}
      </div>
    </div>
  );
}
