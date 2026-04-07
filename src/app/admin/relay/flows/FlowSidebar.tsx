'use client';

import { useState } from 'react';
import { VERTICALS, CURATED_IDS, T } from './flow-helpers';
import { ChevronDown, ChevronRight, Search, Layers } from 'lucide-react';

interface Props {
  selectedId: string;
  onSelect: (functionId: string) => void;
}

export default function FlowSidebar({ selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set([VERTICALS[0]?.id]));
  const q = search.toLowerCase().trim();

  const totalSubs = VERTICALS.reduce((n, v) => n + v.subVerticals.length, 0);

  const toggle = (vId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(vId) ? next.delete(vId) : next.add(vId);
      return next;
    });
  };

  return (
    <div style={{ width: 264, borderRight: `1px solid ${T.bdr}`, background: T.surface, display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${T.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Layers size={14} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>Relay Flows</div>
            <div style={{ fontSize: 10, color: T.t4 }}>{VERTICALS.length} verticals &middot; {totalSubs} sub-verticals &middot; {CURATED_IDS.size} curated</div>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: T.t4 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sub-verticals..."
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, outline: 'none', background: T.bg, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Vertical list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {VERTICALS.map(v => {
          const subs = q
            ? v.subVerticals.filter(s => s.name.toLowerCase().includes(q))
            : v.subVerticals;
          if (q && subs.length === 0) return null;
          const isOpen = expanded.has(v.id) || !!q;

          return (
            <div key={v.id} style={{ marginBottom: 2 }}>
              <button
                onClick={() => toggle(v.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.accentColor, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.t1 }}>{v.name}</span>
                <span style={{ fontSize: 10, color: T.t4, marginRight: 4 }}>{subs.length}</span>
                {isOpen ? <ChevronDown size={13} color={T.t4} /> : <ChevronRight size={13} color={T.t4} />}
              </button>

              {isOpen && subs.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px 6px 34px', border: 'none',
                    background: selectedId === s.id ? T.accentBg : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 11, color: selectedId === s.id ? T.accent : T.t2, fontWeight: selectedId === s.id ? 600 : 400 }}>
                    {s.name}
                  </span>
                  {CURATED_IDS.has(s.id) && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: T.green, background: T.greenBg, padding: '1px 6px', borderRadius: 4 }}>curated</span>
                  )}
                  <span style={{ fontSize: 10, color: T.t4 }}>{s.blocks.length}b</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
