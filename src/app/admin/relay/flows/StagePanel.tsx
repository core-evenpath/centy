'use client';

import React, { useState, useMemo } from 'react';
import {
  T,
  FLOW_STAGE_STYLES,
  getRegistryBlocksForStage,
} from './flow-builder-types';
import type {
  FlowBuilderStage,
  FlowBuilderTransition,
  RegistryBlockSummary,
} from './flow-builder-types';

// ── Props ────────────────────────────────────────────────────────────

interface StagePanelProps {
  stage: FlowBuilderStage;
  allStages: FlowBuilderStage[];
  transitions: FlowBuilderTransition[];
  onUpdateStage: (updated: FlowBuilderStage) => void;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: T.t4,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 6,
};

const SECTION: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: `1px solid ${T.bdr}`,
};

// ── Component ────────────────────────────────────────────────────────

export default function StagePanel({
  stage,
  allStages,
  transitions,
  onUpdateStage,
  onClose,
}: StagePanelProps) {
  const [intentInput, setIntentInput] = useState('');

  const stageStyle = FLOW_STAGE_STYLES[stage.type] ?? { color: '#f3f3f0', textColor: '#555550' };

  const registryBlocks = useMemo(
    () => getRegistryBlocksForStage(stage.type),
    [stage.type],
  );

  const registryMap = useMemo(() => {
    const m = new Map<string, RegistryBlockSummary>();
    for (const b of registryBlocks) m.set(b.id, b);
    return m;
  }, [registryBlocks]);

  const availableBlocks = useMemo(
    () => registryBlocks.filter(b => !stage.blockIds.includes(b.id)),
    [registryBlocks, stage.blockIds],
  );

  const outgoingTransitions = useMemo(
    () => transitions.filter(tr => tr.from === stage.id),
    [transitions, stage.id],
  );

  function removeBlock(blockId: string) {
    onUpdateStage({ ...stage, blockIds: stage.blockIds.filter(id => id !== blockId) });
  }

  function addBlock(blockId: string) {
    onUpdateStage({ ...stage, blockIds: [...stage.blockIds, blockId] });
  }

  function removeIntent(intent: string) {
    onUpdateStage({ ...stage, intentTriggers: stage.intentTriggers.filter(i => i !== intent) });
  }

  function addIntent() {
    const v = intentInput.trim();
    if (!v || stage.intentTriggers.includes(v)) return;
    onUpdateStage({ ...stage, intentTriggers: [...stage.intentTriggers, v] });
    setIntentInput('');
  }

  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${T.bdr}`, background: T.surface, overflowY: 'auto' }}>

      {/* Section 1 — Header */}
      <div style={{ ...SECTION, padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.t1 }}>{stage.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 14, color: T.t4, cursor: 'pointer' }}>&#10005;</button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <span style={{ fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: stageStyle.color, color: stageStyle.textColor, textTransform: 'uppercase' }}>{stage.type}</span>
          <span style={{ fontSize: 8, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: T.bg, color: T.t3 }}>+{stage.leadScoreImpact} score</span>
          {stage.isEntry && <span style={{ fontSize: 8, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: T.greenBg, color: T.green }}>Entry</span>}
          {stage.isExit && <span style={{ fontSize: 8, fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: T.redBg, color: T.red }}>Exit</span>}
        </div>
      </div>

      {/* Section 2 — Assigned Blocks */}
      <div style={SECTION}>
        <div style={SECTION_TITLE}>Blocks ({stage.blockIds.length})</div>
        {stage.blockIds.length === 0 && <div style={{ fontSize: 10, color: T.t4, fontStyle: 'italic' }}>No blocks assigned</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {stage.blockIds.map(bid => {
            const info = registryMap.get(bid);
            return (
              <div key={bid} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 6px', borderRadius: 5, background: info ? T.bg : T.amberBg }}>
                <span style={{ flex: 1, fontWeight: 500, color: info ? T.t2 : T.amber }}>{info ? info.label : bid}</span>
                {info && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: T.priBg, color: T.pri }}>{info.family}</span>}
                <button onClick={() => removeBlock(bid)} style={{ background: 'none', border: 'none', fontSize: 11, color: T.t4, cursor: 'pointer', padding: '0 2px' }}>&#10005;</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3 — Available Blocks */}
      {availableBlocks.length > 0 && (
        <div style={SECTION}>
          <div style={SECTION_TITLE}>Add Blocks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {availableBlocks.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '3px 6px', borderRadius: 5, background: T.bg }}>
                <span style={{ flex: 1, fontWeight: 500, color: T.t2 }}>{b.label}</span>
                <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: T.priBg, color: T.pri }}>{b.family}</span>
                <button onClick={() => addBlock(b.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: T.green, cursor: 'pointer', padding: '0 2px', fontWeight: 700 }}>+</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4 — Intent Triggers */}
      <div style={SECTION}>
        <div style={SECTION_TITLE}>Intent Triggers ({stage.intentTriggers.length})</div>
        {stage.intentTriggers.length > 0 ? (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 6 }}>
            {stage.intentTriggers.map(i => (
              <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 9999, background: T.priBg, color: T.pri, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {i}
                <button onClick={() => removeIntent(i)} style={{ background: 'none', border: 'none', fontSize: 9, color: T.pri, cursor: 'pointer', padding: 0, lineHeight: 1 }}>&#10005;</button>
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: T.t4, fontStyle: 'italic', marginBottom: 6 }}>No intent triggers</div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            value={intentInput}
            onChange={e => setIntentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addIntent(); }}
            placeholder="Add intent..."
            style={{ flex: 1, fontSize: 10, padding: '4px 8px', borderRadius: 5, border: `1px solid ${T.bdr}`, background: T.surface, color: T.t1, outline: 'none' }}
          />
          <button onClick={addIntent} style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 5, border: 'none', background: T.pri, color: '#fff', cursor: 'pointer' }}>Add</button>
        </div>
      </div>

      {/* Section 5 — Transitions (read-only) */}
      <div style={{ padding: '10px 12px' }}>
        <div style={SECTION_TITLE}>Transitions ({outgoingTransitions.length})</div>
        {outgoingTransitions.length === 0 && <div style={{ fontSize: 10, color: T.t4, fontStyle: 'italic' }}>No outgoing transitions</div>}
        {outgoingTransitions.map((tr, i) => {
          const target = allStages.find(s => s.id === tr.to);
          return (
            <div key={i} style={{ fontSize: 10, color: T.t2, padding: '3px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 9999, background: T.accBg, color: T.acc, fontWeight: 500 }}>{tr.trigger}</span>
              <span style={{ color: T.t4 }}>→</span>
              <span style={{ fontWeight: 500 }}>{target?.name ?? tr.to}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
