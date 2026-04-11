'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Activity, CircleDot } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_outage_status',
  family: 'operations',
  label: 'Service Status',
  description: 'Live status per utility with operational/maintenance/delayed indicators',
  applicableCategories: ['government', 'public_services', 'municipal', 'utilities'],
  intentTriggers: {
    keywords: ['status', 'outage', 'down', 'maintenance', 'operational', 'disruption'],
    queryPatterns: ['is * working', 'any outages *', 'service status', 'system status'],
    dataConditions: ['has_service_statuses'],
  },
  dataContract: {
    required: [
      { field: 'services', type: 'tags', label: 'Service Statuses' },
    ],
    optional: [
      { field: 'lastUpdated', type: 'text', label: 'Last Updated' },
    ],
  },
  variants: ['default'],
  sampleData: {
    services: [
      { name: 'Water Supply', status: 'Operational' },
      { name: 'Online Permits', status: 'Maintenance', note: 'Back at 6 PM' },
      { name: 'Waste Collection', status: 'Delayed', note: 'Storm delay — expect 1-day lag' },
      { name: 'Public Transit', status: 'Operational' },
    ],
    lastUpdated: '10 min ago',
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 60,
};

export default function OutageStatusBlock({ data, theme }: BlockComponentProps) {
  const services: Array<Record<string, any>> = data.services || [];

  const colorMap: Record<string, { dot: string; bg: string }> = {
    Operational: { dot: theme.green, bg: theme.greenBg },
    Maintenance: { dot: theme.amber, bg: theme.amberBg },
    Delayed: { dot: theme.red, bg: theme.redBg },
  };

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} color={theme.accent} />
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Service Status</span>
        </div>
        {data.lastUpdated && <span style={{ fontSize: 8, color: theme.t4 }}>Updated {data.lastUpdated}</span>}
      </div>
      {services.map((s, i) => {
        const c = colorMap[s.status] || colorMap.Operational;
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < services.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{s.name}</div>
              {s.note && <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{s.note}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, background: c.bg }}>
              <CircleDot size={8} color={c.dot} />
              <span style={{ fontSize: 9, fontWeight: 600, color: c.dot }}>{s.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
