'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Plane, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_ticket_booking',
  family: 'booking',
  label: 'Ticket / Flight Booking',
  description: 'Route header with flight/bus options showing airline, times, stops, price comparison',
  applicableCategories: ['travel', 'flights', 'transport', 'airlines', 'buses'],
  intentTriggers: {
    keywords: ['flight', 'ticket', 'booking', 'bus', 'airline', 'fare'],
    queryPatterns: ['flights from * to *', 'book a ticket', 'cheapest flight *', 'bus to *'],
    dataConditions: ['has_routes'],
  },
  dataContract: {
    required: [
      { field: 'from', type: 'text', label: 'Origin' },
      { field: 'to', type: 'text', label: 'Destination' },
    ],
    optional: [
      { field: 'date', type: 'date', label: 'Travel Date' },
      { field: 'options', type: 'tags', label: 'Flight/Bus Options' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    from: 'SIN', to: 'NRT', date: 'Apr 20, 2026',
    options: [
      { airline: 'SQ 638', depart: '08:30', arrive: '16:45', duration: '7h 15m', stops: 'Direct', price: 680, badge: 'Best Value' },
      { airline: 'JL 712', depart: '11:00', arrive: '19:50', duration: '7h 50m', stops: 'Direct', price: 740 },
      { airline: 'CX 520', depart: '14:15', arrive: '00:30+1', duration: '9h 15m', stops: '1 stop HKG', price: 520 },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 180,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function TicketBookingBlock({ data, theme }: BlockComponentProps) {
  const options: Array<Record<string, any>> = data.options || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plane size={11} color={theme.accent} />
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{data.from}</span>
          <span style={{ fontSize: 10, color: theme.t4 }}>&#8594;</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{data.to}</span>
        </div>
        {data.date && <span style={{ fontSize: 9, color: theme.t3 }}>{data.date}</span>}
      </div>
      {options.map((o, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < options.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{o.airline}</span>
              {o.badge && <span style={{ fontSize: 7, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 4px', borderRadius: 3 }}>{o.badge}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{o.depart}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 7, color: theme.t4 }}>{o.duration}</span>
                <div style={{ width: '100%', height: 1, background: theme.bdr, margin: '2px 0' }} />
                <span style={{ fontSize: 7, color: o.stops === 'Direct' ? theme.green : theme.amber }}>{o.stops}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{o.arrive}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(o.price)}</div>
            <button style={{ fontSize: 8, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '3px 8px', borderRadius: 5, cursor: 'pointer', marginTop: 2 }}>Select</button>
          </div>
        </div>
      ))}
    </div>
  );
}
