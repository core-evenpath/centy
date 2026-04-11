'use client';

import { useMemo } from 'react';
import { T } from './flow-helpers';
import { getSubVertical, getBlocksForFunction } from '../blocks/previews/registry';
import FlowScenarioCard from './FlowScenarioCard';
import { Diamond, Sparkles, Loader2 } from 'lucide-react';
import type { FlowScenario } from '@/lib/types-flow-scenarios';

interface Props {
  functionId: string;
  scenarios: FlowScenario[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  onRegenerate: () => void;
  generating: boolean;
  error: string | null;
  accentColor: string;
}

export default function FlowScenarioPicker({ functionId, scenarios, selectedIdx, onSelect, onRegenerate, generating, error, accentColor }: Props) {
  const info = useMemo(() => getSubVertical(functionId), [functionId]);
  const blocks = useMemo(() => getBlocksForFunction(functionId), [functionId]);

  const stageBlockCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of blocks) m[b.stage] = (m[b.stage] || 0) + 1;
    return m;
  }, [blocks]);

  const totalStages = Object.keys(stageBlockCounts).length;
  const aiCount = scenarios.filter(s => !!s.modelUsed).length;

  return (
    <div style={{ width: 300, borderRight: `1px solid ${T.bdrL}`, background: T.bg, display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${T.bdrL}`, background: T.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Diamond size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>Scenarios</div>
            <div style={{ fontSize: 11, color: T.t3 }}>Conversation simulations</div>
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>{info?.subVertical.name}</div>
        <div style={{ fontSize: 11, color: T.t3, marginTop: 2 }}>
          {info?.vertical.name} &middot; {blocks.length} blocks &middot; {totalStages} stages
        </div>
        {scenarios.length > 0 && (
          <div style={{ fontSize: 11, color: T.t2, marginTop: 6, fontWeight: 600 }}>
            {scenarios.length} scenarios{aiCount > 0 && <span style={{ fontWeight: 400, color: T.t3 }}> &nbsp;{aiCount} AI-generated</span>}
          </div>
        )}
      </div>

      {/* Scenario list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, scrollbarWidth: 'none' }}>
        {scenarios.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <Sparkles size={24} color={T.t4} style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.t2, marginBottom: 6 }}>No scenarios yet</div>
            <div style={{ fontSize: 11, color: T.t4, lineHeight: 1.6 }}>
              Generate 10 AI-powered customer journey scenarios for this sub-vertical
            </div>
          </div>
        ) : (
          scenarios.map((sc, i) => (
            <FlowScenarioCard key={sc.id} scenario={sc} isSelected={i === selectedIdx}
              onSelect={() => onSelect(i)} accentColor={accentColor} stageBlockCounts={stageBlockCounts} />
          ))
        )}
      </div>

      {/* Generate button + error */}
      <div style={{ padding: 12, borderTop: `1px solid ${T.bdrL}`, background: T.surface }}>
        {error && (
          <div style={{ fontSize: 10, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: 6, marginBottom: 8, lineHeight: 1.4 }}>
            {error}
          </div>
        )}
        <button onClick={onRegenerate} disabled={generating} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: 10, borderRadius: 8, border: 'none', cursor: generating ? 'wait' : 'pointer',
          background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 600, opacity: generating ? 0.7 : 1,
        }}>
          {generating ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
          {generating ? 'Generating...' : scenarios.length > 0 ? 'Regenerate Scenarios' : 'Generate 10 AI Scenarios'}
        </button>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
