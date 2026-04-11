'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardList, Upload } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_service_request',
  family: 'intake',
  label: 'Service Request',
  description: 'Type selector, photo upload prompt, description text, submit CTA',
  applicableCategories: ['home_property', 'home_services', 'repair', 'maintenance'],
  intentTriggers: {
    keywords: ['request', 'submit', 'need help', 'issue', 'problem', 'report'],
    queryPatterns: ['I need *', 'submit a request', 'report a problem', 'something is broken'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'serviceTypes', type: 'tags', label: 'Service Types' },
      { field: 'selectedType', type: 'text', label: 'Selected Type' },
      { field: 'description', type: 'textarea', label: 'Description' },
    ],
  },
  variants: ['default'],
  sampleData: {
    serviceTypes: ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'General Repair'],
    selectedType: 'Plumbing',
    description: '',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function ServiceRequestBlock({ data, theme }: BlockComponentProps) {
  const types: string[] = data.serviceTypes || [];
  const selected = data.selectedType || '';

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ClipboardList size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service Request</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {types.map(t => (
            <div key={t} style={{ padding: '5px 10px', borderRadius: 6, border: t === selected ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: t === selected ? theme.accentBg : theme.surface, fontSize: 9, fontWeight: t === selected ? 600 : 400, color: t === selected ? theme.accent : theme.t2, cursor: 'pointer' }}>
              {t}
            </div>
          ))}
        </div>
        <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, display: 'block' }}>Describe the Issue</label>
        <div style={{ marginTop: 3, padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4, minHeight: 40 }}>
          {data.description || 'Describe what needs fixing...'}
        </div>
        <div style={{ marginTop: 8, padding: '12px', border: `1px dashed ${theme.bdr}`, borderRadius: 8, textAlign: 'center', cursor: 'pointer' }}>
          <Upload size={16} color={theme.t4} style={{ margin: '0 auto' }} />
          <div style={{ fontSize: 9, color: theme.t3, marginTop: 4 }}>Upload photos of the issue</div>
        </div>
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
          Submit Request
        </button>
      </div>
    </div>
  );
}
