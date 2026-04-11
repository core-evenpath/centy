'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { CalendarDays, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_class_schedule',
  family: 'scheduling',
  label: 'Class Schedule',
  description: 'Weekly class timetable with instructor, level, and spots remaining',
  applicableCategories: ['personal_wellness', 'fitness', 'yoga', 'pilates', 'gym'],
  intentTriggers: {
    keywords: ['classes', 'schedule', 'timetable', 'yoga', 'pilates', 'group'],
    queryPatterns: ['class schedule', 'when is * class', 'upcoming classes'],
    dataConditions: ['has_classes'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'classes', type: 'tags', label: 'Classes' },
      { field: 'weekLabel', type: 'text', label: 'Week Label' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    weekLabel: 'This Week',
    classes: [
      { name: 'Vinyasa Flow', instructor: 'Priya K.', day: 'Mon', time: '7:00 AM', level: 'All Levels', spots: 4 },
      { name: 'Power Pilates', instructor: 'Laura M.', day: 'Tue', time: '6:30 PM', level: 'Intermediate', spots: 2 },
      { name: 'Yin Yoga', instructor: 'Priya K.', day: 'Thu', time: '8:00 AM', level: 'Beginner', spots: 8 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function ClassScheduleBlock({ data, theme }: BlockComponentProps) {
  const classes: Array<Record<string, any>> = data.classes || [];
  if (!classes.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <CalendarDays size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Class Schedule</span>
        {data.weekLabel && <span style={{ fontSize: 8, color: theme.t4, marginLeft: 'auto' }}>{data.weekLabel}</span>}
      </div>
      {classes.map((c, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < classes.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: theme.accent }}>{c.day}</div>
            <div style={{ fontSize: 8, color: theme.t3 }}>{c.time}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{c.name}</div>
            <div style={{ fontSize: 8, color: theme.t3 }}>{c.instructor}{c.level ? ` · ${c.level}` : ''}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Users size={8} color={c.spots <= 3 ? theme.amber : theme.green} />
              <span style={{ fontSize: 8, fontWeight: 600, color: c.spots <= 3 ? theme.amber : theme.green }}>{c.spots} left</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
