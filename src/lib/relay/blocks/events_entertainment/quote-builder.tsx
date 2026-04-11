'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calculator, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_quote_builder',
  family: 'pricing',
  label: 'Custom Quote Builder',
  description: 'Event type selector, service checkboxes with pricing, running total',
  applicableCategories: ['events', 'entertainment', 'wedding', 'corporate', 'party', 'catering'],
  intentTriggers: {
    keywords: ['quote', 'estimate', 'pricing', 'cost', 'how much', 'custom quote'],
    queryPatterns: ['how much for *', 'get a quote', 'price for *', 'estimate for *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'eventType', type: 'select', label: 'Event Type', options: ['Wedding', 'Corporate', 'Birthday', 'Gala'] },
      { field: 'services', type: 'tags', label: 'Available Services' },
      { field: 'total', type: 'currency', label: 'Running Total' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    eventType: 'Wedding',
    services: [
      { name: 'Photography', price: 2500, selected: true },
      { name: 'Videography', price: 1800, selected: true },
      { name: 'DJ & Sound', price: 1200, selected: false },
      { name: 'Floral Design', price: 900, selected: false },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function QuoteBuilderBlock({ data, theme }: BlockComponentProps) {
  const services: Array<Record<string, any>> = data.services || [];
  const total = services.filter((s) => s.selected).reduce((sum: number, s: any) => sum + (s.price || 0), 0);

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calculator size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quote Builder</span>
        {data.eventType && <span style={{ fontSize: 8, color: theme.t3, marginLeft: 'auto', background: theme.surface, padding: '2px 6px', borderRadius: 4 }}>{data.eventType}</span>}
      </div>
      <div style={{ padding: '6px 12px' }}>
        {services.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < services.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${s.selected ? theme.accent : theme.bdr}`, background: s.selected ? theme.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.selected && <Check size={10} color="#fff" />}
            </div>
            <span style={{ flex: 1, fontSize: 10, color: theme.t1, fontWeight: s.selected ? 600 : 400 }}>{s.name}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: s.selected ? theme.accent : theme.t4 }}>{fmt(s.price)}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t2 }}>Estimated Total</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent }}>{fmt(total)}</span>
      </div>
    </div>
  );
}
