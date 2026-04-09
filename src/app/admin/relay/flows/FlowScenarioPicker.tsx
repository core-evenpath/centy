'use client';

import { T } from './flow-helpers';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { FlowScenario } from '@/lib/types-flow-scenarios';

interface Props {
  scenarios: FlowScenario[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}

export default function FlowScenarioPicker({ scenarios, selectedIdx, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = scenarios[selectedIdx];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!scenarios.length) return null;

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 8 }}>
      {/* Trigger */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.bdrL}`,
        background: T.bg, cursor: 'pointer', textAlign: 'left',
      }}>
        <MessageSquare size={12} color={T.accent} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.t1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current?.name || 'Select scenario'}
          </div>
          <div style={{ fontSize: 9, color: T.t4 }}>
            {scenarios.length} scenarios · {current?.activeStages.length || 0} stages
          </div>
        </div>
        <ChevronDown size={12} color={T.t4} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 4,
          background: T.surface, border: `1px solid ${T.bdrL}`, borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 280, overflowY: 'auto',
          zIndex: 50, scrollbarWidth: 'none',
        }}>
          <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 600, color: T.t4, borderBottom: `1px solid ${T.bdrL}` }}>
            Customer Scenarios ({scenarios.length})
          </div>
          {scenarios.map((sc, i) => (
            <button key={sc.id} onClick={() => { onSelect(i); setOpen(false); }} style={{
              width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
              padding: '8px 10px', border: 'none', textAlign: 'left', cursor: 'pointer',
              background: i === selectedIdx ? T.accentBg : 'transparent',
              borderBottom: i < scenarios.length - 1 ? `1px solid ${T.bdrL}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: i === selectedIdx ? T.accent : T.t1, flex: 1 }}>
                  {sc.name}
                </span>
                <span style={{ fontSize: 9, color: T.t4, flexShrink: 0 }}>{sc.activeStages.length}s</span>
              </div>
              <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.3 }}>{sc.description}</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
                {sc.tags.slice(0, 4).map(tag => (
                  <span key={tag} style={{ fontSize: 8, color: T.t4, background: T.bg, padding: '1px 5px', borderRadius: 3 }}>
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
