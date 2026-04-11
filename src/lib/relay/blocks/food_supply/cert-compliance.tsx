'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_cert_compliance',
  family: 'trust',
  label: 'Certifications',
  description: 'Food safety cert list with issuing body, ID, expiry, status badge',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm', 'processor'],
  intentTriggers: {
    keywords: ['certification', 'compliance', 'food safety', 'organic', 'HACCP', 'FDA'],
    queryPatterns: ['show certifications *', 'are you certified *', 'food safety *'],
    dataConditions: ['has_certifications'],
  },
  dataContract: {
    required: [
      { field: 'certifications', type: 'tags', label: 'Certifications' },
    ],
    optional: [
      { field: 'supplierName', type: 'text', label: 'Supplier Name' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    supplierName: 'Green Valley Farms',
    certifications: [
      { name: 'USDA Organic', body: 'USDA', certId: 'ORG-2024-14829', expiry: '2027-03-15', status: 'active' },
      { name: 'HACCP', body: 'SGS', certId: 'HACCP-9281', expiry: '2026-11-30', status: 'active' },
      { name: 'Fair Trade', body: 'FLO', certId: 'FT-44821', expiry: '2026-06-01', status: 'expiring' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function CertComplianceBlock({ data, theme }: BlockComponentProps) {
  const certs: Array<Record<string, any>> = data.certifications || [];
  if (!certs.length) return null;

  const statusStyle = (s: string) => ({
    color: s === 'active' ? theme.green : s === 'expiring' ? theme.amber : theme.red,
    bg: s === 'active' ? theme.greenBg : s === 'expiring' ? theme.amberBg : theme.redBg,
  });

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Certifications</span>
        {data.supplierName && <span style={{ fontSize: 9, color: theme.t4, marginLeft: 'auto' }}>{data.supplierName}</span>}
      </div>
      <div style={{ padding: '4px 14px 8px' }}>
        {certs.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: i < certs.length - 1 ? `1px solid ${theme.bdr}` : 'none', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{c.name}</div>
                <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{c.body} · {c.certId}</div>
                <div style={{ fontSize: 8, color: theme.t4 }}>Expires {c.expiry}</div>
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: st.bg, color: st.color, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 3 }}>
                {c.status === 'expiring' && <AlertTriangle size={7} />}{c.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
