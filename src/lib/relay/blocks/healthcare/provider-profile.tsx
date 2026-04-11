'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { UserCheck, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_provider_profile',
  family: 'providers',
  label: 'Provider Profile',
  description: 'Doctor card with credentials, specializations, patient stats',
  applicableCategories: ['healthcare', 'medical', 'clinic', 'hospital', 'dental'],
  intentTriggers: {
    keywords: ['doctor', 'provider', 'physician', 'specialist', 'credentials', 'bio'],
    queryPatterns: ['who is Dr *', 'tell me about *', 'provider profile *'],
    dataConditions: ['has_provider'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Provider Name' },
      { field: 'specialty', type: 'text', label: 'Specialty' },
    ],
    optional: [
      { field: 'credentials', type: 'text', label: 'Credentials' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'patientCount', type: 'number', label: 'Patient Count' },
      { field: 'experience', type: 'text', label: 'Years Experience' },
      { field: 'specializations', type: 'tags', label: 'Specializations' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
      { field: 'accepting', type: 'toggle', label: 'Accepting Patients' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Dr. Sarah Chen', credentials: 'MD, FACP', specialty: 'Internal Medicine',
    rating: 4.8, patientCount: 2400, experience: '15 years',
    specializations: ['Preventive Care', 'Chronic Disease', 'Geriatrics'], accepting: true,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function ProviderProfileBlock({ data, theme }: BlockComponentProps) {
  const specs: string[] = data.specializations || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserCheck size={22} color={theme.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.name}</div>
          <div style={{ fontSize: 10, color: theme.t3 }}>{data.specialty}{data.credentials ? ` · ${data.credentials}` : ''}</div>
          {data.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
              <Star size={10} fill={theme.amber} color={theme.amber} />
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.rating}</span>
              {data.patientCount && <span style={{ fontSize: 8, color: theme.t4 }}>· {data.patientCount.toLocaleString()} patients</span>}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${theme.bdr}` }}>
        {data.experience && <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{data.experience}</div><div style={{ fontSize: 7, color: theme.t4, marginTop: 1 }}>Experience</div></div>}
        {data.patientCount && <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{data.patientCount.toLocaleString()}</div><div style={{ fontSize: 7, color: theme.t4, marginTop: 1 }}>Patients</div></div>}
        {data.accepting !== undefined && <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 700, color: data.accepting ? theme.green : theme.red }}>{data.accepting ? 'Yes' : 'No'}</div><div style={{ fontSize: 7, color: theme.t4, marginTop: 1 }}>Accepting</div></div>}
      </div>
      {specs.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {specs.map(s => <span key={s} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t3, fontWeight: 500 }}>{s}</span>)}
        </div>
      )}
    </div>
  );
}
