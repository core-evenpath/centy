'use client';
import { useState, useEffect } from 'react';
import { C, F, FM, icons } from '../theme';
import { FlowBlockRow } from './FlowBlockRow';
import { FlowConnector } from './FlowConnector';
import { HOMEPAGE_FLOWS } from './flows';
import type { FlowDefinition } from './types';

const Ic = ({ d, size = 20, stroke = 'currentColor', sw = 1.8 }: { d: string; size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

type BlockLibraryVisualProps = {
  flows?: FlowDefinition[];
  rotateMs?: number;
  label?: string;
};

export function BlockLibraryVisual({ flows = HOMEPAGE_FLOWS, rotateMs = 4200, label = 'LIVE BLOCK FLOWS' }: BlockLibraryVisualProps) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % flows.length), rotateMs);
    return () => clearInterval(t);
  }, [paused, flows.length, rotateMs]);

  // Reset index when flows change (e.g. on subpages)
  useEffect(() => {
    setIdx(0);
  }, [flows]);

  const f = flows[idx];

  return (
    <div style={{ maxWidth: 440, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: paused ? C.t4 : C.accent, animation: paused ? 'none' : 'pulse 1.4s infinite', transition: 'background 0.3s' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: C.t3, letterSpacing: '0.1em', fontFamily: F }}>{label}</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {flows.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Show flow ${i + 1}`}
              style={{ width: i === idx ? 22 : 7, height: 4, borderRadius: 2, background: i === idx ? C.accent : C.borderDeep, transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', border: 'none', padding: 0, cursor: 'pointer' }}
            />
          ))}
        </div>
      </div>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ background: C.surfaceAlt, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, position: 'relative', minHeight: 410, overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,10,10,0.03)' }}
      >
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(78,63,255,0.25)' }}>
            <Ic d={icons.msg} size={12} stroke="#fff" sw={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative', height: 18 }}>
            {flows.map((fl, i) => (
              <div
                key={fl.key}
                style={{
                  position: 'absolute', inset: 0,
                  fontSize: 13.5, color: C.t2, fontFamily: "'Fraunces', 'Karla', serif", fontStyle: 'italic', lineHeight: 1.3, letterSpacing: '-0.01em',
                  opacity: i === idx ? 1 : 0,
                  transform: i === idx ? 'translateY(0)' : i < idx ? 'translateY(-6px)' : 'translateY(6px)',
                  transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                {fl.intent}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', minHeight: 310 }}>
          {flows.map((fl, i) => {
            const TopComponent = fl.top.component;
            const BottomComponent = fl.bottom.component;
            return (
              <div
                key={fl.key}
                style={{
                  position: i === idx ? 'relative' : 'absolute',
                  top: i === idx ? 'auto' : 0,
                  left: i === idx ? 'auto' : 0,
                  right: i === idx ? 'auto' : 0,
                  opacity: i === idx ? 1 : 0,
                  transform: i === idx ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                  pointerEvents: i === idx ? 'auto' : 'none',
                }}
              >
                <FlowBlockRow label={fl.top.label} step={1}>
                  <TopComponent {...(fl.top.props || {})} />
                </FlowBlockRow>
                <FlowConnector />
                <FlowBlockRow label={fl.bottom.label} step={2} outcome={fl.outcome}>
                  <BottomComponent {...(fl.bottom.props || {})} />
                </FlowBlockRow>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(10,10,10,0.04)' }}>
          <div
            key={`${idx}-${paused}`}
            style={{ height: '100%', background: C.accent, width: paused ? '100%' : '0%', animation: paused ? 'none' : `progressBar ${rotateMs}ms linear`, opacity: paused ? 0.3 : 1 }}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', background: '#fff', borderRadius: 11, border: `1px solid ${C.border}` }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ic d={icons.check} size={10} stroke={C.accent} sw={3} />
        </div>
        <span style={{ fontSize: 13, color: C.t2, fontFamily: F, fontWeight: 500, lineHeight: 1.4 }}>AI chains the right blocks for each intent &mdash; <strong style={{ color: C.ink }}>dozens more, built per industry</strong></span>
      </div>
    </div>
  );
}
