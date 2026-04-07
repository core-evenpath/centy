'use client';

import { useState } from 'react';
import { FLOW_STAGE_STYLES } from '../blocks/previews/_types';
import { CURATED_IDS, T } from './flow-helpers';
import type { SystemFlowTemplate, FlowStage, FlowTransition } from '@/lib/types-flow-engine';
import type { VerticalBlockDef } from '../blocks/previews/_types';
import { ArrowRight, Zap, Target, Settings2 } from 'lucide-react';

interface Props {
  flow: SystemFlowTemplate;
  blockMap: Map<string, VerticalBlockDef>;
}

function StageCard({ stage, blockMap, onBlockClick }: { stage: FlowStage; blockMap: Map<string, VerticalBlockDef>; onBlockClick: (b: VerticalBlockDef) => void }) {
  const style = FLOW_STAGE_STYLES[stage.type] || { color: '#f3f4f6', textColor: '#374151' };
  return (
    <div style={{ minWidth: 180, maxWidth: 220, background: style.color, borderRadius: 10, padding: 12, border: `1.5px solid ${style.textColor}22`, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: style.textColor }}>{stage.label}</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: style.textColor, background: `${style.textColor}18`, padding: '2px 6px', borderRadius: 4 }}>{stage.type}</span>
      </div>
      {(stage.isEntry || stage.isExit) && (
        <div style={{ fontSize: 9, fontWeight: 700, color: stage.isEntry ? T.green : '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          {stage.isEntry ? 'Entry' : 'Exit'}
        </div>
      )}
      {/* Blocks */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
        {stage.blockTypes.map(bId => {
          const block = blockMap.get(bId);
          return (
            <button
              key={bId}
              onClick={() => block && onBlockClick(block)}
              style={{ fontSize: 10, color: style.textColor, background: '#ffffff88', padding: '2px 7px', borderRadius: 4, border: 'none', cursor: block ? 'pointer' : 'default', fontWeight: 500 }}
              title={block ? block.desc : bId}
            >
              {block ? block.label : bId}
            </button>
          );
        })}
      </div>
      {/* Intents */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
        {stage.intentTriggers.map(intent => (
          <span key={intent} style={{ fontSize: 9, color: '#fff', background: `${style.textColor}99`, padding: '1px 5px', borderRadius: 3 }}>
            {intent}
          </span>
        ))}
      </div>
      {/* Lead score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Target size={10} color={style.textColor} />
        <span style={{ fontSize: 9, color: style.textColor, fontWeight: 600 }}>+{stage.leadScoreImpact} lead score</span>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, padding: '0 2px' }}>
      <ArrowRight size={16} color={T.t4} />
    </div>
  );
}

function TransitionTable({ transitions, stages }: { transitions: FlowTransition[]; stages: FlowStage[] }) {
  const stageMap = new Map(stages.map(s => [s.id, s]));
  return (
    <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Zap size={13} color={T.accent} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Transitions ({transitions.length})</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['From', 'To', 'Trigger', 'Priority'].map(h => (
                <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 600, color: T.t3, borderBottom: `1px solid ${T.bdr}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transitions.map((tr, i) => {
              const from = stageMap.get(tr.from);
              const to = stageMap.get(tr.to);
              const fromStyle = from ? FLOW_STAGE_STYLES[from.type] : null;
              const toStyle = to ? FLOW_STAGE_STYLES[to.type] : null;
              return (
                <tr key={i} style={{ background: tr.priority ? 'rgba(79,70,229,0.03)' : 'transparent' }}>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${T.bdr}` }}>
                    <span style={{ background: fromStyle?.color || T.bg, color: fromStyle?.textColor || T.t2, padding: '1px 8px', borderRadius: 4, fontWeight: 500, fontSize: 10 }}>
                      {from?.label || tr.from}
                    </span>
                  </td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${T.bdr}` }}>
                    <span style={{ background: toStyle?.color || T.bg, color: toStyle?.textColor || T.t2, padding: '1px 8px', borderRadius: 4, fontWeight: 500, fontSize: 10 }}>
                      {to?.label || tr.to}
                    </span>
                  </td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${T.bdr}`, color: T.t2, fontWeight: 500 }}>{tr.trigger}</td>
                  <td style={{ padding: '5px 12px', borderBottom: `1px solid ${T.bdr}` }}>
                    {tr.priority ? <span style={{ fontSize: 10, fontWeight: 600, color: T.accent, background: T.accentBg, padding: '1px 6px', borderRadius: 4 }}>P{tr.priority}</span> : <span style={{ color: T.t4 }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsSummary({ flow }: { flow: SystemFlowTemplate }) {
  const s = flow.settings;
  const items = [
    { label: 'Handoff threshold', value: s.handoffThreshold },
    { label: 'Max turns', value: s.maxTurnsBeforeHandoff },
    { label: 'Lead capture', value: s.enableLeadCapture ? `after turn ${s.leadCaptureAfterTurn}` : 'off' },
    { label: 'Fallback', value: s.fallbackBehavior },
    { label: 'Promos', value: s.showPromos ? 'on' : 'off' },
    { label: 'Testimonials', value: s.showTestimonials ? 'on' : 'off' },
  ];
  return (
    <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.bdr}`, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Settings2 size={13} color={T.t3} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>Settings</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map(it => (
          <div key={it.label} style={{ fontSize: 10, color: T.t3 }}>
            <span style={{ fontWeight: 600 }}>{it.label}:</span> <span style={{ color: T.t1 }}>{String(it.value)}</span>
          </div>
        ))}
      </div>
      {s.enableLeadCapture && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
          {s.leadCaptureFields.map(f => (
            <span key={f} style={{ fontSize: 9, color: T.accent, background: T.accentBg, padding: '1px 6px', borderRadius: 4 }}>{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FlowDiagram({ flow, blockMap }: Props) {
  const [selectedBlock, setSelectedBlock] = useState<VerticalBlockDef | null>(null);
  const isCurated = CURATED_IDS.has(flow.functionId);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: T.bg }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: T.t1 }}>{flow.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: isCurated ? T.green : T.t4, background: isCurated ? T.greenBg : T.bg, padding: '2px 8px', borderRadius: 4, border: `1px solid ${T.bdr}` }}>
            {isCurated ? 'Curated' : 'Auto-generated'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: T.t3, marginBottom: 4 }}>{flow.industryName} &middot; {flow.functionName}</div>
        <div style={{ fontSize: 12, color: T.t2, lineHeight: 1.5 }}>{flow.description}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {[
            { label: 'Stages', value: flow.stages.length },
            { label: 'Transitions', value: flow.transitions.length },
            { label: 'Block types', value: flow.stages.reduce((n, s) => n + s.blockTypes.length, 0) },
          ].map(s => (
            <div key={s.label} style={{ fontSize: 11, color: T.t3 }}>
              <span style={{ fontWeight: 700, color: T.accent, fontSize: 16, marginRight: 4 }}>{s.value}</span>{s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Stage diagram */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
        {flow.stages.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
            <StageCard stage={stage} blockMap={blockMap} onBlockClick={setSelectedBlock} />
            {i < flow.stages.length - 1 && <Arrow />}
          </div>
        ))}
      </div>

      {/* Block detail popover */}
      {selectedBlock && (
        <div style={{ background: T.surface, border: `1px solid ${T.accent}44`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{selectedBlock.label}</span>
            <button onClick={() => setSelectedBlock(null)} style={{ fontSize: 11, color: T.t4, background: 'none', border: 'none', cursor: 'pointer' }}>close</button>
          </div>
          <div style={{ fontSize: 11, color: T.t2, lineHeight: 1.5, marginBottom: 6 }}>{selectedBlock.desc}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10 }}>
            <span style={{ color: T.t3 }}>Family: <strong style={{ color: T.t1 }}>{selectedBlock.family}</strong></span>
            <span style={{ color: T.t3 }}>Stage: <strong style={{ color: T.t1 }}>{selectedBlock.stage}</strong></span>
            <span style={{ color: T.t3 }}>Module: <strong style={{ color: T.t1 }}>{selectedBlock.module || 'none'}</strong></span>
            <span style={{ color: T.t3 }}>Status: <strong style={{ color: selectedBlock.status === 'active' ? T.green : T.accent }}>{selectedBlock.status}</strong></span>
          </div>
          {selectedBlock.intents.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {selectedBlock.intents.map(intent => (
                <span key={intent} style={{ fontSize: 9, color: T.accent, background: T.accentBg, padding: '1px 6px', borderRadius: 3 }}>{intent}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transition table */}
      <div style={{ marginBottom: 16 }}>
        <TransitionTable transitions={flow.transitions} stages={flow.stages} />
      </div>

      {/* Settings */}
      <SettingsSummary flow={flow} />
    </div>
  );
}
