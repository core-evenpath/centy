'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileUp, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_document_collector',
  family: 'operations',
  label: 'Document Collector',
  description: 'Required document checklist with upload status icons and pending count',
  applicableCategories: ['business', 'professional', 'legal', 'finance', 'real_estate', 'insurance'],
  intentTriggers: {
    keywords: ['documents', 'upload', 'required', 'paperwork', 'submit', 'files needed'],
    queryPatterns: ['what documents do I need', 'upload *', 'required documents', 'pending paperwork'],
    dataConditions: ['has_documents'],
  },
  dataContract: {
    required: [
      { field: 'documents', type: 'tags', label: 'Documents' },
    ],
    optional: [
      { field: 'title', type: 'text', label: 'Section Title' },
    ],
  },
  variants: ['default'],
  sampleData: {
    title: 'Required Documents',
    documents: [
      { name: 'Government-issued ID', status: 'uploaded' },
      { name: 'Proof of Income', status: 'pending' },
      { name: 'Tax Returns (2 years)', status: 'pending' },
      { name: 'Business Registration', status: 'uploaded' },
      { name: 'Insurance Certificate', status: 'pending' },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function DocumentCollectorBlock({ data, theme }: BlockComponentProps) {
  const docs: Array<Record<string, any>> = data.documents || [];
  if (!docs.length) return null;
  const pending = docs.filter(d => d.status !== 'uploaded').length;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FileUp size={12} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.t1 }}>{data.title || 'Required Documents'}</span>
        </div>
        {pending > 0 && <span style={{ fontSize: 8, fontWeight: 600, color: theme.amber, background: theme.amberBg, padding: '2px 6px', borderRadius: 4 }}>{pending} pending</span>}
      </div>
      {docs.map((d, i) => {
        const done = d.status === 'uploaded';
        return (
          <div key={i} style={{ padding: '7px 12px', borderBottom: i < docs.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            {done
              ? <CheckCircle size={14} color={theme.green} />
              : <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${theme.t4}` }} />
            }
            <span style={{ flex: 1, fontSize: 10, color: done ? theme.t3 : theme.t1, fontWeight: done ? 400 : 500, textDecoration: done ? 'line-through' : 'none' }}>{d.name}</span>
            {!done && <span style={{ fontSize: 8, fontWeight: 600, color: theme.accent, cursor: 'pointer' }}>Upload</span>}
          </div>
        );
      })}
    </div>
  );
}
