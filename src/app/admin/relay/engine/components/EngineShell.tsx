'use client';

import React, { useMemo, useState } from 'react';
import type { Engine } from '@/lib/relay/engine-types';
import { getAllowedBlocksForFunctionAndEngine } from '@/lib/relay/admin-block-registry';
import { EngineTabs, ACTIVATED_ENGINES, ENGINE_META } from './EngineTabs';
import { EnginePipeline } from './EnginePipeline';

// ── Block Engine (admin) ────────────────────────────────────────────
//
// Engine-scoped view of the block catalog. Pick an engine tab and see
// every block that engine can run, bucketed by canonical stage. No
// partner context — this page is purely "what does an engine look
// like across all sub-verticals".
//
// Partner-scoped engine health lives at /admin/relay/health, which is
// the right home for diagnostics tied to a specific partner's data.

export default function EngineShell() {
  const [activeEngine, setActiveEngine] = useState<Engine>('booking');

  // No partner context here, so `selectedFunctionId` is always null —
  // the helper returns the full cross-vertical catalog for the engine.
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
  const meta = ENGINE_META[activeEngine];
  const engineActivated = ACTIVATED_ENGINES.has(activeEngine);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EngineTabs active={activeEngine} onChange={setActiveEngine} />

      {engineActivated && engineCatalog ? (
        <>
          <div style={{ fontSize: 12, color: '#7a7a70', marginBottom: 4 }}>
            {engineCatalog.length} {meta.label.toLowerCase()} blocks across all sub-verticals,
            bucketed by canonical stage.
          </div>
          <EnginePipeline blocks={engineCatalog} />
        </>
      ) : (
        <ComingSoon engine={activeEngine} />
      )}
    </div>
  );
}

function ComingSoon({ engine }: { engine: Engine }) {
  const meta = ENGINE_META[engine];
  const auto = ACTIVATED_ENGINES.has(engine);
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
        {meta.label} engine — coming in Phase 2
      </div>
      <div style={{ fontSize: 12, maxWidth: 420 }}>
        {auto
          ? 'This engine is already tagged and resolving; UI wiring ships in a follow-up milestone.'
          : 'This engine is part of the Phase 2 rollout. Block tagging, flow templates, and Health coverage will arrive with the per-engine milestone.'}
      </div>
    </div>
  );
}
