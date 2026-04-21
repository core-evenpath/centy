'use client';
import { C, F, FS, icons } from '../../theme';
import type { LibServiceCardProps } from '../types';

const Ic = ({ d, size = 20, stroke = 'currentColor', sw = 1.8 }: { d: string; size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function LibServiceCard({
  title = 'Teeth Whitening — Pro',
  subtitle = '60 min · in-office · 1 visit',
  price = '$389',
}: LibServiceCardProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentSoft} 0%, #E6E3FF 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <Ic d={icons.sparkles} size={20} stroke={C.accent} sw={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{title}</span>
        </div>
        <div style={{ fontSize: 11.5, color: C.t3, fontFamily: F, lineHeight: 1.35 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 800, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1 }}>{price}</span>
        <div style={{ padding: '6px 12px', borderRadius: 7, background: C.ink, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: F }}>Book</div>
      </div>
    </div>
  );
}
