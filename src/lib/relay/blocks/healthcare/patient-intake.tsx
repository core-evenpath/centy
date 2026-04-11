'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardList, AlertCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_patient_intake',
  family: 'operations',
  label: 'Patient Intake Form',
  description: 'Pre-visit registration preview with medical history items, allergy picker',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital'],
  intentTriggers: {
    keywords: ['intake', 'registration', 'new patient', 'forms', 'medical history', 'allergies'],
    queryPatterns: ['new patient form', 'pre-visit *', 'fill out intake', 'registration *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'historyItems', type: 'tags', label: 'Medical History' },
      { field: 'allergies', type: 'tags', label: 'Allergies' },
      { field: 'selectedHistory', type: 'tags', label: 'Selected History' },
      { field: 'selectedAllergies', type: 'tags', label: 'Selected Allergies' },
    ],
  },
  variants: ['default'],
  sampleData: {
    historyItems: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Cancer', 'None'],
    allergies: ['Penicillin', 'Sulfa', 'Latex', 'Iodine', 'None'],
    selectedHistory: ['Hypertension'], selectedAllergies: ['Penicillin'],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function PatientIntakeBlock({ data, theme }: BlockComponentProps) {
  const history: string[] = data.historyItems || [];
  const allergies: string[] = data.allergies || [];
  const selHist: string[] = data.selectedHistory || [];
  const selAllergy: string[] = data.selectedAllergies || [];

  const renderChips = (items: string[], selected: string[], warn?: boolean) => (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
      {items.map(item => {
        const active = selected.includes(item);
        return (
          <div key={item} style={{ padding: '4px 8px', borderRadius: 6, border: active ? `2px solid ${warn ? theme.red : theme.accent}` : `1px solid ${theme.bdr}`, background: active ? (warn ? theme.redBg : theme.accentBg) : theme.surface, fontSize: 9, fontWeight: active ? 600 : 400, color: active ? (warn ? theme.red : theme.accent) : theme.t2, cursor: 'pointer' }}>
            {item}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ClipboardList size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient Intake</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {history.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Medical History</label>
            {renderChips(history, selHist)}
          </div>
        )}
        {allergies.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertCircle size={8} color={theme.red} /> Allergies
            </label>
            {renderChips(allergies, selAllergy, true)}
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
          Submit Intake Form
        </button>
      </div>
    </div>
  );
}
