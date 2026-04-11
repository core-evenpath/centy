'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Calendar, Video } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_consultation_booking',
  family: 'booking',
  label: 'Consultation Booking',
  description: 'Discovery call scheduler with topic selector, format picker, and time slots',
  applicableCategories: ['business', 'professional', 'consulting', 'legal', 'finance', 'coaching'],
  intentTriggers: {
    keywords: ['book', 'schedule', 'consultation', 'call', 'meeting', 'discovery', 'appointment'],
    queryPatterns: ['book a call', 'schedule consultation', 'available times', 'I want to meet *'],
    dataConditions: ['has_availability'],
  },
  dataContract: {
    required: [
      { field: 'topics', type: 'tags', label: 'Topics' },
    ],
    optional: [
      { field: 'formats', type: 'tags', label: 'Formats' },
      { field: 'slots', type: 'tags', label: 'Available Slots' },
      { field: 'duration', type: 'text', label: 'Duration' },
      { field: 'fee', type: 'currency', label: 'Consultation Fee' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    topics: ['Strategy Review', 'Technical Audit', 'Growth Planning', 'Team Assessment'],
    formats: ['Video', 'Phone', 'In-Person'],
    slots: ['Mon 10:00 AM', 'Tue 2:00 PM', 'Wed 11:00 AM', 'Thu 3:00 PM'],
    duration: '45 min', fee: 150,
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 60,
};

export default function ConsultationBookingBlock({ data, theme }: BlockComponentProps) {
  const topics: string[] = data.topics || [];
  const formats: string[] = data.formats || ['Video', 'Phone', 'In-Person'];
  const slots: string[] = data.slots || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Calendar size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Book a Consultation</span>
        {data.duration && <span style={{ fontSize: 8, color: theme.t3, marginLeft: 'auto' }}>{data.duration}</span>}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Topic</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4, marginBottom: 10 }}>
          {topics.map((t, i) => (
            <div key={t} style={{ padding: '5px 8px', borderRadius: 6, border: i === 0 ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: i === 0 ? theme.accentBg : theme.surface, fontSize: 9, color: i === 0 ? theme.accent : theme.t2, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
        <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Format</label>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, marginBottom: 10 }}>
          {formats.map((f, i) => (
            <div key={f} style={{ padding: '5px 10px', borderRadius: 6, border: i === 0 ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: i === 0 ? theme.accentBg : theme.surface, fontSize: 9, color: i === 0 ? theme.accent : theme.t2, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              {i === 0 && <Video size={9} />}{f}
            </div>
          ))}
        </div>
        {slots.length > 0 && (<>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available Slots</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4, marginBottom: 10 }}>
            {slots.map(s => <div key={s} style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${theme.bdr}`, fontSize: 9, color: theme.t2, cursor: 'pointer' }}>{s}</div>)}
          </div>
        </>)}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {data.fee && <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent }}>${data.fee}</span>}
          <button style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', marginLeft: 'auto' }}>Confirm Booking</button>
        </div>
      </div>
    </div>
  );
}
