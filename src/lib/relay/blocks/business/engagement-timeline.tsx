'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Activity, Circle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_engagement_timeline',
  family: 'tracking',
  label: 'Engagement Timeline',
  description: 'Active project phases with milestone dots and completion percentage',
  applicableCategories: ['business', 'professional', 'consulting', 'agency'],
  intentTriggers: {
    keywords: ['timeline', 'milestones', 'progress', 'phase', 'status', 'where are we'],
    queryPatterns: ['project status', 'where are we', 'timeline update', 'milestones *'],
    dataConditions: ['has_engagement'],
  },
  dataContract: {
    required: [
      { field: 'projectName', type: 'text', label: 'Project Name' },
      { field: 'phases', type: 'tags', label: 'Phases' },
    ],
    optional: [
      { field: 'completion', type: 'number', label: 'Completion %' },
      { field: 'currentPhase', type: 'text', label: 'Current Phase' },
    ],
  },
  variants: ['default'],
  sampleData: {
    projectName: 'Platform Migration',
    completion: 65,
    currentPhase: 'Development',
    phases: [
      { name: 'Discovery', status: 'done' },
      { name: 'Design', status: 'done' },
      { name: 'Development', status: 'active' },
      { name: 'Testing', status: 'upcoming' },
      { name: 'Launch', status: 'upcoming' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 60,
};

export default function EngagementTimelineBlock({ data, theme }: BlockComponentProps) {
  const phases: Array<Record<string, any>> = data.phases || [];
  const completion = data.completion ?? 0;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Activity size={12} color={theme.accent} />
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{data.projectName}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{completion}%</span>
      </div>
      <div style={{ padding: '6px 12px 2px' }}>
        <div style={{ height: 4, background: theme.bg, borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${completion}%`, height: '100%', background: theme.accent, borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ padding: '0 12px 10px' }}>
        {phases.map((p, i) => {
          const isDone = p.status === 'done';
          const isActive = p.status === 'active';
          const dotColor = isDone ? theme.green : isActive ? theme.accent : theme.t4;
          const dotBg = isDone ? theme.greenBg : isActive ? theme.accentBg : theme.bg;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: dotBg, border: `2px solid ${dotColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isDone && <span style={{ fontSize: 9, color: theme.green }}>&#10003;</span>}
                {isActive && <Circle size={6} fill={theme.accent} color={theme.accent} />}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? theme.accent : isDone ? theme.t2 : theme.t4 }}>{p.name}</span>
              {isActive && <span style={{ fontSize: 7, fontWeight: 600, color: theme.accent, background: theme.accentBg, padding: '1px 5px', borderRadius: 4, marginLeft: 'auto' }}>In Progress</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
