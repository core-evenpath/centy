'use client';

import { T } from './flow-helpers';
import { MessageSquare, Sparkles, Loader2, Play } from 'lucide-react';
import type { FlowScenario } from '@/lib/types-flow-scenarios';

interface Props {
  scenarios: FlowScenario[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onRegenerate: () => void;
  generating: boolean;
  subVerticalName: string;
}

export default function FlowScenarioPicker({ scenarios, selectedIdx, onSelect, onRegenerate, generating, subVerticalName }: Props) {
  return (
    <div style={{ width: 260, borderRight: `1px solid ${T.bdrL}`, background: T.surface, display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${T.bdrL}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <MessageSquare size={14} color={T.accent} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Scenarios</div>
          {scenarios.length > 0 && (
            <span style={{ fontSize: 10, color: T.t4, background: T.bg, padding: '1px 6px', borderRadius: 4, marginLeft: 'auto' }}>
              {scenarios.length}
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: T.t3 }}>{subVerticalName}</div>
      </div>

      {/* Scenario list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
        {scenarios.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Sparkles size={20} color={T.t4} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t2, marginBottom: 4 }}>No scenarios yet</div>
            <div style={{ fontSize: 10, color: T.t4, lineHeight: 1.5 }}>
              Generate 10 AI-powered customer journey scenarios for this sub-vertical
            </div>
          </div>
        ) : (
          scenarios.map((sc, i) => (
            <button key={sc.id} onClick={() => onSelect(i)} style={{
              width: '100%', display: 'flex', flexDirection: 'column', gap: 3,
              padding: '10px 14px', border: 'none', textAlign: 'left', cursor: 'pointer',
              background: i === selectedIdx ? T.accentBg : 'transparent',
              borderBottom: `1px solid ${T.bdrL}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.t4, width: 16, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: i === selectedIdx ? T.accent : T.t1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sc.name}
                </span>
                {i === selectedIdx && <Play size={10} color={T.accent} />}
              </div>
              <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.3, marginLeft: 22 }}>{sc.description}</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginLeft: 22, marginTop: 2 }}>
                {sc.tags.slice(0, 3).map(tag => (
                  <span key={tag} style={{ fontSize: 8, color: T.t4, background: T.bg, padding: '1px 5px', borderRadius: 3 }}>
                    {tag}
                  </span>
                ))}
                <span style={{ fontSize: 8, color: T.t4 }}>{sc.activeStages.length} stages</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Generate button */}
      <div style={{ padding: 12, borderTop: `1px solid ${T.bdrL}` }}>
        <button onClick={onRegenerate} disabled={generating} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: 10, borderRadius: 8, border: 'none', cursor: generating ? 'wait' : 'pointer',
          background: T.accent, color: '#fff', fontSize: 12, fontWeight: 600, opacity: generating ? 0.7 : 1,
        }}>
          {generating ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
          {generating ? 'Generating...' : scenarios.length > 0 ? 'Regenerate Scenarios' : 'Generate 10 AI Scenarios'}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
