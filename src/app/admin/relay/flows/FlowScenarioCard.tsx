'use client';

import { T } from './flow-helpers';
import { FLOW_STAGE_STYLES } from '../blocks/previews/_types';
import type { FlowScenario } from '@/lib/types-flow-scenarios';

interface Props {
  scenario: FlowScenario;
  isSelected: boolean;
  onSelect: () => void;
  accentColor: string;
  stageBlockCounts: Record<string, number>;
}

export default function FlowScenarioCard({ scenario, isSelected, onSelect, accentColor, stageBlockCounts }: Props) {
  const sc = scenario;
  const isAI = !!sc.modelUsed;
  const stages = sc.activeStages || [];
  const msgCount = stages.reduce((n, s) => n + (s === 'greeting' ? 1 : 2), 0);
  const blockCount = stages.reduce((n, s) => n + (stageBlockCounts[s] || 0), 0);

  return (
    <button onClick={onSelect} style={{
      width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
      padding: '14px 16px', border: `1.5px solid ${isSelected ? accentColor : T.bdrL}`,
      borderRadius: 12, textAlign: 'left', cursor: 'pointer', marginBottom: 8,
      background: isSelected ? `${accentColor}06` : T.surface,
    }}>
      {/* Name + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.t1, lineHeight: 1.3 }}>{sc.name}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: isAI ? '#7c3aed' : T.t4, letterSpacing: 0.5,
          background: isAI ? '#f3f0ff' : T.bg, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
        }}>{isAI ? 'AI' : 'MANUAL'}</span>
      </div>

      {/* Description */}
      <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>{sc.description}</div>

      {/* Stage flow pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {stages.map((stage, i) => {
          const style = FLOW_STAGE_STYLES[stage] || { color: T.bg, textColor: T.t3 };
          return (
            <span key={stage} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, color: style.textColor,
                background: style.color, padding: '2px 8px', borderRadius: 4,
              }}>{stage}</span>
              {i < stages.length - 1 && <span style={{ fontSize: 10, color: T.t4 }}>&rarr;</span>}
            </span>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ fontSize: 10, color: T.t4, display: 'flex', gap: 12 }}>
        <span>{stages.length} stages</span>
        <span>{msgCount} messages</span>
        <span>{blockCount} blocks</span>
      </div>
    </button>
  );
}
