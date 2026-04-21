'use client';
import { C, F, FM } from '../../theme';
import type { LibQuoteBuilderProps } from '../types';

export function LibQuoteBuilder({
  sku = 'SKU BBV-075',
  skuSub = "Brass valve, 3/4\u2033",
  qty = 500,
  discount = '\u2212$280',
  total = '$1,320',
}: LibQuoteBuilderProps) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: C.surfaceAlt, borderRadius: 7, marginBottom: 9 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, fontFamily: F, letterSpacing: '-0.01em' }}>{sku}</div>
          <div style={{ fontSize: 11, color: C.t3, fontFamily: F, marginTop: 1 }}>{skuSub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 6, padding: '3px 6px', border: `1px solid ${C.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t3, fontFamily: F, width: 14, textAlign: 'center', lineHeight: 1 }}>&minus;</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F, minWidth: 30, textAlign: 'center' }}>{qty}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F, width: 14, textAlign: 'center', lineHeight: 1 }}>+</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10.5, color: C.t3, fontFamily: F }}>Volume discount applied</span>
          <span style={{ fontFamily: FM, fontSize: 11.5, color: C.accent, fontWeight: 700 }}>{discount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: C.t3, fontFamily: F }}>Total</span>
          <span style={{ fontFamily: F, fontSize: 18, fontWeight: 800, color: C.accent, letterSpacing: '-0.025em', lineHeight: 1 }}>{total}</span>
        </div>
      </div>
    </div>
  );
}
