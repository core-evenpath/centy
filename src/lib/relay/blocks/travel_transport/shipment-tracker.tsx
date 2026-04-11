'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Package, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_shipment_tracker',
  family: 'logistics',
  label: 'Shipment Tracker',
  description: '5-step delivery pipeline with live timestamps and ETA',
  applicableCategories: ['transport', 'logistics', 'courier', 'shipping', 'freight'],
  intentTriggers: {
    keywords: ['shipment', 'tracking', 'delivery', 'parcel', 'courier', 'freight'],
    queryPatterns: ['track my shipment', 'where is my package', 'delivery status *', 'tracking number *'],
    dataConditions: ['has_tracking'],
  },
  dataContract: {
    required: [{ field: 'trackingId', type: 'text', label: 'Tracking ID' }],
    optional: [
      { field: 'origin', type: 'text', label: 'Origin' },
      { field: 'destination', type: 'text', label: 'Destination' },
      { field: 'eta', type: 'text', label: 'ETA' },
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
    ],
  },
  variants: ['default'],
  sampleData: {
    trackingId: 'SHP-90812-KL', origin: 'Shanghai', destination: 'Los Angeles', eta: 'Apr 16, 2026',
    steps: [{ label: 'Picked Up', time: 'Apr 8, 10:22', done: true }, { label: 'In Transit', time: 'Apr 9, 03:15', done: true }, { label: 'Customs', time: 'Apr 11, 08:40', done: true }, { label: 'Out for Delivery', time: '', done: false }, { label: 'Delivered', time: '', done: false }],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

export default function ShipmentTrackerBlock({ data, theme }: BlockComponentProps) {
  const steps: Array<{ label: string; time?: string; done: boolean }> = data.steps || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Package size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Shipment Tracker</span>
        </div>
        <span style={{ fontSize: 8, color: theme.t4, fontFamily: 'monospace' }}>{data.trackingId}</span>
      </div>
      {(data.origin || data.destination) && (
        <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: theme.t2 }}>{data.origin}</span>
          <span style={{ fontSize: 9, color: theme.t4 }}>&#8594;</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>{data.destination}</span>
        </div>
      )}
      {steps.length > 0 && (
        <div style={{ padding: '10px 12px' }}>
          {steps.map((s, i) => {
            const isCurrent = s.done && (i === steps.length - 1 || !steps[i + 1].done);
            return (
              <div key={i} style={{ display: 'flex', gap: 10, minHeight: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.done ? theme.accent : theme.bg, border: s.done ? 'none' : `2px solid ${theme.bdr}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.done && <span style={{ color: '#fff', fontSize: 7 }}>&#10003;</span>}
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: s.done && steps[i + 1].done ? theme.accent : theme.bdr }} />}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: isCurrent ? 700 : s.done ? 500 : 400, color: isCurrent ? theme.accent : s.done ? theme.t1 : theme.t4 }}>{s.label}</div>
                  {s.time && <div style={{ fontSize: 7, color: theme.t4, marginTop: 1 }}>{s.time}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {data.eta && (
        <div style={{ padding: '6px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={9} color={theme.t4} />
          <span style={{ fontSize: 8, color: theme.t3 }}>ETA:</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.green }}>{data.eta}</span>
        </div>
      )}
    </div>
  );
}
