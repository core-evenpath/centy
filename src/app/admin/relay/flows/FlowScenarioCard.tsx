// @ts-nocheck
'use client';

import { T } from './flow-helpers';
import { FLOW_STAGE_STYLES } from '../blocks/previews/_types';

interface ScenarioCardProps {
  name: string;
  badgeType: 'ai' | 'manual';
  description: string;
  stages: string[];
  stageCount: number;
  messageCount: number;
  blockCount: number;
  isActive: boolean;
  accentColor: string;
  onClick: () => void;
}

export default function FlowScenarioCard({
  name, badgeType, description, stages, stageCount, messageCount, blockCount,
  isActive, accentColor, onClick,
}: ScenarioCardProps) {
  const badgeAI = badgeType === 'ai';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        border: `1px solid ${isActive ? accentColor : T.bdrL}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        background: isActive ? `rgba(194,65,12,0.04)` : T.surface,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'all 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, lineHeight: 1.3 }}>{name}</div>
        <span style={{
          fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          whiteSpace: 'nowrap', flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.3,
          background: badgeAI ? 'rgba(124,58,237,0.08)' : T.bg,
          color: badgeAI ? '#7c3aed' : T.t3,
        }}>
          {badgeAI ? 'AI' : 'manual'}
        </span>
      </div>

      <div style={{ fontSize: 10, color: T.t3, marginTop: 3, lineHeight: 1.4 }}>{description}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 7, flexWrap: 'wrap' }}>
        {stages.map((stage, i) => {
          const style = FLOW_STAGE_STYLES[stage] || { color: T.accentBg, textColor: T.accent };
          return (
            <span key={`${stage}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
              <span style={{
                fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                whiteSpace: 'nowrap', background: style.color, color: style.textColor,
              }}>
                {stage}
              </span>
              {i < stages.length - 1 && (
                <span style={{ fontSize: 8, color: T.bdrM, margin: '0 2px' }}>{'\u2192'}</span>
              )}
            </span>
          );
        })}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 7,
        paddingTop: 7, borderTop: `1px solid #f5f3f0`,
      }}>
        <span style={{ fontSize: 9, color: T.t4 }}><strong style={{ fontWeight: 600, color: T.t3 }}>{stageCount}</strong> stages</span>
        <span style={{ fontSize: 9, color: T.t4 }}><strong style={{ fontWeight: 600, color: T.t3 }}>{messageCount}</strong> messages</span>
        <span style={{ fontSize: 9, color: T.t4 }}><strong style={{ fontWeight: 600, color: T.t3 }}>{blockCount}</strong> blocks</span>
      </div>
    </button>
  );
}
