'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { TrendingUp, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_progress',
  family: 'tracking',
  label: 'Progress Dashboard',
  description: 'Circular completion chart representation, module progress bars, next deadline',
  applicableCategories: ['education', 'elearning', 'coaching', 'training'],
  intentTriggers: {
    keywords: ['progress', 'dashboard', 'completion', 'status', 'my courses', 'how far'],
    queryPatterns: ['my progress', 'how am I doing', 'course completion', 'what is left'],
    dataConditions: ['has_progress'],
  },
  dataContract: {
    required: [
      { field: 'overallPercent', type: 'number', label: 'Overall Completion %' },
    ],
    optional: [
      { field: 'courseTitle', type: 'text', label: 'Course Title' },
      { field: 'modules', type: 'tags', label: 'Module Progress' },
      { field: 'nextDeadline', type: 'text', label: 'Next Deadline' },
      { field: 'hoursSpent', type: 'number', label: 'Hours Spent' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    courseTitle: 'Full-Stack Web Development', overallPercent: 42, hoursSpent: 38,
    nextDeadline: 'React Assignment — Apr 18',
    modules: [
      { name: 'HTML & CSS', percent: 100 },
      { name: 'JavaScript', percent: 100 },
      { name: 'React', percent: 35 },
      { name: 'Node.js', percent: 0 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

export default function ProgressBlock({ data, theme }: BlockComponentProps) {
  const pct = data.overallPercent || 0;
  const modules: Array<Record<string, any>> = data.modules || [];
  const r = 30; const c = 2 * Math.PI * r; const offset = c - (pct / 100) * c;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <TrendingUp size={12} color={theme.accent} />
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>{data.courseTitle || 'Progress'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width={72} height={72} viewBox="0 0 72 72">
          <circle cx={36} cy={36} r={r} fill="none" stroke={theme.bdr} strokeWidth={5} />
          <circle cx={36} cy={36} r={r} fill="none" stroke={theme.accent} strokeWidth={5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 36 36)" />
          <text x={36} y={34} textAnchor="middle" fontSize={14} fontWeight={800} fill={theme.t1}>{pct}%</text>
          <text x={36} y={44} textAnchor="middle" fontSize={7} fill={theme.t4}>complete</text>
        </svg>
        <div style={{ flex: 1 }}>
          {data.hoursSpent && <div style={{ fontSize: 9, color: theme.t3, marginBottom: 6 }}>{data.hoursSpent}h spent</div>}
          {modules.map((m, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, marginBottom: 2 }}>
                <span style={{ color: theme.t2 }}>{m.name}</span>
                <span style={{ fontWeight: 600, color: m.percent === 100 ? theme.green : theme.t3 }}>{m.percent}%</span>
              </div>
              <div style={{ height: 3, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${m.percent}%`, height: '100%', background: m.percent === 100 ? theme.green : theme.accent, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.nextDeadline && (
        <div style={{ marginTop: 8, padding: '6px 8px', background: theme.amberBg, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: theme.amber, fontWeight: 600 }}>
          <Clock size={10} /> {data.nextDeadline}
        </div>
      )}
    </div>
  );
}
