'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardCheck, CreditCard } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_enrollment',
  family: 'conversion',
  label: 'Enrollment Form',
  description: 'Registration flow with course summary and payment plan selector',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['enroll', 'register', 'sign up', 'admission', 'join', 'apply'],
    queryPatterns: ['how to enroll', 'register for *', 'sign up for *', 'admission process'],
    dataConditions: ['has_enrollment'],
  },
  dataContract: {
    required: [
      { field: 'courseTitle', type: 'text', label: 'Course Title' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'startDate', type: 'date', label: 'Start Date' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'paymentPlans', type: 'tags', label: 'Payment Plans' },
      { field: 'seatsLeft', type: 'number', label: 'Seats Left' },
    ],
  },
  variants: ['default'],
  sampleData: {
    courseTitle: 'Full-Stack Web Development', price: 4999, startDate: '2026-05-01',
    duration: '12 weeks', seatsLeft: 8,
    paymentPlans: [
      { label: 'Full Payment', amount: 4999, badge: 'Save 10%' },
      { label: '3 Installments', amount: 1833, suffix: '/mo' },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function EnrollmentBlock({ data, theme }: BlockComponentProps) {
  const plans: Array<Record<string, any>> = data.paymentPlans || [];
  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ClipboardCheck size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Enrollment</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ padding: '6px 8px', background: theme.bg, borderRadius: 6, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{data.courseTitle}</div>
          <div style={{ fontSize: 8, color: theme.t3, marginTop: 2 }}>{data.duration}{data.startDate ? ` · Starts ${data.startDate}` : ''}</div>
        </div>
        {data.seatsLeft && <div style={{ fontSize: 9, fontWeight: 600, color: data.seatsLeft <= 5 ? theme.red : theme.amber, marginBottom: 8 }}>{data.seatsLeft} seats remaining</div>}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
          <div style={{ marginTop: 3, padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4 }}>Enter your name</div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
          <div style={{ marginTop: 3, padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4 }}>Enter email address</div>
        </div>
        {plans.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3, display: 'block' }}>Payment Plan</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {plans.map((p, i) => (
                <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 6, border: i === 0 ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: i === 0 ? theme.accentBg : theme.surface, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                  {p.badge && <div style={{ position: 'absolute', top: -5, right: 4, fontSize: 6, fontWeight: 700, color: '#fff', background: theme.green, padding: '1px 4px', borderRadius: 3 }}>{p.badge}</div>}
                  <div style={{ fontSize: 9, fontWeight: 600, color: i === 0 ? theme.accent : theme.t2 }}>{p.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? theme.accent : theme.t1, marginTop: 2 }}>{fmt(p.amount)}{p.suffix || ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <CreditCard size={12} /> Complete Enrollment
        </button>
      </div>
    </div>
  );
}
