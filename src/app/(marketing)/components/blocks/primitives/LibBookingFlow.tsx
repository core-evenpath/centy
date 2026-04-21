'use client';
import { C, F } from '../../theme';
import type { LibBookingFlowProps } from '../types';

const DEFAULT_DAYS = [
  { d: 'Tue', n: '15', slots: 3 },
  { d: 'Wed', n: '16', slots: 1, active: true },
  { d: 'Thu', n: '17', slots: 4 },
  { d: 'Fri', n: '18', slots: 2 },
  { d: 'Sat', n: '19', slots: 0 },
];
const DEFAULT_TIMES = ['9:00 AM', '10:30 AM', '2:00 PM'];

export function LibBookingFlow({ days = DEFAULT_DAYS, times = DEFAULT_TIMES }: LibBookingFlowProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, padding: '11px 13px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, marginBottom: 9 }}>
        {days.map((d, i) => (
          <div key={i} style={{ padding: '7px 0', borderRadius: 7, background: d.active ? C.ink : d.slots === 0 ? C.surfaceAlt : '#fff', border: d.active ? 'none' : `1px solid ${C.border}`, textAlign: 'center', opacity: d.slots === 0 ? 0.4 : 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: d.active ? 'rgba(255,255,255,0.7)' : C.t3, fontFamily: F, lineHeight: 1 }}>{d.d}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: d.active ? '#fff' : C.ink, fontFamily: F, letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 2 }}>{d.n}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {times.map((t, i) => (
          <div key={i} style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: i === 1 ? C.accent : '#fff', border: i === 1 ? 'none' : `1px solid ${C.border}`, fontSize: 11.5, fontWeight: 700, color: i === 1 ? '#fff' : C.ink, fontFamily: F, textAlign: 'center' }}>{t}</div>
        ))}
      </div>
    </div>
  );
}
