'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { UserCircle, Award } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fin_advisor',
  family: 'people',
  label: 'Advisor Profile',
  description: 'CFP/CFA with credentials, AUM, client count, specialties',
  applicableCategories: ['financial_services', 'wealth_management', 'investing', 'insurance'],
  intentTriggers: {
    keywords: ['advisor', 'financial planner', 'CFP', 'CFA', 'wealth advisor', 'consultant'],
    queryPatterns: ['speak to an advisor', 'who is my advisor', 'financial planner *'],
    dataConditions: ['has_advisor'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Advisor Name' },
    ],
    optional: [
      { field: 'credentials', type: 'tags', label: 'Credentials' },
      { field: 'title', type: 'text', label: 'Title' },
      { field: 'aum', type: 'text', label: 'Assets Under Mgmt' },
      { field: 'clients', type: 'number', label: 'Client Count' },
      { field: 'experience', type: 'text', label: 'Experience' },
      { field: 'specialties', type: 'tags', label: 'Specialties' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Sarah Chen', title: 'Senior Wealth Advisor', credentials: ['CFP', 'CFA'],
    aum: '$142M', clients: 87, experience: '14 years',
    specialties: ['Retirement Planning', 'Tax Strategy', 'Estate Planning'], rating: 4.9,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function AdvisorBlock({ data, theme }: BlockComponentProps) {
  const { name, title, aum, clients, experience, rating } = data;
  const credentials: string[] = data.credentials || [];
  const specialties: string[] = data.specialties || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px', display: 'flex', gap: 10, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserCircle size={24} color={theme.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{name}</span>
            {credentials.map(c => <span key={c} style={{ fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: theme.accentBg, color: theme.accent }}>{c}</span>)}
          </div>
          {title && <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{title}</div>}
          {rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
              <Award size={9} color={theme.amber} />
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.amber }}>{rating}/5</span>
              {experience && <span style={{ fontSize: 8, color: theme.t4 }}>· {experience}</span>}
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', gap: 8, borderBottom: specialties.length ? `1px solid ${theme.bdr}` : 'none' }}>
        {[{ l: 'AUM', v: aum }, { l: 'Clients', v: clients }, { l: 'Experience', v: experience }].filter(r => r.v).map(r => (
          <div key={r.l} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>{r.v}</div>
            <div style={{ fontSize: 7, color: theme.t4, textTransform: 'uppercase' }}>{r.l}</div>
          </div>
        ))}
      </div>
      {specialties.length > 0 && (
        <div style={{ padding: '8px 12px', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {specialties.map(s => <span key={s} style={{ fontSize: 7, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t3 }}>{s}</span>)}
        </div>
      )}
      <div style={{ padding: '6px 12px 10px' }}>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Schedule Consultation</button>
      </div>
    </div>
  );
}
