'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Camera, ArrowRight } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_before_after',
  family: 'proof',
  label: 'Before / After Gallery',
  description: 'Side-by-side project photo placeholders with category tag and duration',
  applicableCategories: ['home_property', 'home_services', 'renovation', 'repair'],
  intentTriggers: {
    keywords: ['before', 'after', 'results', 'photos', 'gallery', 'portfolio', 'work samples'],
    queryPatterns: ['show me examples', 'before and after *', 'past work', 'project photos'],
    dataConditions: ['has_projects'],
  },
  dataContract: {
    required: [
      { field: 'projects', type: 'tags', label: 'Projects' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    projects: [
      { title: 'Kitchen Remodel', category: 'Renovation', duration: '5 days', beforeImg: '', afterImg: '' },
      { title: 'Bathroom Retile', category: 'Tiling', duration: '2 days', beforeImg: '', afterImg: '' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function BeforeAfterBlock({ data, theme }: BlockComponentProps) {
  const projects: Array<Record<string, any>> = data.projects || [];
  if (!projects.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {projects.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '6px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{p.title}</span>
              <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{p.category}</span>
            </div>
            {p.duration && <span style={{ fontSize: 8, color: theme.t4 }}>{p.duration}</span>}
          </div>
          <div style={{ display: 'flex', gap: 1, background: theme.bdr }}>
            <div style={{ flex: 1, height: 80, background: theme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Camera size={16} color={theme.t4} />
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.t4, textTransform: 'uppercase' }}>Before</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: theme.surface, padding: '0 2px' }}>
              <ArrowRight size={10} color={theme.accent} />
            </div>
            <div style={{ flex: 1, height: 80, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.greenBg})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Camera size={16} color={theme.green} />
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.green, textTransform: 'uppercase' }}>After</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
