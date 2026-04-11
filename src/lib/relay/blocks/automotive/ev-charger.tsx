'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Zap, BatteryCharging } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_ev_charger',
  family: 'ev',
  label: 'EV Charging Status',
  description: 'Charger availability with station types, power levels, real-time status dots',
  applicableCategories: ['automotive', 'ev', 'charging', 'dealership', 'fleet'],
  intentTriggers: {
    keywords: ['charger', 'charging', 'EV', 'electric', 'plug', 'station', 'Level 2', 'DC fast'],
    queryPatterns: ['is there a charger *', 'charging status', 'EV charging *', 'available chargers'],
    dataConditions: ['has_chargers'],
  },
  dataContract: {
    required: [
      { field: 'stations', type: 'tags', label: 'Charger Stations' },
    ],
    optional: [
      { field: 'locationLabel', type: 'text', label: 'Location' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    locationLabel: 'Main Lot - Building A',
    stations: [
      { id: 'EV-01', type: 'Level 2', power: '7.7 kW', connector: 'J1772', status: 'Available' },
      { id: 'EV-02', type: 'Level 2', power: '7.7 kW', connector: 'J1772', status: 'In Use' },
      { id: 'DC-01', type: 'DC Fast', power: '150 kW', connector: 'CCS', status: 'Available' },
      { id: 'DC-02', type: 'DC Fast', power: '150 kW', connector: 'CCS', status: 'Offline' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 30,
};

export default function EvChargerBlock({ data, theme }: BlockComponentProps) {
  const stations: Array<Record<string, any>> = data.stations || [];
  if (!stations.length) return null;

  const available = stations.filter(s => s.status === 'Available').length;
  const statusStyle = (s: string) => {
    if (s === 'Available') return { color: theme.green, bg: theme.greenBg, dot: theme.green };
    if (s === 'In Use') return { color: theme.amber, bg: theme.amberBg, dot: theme.amber };
    return { color: theme.red, bg: theme.redBg, dot: theme.red };
  };

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <BatteryCharging size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>EV Charging</span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, color: theme.green }}>{available}/{stations.length} available</span>
      </div>
      {data.locationLabel && <div style={{ padding: '4px 12px', fontSize: 8, color: theme.t4 }}>{data.locationLabel}</div>}
      {stations.map((s, i) => {
        const ss = statusStyle(s.status);
        return (
          <div key={i} style={{ padding: '7px 12px', borderBottom: i < stations.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{s.id}</span>
                <span style={{ fontSize: 8, color: theme.t4 }}>{s.connector}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <Zap size={7} color={theme.t4} />
                <span style={{ fontSize: 8, color: theme.t3 }}>{s.type} · {s.power}</span>
              </div>
            </div>
            <span style={{ fontSize: 8, fontWeight: 600, color: ss.color, background: ss.bg, padding: '2px 6px', borderRadius: 4 }}>{s.status}</span>
          </div>
        );
      })}
    </div>
  );
}
