'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShieldCheck, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_warranty',
  family: 'trust',
  label: 'Warranty & Coverage',
  description: 'Active warranty plans with coverage term, mileage limit, status badges',
  applicableCategories: ['automotive', 'dealership', 'service_center'],
  intentTriggers: {
    keywords: ['warranty', 'coverage', 'protection', 'extended', 'guarantee', 'plan'],
    queryPatterns: ['what warranty *', 'am I covered', 'warranty status', 'coverage for *'],
    dataConditions: ['has_warranty'],
  },
  dataContract: {
    required: [
      { field: 'plans', type: 'tags', label: 'Warranty Plans' },
    ],
    optional: [
      { field: 'vehicleLabel', type: 'text', label: 'Vehicle' },
    ],
  },
  variants: ['default'],
  sampleData: {
    vehicleLabel: '2024 Toyota Camry XSE',
    plans: [
      { name: 'Basic Warranty', term: '3 yr / 36,000 mi', status: 'Active', coverage: 'Bumper-to-bumper', expires: '2027-03-15' },
      { name: 'Powertrain', term: '5 yr / 60,000 mi', status: 'Active', coverage: 'Engine, transmission, drivetrain', expires: '2029-03-15' },
      { name: 'Corrosion', term: '5 yr / Unlimited', status: 'Active', coverage: 'Body rust-through', expires: '2029-03-15' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function WarrantyBlock({ data, theme }: BlockComponentProps) {
  const plans: Array<Record<string, any>> = data.plans || [];
  if (!plans.length) return null;

  const statusColor = (s: string) => {
    if (s === 'Active') return { color: theme.green, bg: theme.greenBg };
    if (s === 'Expired') return { color: theme.red, bg: theme.redBg };
    return { color: theme.amber, bg: theme.amberBg };
  };

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ShieldCheck size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Warranty & Coverage</span>
      </div>
      {data.vehicleLabel && <div style={{ padding: '6px 12px', fontSize: 9, color: theme.t3, borderBottom: `1px solid ${theme.bdr}` }}>{data.vehicleLabel}</div>}
      {plans.map((p, i) => {
        const sc = statusColor(p.status || 'Active');
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < plans.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{p.name}</span>
              <span style={{ fontSize: 8, fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 6px', borderRadius: 4 }}>{p.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Clock size={8} color={theme.t4} />
              <span style={{ fontSize: 9, color: theme.t3 }}>{p.term}</span>
            </div>
            {p.coverage && <div style={{ fontSize: 8, color: theme.t4, marginTop: 2 }}>{p.coverage}</div>}
          </div>
        );
      })}
    </div>
  );
}
