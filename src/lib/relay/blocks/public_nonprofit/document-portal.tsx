'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText, Download } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_document_portal',
  family: 'forms',
  label: 'Forms & Documents',
  description: 'Downloadable and online forms list organized by department',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['form', 'document', 'download', 'application form', 'pdf', 'paperwork'],
    queryPatterns: ['where can I find the * form', 'download * form', 'I need a form for *'],
    dataConditions: ['has_forms'],
  },
  dataContract: {
    required: [
      { field: 'documents', type: 'tags', label: 'Documents List' },
    ],
    optional: [
      { field: 'department', type: 'text', label: 'Filter Department' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    documents: [
      { name: 'Zoning Variance Application', department: 'Planning', format: 'PDF', online: true },
      { name: 'Business Tax Return', department: 'Revenue', format: 'PDF', online: false },
      { name: 'Park Reservation Request', department: 'Parks & Rec', format: 'Online', online: true },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function DocumentPortalBlock({ data, theme }: BlockComponentProps) {
  const docs: Array<Record<string, any>> = data.documents || [];
  if (!docs.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileText size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Forms & Documents</span>
      </div>
      {docs.map((doc, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < docs.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{doc.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
              {doc.department && <span style={{ fontSize: 8, color: theme.accent, background: theme.accentBg, padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>{doc.department}</span>}
              {doc.format && <span style={{ fontSize: 8, color: theme.t4 }}>{doc.format}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: doc.online ? theme.accent : theme.bg, border: doc.online ? 'none' : `1px solid ${theme.bdr}`, cursor: 'pointer' }}>
            <Download size={10} color={doc.online ? '#fff' : theme.t3} />
            <span style={{ fontSize: 9, fontWeight: 600, color: doc.online ? '#fff' : theme.t2 }}>{doc.online ? 'Fill Online' : 'Download'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
