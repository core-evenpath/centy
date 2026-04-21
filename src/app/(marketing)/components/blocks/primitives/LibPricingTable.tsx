'use client';
import { C, F, icons } from '../../theme';
import type { LibPricingTableProps } from '../types';

const Ic = ({ d, size = 20, stroke = 'currentColor', sw = 1.8 }: { d: string; size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const DEFAULT_TIERS = [
  { name: 'Whitening Plus', price: '$389', feat: 'Clean + pro whitening', pop: true },
  { name: 'Full Restoration', price: '$1,200+', feat: 'Full smile consult', pop: false },
];

export function LibPricingTable({ tiers = DEFAULT_TIERS }: LibPricingTableProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      {tiers.map((t, i) => (
        <div key={i} style={{ padding: '11px 14px', borderBottom: i < tiers.length - 1 ? `1px solid ${C.borderLight}` : 'none', background: t.pop ? C.accentSoft : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F, letterSpacing: '-0.01em' }}>{t.name}</span>
              {t.pop && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: C.accent, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.04em' }}>POPULAR</span>}
            </div>
            <div style={{ fontSize: 11, color: C.t3, fontFamily: F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.feat}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 800, color: C.ink, letterSpacing: '-0.025em' }}>{t.price}</span>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: t.pop ? C.accent : C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic d={icons.arrow} size={11} stroke="#fff" sw={2.5} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
