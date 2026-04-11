'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Award, BarChart3 } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_assessment',
  family: 'tracking',
  label: 'Assessment Result',
  description: 'Test score display with section breakdown and percentile ranking bar',
  applicableCategories: ['education', 'elearning', 'coaching', 'training', 'academy'],
  intentTriggers: {
    keywords: ['result', 'score', 'assessment', 'test', 'grade', 'marks', 'exam'],
    queryPatterns: ['my results', 'test score', 'how did I score', 'assessment results'],
    dataConditions: ['has_assessment'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Assessment Title' },
      { field: 'score', type: 'number', label: 'Score' },
      { field: 'maxScore', type: 'number', label: 'Max Score' },
    ],
    optional: [
      { field: 'percentile', type: 'number', label: 'Percentile' },
      { field: 'grade', type: 'text', label: 'Grade' },
      { field: 'sections', type: 'tags', label: 'Section Scores' },
      { field: 'date', type: 'date', label: 'Test Date' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'React Midterm Assessment', score: 82, maxScore: 100, percentile: 88, grade: 'A', date: '2026-04-05',
    sections: [{ label: 'Components & Props', score: 18, max: 20 }, { label: 'State Management', score: 22, max: 25 }, { label: 'Hooks', score: 20, max: 25 }, { label: 'Routing', score: 22, max: 30 }],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function AssessmentBlock({ data, theme }: BlockComponentProps) {
  const pct = Math.round((data.score / data.maxScore) * 100) || 0;
  const sections: Array<Record<string, any>> = data.sections || [];
  const gradeColor = pct >= 80 ? theme.green : pct >= 50 ? theme.amber : theme.red;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Award size={12} color={theme.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>{data.title}</span>
        </div>
        {data.date && <span style={{ fontSize: 8, color: theme.t4 }}>{data.date}</span>}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: gradeColor }}>{data.score}</div>
          <div style={{ fontSize: 8, color: theme.t4 }}>out of {data.maxScore}</div>
        </div>
        <div style={{ flex: 1 }}>
          {data.grade && <div style={{ fontSize: 20, fontWeight: 800, color: gradeColor, marginBottom: 2 }}>Grade {data.grade}</div>}
          {data.percentile && (
            <div>
              <div style={{ fontSize: 8, color: theme.t3, marginBottom: 2 }}>Top {100 - data.percentile}% — {data.percentile}th percentile</div>
              <div style={{ height: 5, background: theme.bg, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${data.percentile}%`, height: '100%', background: theme.accent, borderRadius: 3 }} />
              </div>
            </div>
          )}
        </div>
      </div>
      {sections.length > 0 && (
        <div style={{ padding: '8px 12px' }}>
          {sections.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: theme.t3, width: 110 }}>{s.label}</span>
              <div style={{ flex: 1, height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${(s.score / s.max) * 100}%`, height: '100%', background: s.score / s.max >= 0.8 ? theme.green : theme.accent, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1, width: 36, textAlign: 'right' }}>{s.score}/{s.max}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
