'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Gauge, CalendarClock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_retainer_status',
  family: 'tracking',
  label: 'Retainer Status',
  description: 'Monthly retainer gauge with hours used/remaining and renewal date',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['retainer', 'hours', 'remaining', 'usage', 'balance', 'renewal'],
    queryPatterns: ['how many hours left', 'retainer status', 'usage this month', 'when does it renew'],
    dataConditions: ['has_retainer'],
  },
  dataContract: {
    required: [
      { field: 'totalHours', type: 'number', label: 'Total Hours' },
      { field: 'usedHours', type: 'number', label: 'Used Hours' },
    ],
    optional: [
      { field: 'planName', type: 'text', label: 'Plan Name' },
      { field: 'renewalDate', type: 'date', label: 'Renewal Date' },
      { field: 'monthlyFee', type: 'currency', label: 'Monthly Fee' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    planName: 'Growth Retainer', totalHours: 40, usedHours: 27,
    renewalDate: '2026-05-01', monthlyFee: 6000,
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 60,
};

export default function RetainerStatusBlock({ data, theme }: BlockComponentProps) {
  const total = data.totalHours || 1;
  const used = data.usedHours || 0;
  const remaining = Math.max(0, total - used);
  const pct = Math.min(100, Math.round((used / total) * 100));
  const isHigh = pct >= 80;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Gauge size={12} color={theme.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{data.planName || 'Retainer'}</span>
        </div>
        {data.monthlyFee && <span style={{ fontSize: 10, fontWeight: 600, color: theme.t3 }}>${data.monthlyFee.toLocaleString()}/mo</span>}
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: isHigh ? theme.amber : theme.accent }}>{remaining}</span>
          <span style={{ fontSize: 10, color: theme.t3 }}>of {total} hrs remaining</span>
        </div>
        <div style={{ height: 8, background: theme.bg, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: isHigh ? theme.amber : theme.accent, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: theme.t4 }}>
          <span>{used} hrs used ({pct}%)</span>
          {isHigh && <span style={{ color: theme.amber, fontWeight: 600 }}>Running low</span>}
        </div>
      </div>
      {data.renewalDate && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.t3 }}>
          <CalendarClock size={10} color={theme.t4} />Renews {data.renewalDate}
        </div>
      )}
    </div>
  );
}
