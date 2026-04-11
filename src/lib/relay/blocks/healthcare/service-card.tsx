'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Stethoscope, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_service_card',
  family: 'services',
  label: 'Service / Procedure Card',
  description: 'Medical service card with specialty tag, duration, pricing, insurance indicator',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital', 'dental'],
  intentTriggers: {
    keywords: ['services', 'procedures', 'treatments', 'pricing', 'cost', 'specialty'],
    queryPatterns: ['what services *', 'how much does *', 'do you offer *'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Service Name' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'specialty', type: 'text', label: 'Specialty' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'insuranceAccepted', type: 'toggle', label: 'Insurance Accepted' },
      { field: 'description', type: 'text', label: 'Description' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Annual Physical Exam', specialty: 'Primary Care', duration: '45 min', price: 250, insuranceAccepted: true, description: 'Comprehensive wellness check' },
      { name: 'MRI Scan', specialty: 'Radiology', duration: '30 min', price: 1200, insuranceAccepted: true },
      { name: 'Dental Cleaning', specialty: 'Dental', duration: '60 min', price: 150, insuranceAccepted: false },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ServiceCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Stethoscope size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No services available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Stethoscope size={18} color={theme.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{s.name}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
              {s.specialty && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{s.specialty}</span>}
              {s.duration && <span style={{ fontSize: 8, color: theme.t3, display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} />{s.duration}</span>}
              {s.insuranceAccepted && <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: theme.greenBg, color: theme.green, fontWeight: 600 }}>Insured</span>}
            </div>
            {s.description && <div style={{ fontSize: 9, color: theme.t3, marginTop: 3 }}>{s.description}</div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(s.price)}</span>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Book</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
