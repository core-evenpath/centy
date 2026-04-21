'use client';
import { C, F } from '../../theme';
import type { LibLocationMapProps } from '../types';

export function LibLocationMap({
  name = 'Northstar \u2014 Midtown',
  address = '412 W 34th St',
  dist = '0.8 mi',
}: LibLocationMapProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 98, background: 'linear-gradient(135deg, #EDEAE0 0%, #DDD8C8 100%)', position: 'relative', flexShrink: 0 }}>
        <svg width="100%" height="100%" viewBox="0 0 98 88" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
          <path d="M0 44 Q 28 34, 50 50 T 98 42" stroke="#C9C3B3" strokeWidth="1.5" fill="none" />
          <path d="M0 22 Q 33 30, 60 20 T 98 28" stroke="#D6D0BF" strokeWidth="1" fill="none" />
          <path d="M0 66 Q 40 60, 65 72 T 98 64" stroke="#D6D0BF" strokeWidth="1" fill="none" />
          <rect x="10" y="8" width="15" height="13" fill="#E0DAC8" opacity="0.6" rx="1" />
          <rect x="72" y="10" width="15" height="20" fill="#E0DAC8" opacity="0.6" rx="1" />
          <rect x="62" y="56" width="20" height="16" fill="#E0DAC8" opacity="0.6" rx="1" />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(78,63,255,0.45)' }}>
            <div style={{ transform: 'rotate(45deg)', width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 14px', flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{name}</div>
        <div style={{ fontSize: 11, color: C.t3, fontFamily: F, marginBottom: 9 }}>{address} &middot; {dist}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, padding: '5px 10px', borderRadius: 6, background: C.ink, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: F, textAlign: 'center' }}>Directions</div>
          <div style={{ flex: 1, padding: '5px 10px', borderRadius: 6, background: '#fff', border: `1px solid ${C.border}`, color: C.ink, fontSize: 11, fontWeight: 700, fontFamily: F, textAlign: 'center' }}>Call</div>
        </div>
      </div>
    </div>
  );
}
