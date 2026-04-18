'use client';

import React, { useState } from 'react';
import type { EngineHealthDoc, FixProposal } from '@/lib/relay/health';
import type { Engine } from '@/lib/relay/engine-types';
import { FixProposalCard } from './FixProposalCard';

interface SectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  startOpen?: boolean;
}

function Section({ title, count, children, startOpen }: SectionProps) {
  const [open, setOpen] = useState(!!startOpen);
  const hasItems = count > 0;

  return (
    <section
      style={{
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: hasItems ? 'rgba(185,28,28,0.04)' : '#f7f3ec',
          border: 'none',
          borderBottom: open ? '1px solid #e8e4dc' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#7a7a70' }}>{open ? '▾' : '▸'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a18' }}>{title}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 3,
              background: hasItems ? '#b91c1c' : '#d4d0c8',
              color: '#ffffff',
            }}
          >
            {count}
          </span>
        </div>
      </button>
      {open && <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    </section>
  );
}

interface Props {
  partnerId: string;
  engine: Engine;
  health: EngineHealthDoc;
  onFixApplied: () => void;
}

export function IssueDrillDown({ partnerId, engine, health, onFixApplied }: Props) {
  // Group fix proposals by kind for cleaner drill-down.
  const bindFieldProposals = health.fixProposals.filter((p) => p.kind === 'bind-field');
  const enableProposals    = health.fixProposals.filter((p) => p.kind === 'enable-block');
  const connectProposals   = health.fixProposals.filter((p) => p.kind === 'connect-flow');
  const populateProposals  = health.fixProposals.filter((p) => p.kind === 'populate-module');

  const missingStages = health.stages.filter((s) => s.status === 'red');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Section title="Missing stages" count={missingStages.length} startOpen={missingStages.length > 0}>
        {missingStages.length === 0 ? (
          <EmptyNote label="All canonical stages have at least one renderable block." />
        ) : (
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#3d3d38', lineHeight: 1.6 }}>
            {missingStages.map((s) => (
              <li key={s.stageId}>
                <strong>{s.stageId}</strong> — 0 renderable blocks{s.blockCount === 0 ? ' (no blocks assigned)' : ` of ${s.blockCount}`}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Orphan blocks" count={health.orphanBlocks.length} startOpen={health.orphanBlocks.length > 0}>
        {health.orphanBlocks.length === 0 ? (
          <EmptyNote label="No enabled blocks without flow references." />
        ) : (
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#3d3d38', lineHeight: 1.6 }}>
            {health.orphanBlocks.map((o) => (
              <li key={o.blockId}>
                <code style={{ fontFamily: 'ui-monospace, monospace' }}>{o.blockId}</code> — {o.reason}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Orphan flow targets" count={health.orphanFlowTargets.length} startOpen={health.orphanFlowTargets.length > 0}>
        {health.orphanFlowTargets.length === 0 ? (
          <EmptyNote label="All flow-referenced blocks exist in the partner's engine-scoped catalog." />
        ) : (
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#3d3d38', lineHeight: 1.6 }}>
            {health.orphanFlowTargets.map((o, i) => (
              <li key={`${o.flowId}-${o.stageId}-${o.blockId}-${i}`}>
                Flow <strong>{o.flowId}</strong> stage <strong>{o.stageId}</strong> references missing block <code>{o.blockId}</code>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Unresolved bindings"
        count={health.unresolvedBindings.length + bindFieldProposals.length}
        startOpen={health.unresolvedBindings.length > 0 || bindFieldProposals.length > 0}
      >
        {health.unresolvedBindings.length === 0 && bindFieldProposals.length === 0 ? (
          <EmptyNote label="No required fields missing bindings." />
        ) : (
          <>
            {health.unresolvedBindings.length > 0 && (
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#3d3d38', lineHeight: 1.6 }}>
                {health.unresolvedBindings.map((u, i) => (
                  <li key={`${u.blockId}-${u.field}-${i}`}>
                    <code>{u.blockId}</code> field <strong>{u.field}</strong> — {u.reason}
                  </li>
                ))}
              </ul>
            )}
            {bindFieldProposals.map((p) => (
              <FixProposalCard
                key={proposalKey(p)}
                partnerId={partnerId}
                engine={engine}
                proposal={p}
                onApplied={onFixApplied}
              />
            ))}
          </>
        )}
      </Section>

      <Section
        title="Empty modules"
        count={health.emptyModules.length + populateProposals.length}
        startOpen={health.emptyModules.length > 0}
      >
        {health.emptyModules.length === 0 && populateProposals.length === 0 ? (
          <EmptyNote label="All connected modules have items." />
        ) : (
          <>
            {health.emptyModules.length > 0 && (
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: '#3d3d38', lineHeight: 1.6 }}>
                {health.emptyModules.map((m) => (
                  <li key={m}>
                    <strong>{m}</strong> — no items. Seed via /admin/modules or M15 seed templates (coming).
                  </li>
                ))}
              </ul>
            )}
            {populateProposals.map((p) => (
              <FixProposalCard
                key={proposalKey(p)}
                partnerId={partnerId}
                engine={engine}
                proposal={p}
                onApplied={onFixApplied}
              />
            ))}
          </>
        )}
      </Section>

      {(enableProposals.length > 0 || connectProposals.length > 0) && (
        <Section
          title="Other fix proposals"
          count={enableProposals.length + connectProposals.length}
        >
          {enableProposals.map((p) => (
            <FixProposalCard
              key={proposalKey(p)}
              partnerId={partnerId}
              engine={engine}
              proposal={p}
              onApplied={onFixApplied}
            />
          ))}
          {connectProposals.map((p) => (
            <FixProposalCard
              key={proposalKey(p)}
              partnerId={partnerId}
              engine={engine}
              proposal={p}
              onApplied={onFixApplied}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function EmptyNote({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, color: '#7a7a70', fontStyle: 'italic' }}>{label}</div>
  );
}

function proposalKey(p: FixProposal): string {
  return `${p.kind}:${p.blockId ?? ''}:${p.field ?? ''}:${p.moduleSlug ?? ''}`;
}
