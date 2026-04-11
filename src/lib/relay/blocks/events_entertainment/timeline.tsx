'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Clock, CheckCircle } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_timeline',
  family: 'planning',
  label: 'Planning Timeline',
  description: 'Multi-phase milestone tracker from consultation to event day',
  applicableCategories: ['events', 'entertainment', 'wedding', 'corporate', 'party'],
  intentTriggers: {
    keywords: ['timeline', 'planning', 'milestones', 'schedule', 'phases', 'steps'],
    queryPatterns: ['what is the timeline', 'planning steps', 'how does the process work'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'phases', type: 'tags', label: 'Planning Phases' },
      { field: 'eventDate', type: 'date', label: 'Event Date' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    eventDate: '2026-09-15',
    phases: [
      { label: 'Consultation', date: '6 months out', status: 'done' },
      { label: 'Vendor Selection', date: '5 months out', status: 'done' },
      { label: 'Design & Planning', date: '3 months out', status: 'active' },
      { label: 'Final Walkthrough', date: '2 weeks out', status: 'upcoming' },
      { label: 'Event Day', date: 'Sep 15', status: 'upcoming' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function TimelineBlock({ data, theme }: BlockComponentProps) {
  const phases: Array<Record<string, any>> = data.phases || [];
  if (!phases.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Clock size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Planning Timeline</span>
        {data.eventDate && <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>Event: {data.eventDate}</span>}
      </div>
      <div style={{ padding: '8px 12px' }}>
        {phases.map((p, i) => {
          const isDone = p.status === 'done';
          const isActive = p.status === 'active';
          return (
            <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: i < phases.length - 1 ? 10 : 0, position: 'relative' }}>
              {i < phases.length - 1 && <div style={{ position: 'absolute', left: 7, top: 16, width: 2, height: 'calc(100% - 8px)', background: isDone ? theme.green : theme.bdr }} />}
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: isDone ? theme.green : isActive ? theme.accent : theme.bg, border: isDone || isActive ? 'none' : `2px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {isDone && <CheckCircle size={10} color="#fff" />}
                {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: isDone || isActive ? 600 : 400, color: isDone ? theme.t1 : isActive ? theme.accent : theme.t3 }}>{p.label}</div>
                <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{p.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
