'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_estimate',
  family: 'pricing',
  label: 'Estimate Builder',
  description: 'Line-item cost breakdown with labor, parts, total, approve/revise actions',
  applicableCategories: ['home_property', 'home_services', 'repair', 'renovation'],
  intentTriggers: {
    keywords: ['estimate', 'quote', 'cost', 'price', 'breakdown', 'invoice'],
    queryPatterns: ['how much does *', 'get an estimate', 'price for *', 'cost breakdown'],
    dataConditions: ['has_estimate'],
  },
  dataContract: {
    required: [
      { field: 'lineItems', type: 'tags', label: 'Line Items' },
    ],
    optional: [
      { field: 'laborTotal', type: 'currency', label: 'Labor Total' },
      { field: 'partsTotal', type: 'currency', label: 'Parts Total' },
      { field: 'total', type: 'currency', label: 'Grand Total' },
      { field: 'serviceName', type: 'text', label: 'Service' },
    ],
  },
  variants: ['default', 'detailed'],
  sampleData: {
    serviceName: 'Water Heater Replacement',
    lineItems: [
      { label: '50-Gal Tank Water Heater', type: 'parts', amount: 680 },
      { label: 'Fittings & Connectors', type: 'parts', amount: 45 },
      { label: 'Installation Labor (3 hrs)', type: 'labor', amount: 270 },
      { label: 'Old Unit Disposal', type: 'labor', amount: 50 },
    ],
    laborTotal: 320, partsTotal: 725, total: 1045,
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function EstimateBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.lineItems || [];
  const total = data.total || items.reduce((s: number, i: Record<string, any>) => s + (i.amount || 0), 0);

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <FileText size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimate</span>
        {data.serviceName && <span style={{ fontSize: 9, color: theme.t3, marginLeft: 'auto' }}>{data.serviceName}</span>}
      </div>
      <div style={{ padding: '6px 12px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div>
              <div style={{ fontSize: 10, color: theme.t1 }}>{item.label}</div>
              <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>{item.type}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{fmt(item.amount)}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {data.laborTotal && <div style={{ fontSize: 8, color: theme.t3 }}>Labor: {fmt(data.laborTotal)}</div>}
          {data.partsTotal && <div style={{ fontSize: 8, color: theme.t3 }}>Parts: {fmt(data.partsTotal)}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: theme.t4 }}>Total</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>{fmt(total)}</div>
        </div>
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
        <button style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${theme.bdr}`, background: theme.surface, color: theme.t2, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Revise</button>
        <button style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <CheckCircle size={10} /> Approve
        </button>
      </div>
    </div>
  );
}
