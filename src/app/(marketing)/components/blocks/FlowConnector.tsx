'use client';
import { C, FM } from '../theme';

export function FlowConnector() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 26, top: 0, bottom: 0, width: 1.5, background: `linear-gradient(180deg, ${C.borderDeep} 0%, ${C.accent}66 50%, ${C.borderDeep} 100%)`, transform: 'translateX(-0.75px)' }} />
      <div style={{ position: 'absolute', left: 26, top: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: '#fff', border: `1.5px solid ${C.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.accent }} />
      </div>
      <div style={{ marginLeft: 48, fontFamily: FM, fontSize: 9.5, fontWeight: 700, color: C.t4, letterSpacing: '0.12em' }}>THEN</div>
    </div>
  );
}
