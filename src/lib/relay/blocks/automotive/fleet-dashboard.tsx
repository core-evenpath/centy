'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_fleet_dashboard',
  family: 'fleet',
  label: 'Fleet Dashboard',
  description: 'Multi-vehicle status grid with per-vehicle plate/model/driver/status',
  applicableCategories: ['automotive', 'fleet', 'rental', 'logistics'],
  intentTriggers: {
    keywords: ['fleet', 'vehicles', 'drivers', 'status', 'utilization', 'dashboard'],
    queryPatterns: ['fleet status', 'show my fleet', 'vehicle overview', 'all vehicles'],
    dataConditions: ['has_fleet'],
  },
  dataContract: {
    required: [
      { field: 'vehicles', type: 'tags', label: 'Fleet Vehicles' },
    ],
    optional: [
      { field: 'totalCount', type: 'number', label: 'Total Vehicles' },
      { field: 'activeCount', type: 'number', label: 'Active Vehicles' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    totalCount: 12, activeCount: 9,
    vehicles: [
      { plate: 'ABC-1234', model: '2024 Transit Van', driver: 'John D.', status: 'Active', mileage: 14200 },
      { plate: 'DEF-5678', model: '2023 F-150', driver: 'Sarah K.', status: 'In Service', mileage: 38400 },
      { plate: 'GHI-9012', model: '2024 Camry', driver: 'Mike R.', status: 'Active', mileage: 8100 },
      { plate: 'JKL-3456', model: '2023 Sprinter', driver: null, status: 'Available', mileage: 52000 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

export default function FleetDashboardBlock({ data, theme }: BlockComponentProps) {
  const vehicles: Array<Record<string, any>> = data.vehicles || [];
  const statusColor = (s: string) => {
    if (s === 'Active') return { color: theme.green, bg: theme.greenBg };
    if (s === 'In Service') return { color: theme.amber, bg: theme.amberBg };
    if (s === 'Available') return { color: theme.accent, bg: theme.accentBg };
    return { color: theme.red, bg: theme.redBg };
  };

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Car size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>Fleet Dashboard</span>
        </div>
        {data.totalCount && <span style={{ fontSize: 9, color: theme.t3 }}>{data.activeCount || 0}/{data.totalCount} active</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: theme.bdr }}>
        {vehicles.map((v, i) => {
          const sc = statusColor(v.status);
          return (
            <div key={i} style={{ background: theme.surface, padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: theme.t1, fontFamily: 'monospace' }}>{v.plate}</span>
                <span style={{ fontSize: 7, fontWeight: 600, color: sc.color, background: sc.bg, padding: '1px 5px', borderRadius: 3 }}>{v.status}</span>
              </div>
              <div style={{ fontSize: 9, color: theme.t2, marginBottom: 2 }}>{v.model}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: theme.t4 }}>
                  {v.driver ? <><Users size={7} />{v.driver}</> : <span style={{ fontStyle: 'italic' }}>Unassigned</span>}
                </span>
                {v.mileage && <span style={{ fontSize: 7, color: theme.t4 }}>{v.mileage.toLocaleString()} mi</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
