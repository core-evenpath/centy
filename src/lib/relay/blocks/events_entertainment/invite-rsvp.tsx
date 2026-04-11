'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Mail, UserCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_invite_rsvp',
  family: 'management',
  label: 'RSVP Tracker',
  description: 'Guest list with sent/accepted/declined/pending counts, dietary info',
  applicableCategories: ['events', 'entertainment', 'wedding', 'corporate', 'party', 'gala'],
  intentTriggers: {
    keywords: ['rsvp', 'guest list', 'invites', 'responses', 'attendance', 'dietary'],
    queryPatterns: ['rsvp status', 'who responded', 'guest list for *', 'how many confirmed'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'sent', type: 'number', label: 'Invites Sent' },
      { field: 'accepted', type: 'number', label: 'Accepted' },
      { field: 'declined', type: 'number', label: 'Declined' },
      { field: 'pending', type: 'number', label: 'Pending' },
      { field: 'dietary', type: 'tags', label: 'Dietary Requirements' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    sent: 200, accepted: 142, declined: 18, pending: 40,
    dietary: [{ label: 'Vegetarian', count: 24 }, { label: 'Vegan', count: 8 }, { label: 'Gluten-Free', count: 12 }, { label: 'Halal', count: 6 }],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 60,
};

export default function InviteRsvpBlock({ data, theme }: BlockComponentProps) {
  const sent = data.sent || 0;
  const accepted = data.accepted || 0;
  const declined = data.declined || 0;
  const pending = data.pending || 0;
  const dietary: Array<{ label: string; count: number }> = data.dietary || [];
  const stats = [
    { label: 'Sent', value: sent, color: theme.t2, bg: theme.bg },
    { label: 'Accepted', value: accepted, color: theme.green, bg: theme.greenBg },
    { label: 'Declined', value: declined, color: theme.red, bg: theme.redBg },
    { label: 'Pending', value: pending, color: theme.amber, bg: theme.amberBg },
  ];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Mail size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>RSVP Tracker</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: '8px 10px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: s.bg }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 7, color: theme.t3, fontWeight: 600, textTransform: 'uppercase', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {sent > 0 && (
        <div style={{ padding: '0 12px 6px' }}>
          <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(accepted / sent) * 100}%`, background: theme.green, height: '100%' }} />
            <div style={{ width: `${(declined / sent) * 100}%`, background: theme.red, height: '100%' }} />
            <div style={{ width: `${(pending / sent) * 100}%`, background: theme.amber, height: '100%' }} />
          </div>
        </div>
      )}
      {dietary.length > 0 && (
        <div style={{ padding: '6px 12px', borderTop: `1px solid ${theme.bdr}` }}>
          <div style={{ fontSize: 8, fontWeight: 600, color: theme.t3, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}><UserCheck size={8} />Dietary Requirements</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {dietary.map(d => <span key={d.label} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t2 }}>{d.label} ({d.count})</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
