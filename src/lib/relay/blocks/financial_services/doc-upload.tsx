'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Upload, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_doc_upload',
  family: 'onboarding',
  label: 'Document Upload',
  description: 'KYC/verification checklist with uploaded/pending status icons',
  applicableCategories: ['financial_services', 'banking', 'lending', 'insurance'],
  intentTriggers: {
    keywords: ['documents', 'upload', 'verification', 'KYC', 'ID', 'proof'],
    queryPatterns: ['what documents do I need', 'upload my *', 'verify my identity'],
    dataConditions: ['requires_documents'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'documents', type: 'tags', label: 'Required Documents' },
      { field: 'applicationRef', type: 'text', label: 'Application Reference' },
    ],
  },
  variants: ['default'],
  sampleData: {
    applicationRef: 'APP-2026-48291',
    documents: [
      { name: 'Government-Issued ID', status: 'uploaded', fileName: 'drivers_license.pdf' },
      { name: 'Proof of Address', status: 'uploaded', fileName: 'utility_bill.pdf' },
      { name: 'Income Verification', status: 'pending' },
      { name: 'Bank Statements (3 mo)', status: 'pending' },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function DocUploadBlock({ data, theme }: BlockComponentProps) {
  const documents: Array<Record<string, any>> = data.documents || [];
  const uploaded = documents.filter(d => d.status === 'uploaded').length;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Upload size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Document Checklist</span>
        </div>
        <span style={{ fontSize: 8, color: theme.t4 }}>{uploaded}/{documents.length} complete</span>
      </div>
      {data.applicationRef && (
        <div style={{ padding: '5px 12px', background: theme.bg, fontSize: 8, color: theme.t4 }}>Ref: {data.applicationRef}</div>
      )}
      {documents.map((d, i) => {
        const done = d.status === 'uploaded';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < documents.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: done ? theme.greenBg : theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {done ? <CheckCircle size={12} color={theme.green} /> : <Upload size={12} color={theme.t4} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: theme.t1 }}>{d.name}</div>
              {d.fileName && <div style={{ fontSize: 8, color: theme.t4 }}>{d.fileName}</div>}
            </div>
            {!done && (
              <button style={{ fontSize: 8, fontWeight: 600, color: theme.accent, background: theme.accentBg, border: 'none', padding: '4px 8px', borderRadius: 5, cursor: 'pointer' }}>Upload</button>
            )}
            {done && <span style={{ fontSize: 8, fontWeight: 600, color: theme.green }}>Done</span>}
          </div>
        );
      })}
    </div>
  );
}
