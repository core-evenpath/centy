'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Award, ShieldCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_certificate',
  family: 'credentials',
  label: 'Certificate / Credential',
  description: 'Formal completion certificate card with verification ID and date',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['certificate', 'credential', 'completion', 'diploma', 'verified', 'badge'],
    queryPatterns: ['do I get a certificate', 'course certificate', 'verify credential', 'my certificates'],
    dataConditions: ['has_certificate'],
  },
  dataContract: {
    required: [
      { field: 'recipientName', type: 'text', label: 'Recipient Name' },
      { field: 'courseTitle', type: 'text', label: 'Course Title' },
    ],
    optional: [
      { field: 'issueDate', type: 'date', label: 'Issue Date' },
      { field: 'verificationId', type: 'text', label: 'Verification ID' },
      { field: 'issuer', type: 'text', label: 'Issuing Organization' },
      { field: 'grade', type: 'text', label: 'Grade / Distinction' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    recipientName: 'Ravi Kumar', courseTitle: 'Full-Stack Web Development',
    issueDate: '2026-03-28', verificationId: 'CERT-2026-FS-4821',
    issuer: 'Centy Academy', grade: 'Distinction',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function CertificateBlock({ data, theme }: BlockComponentProps) {
  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.accentBg})`, textAlign: 'center', borderBottom: `1px solid ${theme.bdr}` }}>
        <Award size={24} color={theme.accent} />
        <div style={{ fontSize: 8, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Certificate of Completion</div>
      </div>
      <div style={{ padding: '14px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>This certifies that</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: theme.t1, marginTop: 4 }}>{data.recipientName}</div>
        <div style={{ fontSize: 8, color: theme.t4, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>has successfully completed</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: theme.accent, marginTop: 4 }}>{data.courseTitle}</div>
        {data.grade && (
          <div style={{ display: 'inline-block', marginTop: 6, fontSize: 9, fontWeight: 700, color: theme.green, background: theme.greenBg, padding: '2px 8px', borderRadius: 4 }}>{data.grade}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${theme.bdr}` }}>
          {data.issuer && <div><div style={{ fontSize: 7, color: theme.t4, textTransform: 'uppercase' }}>Issued by</div><div style={{ fontSize: 9, fontWeight: 600, color: theme.t1, marginTop: 1 }}>{data.issuer}</div></div>}
          {data.issueDate && <div><div style={{ fontSize: 7, color: theme.t4, textTransform: 'uppercase' }}>Date</div><div style={{ fontSize: 9, fontWeight: 600, color: theme.t1, marginTop: 1 }}>{data.issueDate}</div></div>}
        </div>
        {data.verificationId && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 8, color: theme.t3 }}>
            <ShieldCheck size={10} color={theme.green} />
            <span>ID: {data.verificationId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
