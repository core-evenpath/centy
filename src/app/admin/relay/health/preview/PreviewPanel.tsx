'use client';

import React, { useMemo, useState } from 'react';
import type { AnyPreviewScript } from '@/lib/relay/preview/scripts-index';
import { SUB_VERTICAL_LABELS } from '@/lib/relay/preview/scripts-index';
import type { PreviewRunResult, PreviewTurnResult } from '@/lib/relay/preview/script-runner';
import { runPreviewScriptAction } from '@/actions/relay-preview-actions';

type PreviewScript = AnyPreviewScript;

interface Props {
  partnerId: string;
  scripts: PreviewScript[];
}

type RunState =
  | { kind: 'idle' }
  | { kind: 'running'; scriptId: string }
  | { kind: 'done'; result: PreviewRunResult }
  | { kind: 'error'; scriptId: string; message: string };

export default function PreviewPanel({ partnerId, scripts }: Props) {
  const [selected, setSelected] = useState<PreviewScript | null>(null);
  const [state, setState] = useState<RunState>({ kind: 'idle' });

  const groups = useMemo(() => {
    const out: Record<string, PreviewScript[]> = {};
    for (const s of scripts) {
      (out[s.subVertical] ??= []).push(s);
    }
    return out;
  }, [scripts]);

  async function runScript(script: PreviewScript) {
    setSelected(script);
    setState({ kind: 'running', scriptId: script.id });
    try {
      const response = await runPreviewScriptAction(partnerId, script.id);
      if (response.ok) {
        setState({ kind: 'done', result: response.result });
      } else {
        setState({ kind: 'error', scriptId: script.id, message: response.error });
      }
    } catch (err) {
      setState({
        kind: 'error',
        scriptId: script.id,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function reRun() {
    if (!selected) return;
    await runScript(selected);
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 16,
        alignItems: 'stretch',
      }}
    >
      <ScriptPicker
        groups={groups}
        selectedId={selected?.id ?? null}
        onSelect={runScript}
        runningId={state.kind === 'running' ? state.scriptId : null}
      />
      <div style={{ minHeight: 400 }}>
        {state.kind === 'idle' && !selected && (
          <EmptyState>Pick a script from the left to run it in sandbox against this partner.</EmptyState>
        )}
        {state.kind === 'running' && (
          <EmptyState>Running {state.scriptId}…</EmptyState>
        )}
        {state.kind === 'error' && (
          <div style={{ padding: 16, background: 'rgba(185,28,28,0.05)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 8, color: '#b91c1c', fontSize: 12 }}>
            <strong>Error running {state.scriptId}:</strong> {state.message}
          </div>
        )}
        {state.kind === 'done' && selected && (
          <RunResultView
            script={selected}
            result={state.result}
            onReRun={reRun}
          />
        )}
      </div>
    </div>
  );
}

// ── Left column: script picker ────────────────────────────────────────

function ScriptPicker({
  groups,
  selectedId,
  onSelect,
  runningId,
}: {
  groups: Record<string, PreviewScript[]>;
  selectedId: string | null;
  onSelect: (script: PreviewScript) => void;
  runningId: string | null;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        padding: 10,
        overflowY: 'auto',
        maxHeight: 540,
      }}
    >
      {Object.keys(groups).map((subVertical) => (
        <div key={subVertical} style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#3d3d38',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 8px',
            }}
          >
            {SUB_VERTICAL_LABELS[subVertical] ?? subVertical}
          </div>
          {groups[subVertical].map((s) => {
            const isSelected = selectedId === s.id;
            const isRunning = runningId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                disabled={isRunning}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  background: isSelected ? 'rgba(45,74,62,0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: isRunning ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: isSelected ? 600 : 500, color: '#1a1a18' }}>
                  {s.label}
                  {isRunning && <span style={{ color: '#7a7a70', marginLeft: 6 }}>… running</span>}
                </span>
                <span style={{ fontSize: 10, color: '#7a7a70' }}>{s.description}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Right column: run result ──────────────────────────────────────────

function RunResultView({
  script,
  result,
  onReRun,
}: {
  script: PreviewScript;
  result: PreviewRunResult;
  onReRun: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          padding: '10px 14px',
          background: '#ffffff',
          border: '1px solid #e8e4dc',
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a18' }}>{script.label}</span>
          <span style={{ fontSize: 10, color: '#7a7a70' }}>
            {result.turns.length} turns · {result.totalElapsedMs}ms · sandbox {result.conversationId}
          </span>
        </div>
        <button
          onClick={onReRun}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            background: '#2d4a3e',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Re-run
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {result.turns.map((t) => (
          <TurnView key={t.turnIndex} turn={t} />
        ))}
      </div>
    </div>
  );
}

function TurnView({ turn }: { turn: PreviewTurnResult }) {
  return (
    <div
      style={{
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        background: turn.error ? 'rgba(185,28,28,0.04)' : '#ffffff',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, color: '#7a7a70', fontWeight: 700 }}>Turn {turn.turnIndex + 1}</span>
        <span style={{ fontSize: 11, color: '#3d3d38' }}>{turn.userMessage}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 9, color: '#7a7a70' }}>
        <span>block: <strong style={{ color: '#1d4ed8' }}>{turn.blockId ?? '—'}</strong></span>
        <span>catalog: {turn.catalogSize}</span>
        <span>path: {turn.compositionPath}</span>
        <span>{turn.elapsedMs}ms</span>
      </div>
      {turn.error ? (
        <div style={{ fontSize: 11, color: '#b91c1c' }}><strong>Error:</strong> {turn.error}</div>
      ) : (
        <div style={{ fontSize: 11, color: '#1a1a18', lineHeight: 1.5, background: '#f7f3ec', padding: '6px 8px', borderRadius: 6 }}>
          {turn.text}
        </div>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#7a7a70', fontSize: 12, background: '#ffffff', border: '1px dashed #d4d0c8', borderRadius: 12 }}>
      {children}
    </div>
  );
}
