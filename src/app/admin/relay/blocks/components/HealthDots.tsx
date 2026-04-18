'use client';

import React from 'react';

// Three-dot Health indicator per M08 spec:
//   dot 1 — Flow reference (is this block referenced by the active flow?)
//   dot 2 — Module connection (does the block bind a module?)
//   dot 3 — Fields (all required fields bound and non-empty?)
//
// Status derivation is done upstream in BookingPipeline from the
// EngineHealthDoc's aggregate arrays + each block's static `module`
// metadata. This component is a pure presentation concern.

export type DotStatus = 'ok' | 'partial' | 'missing' | 'na';

export interface BlockDotSummary {
  flow: DotStatus;
  module: DotStatus;
  fields: DotStatus;
}

const DOT_COLORS: Record<DotStatus, string> = {
  ok: '#2d6a4f',
  partial: '#b45309',
  missing: '#b91c1c',
  na: '#d4d0c8',
};

interface Props {
  summary?: BlockDotSummary | null;
  /** When no partner is selected, dots are suppressed (spec: catalog view). */
  hidden?: boolean;
}

export function HealthDots({ summary, hidden }: Props) {
  if (hidden || !summary) return null;

  const dot = (status: DotStatus, title: string, key: string) => (
    <span
      key={key}
      title={`${title}: ${status}`}
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: DOT_COLORS[status],
        display: 'inline-block',
      }}
    />
  );

  return (
    <div
      aria-label="Block health"
      role="group"
      style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}
    >
      {dot(summary.flow, 'Flow reference', 'f')}
      {dot(summary.module, 'Module connection', 'm')}
      {dot(summary.fields, 'Required fields', 'x')}
    </div>
  );
}
