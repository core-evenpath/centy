'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { User, Award } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_expert_profile',
  family: 'people',
  label: 'Expert / Team Profile',
  description: 'Professional card with credentials, specialization tags, and project count',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'legal', 'finance'],
  intentTriggers: {
    keywords: ['team', 'expert', 'profile', 'consultant', 'advisor', 'who', 'specialist'],
    queryPatterns: ['who is *', 'tell me about the team', 'meet the *', 'your experts'],
    dataConditions: ['has_team'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Full Name' },
      { field: 'role', type: 'text', label: 'Role / Title' },
    ],
    optional: [
      { field: 'credentials', type: 'tags', label: 'Credentials' },
      { field: 'specializations', type: 'tags', label: 'Specializations' },
      { field: 'projectCount', type: 'number', label: 'Projects Completed' },
      { field: 'yearsExp', type: 'number', label: 'Years Experience' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
      { field: 'bio', type: 'textarea', label: 'Short Bio' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Priya Sharma', role: 'Principal Consultant', credentials: ['CFA', 'MBA'], specializations: ['M&A Advisory', 'Due Diligence'], projectCount: 87, yearsExp: 14 },
      { name: 'David Chen', role: 'Senior Strategist', credentials: ['PMP'], specializations: ['Digital Transformation', 'GTM'], projectCount: 52, yearsExp: 9 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 600,
};

export default function ExpertProfileBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [data];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={20} color={theme.t4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{p.name}</div>
            <div style={{ fontSize: 9, color: theme.accent, fontWeight: 500, marginTop: 1 }}>{p.role}</div>
            {p.credentials?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {p.credentials.map((c: string) => (
                  <span key={c} style={{ fontSize: 7, fontWeight: 700, color: theme.accent, background: theme.accentBg, padding: '2px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Award size={7} />{c}
                  </span>
                ))}
              </div>
            )}
            {p.specializations?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                {p.specializations.map((s: string) => <span key={s} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t3, border: `1px solid ${theme.bdr}` }}>{s}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 9, color: theme.t3 }}>
              {p.projectCount && <span><strong style={{ color: theme.t1 }}>{p.projectCount}</strong> projects</span>}
              {p.yearsExp && <span><strong style={{ color: theme.t1 }}>{p.yearsExp}</strong> yrs exp</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
