'use client';

import React from 'react';
import type { EngineHealthDoc, HealthStatus } from '@/lib/relay/health';
import type { Engine } from '@/lib/relay/engine-types';
import { ENGINES } from '@/lib/relay/engine-types';

const STATUS_COLORS: Record<HealthStatus, { bg: string; fg: string; dot: string }> = {
  green: { bg: 'rgba(45,106,79,0.08)', fg: '#2d6a4f', dot: '#2d6a4f' },
  amber: { bg: 'rgba(180,83,9,0.08)', fg: '#b45309', dot: '#b45309' },
  red:   { bg: 'rgba(185,28,28,0.08)', fg: '#b91c1c', dot: '#b91c1c' },
};

interface Props {
  partnerEngines: readonly Engine[];
  healthByEngine: Partial<Record<Engine, EngineHealthDoc | null>>;
  selectedEngine: Engine | null;
  onSelectEngine: (engine: Engine) => void;
}

function engineIssueCount(doc: EngineHealthDoc | null | undefined): number {
  if (!doc) return 0;
  const redStages = doc.stages.filter((s) => s.status === 'red').length;
  return (
    redStages +
    doc.orphanBlocks.length +
    doc.orphanFlowTargets.length +
    doc.unresolvedBindings.length +
    doc.emptyModules.length
  );
}

function engineFixableCount(doc: EngineHealthDoc | null | undefined): number {
  return doc?.fixProposals.length ?? 0;
}

export function HealthMatrix({
  partnerEngines,
  healthByEngine,
  selectedEngine,
  onSelectEngine,
}: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 100px 120px 120px 1fr',
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <HeaderCell label="Engine" />
      <HeaderCell label="Status" />
      <HeaderCell label="Issues" />
      <HeaderCell label="Fixable" />
      <HeaderCell label="Summary" />

      {ENGINES.map((engine) => {
        const hasEngine = partnerEngines.includes(engine);
        const doc = healthByEngine[engine] ?? null;
        const isSelected = selectedEngine === engine;
        const status = doc?.status ?? null;
        const issues = engineIssueCount(doc);
        const fixable = engineFixableCount(doc);
        const colors = status ? STATUS_COLORS[status] : null;

        return (
          <React.Fragment key={engine}>
            <Cell
              isSelected={isSelected}
              interactive={hasEngine}
              onClick={hasEngine ? () => onSelectEngine(engine) : undefined}
            >
              <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
                {engine}
              </span>
            </Cell>
            <Cell
              isSelected={isSelected}
              interactive={hasEngine}
              onClick={hasEngine ? () => onSelectEngine(engine) : undefined}
            >
              {hasEngine ? (
                status ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors!.fg,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: colors!.bg,
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: colors!.dot,
                      }}
                    />
                    {status}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#a8a89e', fontStyle: 'italic' }}>
                    pending
                  </span>
                )
              ) : (
                <span style={{ color: '#d4d0c8', fontSize: 14 }}>—</span>
              )}
            </Cell>
            <Cell
              isSelected={isSelected}
              interactive={hasEngine}
              onClick={hasEngine ? () => onSelectEngine(engine) : undefined}
            >
              {hasEngine ? (
                <span style={{ fontSize: 12, color: issues > 0 ? '#b91c1c' : '#7a7a70' }}>
                  {issues}
                </span>
              ) : (
                <span style={{ color: '#d4d0c8' }}>—</span>
              )}
            </Cell>
            <Cell
              isSelected={isSelected}
              interactive={hasEngine}
              onClick={hasEngine ? () => onSelectEngine(engine) : undefined}
            >
              {hasEngine ? (
                <span style={{ fontSize: 12, color: fixable > 0 ? '#1d4ed8' : '#7a7a70' }}>
                  {fixable}
                </span>
              ) : (
                <span style={{ color: '#d4d0c8' }}>—</span>
              )}
            </Cell>
            <Cell
              isSelected={isSelected}
              interactive={hasEngine}
              onClick={hasEngine ? () => onSelectEngine(engine) : undefined}
            >
              <span style={{ fontSize: 11, color: '#7a7a70' }}>
                {!hasEngine
                  ? 'Engine not active for this partner'
                  : !doc
                    ? 'No Health data yet — will compute on next admin save'
                    : `${doc.stages.length} stages · ${doc.emptyModules.length} empty modules · ${doc.unresolvedBindings.length} unresolved`}
              </span>
            </Cell>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: '#f7f3ec',
        borderBottom: '1px solid #e8e4dc',
        fontSize: 10,
        fontWeight: 700,
        color: '#3d3d38',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </div>
  );
}

function Cell({
  children,
  isSelected,
  interactive,
  onClick,
}: {
  children: React.ReactNode;
  isSelected: boolean;
  interactive: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid #f0ece4',
        cursor: interactive ? 'pointer' : 'default',
        background: isSelected ? 'rgba(45,74,62,0.06)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}
