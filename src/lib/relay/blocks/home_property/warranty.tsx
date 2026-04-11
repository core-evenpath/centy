'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShieldCheck, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_warranty',
  family: 'trust',
  label: 'Work Guarantee',
  description: 'Warranty plans per service type with coverage term and status badge',
  applicableCategories: ['home_property', 'home_services', 'repair', 'installation'],
  intentTriggers: {
    keywords: ['warranty', 'guarantee', 'coverage', 'protection', 'assured'],
    queryPatterns: ['is this covered', 'warranty on *', 'do you guarantee *', 'coverage details'],
    dataConditions: ['has_warranty'],
  },
  dataContract: {
    required: [
      { field: 'warranties', type: 'tags', label: 'Warranties' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    warranties: [
      { service: 'Plumbing Repairs', term: '1 year', status: 'active' },
      { service: 'HVAC Installation', term: '5 years', status: 'active' },
      { service: 'Electrical Work', term: '2 years', status: 'active' },
      { service: 'Roof Repair', term: '3 years', status: 'expired' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function WarrantyBlock({ data, theme }: BlockComponentProps) {
  const warranties: Array<Record<string, any>> = data.warranties || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ShieldCheck size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Work Guarantee</span>
      </div>
      {warranties.map((w, i) => {
        const isActive = w.status === 'active';
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < warranties.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={14} color={isActive ? theme.green : theme.t4} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{w.service}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <Clock size={8} color={theme.t4} />
                <span style={{ fontSize: 8, color: theme.t3 }}>{w.term} coverage</span>
              </div>
            </div>
            <span style={{
              fontSize: 8, fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
              color: isActive ? theme.green : theme.red,
              background: isActive ? theme.greenBg : theme.redBg,
            }}>
              {w.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
