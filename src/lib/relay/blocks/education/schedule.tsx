'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'edu_schedule',
  family: 'timetable',
  label: 'Schedule / Timetable',
  description: 'Weekly class grid with day columns and color-coded subject slots',
  applicableCategories: ['education', 'coaching', 'training', 'academy', 'school'],
  intentTriggers: {
    keywords: ['schedule', 'timetable', 'classes', 'timing', 'when', 'weekly'],
    queryPatterns: ['when is * class', 'show schedule', 'class timings', 'weekly timetable'],
    dataConditions: ['has_schedule'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'weekLabel', type: 'text', label: 'Week Label' },
      { field: 'days', type: 'tags', label: 'Days' },
      { field: 'slots', type: 'tags', label: 'Time Slots' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    weekLabel: 'This Week',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    slots: [
      { day: 'Mon', time: '9:00 AM', subject: 'Mathematics', color: 'accent' },
      { day: 'Mon', time: '11:00 AM', subject: 'Physics', color: 'green' },
      { day: 'Tue', time: '9:00 AM', subject: 'Chemistry', color: 'amber' },
      { day: 'Wed', time: '9:00 AM', subject: 'Mathematics', color: 'accent' },
      { day: 'Thu', time: '2:00 PM', subject: 'English', color: 'green' },
      { day: 'Fri', time: '9:00 AM', subject: 'Physics', color: 'amber' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

const colorMap = (c: string, t: BlockComponentProps['theme']) => {
  if (c === 'green') return { bg: t.greenBg, fg: t.green };
  if (c === 'amber') return { bg: t.amberBg, fg: t.amber };
  return { bg: t.accentBg, fg: t.accent };
};

export default function ScheduleBlock({ data, theme }: BlockComponentProps) {
  const days: string[] = data.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slots: Array<Record<string, any>> = data.slots || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: `1px solid ${theme.bdr}` }}>
        <Calendar size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{data.weekLabel || 'This Week'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 1, padding: 8 }}>
        {days.map(d => <div key={d} style={{ fontSize: 8, fontWeight: 700, color: theme.t3, textAlign: 'center', paddingBottom: 4 }}>{d}</div>)}
        {days.map(d => {
          const daySlots = slots.filter((s: any) => s.day === d);
          return (
            <div key={`col-${d}`} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {daySlots.length ? daySlots.map((s: any, j: number) => {
                const cm = colorMap(s.color, theme);
                return (
                  <div key={j} style={{ background: cm.bg, borderRadius: 4, padding: '4px 3px', textAlign: 'center', borderLeft: `2px solid ${cm.fg}` }}>
                    <div style={{ fontSize: 7, fontWeight: 600, color: cm.fg }}>{s.subject}</div>
                    <div style={{ fontSize: 6, color: theme.t4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, marginTop: 1 }}><Clock size={6} />{s.time}</div>
                  </div>
                );
              }) : <div style={{ fontSize: 7, color: theme.t4, textAlign: 'center', padding: 6 }}>—</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
