'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Activity, AlertTriangle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_symptom_checker',
  family: 'assessment',
  label: 'Symptom Assessment',
  description: 'Multi-step questionnaire showing body region, severity, duration selections',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'telehealth'],
  intentTriggers: {
    keywords: ['symptoms', 'pain', 'feeling', 'assessment', 'checker', 'diagnosis'],
    queryPatterns: ['I have *', 'my * hurts', 'check my symptoms', 'feeling *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'bodyRegions', type: 'tags', label: 'Body Regions' },
      { field: 'severityLevels', type: 'tags', label: 'Severity Levels' },
      { field: 'durations', type: 'tags', label: 'Duration Options' },
      { field: 'selectedRegion', type: 'text', label: 'Selected Region' },
      { field: 'selectedSeverity', type: 'text', label: 'Selected Severity' },
      { field: 'selectedDuration', type: 'text', label: 'Selected Duration' },
    ],
  },
  variants: ['default'],
  sampleData: {
    bodyRegions: ['Head', 'Chest', 'Abdomen', 'Back', 'Limbs', 'Skin'],
    severityLevels: ['Mild', 'Moderate', 'Severe'],
    durations: ['Today', '2-3 days', '1 week', '2+ weeks'],
    selectedRegion: 'Head', selectedSeverity: 'Moderate', selectedDuration: '2-3 days',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function SymptomCheckerBlock({ data, theme }: BlockComponentProps) {
  const regions: string[] = data.bodyRegions || [];
  const severities: string[] = data.severityLevels || [];
  const durations: string[] = data.durations || [];
  const sevColors: Record<string, { c: string; bg: string }> = { Mild: { c: theme.green, bg: theme.greenBg }, Moderate: { c: theme.amber, bg: theme.amberBg }, Severe: { c: theme.red, bg: theme.redBg } };

  const renderGroup = (label: string, items: string[], selected: string, colorMap?: Record<string, { c: string; bg: string }>) => (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {items.map(item => {
          const active = item === selected;
          const cm = colorMap?.[item];
          return (
            <div key={item} style={{ padding: '5px 8px', borderRadius: 6, border: active ? `2px solid ${cm?.c || theme.accent}` : `1px solid ${theme.bdr}`, background: active ? (cm?.bg || theme.accentBg) : theme.surface, fontSize: 9, fontWeight: active ? 600 : 400, color: active ? (cm?.c || theme.accent) : theme.t2, cursor: 'pointer' }}>
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Activity size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Symptom Assessment</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {regions.length > 0 && renderGroup('Body Region', regions, data.selectedRegion || '')}
        {severities.length > 0 && renderGroup('Severity', severities, data.selectedSeverity || '', sevColors)}
        {durations.length > 0 && renderGroup('Duration', durations, data.selectedDuration || '')}
        <div style={{ padding: '6px 8px', background: theme.amberBg, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <AlertTriangle size={10} color={theme.amber} />
          <span style={{ fontSize: 8, color: theme.amber }}>This is not a medical diagnosis. Please consult a provider.</span>
        </div>
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
          Continue Assessment
        </button>
      </div>
    </div>
  );
}
