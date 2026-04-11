'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileCheck, AlertCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_document_checklist',
  family: 'documents',
  label: 'Document Checklist',
  description: 'Required document list with uploaded/pending states',
  applicableCategories: ['travel', 'immigration', 'visa_services', 'agencies', 'logistics'],
  intentTriggers: {
    keywords: ['documents', 'checklist', 'required', 'upload', 'paperwork'],
    queryPatterns: ['what documents do I need', 'required documents *', 'upload documents', 'document list'],
    dataConditions: ['has_documents'],
  },
  dataContract: {
    required: [{ field: 'items', type: 'tags', label: 'Document Items' }],
    optional: [
      { field: 'title', type: 'text', label: 'Checklist Title' },
      { field: 'progress', type: 'number', label: 'Progress Percent' },
    ],
  },
  variants: ['default'],
  sampleData: {
    title: 'Japan Visa Documents', progress: 60,
    items: [
      { name: 'Passport Copy', status: 'uploaded' },
      { name: 'Photo (35x45mm)', status: 'uploaded' },
      { name: 'Bank Statement', status: 'uploaded' },
      { name: 'Itinerary', status: 'pending' },
      { name: 'Hotel Booking', status: 'pending' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 60,
};

export default function DocumentChecklistBlock({ data, theme }: BlockComponentProps) {
  const items: Array<{ name: string; status: string }> = data.items || [];
  if (!items.length) return null;
  const uploaded = items.filter(d => d.status === 'uploaded').length;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <FileCheck size={11} color={theme.accent} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.title || 'Document Checklist'}</span>
        </div>
        <span style={{ fontSize: 8, color: theme.t3 }}>{uploaded}/{items.length} uploaded</span>
      </div>
      <div style={{ padding: '4px 12px 2px' }}>
        <div style={{ height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ width: `${(uploaded / items.length) * 100}%`, height: '100%', background: theme.accent, borderRadius: 2 }} />
        </div>
      </div>
      {items.map((d, i) => {
        const done = d.status === 'uploaded';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: done ? theme.greenBg : theme.amberBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {done ? <span style={{ fontSize: 9, color: theme.green, fontWeight: 700 }}>&#10003;</span> : <AlertCircle size={9} color={theme.amber} />}
            </div>
            <span style={{ fontSize: 10, color: theme.t1, flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: done ? theme.green : theme.amber }}>{done ? 'Uploaded' : 'Pending'}</span>
          </div>
        );
      })}
    </div>
  );
}
