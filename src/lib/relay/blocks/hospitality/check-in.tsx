'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ClipboardCheck, User, Clock, CreditCard } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_check_in',
  family: 'form',
  label: 'Digital Check-in',
  description: 'Pre-arrival check-in form with ID, arrival time, add-ons',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts'],
  intentTriggers: {
    keywords: ['check in', 'arrive', 'pre-check', 'check-in', 'early arrival'],
    queryPatterns: ['how to check in', 'online check-in', 'pre check in'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'guestName', type: 'text', label: 'Guest Name' },
      { field: 'roomName', type: 'text', label: 'Room' },
      { field: 'checkInDate', type: 'date', label: 'Check-in Date' },
      { field: 'estimatedArrival', type: 'text', label: 'Estimated Arrival' },
      { field: 'addOns', type: 'tags', label: 'Add-ons' },
    ],
  },
  variants: ['default'],
  sampleData: {
    guestName: '', roomName: 'Deluxe Ocean View', checkInDate: '2026-04-15',
    estimatedArrival: '3:00 PM', addOns: ['Late checkout ($30)', 'Airport pickup ($45)', 'Welcome fruit basket ($15)'],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function CheckInBlock({ data, theme }: BlockComponentProps) {
  const addOns: string[] = data.addOns || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <ClipboardCheck size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Digital Check-in</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {data.roomName && (
          <div style={{ padding: '6px 8px', background: theme.bg, borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={10} color={theme.accent} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.roomName}</div>
              <div style={{ fontSize: 8, color: theme.t4 }}>{data.checkInDate || 'Select date'}</div>
            </div>
          </div>
        )}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
          <div style={{ marginTop: 3, padding: '8px 10px', border: `1px solid ${theme.bdr}`, borderRadius: 6, fontSize: 10, color: theme.t4 }}>Enter guest name</div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimated Arrival</label>
          <div style={{ marginTop: 3, display: 'flex', gap: 4 }}>
            {['2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM+'].map(t => (
              <div key={t} style={{ padding: '6px 8px', borderRadius: 6, border: t === data.estimatedArrival ? `2px solid ${theme.accent}` : `1px solid ${theme.bdr}`, background: t === data.estimatedArrival ? theme.accentBg : theme.surface, fontSize: 9, fontWeight: t === data.estimatedArrival ? 600 : 400, color: t === data.estimatedArrival ? theme.accent : theme.t2, cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                {t}
              </div>
            ))}
          </div>
        </div>
        {addOns.length > 0 && (
          <div>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Add-ons</label>
            <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {addOns.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, border: `1px solid ${theme.bdr}`, cursor: 'pointer' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${theme.bdr}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: theme.t2 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
          Complete Check-in
        </button>
      </div>
    </div>
  );
}
