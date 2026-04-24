'use client';

import React, { useMemo } from 'react';
import type { ServerBlockData } from '../../blocks/previews/_registry-data';
import type { EngineHealthDoc } from '@/lib/relay/health';
import { BOOKING_CANONICAL_STAGES } from '@/lib/relay/health';
import { BlockCard } from '../../blocks/components/BlockCard';
import type { BlockDotSummary, DotStatus } from './HealthDots';

// Human-readable labels per canonical stage.
const STAGE_LABELS: Record<(typeof BOOKING_CANONICAL_STAGES)[number], string> = {
  greeting: 'Greeting',
  discovery: 'Discovery',
  showcase: 'Showcase',
  comparison: 'Comparison',
  conversion: 'Conversion',
  followup: 'Follow-up',
  handoff: 'Handoff',
};

/**
 * Derive per-block dot summaries from the partner's EngineHealthDoc +
 * the static block catalog. The EngineHealthDoc stores aggregate arrays
 * (unresolvedBindings, orphanBlocks, etc.) — we project those into a
 * per-block triple the BlockCard can render.
 */
function buildDotSummaries(
  blocks: ServerBlockData[],
  health: EngineHealthDoc,
): Record<string, BlockDotSummary> {
  const orphans = new Set(health.orphanBlocks.map((o) => o.blockId));

  // Group unresolved bindings by blockId: >0 means that block has
  // at least one missing required field.
  const blocksWithMissingFields = new Set<string>();
  for (const u of health.unresolvedBindings) blocksWithMissingFields.add(u.blockId);

  // Empty modules -> blocks bound to those modules surface as 'partial'
  // on the module dot (module is connected but empty — not 'ok').
  const emptyModules = new Set(health.emptyModules);

  const out: Record<string, BlockDotSummary> = {};
  for (const b of blocks) {
    // Flow dot: orphan blocks are the ones no flow stage references.
    const flow: DotStatus = orphans.has(b.id) ? 'missing' : 'ok';

    // Module dot: 'na' when the block doesn't bind a module at all;
    // 'partial' when module is connected but empty; 'ok' otherwise.
    let moduleD: DotStatus;
    if (!b.module) moduleD = 'na';
    else if (emptyModules.has(b.module)) moduleD = 'partial';
    else moduleD = 'ok';

    // Fields dot: 'missing' if any required field is unbound for this
    // block in the health doc. Absence of blocked fields defaults to 'ok'.
    const fields: DotStatus = blocksWithMissingFields.has(b.id) ? 'missing' : 'ok';

    out[b.id] = { flow, module: moduleD, fields };
  }
  return out;
}

interface Props {
  /** Booking-scoped catalog — from `getAllowedBlocksForFunctionAndEngine`. */
  blocks: ServerBlockData[];
  /** Health doc for the selected partner. Absent = no partner selected. */
  health?: EngineHealthDoc | null;
}

export function EnginePipeline({ blocks, health }: Props) {
  const hideHealth = !health;

  const dotSummaries = useMemo(
    () => (health ? buildDotSummaries(blocks, health) : {}),
    [blocks, health],
  );

  // Bucket blocks by canonical stage. Blocks whose `stage` doesn't land
  // in the canonical list fall into an "Other" bucket so operators can
  // still see them — better than silently dropping tagged blocks.
  const byStage: Record<string, ServerBlockData[]> = {};
  for (const stage of BOOKING_CANONICAL_STAGES) byStage[stage] = [];
  const otherStage: ServerBlockData[] = [];
  for (const block of blocks) {
    const list = byStage[block.stage];
    if (list) list.push(block);
    else otherStage.push(block);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOOKING_CANONICAL_STAGES.length}, minmax(220px, 1fr))`,
          gap: 12,
          overflowX: 'auto',
        }}
      >
        {BOOKING_CANONICAL_STAGES.map((stage) => {
          const stageBlocks = byStage[stage] ?? [];
          return (
            <div
              key={stage}
              style={{
                background: '#f7f3ec',
                border: '1px solid #e8e4dc',
                borderRadius: 8,
                padding: 10,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingBottom: 6,
                  borderBottom: '1px solid #e8e4dc',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: '#3d3d38', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {STAGE_LABELS[stage]}
                </span>
                <span style={{ fontSize: 10, color: '#7a7a70' }}>{stageBlocks.length}</span>
              </div>
              {stageBlocks.length === 0 ? (
                <div style={{ fontSize: 10, color: '#a8a89e', fontStyle: 'italic', padding: '8px 0' }}>
                  No blocks in this stage
                </div>
              ) : (
                stageBlocks.map((b) => (
                  <BlockCard
                    key={b.id}
                    block={b}
                    dotSummary={dotSummaries[b.id]}
                    hideHealth={hideHealth}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      {otherStage.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#b45309', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Other stages ({otherStage.length})
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {otherStage.map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                dotSummary={dotSummaries[b.id]}
                hideHealth={hideHealth}
              />
            ))}
          </div>
        </div>
      )}

      {!hideHealth && health && (
        <div
          style={{
            padding: '10px 14px',
            background: '#ffffff',
            border: '1px solid #e8e4dc',
            borderRadius: 8,
            fontSize: 11,
            color: '#3d3d38',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span>
            Engine health:{' '}
            <strong
              style={{
                color:
                  health.status === 'green'
                    ? '#2d6a4f'
                    : health.status === 'amber'
                      ? '#b45309'
                      : '#b91c1c',
              }}
            >
              {health.status}
            </strong>
          </span>
          <span>Stages: {health.stages.length}</span>
          <span>Empty modules: {health.emptyModules.length}</span>
          <span>Unresolved bindings: {health.unresolvedBindings.length}</span>
          <span>Orphan blocks: {health.orphanBlocks.length}</span>
          <span style={{ color: '#a8a89e', fontSize: 10 }}>
            computed {new Date(health.computedAt).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}
