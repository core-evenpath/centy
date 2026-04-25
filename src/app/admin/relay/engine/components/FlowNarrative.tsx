'use client';

// ── Flow Narrative (PR fix-13) ──────────────────────────────────────
//
// Top-of-flow card that answers "what happens here?" in plain English.
// The whole framing fix: no admin jargon ("engine-scoped catalog"),
// just a 2-3 sentence story keyed to a verb the user already uses.

import React from 'react';
import type { FlowDefinition } from './flow-definitions';

interface Props {
  flow: FlowDefinition;
  /** How many blocks the catalog has for this flow (shown as a
   *  secondary stat — primary signal is the narrative). */
  catalogSize: number;
}

export function FlowNarrative({ flow, catalogSize }: Props) {
  const required = flow.happyPath.filter((s) => s.required).length;
  const optional = flow.happyPath.length - required;

  return (
    <section
      style={{
        background: flow.accent.bg,
        border: `1px solid ${flow.accent.border}`,
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
          {flow.emoji}
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: flow.accent.text,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {flow.label}
          </h2>
          <p
            style={{
              fontSize: 11,
              color: flow.accent.text,
              opacity: 0.75,
              margin: '2px 0 0',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Transaction flow · engine = {flow.engine}
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            fontSize: 11,
            color: flow.accent.text,
            flexWrap: 'wrap',
          }}
        >
          <Stat label="Required" value={required} accent={flow.accent} />
          <Stat label="Optional" value={optional} accent={flow.accent} />
          <Stat label="In catalog" value={catalogSize} accent={flow.accent} />
        </div>
      </div>
      <p
        style={{
          fontSize: 14,
          color: '#1a1a18',
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 760,
        }}
      >
        {flow.narrative}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: FlowDefinition['accent'];
}) {
  return (
    <span
      style={{
        background: '#ffffff',
        border: `1px solid ${accent.border}`,
        borderRadius: 6,
        padding: '4px 8px',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        fontWeight: 600,
        color: accent.text,
      }}
    >
      <span>{value}</span>
      <span style={{ opacity: 0.75, fontWeight: 500, fontSize: 10 }}>{label}</span>
    </span>
  );
}
