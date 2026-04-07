'use client';

import { useState, useMemo } from 'react';
import FlowSidebar from './FlowSidebar';
import FlowDiagram from './FlowDiagram';
import { buildFlowSync, getBlockMap, T, VERTICALS } from './flow-helpers';
import { Layers } from 'lucide-react';

export default function RelayFlowMockup() {
  const [selectedId, setSelectedId] = useState('');

  const flow = useMemo(() => (selectedId ? buildFlowSync(selectedId) : null), [selectedId]);
  const blockMap = useMemo(() => (selectedId ? getBlockMap(selectedId) : new Map()), [selectedId]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <FlowSidebar selectedId={selectedId} onSelect={setSelectedId} />

      {flow ? (
        <FlowDiagram flow={flow} blockMap={blockMap} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: T.accent }}>
              <Layers size={24} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 6 }}>Select a Sub-Vertical</div>
            <div style={{ fontSize: 13, color: T.t3, lineHeight: 1.6 }}>
              Choose a sub-vertical from the sidebar to view its conversation flow.
              Each flow shows how customers move through stages — from greeting to conversion — with the blocks rendered at each step.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20 }}>
              {[
                { label: 'Verticals', value: VERTICALS.length },
                { label: 'Sub-verticals', value: VERTICALS.reduce((n, v) => n + v.subVerticals.length, 0) },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.accent }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: T.t4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
