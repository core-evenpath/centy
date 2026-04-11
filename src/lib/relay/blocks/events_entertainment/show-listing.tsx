'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Ticket, MapPin } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_show_listing',
  family: 'entertainment',
  label: 'Show Listing',
  description: 'Upcoming shows with type tag, date/time, venue, ticket price, seat count',
  applicableCategories: ['events', 'entertainment', 'concerts', 'theater', 'comedy', 'live_shows'],
  intentTriggers: {
    keywords: ['shows', 'upcoming', 'events', 'concerts', 'tickets', 'performances'],
    queryPatterns: ['upcoming shows', 'what shows *', 'events this *', 'tickets for *'],
    dataConditions: ['has_shows'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Show Title' },
      { field: 'date', type: 'date', label: 'Show Date' },
    ],
    optional: [
      { field: 'type', type: 'text', label: 'Show Type' },
      { field: 'time', type: 'text', label: 'Time' },
      { field: 'venue', type: 'text', label: 'Venue' },
      { field: 'price', type: 'currency', label: 'Ticket Price' },
      { field: 'seatsLeft', type: 'number', label: 'Seats Remaining' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { title: 'Jazz Night Live', type: 'Live Music', date: '2026-06-20', time: '8:00 PM', venue: 'Blue Note Lounge', price: 45, seatsLeft: 32 },
      { title: 'Comedy Showcase', type: 'Comedy', date: '2026-06-22', time: '7:30 PM', venue: 'City Theater', price: 30, seatsLeft: 8 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 120,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ShowListingBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Ticket size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Upcoming Shows</span>
      </div>
      {items.map((s, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{s.title}</span>
              {s.type && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{s.type}</span>}
            </div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 2, display: 'flex', gap: 6 }}>
              <span>{s.date}{s.time ? ` · ${s.time}` : ''}</span>
              {s.venue && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={8} />{s.venue}</span>}
            </div>
            {s.seatsLeft != null && s.seatsLeft <= 15 && <div style={{ fontSize: 8, color: theme.amber, fontWeight: 600, marginTop: 2 }}>Only {s.seatsLeft} seats left</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{fmt(s.price)}</div>
            <button style={{ fontSize: 8, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '4px 8px', borderRadius: 5, cursor: 'pointer', marginTop: 3 }}>Get Tickets</button>
          </div>
        </div>
      ))}
    </div>
  );
}
