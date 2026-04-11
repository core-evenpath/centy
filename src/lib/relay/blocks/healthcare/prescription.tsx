'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Pill, RefreshCw } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_prescription',
  family: 'pharmacy',
  label: 'Prescription Manager',
  description: 'Medication list with dosage, refill count, renewal status pills',
  applicableCategories: ['healthcare', 'medical', 'pharmacy', 'clinic'],
  intentTriggers: {
    keywords: ['prescription', 'medication', 'refill', 'medicine', 'drug', 'dosage', 'pharmacy'],
    queryPatterns: ['my prescriptions', 'refill *', 'medication list', 'renew *'],
    dataConditions: ['has_prescriptions'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'medications', type: 'tags', label: 'Medications' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    medications: [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', refillsLeft: 3, status: 'active' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', refillsLeft: 1, status: 'active' },
      { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', refillsLeft: 0, status: 'renewal' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function PrescriptionBlock({ data, theme }: BlockComponentProps) {
  const meds: Array<Record<string, any>> = data.medications || [];
  if (!meds.length) return null;

  const statusStyle = (s: string) => s === 'active'
    ? { color: theme.green, bg: theme.greenBg }
    : s === 'renewal' ? { color: theme.amber, bg: theme.amberBg }
    : { color: theme.red, bg: theme.redBg };

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Pill size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Prescriptions</span>
      </div>
      {meds.map((m, i) => {
        const st = statusStyle(m.status);
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < meds.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Pill size={14} color={theme.accent} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{m.name} <span style={{ fontSize: 9, fontWeight: 400, color: theme.t3 }}>{m.dosage}</span></div>
              <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{m.frequency}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 5px', borderRadius: 4, background: st.bg, color: st.color, textTransform: 'capitalize' }}>{m.status}</span>
              <div style={{ fontSize: 8, color: theme.t4, marginTop: 3, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                <RefreshCw size={7} />{m.refillsLeft} refills
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
