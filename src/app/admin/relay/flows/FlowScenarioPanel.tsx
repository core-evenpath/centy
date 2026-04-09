// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { Sparkles, Play, RotateCcw, Loader2, Layers } from 'lucide-react';
import { T } from './flow-helpers';
import type { ScenarioScript } from '@/lib/types-flow-engine';
import type { FlowMessage } from './flow-conversation';
import FlowScenarioCard from './FlowScenarioCard';

interface Props {
  functionId: string;
  subVerticalName: string;
  industryName: string;
  accentColor: string;
  blockCount: number;
  stageCount: number;
  selectedScenarioIdx: number | null;
  onSelectScenario: (idx: number) => void;
  onPlay: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  generating: boolean;
  scenario: ScenarioScript | null;
  messages: FlowMessage[];
}

function deriveStages(msgs: FlowMessage[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of msgs) {
    if (m.type === 'stage-divider' && m.stage && !seen.has(m.stage)) {
      seen.add(m.stage);
      result.push(m.stage);
    }
  }
  return result;
}

function countBlocks(msgs: FlowMessage[]): number {
  return msgs.filter(m => m.blockPreviews && m.blockPreviews.length > 0).length;
}

export default function FlowScenarioPanel({
  functionId, subVerticalName, industryName, accentColor, blockCount, stageCount,
  selectedScenarioIdx, onSelectScenario, onPlay, onReset, onRegenerate,
  generating, scenario, messages,
}: Props) {
  const scenarioCount = 1 + (scenario ? 1 : 0);
  const aiCount = scenario ? 1 : 0;

  const defaultStages = useMemo(() => deriveStages(messages), [messages]);
  const defaultMsgCount = messages.filter(m => m.type !== 'stage-divider').length;
  const defaultBlockCount = countBlocks(messages);

  const aiStages = useMemo(() => scenario ? Object.keys(scenario.stages) : [], [scenario]);

  return (
    <div style={{
      width: 280, borderRight: `1px solid ${T.bdrL}`, background: T.surface,
      display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0,
    }}>
      <div style={{ padding: '14px 14px 12px', borderBottom: functionId ? 'none' : `1px solid ${T.bdrL}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: '#7c3aed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <Sparkles size={12} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Scenarios</div>
            <div style={{ fontSize: 10, color: T.t4 }}>Conversation simulations</div>
          </div>
        </div>
      </div>

      {functionId && (
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${T.bdrL}`, background: T.bg,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{subVerticalName}</div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>
            {industryName} &middot; {blockCount} blocks &middot; {stageCount} stages
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: T.t4 }}>
              <strong style={{ color: T.t2, fontWeight: 600 }}>{scenarioCount}</strong> scenarios
            </span>
            <span style={{ fontSize: 10, color: T.t4 }}>
              <strong style={{ color: T.t2, fontWeight: 600 }}>{aiCount}</strong> AI-generated
            </span>
          </div>
        </div>
      )}

      <div style={{
        flex: 1, overflowY: 'auto', padding: 8,
        display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'none',
      }}>
        {!functionId ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: T.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent,
            }}>
              <Layers size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>Select a sub-vertical</div>
            <div style={{ fontSize: 11, color: T.t3, textAlign: 'center', maxWidth: 200 }}>
              Choose from the sidebar to view and simulate scenarios.
            </div>
          </div>
        ) : (
          <>
            <FlowScenarioCard
              name="Default flow"
              badgeType="manual"
              description={`Standard conversation flow through ${stageCount} stages`}
              stages={defaultStages}
              stageCount={defaultStages.length}
              messageCount={defaultMsgCount}
              blockCount={defaultBlockCount}
              isActive={selectedScenarioIdx === 0}
              accentColor={accentColor}
              onClick={() => onSelectScenario(0)}
            />
            {scenario && (
              <FlowScenarioCard
                name={`${scenario.functionName} AI Script`}
                badgeType="ai"
                description={`AI-generated scenario covering ${aiStages.join(', ')} stages`}
                stages={aiStages}
                stageCount={aiStages.length}
                messageCount={Object.keys(scenario.stages).length * 2}
                blockCount={Object.keys(scenario.stages).length}
                isActive={selectedScenarioIdx === 1}
                accentColor={accentColor}
                onClick={() => onSelectScenario(1)}
              />
            )}
          </>
        )}
      </div>

      {functionId && (
        <div style={{
          padding: '8px 10px', borderTop: `1px solid ${T.bdrL}`,
          display: 'flex', gap: 6,
        }}>
          <button onClick={onPlay} style={{
            flex: 1, padding: 7, borderRadius: 7, border: 'none',
            background: T.accent, color: '#fff', fontSize: 10, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <Play size={10} fill="#fff" /> Play
          </button>
          <button onClick={onReset} style={{
            padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.bdrL}`,
            background: T.surface, cursor: 'pointer', color: T.t2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RotateCcw size={11} />
          </button>
          <button onClick={onRegenerate} disabled={generating} style={{
            flex: 1, padding: 7, borderRadius: 7,
            border: '1px solid rgba(124,58,237,0.15)',
            background: generating ? 'rgba(124,58,237,0.03)' : 'rgba(124,58,237,0.06)',
            color: '#7c3aed', fontSize: 10, fontWeight: 600,
            cursor: generating ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            opacity: generating ? 0.6 : 1,
          }}>
            {generating ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={10} />}
            {generating ? 'Generating...' : scenario ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
