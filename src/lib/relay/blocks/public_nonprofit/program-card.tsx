'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FolderOpen, TrendingUp } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_program_card',
  family: 'programs',
  label: 'Program Card',
  description: 'Active programs with status badge, budget, progress bar',
  applicableCategories: ['nonprofit', 'government', 'public_services', 'community'],
  intentTriggers: {
    keywords: ['program', 'initiative', 'project', 'grant', 'budget', 'active programs'],
    queryPatterns: ['what programs *', 'tell me about the * program', 'current initiatives'],
    dataConditions: ['has_programs'],
  },
  dataContract: {
    required: [
      { field: 'programs', type: 'tags', label: 'Programs List' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    programs: [
      { name: 'Youth STEM Initiative', status: 'Active', budget: '$180K', progress: 65, enrolled: 240 },
      { name: 'Senior Meals Program', status: 'Active', budget: '$95K', progress: 82, enrolled: 410 },
      { name: 'Green Spaces Expansion', status: 'Planning', budget: '$320K', progress: 15, enrolled: null },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function ProgramCardBlock({ data, theme }: BlockComponentProps) {
  const programs: Array<Record<string, any>> = data.programs || [];
  if (!programs.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {programs.map((p, i) => {
        const statusColor = p.status === 'Active' ? theme.green : p.status === 'Planning' ? theme.amber : theme.t4;
        const statusBg = p.status === 'Active' ? theme.greenBg : p.status === 'Planning' ? theme.amberBg : theme.bg;
        return (
          <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FolderOpen size={12} color={theme.accent} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{p.name}</span>
              </div>
              <span style={{ fontSize: 8, fontWeight: 600, color: statusColor, background: statusBg, padding: '2px 6px', borderRadius: 4 }}>{p.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {p.budget && <span style={{ fontSize: 10, color: theme.t3 }}>Budget: <strong style={{ color: theme.t1 }}>{p.budget}</strong></span>}
              {p.enrolled != null && <span style={{ fontSize: 10, color: theme.t3 }}>Enrolled: <strong style={{ color: theme.t1 }}>{p.enrolled}</strong></span>}
            </div>
            {p.progress != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: theme.accent, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: theme.t2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp size={8} /> {p.progress}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
