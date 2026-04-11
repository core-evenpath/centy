'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ListOrdered, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_curriculum',
  family: 'content',
  label: 'Curriculum Outline',
  description: 'Module breakdown with numbered steps and completion status badges',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['curriculum', 'syllabus', 'modules', 'topics', 'outline', 'content'],
    queryPatterns: ['what will I learn', 'course syllabus', 'show curriculum', 'modules in *'],
    dataConditions: ['has_curriculum'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Course Title' },
    ],
    optional: [
      { field: 'modules', type: 'tags', label: 'Modules' },
      { field: 'totalHours', type: 'number', label: 'Total Hours' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Full-Stack Web Development', totalHours: 120,
    modules: [
      { name: 'HTML & CSS Foundations', hours: 12, status: 'completed' },
      { name: 'JavaScript Deep Dive', hours: 18, status: 'completed' },
      { name: 'React & State Management', hours: 24, status: 'in_progress' },
      { name: 'Node.js & Express', hours: 20, status: 'locked' },
      { name: 'Databases & Auth', hours: 22, status: 'locked' },
      { name: 'Capstone Project', hours: 24, status: 'locked' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

const statusStyle = (s: string, t: BlockComponentProps['theme']) => {
  if (s === 'completed') return { label: 'Done', color: t.green, bg: t.greenBg };
  if (s === 'in_progress') return { label: 'In Progress', color: t.amber, bg: t.amberBg };
  return { label: 'Locked', color: t.t4, bg: t.bg };
};

export default function CurriculumBlock({ data, theme }: BlockComponentProps) {
  const modules: Array<Record<string, any>> = data.modules || [];
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <ListOrdered size={12} color={theme.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>{data.title || 'Curriculum'}</span>
        </div>
        {data.totalHours && <span style={{ fontSize: 8, color: theme.t4 }}>{data.totalHours}h total</span>}
      </div>
      <div style={{ padding: '6px 12px' }}>
        {modules.map((m, i) => {
          const st = statusStyle(m.status, theme);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < modules.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.status === 'completed' ? theme.greenBg : theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {m.status === 'completed' ? <CheckCircle size={12} color={theme.green} /> : <span style={{ fontSize: 9, fontWeight: 700, color: theme.t3 }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: m.status === 'locked' ? theme.t4 : theme.t1 }}>{m.name}</div>
                {m.hours && <div style={{ fontSize: 8, color: theme.t4 }}>{m.hours}h</div>}
              </div>
              <span style={{ fontSize: 7, fontWeight: 600, color: st.color, background: st.bg, padding: '2px 5px', borderRadius: 4 }}>{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
