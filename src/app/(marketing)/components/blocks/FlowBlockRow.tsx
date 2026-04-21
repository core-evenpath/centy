'use client';
import { C, F, FM, icons } from '../theme';

const Ic = ({ d, size = 20, stroke = 'currentColor', sw = 1.8 }: { d: string; size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function FlowBlockRow({ label, step, outcome, children }: { label: string; step: number; outcome?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, fontFamily: FM, letterSpacing: '-0.02em' }}>{step}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.t2, fontFamily: F, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</span>
        </div>
        {outcome && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 6px', background: C.ink, borderRadius: 100 }}>
            <Ic d={icons.check} size={9} stroke={C.accent} sw={3} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: F, letterSpacing: '0.02em' }}>{outcome}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
