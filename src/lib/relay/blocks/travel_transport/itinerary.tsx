'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar, MapPin } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_itinerary',
  family: 'catalog',
  label: 'Day-by-Day Itinerary',
  description: 'Visual timeline with day ranges, locations, activities, and total pricing',
  applicableCategories: ['travel', 'tours', 'agencies', 'holidays'],
  intentTriggers: {
    keywords: ['itinerary', 'schedule', 'day plan', 'trip plan', 'agenda'],
    queryPatterns: ['show itinerary', 'what is the plan', 'day by day *', 'trip schedule'],
    dataConditions: ['has_itinerary'],
  },
  dataContract: {
    required: [{ field: 'days', type: 'tags', label: 'Itinerary Days' }],
    optional: [
      { field: 'title', type: 'text', label: 'Trip Title' },
      { field: 'totalPrice', type: 'currency', label: 'Total Price' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Bali Explorer — 7 Nights',
    totalPrice: 1299,
    days: [
      { day: 1, label: 'Arrival & Seminyak', location: 'Seminyak', activities: ['Airport transfer', 'Beach sunset'] },
      { day: '2-3', label: 'Ubud Culture', location: 'Ubud', activities: ['Rice terraces', 'Monkey forest', 'Spa'] },
      { day: '4-5', label: 'Nusa Penida', location: 'Nusa Penida', activities: ['Snorkelling', 'Kelingking Beach'] },
      { day: '6-7', label: 'Relax & Departure', location: 'Kuta', activities: ['Free day', 'Airport transfer'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ItineraryBlock({ data, theme }: BlockComponentProps) {
  const days: Array<Record<string, any>> = data.days || [];
  if (!days.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={11} color={theme.t1} />
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.title || 'Itinerary'}</span>
        </div>
        {data.totalPrice && <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{fmt(data.totalPrice)}</span>}
      </div>
      {days.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderBottom: i < days.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: theme.accent }}>{d.day}</div>
            {i < days.length - 1 && <div style={{ width: 2, flex: 1, background: theme.bdr, marginTop: 3 }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{d.label}</div>
            <div style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}><MapPin size={8} />{d.location}</div>
            {d.activities?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                {d.activities.map((a: string, j: number) => <span key={j} style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.bg, color: theme.t3 }}>{a}</span>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
