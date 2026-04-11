'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardList, AlertTriangle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_intake_form',
  family: 'operations',
  label: 'Client Intake Form',
  description: 'Pre-visit health history items, allergies, and consent checklist',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage', 'skincare', 'medical_spa'],
  intentTriggers: {
    keywords: ['intake', 'form', 'health', 'allergies', 'consent', 'pre-visit'],
    queryPatterns: ['fill out intake *', 'health form', 'consent form'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'healthItems', type: 'tags', label: 'Health History Items' },
      { field: 'allergies', type: 'tags', label: 'Allergies' },
      { field: 'consentItems', type: 'tags', label: 'Consent Checklist' },
      { field: 'notes', type: 'textarea', label: 'Additional Notes' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    healthItems: [{ label: 'Pregnant or nursing', checked: false }, { label: 'Heart condition', checked: false }, { label: 'Skin sensitivity', checked: true }],
    allergies: ['Latex', 'Fragrance'],
    consentItems: [{ label: 'I agree to the cancellation policy', checked: true }, { label: 'I consent to treatment', checked: true }],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

const chk = (on: boolean, clr: string, bdr: string, surf: string) => (
  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${on ? clr : bdr}`, background: on ? clr : surf, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' as const }}>
    {on && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>&#10003;</span>}
  </div>
);

export default function IntakeFormBlock({ data, theme }: BlockComponentProps) {
  const health: Array<Record<string, any>> = data.healthItems || [];
  const allergies: string[] = data.allergies || [];
  const consent: Array<Record<string, any>> = data.consentItems || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ClipboardList size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Client Intake</span>
      </div>
      {health.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t3, marginBottom: 4 }}>Health History</div>
          {health.map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              {chk(h.checked, theme.accent, theme.bdr, theme.surface)}
              <span style={{ fontSize: 10, color: theme.t2 }}>{h.label}</span>
            </div>
          ))}
        </div>
      )}
      {allergies.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <AlertTriangle size={10} color={theme.amber} />
            <span style={{ fontSize: 9, fontWeight: 700, color: theme.t3 }}>Allergies</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {allergies.map(a => <span key={a} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.amberBg, color: theme.amber, fontWeight: 600 }}>{a}</span>)}
          </div>
        </div>
      )}
      {consent.length > 0 && (
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t3, marginBottom: 4 }}>Consent</div>
          {consent.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              {chk(c.checked, theme.green, theme.bdr, theme.surface)}
              <span style={{ fontSize: 10, color: theme.t2 }}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
