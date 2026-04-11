'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Building2, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_service_directory',
  family: 'services',
  label: 'Service Directory',
  description: 'Government/public services list with department tags, processing times, fees',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['services', 'department', 'government', 'public', 'apply', 'permit', 'license'],
    queryPatterns: ['what services *', 'how do I apply for *', 'where can I get *'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'services', type: 'tags', label: 'Services List' },
    ],
    optional: [
      { field: 'department', type: 'text', label: 'Department' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    services: [
      { name: 'Building Permit', department: 'Planning', processingTime: '5-10 days', fee: '$150', tags: ['Construction', 'Zoning'] },
      { name: 'Business License', department: 'Revenue', processingTime: '3-5 days', fee: '$75', tags: ['Business'] },
      { name: 'Birth Certificate', department: 'Vital Records', processingTime: '1-2 days', fee: '$25', tags: ['Records'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 600,
};

export default function ServiceDirectoryBlock({ data, theme }: BlockComponentProps) {
  const services: Array<Record<string, any>> = data.services || [];
  if (!services.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {services.map((s, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={12} color={theme.accent} />
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{s.name}</span>
            </div>
            {s.fee && <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{s.fee}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {s.department && <span style={{ fontSize: 9, color: theme.accent, background: theme.accentBg, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{s.department}</span>}
            {s.processingTime && (
              <span style={{ fontSize: 9, color: theme.t3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Clock size={8} /> {s.processingTime}
              </span>
            )}
          </div>
          {s.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {s.tags.map((t: string) => (
                <span key={t} style={{ fontSize: 8, color: theme.t3, background: theme.bg, padding: '2px 6px', borderRadius: 4, border: `1px solid ${theme.bdr}` }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
