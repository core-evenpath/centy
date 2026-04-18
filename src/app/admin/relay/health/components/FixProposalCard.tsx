'use client';

import React, { useState } from 'react';
import type { FixProposal } from '@/lib/relay/health';
import type { Engine } from '@/lib/relay/engine-types';
import { applyFixProposal } from '@/actions/relay-health-actions';

const KIND_LABEL: Record<FixProposal['kind'], { label: string; emoji: string }> = {
  'bind-field':      { label: 'Bind field',      emoji: '🔗' },
  'enable-block':    { label: 'Enable block',    emoji: '✅' },
  'connect-flow':    { label: 'Connect to flow', emoji: '🧭' },
  'populate-module': { label: 'Add items',       emoji: '📦' },
};

const CONFIDENCE_COLORS: Record<FixProposal['confidence'], { bg: string; fg: string }> = {
  high:   { bg: 'rgba(45,106,79,0.08)',  fg: '#2d6a4f' },
  medium: { bg: 'rgba(180,83,9,0.08)',   fg: '#b45309' },
  low:    { bg: 'rgba(122,122,112,0.12)', fg: '#7a7a70' },
};

interface Props {
  partnerId: string;
  engine: Engine;
  proposal: FixProposal;
  onApplied?: () => void;
}

type ApplyState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string; hint?: string };

export function FixProposalCard({ partnerId, engine, proposal, onApplied }: Props) {
  const [state, setState] = useState<ApplyState>({ kind: 'idle' });
  const meta = KIND_LABEL[proposal.kind];
  const conf = CONFIDENCE_COLORS[proposal.confidence];

  async function onApply() {
    setState({ kind: 'pending' });
    try {
      const result = await applyFixProposal(partnerId, engine, proposal);
      if (result.ok) {
        setState({ kind: 'ok' });
        onApplied?.();
      } else {
        setState({
          kind: 'error',
          message: result.error ?? 'Unknown error',
          hint: result.hint,
        });
      }
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return (
    <div
      style={{
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        padding: '10px 12px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden>{meta.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a18' }}>{meta.label}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                background: conf.bg,
                color: conf.fg,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              {proposal.confidence}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#3d3d38', lineHeight: 1.5 }}>{proposal.reason}</div>
          {proposal.blockId && (
            <div style={{ fontSize: 9, color: '#7a7a70', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>
              block: {proposal.blockId}
              {proposal.field ? ` · field: ${proposal.field}` : ''}
              {proposal.moduleSlug ? ` · module: ${proposal.moduleSlug}` : ''}
              {proposal.sourceField ? ` → ${proposal.sourceField}` : ''}
            </div>
          )}
        </div>
        <button
          onClick={onApply}
          disabled={state.kind === 'pending' || state.kind === 'ok'}
          style={{
            padding: '6px 12px',
            background: state.kind === 'ok' ? '#2d6a4f' : '#2d4a3e',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: state.kind === 'pending' || state.kind === 'ok' ? 'default' : 'pointer',
            opacity: state.kind === 'pending' ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {state.kind === 'pending'
            ? 'Applying…'
            : state.kind === 'ok'
              ? '✓ Applied'
              : 'Apply fix'}
        </button>
      </div>
      {state.kind === 'error' && (
        <div
          style={{
            fontSize: 11,
            padding: '8px 10px',
            background: 'rgba(185,28,28,0.05)',
            color: '#b91c1c',
            border: '1px solid rgba(185,28,28,0.2)',
            borderRadius: 6,
          }}
        >
          <strong>Apply failed:</strong> {state.message}
        </div>
      )}
    </div>
  );
}
