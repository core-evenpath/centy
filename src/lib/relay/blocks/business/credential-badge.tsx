'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShieldCheck, Award } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_credential_badge',
  family: 'trust',
  label: 'Credentials & Licenses',
  description: 'Professional license and certification list with status badges',
  applicableCategories: ['business', 'professional', 'legal', 'finance', 'healthcare', 'real_estate'],
  intentTriggers: {
    keywords: ['credentials', 'license', 'certification', 'qualified', 'accredited', 'verified'],
    queryPatterns: ['are you certified', 'what credentials *', 'show licenses', 'qualifications'],
    dataConditions: ['has_credentials'],
  },
  dataContract: {
    required: [
      { field: 'credentials', type: 'tags', label: 'Credentials' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Section Title' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Licenses & Certifications',
    credentials: [
      { name: 'Certified Public Accountant', issuer: 'AICPA', status: 'active', year: 2019 },
      { name: 'PMP', issuer: 'PMI', status: 'active', year: 2021 },
      { name: 'Series 65', issuer: 'FINRA', status: 'expired', year: 2018 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function CredentialBadgeBlock({ data, theme }: BlockComponentProps) {
  const credentials: Array<Record<string, any>> = data.credentials || [];
  if (!credentials.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ShieldCheck size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>{data.title || 'Credentials & Licenses'}</span>
      </div>
      {credentials.map((c, i) => {
        const isActive = c.status === 'active';
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < credentials.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: isActive ? theme.greenBg : theme.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={12} color={isActive ? theme.green : theme.red} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{c.name}</div>
              <div style={{ fontSize: 8, color: theme.t4 }}>{c.issuer}{c.year ? ` · ${c.year}` : ''}</div>
            </div>
            <span style={{ fontSize: 7, fontWeight: 700, color: isActive ? theme.green : theme.red, background: isActive ? theme.greenBg : theme.redBg, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{c.status}</span>
          </div>
        );
      })}
    </div>
  );
}
