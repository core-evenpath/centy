'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Engine } from '@/lib/relay/engine-types';
import { getAllowedBlocksForFunctionAndEngine } from '@/lib/relay/admin-block-registry';
import type { ServerBlockData } from '../../blocks/previews/_registry-data';
import { EngineTabs, ACTIVATED_ENGINES, ENGINE_META } from './EngineTabs';
import { EnginePipeline } from './EnginePipeline';
import { FlowNarrative } from './FlowNarrative';
import { HappyPathStrip } from './HappyPathStrip';
import { ChatExample } from './ChatExample';
import { getFlowByEngine } from './flow-definitions';

// ── Block Engine → Transaction Flows (PR fix-13) ────────────────────
//
// The page now answers "what happens when someone buys / books /
// leads / engages / asks?" instead of "what blocks does each engine
// own?". Per-engine tab renders three sections:
//
//   1. FlowNarrative   — plain-English description of the journey
//   2. HappyPathStrip  — required + optional block ribbon left → right
//   3. ChatExample     — sample conversation with synced highlights
//
// The original 7-stage pipeline is preserved as a collapsed "All
// blocks in catalog" expandable below, so admins who do need the
// flat catalog haven't lost it — but it's no longer the front door.

export default function EngineShell() {
  const [activeEngine, setActiveEngine] = useState<Engine>('commerce');
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [showAllBlocks, setShowAllBlocks] = useState(false);

  // Per-engine catalog. No partner context here, so the helper
  // returns the full cross-vertical block list for each engine.
  const catalogs = useMemo(
    () => ({
      booking: getAllowedBlocksForFunctionAndEngine(null, 'booking'),
      commerce: getAllowedBlocksForFunctionAndEngine(null, 'commerce'),
      lead: getAllowedBlocksForFunctionAndEngine(null, 'lead'),
      engagement: getAllowedBlocksForFunctionAndEngine(null, 'engagement'),
      info: getAllowedBlocksForFunctionAndEngine(null, 'info'),
    }),
    [],
  );

  const engineCatalog = catalogs[activeEngine as keyof typeof catalogs];
  const engineActivated = ACTIVATED_ENGINES.has(activeEngine);
  const flow = getFlowByEngine(activeEngine);

  // Lookup map for the happy-path strip — needs to resolve blockIds
  // to actual ServerBlockData. Build from the union of all engine
  // catalogs so cross-engine blocks (e.g. shared `greeting`) resolve
  // even if they don't appear in the current engine's catalog.
  const blockById = useMemo(() => {
    const map: Record<string, ServerBlockData> = {};
    for (const list of Object.values(catalogs)) {
      for (const b of list) map[b.id] = b;
    }
    return map;
  }, [catalogs]);

  // Reset hover state when switching tabs.
  const handleTabChange = (engine: Engine) => {
    setHoveredBlockId(null);
    setActiveEngine(engine);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EngineTabs active={activeEngine} onChange={handleTabChange} />

      {!engineActivated || !flow || !engineCatalog ? (
        <ComingSoon engine={activeEngine} />
      ) : (
        <>
          <FlowNarrative flow={flow} catalogSize={engineCatalog.length} />

          <HappyPathStrip
            flow={flow}
            blockById={blockById}
            highlightedBlockId={hoveredBlockId}
            onHover={setHoveredBlockId}
          />

          <ChatExample
            flow={flow}
            highlightedBlockId={hoveredBlockId}
            onHover={setHoveredBlockId}
          />

          {/* All-blocks expandable — keeps the legacy 7-stage
              pipeline available without making it the primary view. */}
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #e8e4dc',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setShowAllBlocks((v) => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {showAllBlocks ? (
                  <ChevronDown size={16} color="#7a7a70" />
                ) : (
                  <ChevronRight size={16} color="#7a7a70" />
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a18' }}>
                  All blocks in this flow
                </span>
                <span
                  style={{
                    fontSize: 11,
                    background: '#f7f3ec',
                    color: '#3d3d38',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 500,
                  }}
                >
                  {engineCatalog.length}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#7a7a70' }}>
                {showAllBlocks ? 'Hide' : 'Show'} canonical-stage grid
              </span>
            </button>
            {showAllBlocks && (
              <div style={{ padding: '0 16px 16px' }}>
                <EnginePipeline blocks={engineCatalog} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ComingSoon({ engine }: { engine: Engine }) {
  const meta = ENGINE_META[engine];
  return (
    <div
      style={{
        padding: '48px 24px',
        background: '#ffffff',
        border: '1px dashed #d4d0c8',
        borderRadius: 12,
        textAlign: 'center',
        color: '#7a7a70',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 32 }} aria-hidden>
        {meta.emoji}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#3d3d38' }}>
        {meta.label} flow — coming in Phase 2
      </div>
      <div style={{ fontSize: 12, maxWidth: 420 }}>
        This flow is part of the Phase 2 rollout. Block tagging, flow
        templates, and Health coverage will arrive with the per-flow
        milestone.
      </div>
    </div>
  );
}
