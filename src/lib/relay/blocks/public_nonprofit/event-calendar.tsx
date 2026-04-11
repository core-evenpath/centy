'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar, MapPin } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_event_calendar',
  family: 'community',
  label: 'Community Events',
  description: 'Upcoming public events, meetings, workshops, festivals',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit', 'community'],
  intentTriggers: {
    keywords: ['event', 'meeting', 'workshop', 'festival', 'calendar', 'upcoming', 'schedule'],
    queryPatterns: ['what events are *', 'upcoming events', 'when is the next *'],
    dataConditions: ['has_events'],
  },
  dataContract: {
    required: [
      { field: 'events', type: 'tags', label: 'Events List' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    events: [
      { title: 'Town Hall Meeting', date: 'Apr 15', time: '6:00 PM', location: 'City Hall, Room 201', type: 'Meeting' },
      { title: 'Spring Clean-Up Day', date: 'Apr 20', time: '9:00 AM', location: 'Riverside Park', type: 'Volunteer' },
      { title: 'Small Business Workshop', date: 'Apr 22', time: '2:00 PM', location: 'Community Center', type: 'Workshop' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

export default function EventCalendarBlock({ data, theme }: BlockComponentProps) {
  const events: Array<Record<string, any>> = data.events || [];
  if (!events.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: theme.accentBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={12} color={theme.accent} />
            <span style={{ fontSize: 7, fontWeight: 700, color: theme.accent, marginTop: 1 }}>{ev.date}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1, marginBottom: 2 }}>{ev.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {ev.type && <span style={{ fontSize: 8, fontWeight: 600, color: theme.accent, background: theme.accentBg2, padding: '1px 5px', borderRadius: 3 }}>{ev.type}</span>}
              {ev.time && <span style={{ fontSize: 9, color: theme.t3 }}>{ev.time}</span>}
              {ev.location && (
                <span style={{ fontSize: 9, color: theme.t3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MapPin size={8} /> {ev.location}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
