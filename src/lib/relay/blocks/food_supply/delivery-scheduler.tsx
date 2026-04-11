'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CalendarClock, Snowflake } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_delivery_scheduler',
  family: 'logistics',
  label: 'Delivery Scheduler',
  description: 'Date/time window picker with cold chain toggle',
  applicableCategories: ['food_supply', 'wholesale', 'distributor', 'farm'],
  intentTriggers: {
    keywords: ['delivery', 'schedule', 'ship', 'window', 'cold chain', 'date'],
    queryPatterns: ['schedule delivery *', 'when can you deliver *', 'delivery windows *'],
    dataConditions: ['has_delivery_windows'],
  },
  dataContract: {
    required: [
      { field: 'windows', type: 'tags', label: 'Delivery Windows' },
    ],
    optional: [
      { field: 'coldChain', type: 'toggle', label: 'Cold Chain Required' },
      { field: 'address', type: 'text', label: 'Delivery Address' },
    ],
  },
  variants: ['default'],
  sampleData: {
    coldChain: true, address: '450 Market St, San Francisco',
    windows: [
      { date: 'Mon, Apr 14', slots: ['6-8 AM', '10-12 PM'], available: true },
      { date: 'Tue, Apr 15', slots: ['6-8 AM', '2-4 PM'], available: true },
      { date: 'Wed, Apr 16', slots: ['6-8 AM'], available: false },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

export default function DeliverySchedulerBlock({ data, theme }: BlockComponentProps) {
  const windows: Array<Record<string, any>> = data.windows || [];
  if (!windows.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CalendarClock size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Delivery Schedule</span>
        {data.coldChain && (
          <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: theme.accentBg, color: theme.accent, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Snowflake size={8} /> Cold Chain
          </span>
        )}
      </div>
      {data.address && <div style={{ padding: '6px 14px', fontSize: 9, color: theme.t3 }}>{data.address}</div>}
      <div style={{ padding: '4px 14px 10px' }}>
        {windows.map((w, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < windows.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: w.available !== false ? theme.t1 : theme.t4 }}>{w.date}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {(w.slots || []).map((slot: string) => (
                <span key={slot} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: w.available !== false ? theme.accentBg : theme.bg, color: w.available !== false ? theme.accent : theme.t4, fontWeight: 500, border: `1px solid ${w.available !== false ? theme.accentBg2 : theme.bdr}` }}>
                  {slot}
                </span>
              ))}
              {w.available === false && <span style={{ fontSize: 8, color: theme.t4, alignSelf: 'center' }}>Unavailable</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
