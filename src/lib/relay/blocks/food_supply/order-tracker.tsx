'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Check, Truck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_order_tracker',
  family: 'logistics',
  label: 'Order Tracker',
  description: 'Multi-step delivery pipeline with timestamps and ETA',
  applicableCategories: ['food_supply', 'wholesale', 'distributor'],
  intentTriggers: {
    keywords: ['track', 'order', 'status', 'where', 'shipment', 'delivery'],
    queryPatterns: ['track my order *', 'where is order *', 'order status *'],
    dataConditions: ['has_order_id'],
  },
  dataContract: {
    required: [
      { field: 'orderId', type: 'text', label: 'Order ID' },
      { field: 'status', type: 'select', label: 'Status', options: ['Confirmed', 'Processing', 'Packed', 'In Transit', 'Delivered'] },
    ],
    optional: [
      { field: 'eta', type: 'text', label: 'ETA' },
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
    ],
  },
  variants: ['default'],
  sampleData: {
    orderId: 'FS-20260412-0087', status: 'In Transit', eta: 'Today, 2-4 PM',
    steps: [
      { label: 'Confirmed', time: 'Apr 11, 8:00 AM', done: true },
      { label: 'Processing', time: 'Apr 11, 10:30 AM', done: true },
      { label: 'Packed', time: 'Apr 11, 3:15 PM', done: true },
      { label: 'In Transit', time: 'Apr 12, 5:00 AM', done: true },
      { label: 'Delivered', time: '', done: false },
    ],
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 60,
};

export default function OrderTrackerBlock({ data, theme }: BlockComponentProps) {
  const steps: Array<Record<string, any>> = data.steps || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: theme.t3 }}>Order {data.orderId}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1, marginTop: 1 }}>{data.status}</div>
        </div>
        {data.eta && (
          <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: theme.accentBg, color: theme.accent }}>
            ETA: {data.eta}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, position: 'relative', paddingBottom: i < steps.length - 1 ? 14 : 0 }}>
            {i < steps.length - 1 && (
              <div style={{ position: 'absolute', left: 9, top: 20, width: 2, bottom: 0, background: step.done ? theme.accent : theme.bdr }} />
            )}
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.done ? theme.accent : theme.surface, border: step.done ? 'none' : `2px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              {step.done ? <Check size={10} color="#fff" strokeWidth={3} /> : <Truck size={8} color={theme.t4} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: step.done ? 600 : 400, color: step.done ? theme.t1 : theme.t4 }}>{step.label}</div>
              {step.time && <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{step.time}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
