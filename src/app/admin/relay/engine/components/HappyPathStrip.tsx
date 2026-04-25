'use client';

// ── Happy Path Strip (PR fix-13) ────────────────────────────────────
//
// Horizontal flow ribbon showing the canonical block sequence for a
// transaction. Required steps render with a solid border + "Required"
// pill; optional steps render dimmed + dashed. Arrows between tiles
// telegraph the direction of travel.
//
// Replaces the 7-column "canonical stages" grid as the primary view.
// The full catalog is still available below in the "All blocks"
// expandable — this strip is the *minimum* journey, not exhaustive.

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ServerBlockData } from '../../blocks/previews/_registry-data';
import type { FlowStep, FlowDefinition } from './flow-definitions';

interface Props {
  flow: FlowDefinition;
  /** Block lookup keyed by id — caller passes the catalog already
   *  resolved. Lets us render the actual `block.label` and `block.desc`. */
  blockById: Record<string, ServerBlockData>;
  /** Block id of a tile to highlight (e.g. when admin hovers a chat
   *  turn). Optional. */
  highlightedBlockId?: string | null;
  /** Hover handler so the chat example can sync highlights. */
  onHover?: (blockId: string | null) => void;
}

const ROLE_LABELS: Record<FlowStep['role'], string> = {
  entry: 'Entry',
  core: 'Core',
  exit: 'Exit',
};

export function HappyPathStrip({
  flow,
  blockById,
  highlightedBlockId,
  onHover,
}: Props) {
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #e8e4dc',
        borderRadius: 12,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a18' }}>
            Happy path
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7a7a70' }}>
            Minimum sequence of blocks for this flow. Solid = required, dashed = optional.
          </p>
        </div>
        <Legend />
      </header>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {flow.happyPath.map((step, i) => {
          const isLast = i === flow.happyPath.length - 1;
          const block = blockById[step.blockId];
          return (
            <React.Fragment key={`${step.blockId}-${i}`}>
              <Tile
                step={step}
                block={block}
                accent={flow.accent}
                highlighted={highlightedBlockId === step.blockId}
                onHover={onHover}
              />
              {!isLast && <Arrow />}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

function Tile({
  step,
  block,
  accent,
  highlighted,
  onHover,
}: {
  step: FlowStep;
  block: ServerBlockData | undefined;
  accent: FlowDefinition['accent'];
  highlighted: boolean;
  onHover?: (blockId: string | null) => void;
}) {
  const missing = !block;
  const dim = !step.required && !highlighted;
  const ring = highlighted ? `0 0 0 3px ${accent.border}` : 'none';

  return (
    <div
      onMouseEnter={() => onHover?.(step.blockId)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        flex: '0 0 auto',
        width: 200,
        minHeight: 140,
        background: missing ? '#fef2f2' : highlighted ? accent.bg : '#ffffff',
        border: missing
          ? '1px dashed #fca5a5'
          : step.required
          ? `1.5px solid ${highlighted ? accent.text : '#cbd5e1'}`
          : '1.5px dashed #cbd5e1',
        borderRadius: 8,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: dim ? 0.85 : 1,
        boxShadow: ring,
        transition: 'opacity 120ms ease, box-shadow 120ms ease, background 120ms ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: accent.text,
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {ROLE_LABELS[step.role]}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: step.required ? '#fef3c7' : '#f1f5f9',
            color: step.required ? '#92400e' : '#64748b',
          }}
        >
          {step.required ? 'Required' : 'Optional'}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18', lineHeight: 1.25 }}>
        {block?.label ?? step.blockId}
      </div>
      <div style={{ fontSize: 10, color: '#7a7a70', lineHeight: 1.4, flex: 1 }}>
        {step.why}
      </div>
      <code
        style={{
          fontSize: 9,
          color: '#475569',
          background: '#f7f3ec',
          padding: '2px 5px',
          borderRadius: 3,
          alignSelf: 'flex-start',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {step.blockId}
      </code>
      {missing && (
        <div style={{ fontSize: 9, color: '#b91c1c', fontWeight: 600 }}>
          ⚠ block id not in registry
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <div
      aria-hidden
      style={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#cbd5e1',
      }}
    >
      <ChevronRight size={20} />
    </div>
  );
}

function Legend() {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#475569' }}>
      <LegendItem swatch={<SolidSwatch />} label="Required" />
      <LegendItem swatch={<DashedSwatch />} label="Optional" />
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {swatch}
      {label}
    </span>
  );
}

function SolidSwatch() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 16,
        height: 10,
        border: '1.5px solid #475569',
        borderRadius: 2,
      }}
    />
  );
}

function DashedSwatch() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 16,
        height: 10,
        border: '1.5px dashed #94a3b8',
        borderRadius: 2,
      }}
    />
  );
}
