'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MessageSquare, Send } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_complaint',
  family: 'engagement',
  label: 'Request / Complaint',
  description: 'Category selector, subject input, details textarea preview, submit CTA',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['complaint', 'request', 'report', 'issue', 'problem', 'grievance', 'feedback'],
    queryPatterns: ['I want to report *', 'file a complaint *', 'submit a request *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'categories', type: 'tags', label: 'Issue Categories' },
      { field: 'subject', type: 'text', label: 'Subject' },
      { field: 'details', type: 'textarea', label: 'Details' },
    ],
  },
  variants: ['default'],
  sampleData: {
    categories: ['Roads & Sidewalks', 'Water & Sewer', 'Noise', 'Trash & Recycling', 'Parks', 'Other'],
    subject: '',
    details: '',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function ComplaintBlock({ data, theme }: BlockComponentProps) {
  const categories: string[] = data.categories || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <MessageSquare size={12} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Submit a Request</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {categories.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
              {categories.map(c => (
                <span key={c} style={{ fontSize: 9, color: theme.t2, border: `1px solid ${theme.bdr}`, padding: '4px 8px', borderRadius: 5, cursor: 'pointer' }}>{c}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</label>
          <div style={{ marginTop: 3, padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4 }}>Brief description of your issue</div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</label>
          <div style={{ marginTop: 3, padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4, minHeight: 48 }}>Provide additional details...</div>
        </div>
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Send size={10} /> Submit Request
        </button>
      </div>
    </div>
  );
}
