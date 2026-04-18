'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Engine } from '@/lib/relay/engine-types';
import type { EngineHealthDoc } from '@/lib/relay/health';
import { getAllowedBlocksForFunctionAndEngine } from '@/lib/relay/admin-block-registry';
import { getEngineHealth } from '@/actions/relay-health-actions';
import { EngineTabs, ACTIVATED_ENGINES, ENGINE_META } from './EngineTabs';
import { BookingPipeline } from './BookingPipeline';
import { PartnerSelector, type PartnerOption } from './PartnerSelector';
import AdminRelayBlocks from '../AdminRelayBlocks';

interface Props {
  initialBlocks: Array<{ id: string; status: string }>;
  partners: PartnerOption[];
}

export default function BlocksEngineShell({ initialBlocks, partners }: Props) {
  const [activeEngine, setActiveEngine] = useState<Engine>('booking');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [health, setHealth] = useState<EngineHealthDoc | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const selectedPartnerObj = partners.find((p) => p.id === selectedPartner);
  const selectedFunctionId = selectedPartnerObj?.functionId ?? null;

  // Fetch Health whenever the partner or engine changes. Booking is the
  // Booking + Commerce are the activated engines in Phase 2 session 1
  // — skip Health load for other engines (they show "Coming soon").
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedPartner || !ACTIVATED_ENGINES.has(activeEngine)) {
        setHealth(null);
        return;
      }
      setLoadingHealth(true);
      try {
        const doc = await getEngineHealth(selectedPartner, activeEngine);
        if (!cancelled) setHealth(doc);
      } catch (err) {
        if (!cancelled) {
          setHealth(null);
          console.error('[blocks] health load failed', err);
        }
      } finally {
        if (!cancelled) setLoadingHealth(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedPartner, activeEngine]);

  // Engine-scoped catalog via the M12 helper. For catalog view (no
  // partner), we still want an engine scope so the tab content is
  // meaningful; we just hide the Health dots.
  const bookingCatalog = useMemo(
    () => getAllowedBlocksForFunctionAndEngine(selectedFunctionId, 'booking'),
    [selectedFunctionId],
  );
  const commerceCatalog = useMemo(
    () => getAllowedBlocksForFunctionAndEngine(selectedFunctionId, 'commerce'),
    [selectedFunctionId],
  );
  const leadCatalog = useMemo(
    () => getAllowedBlocksForFunctionAndEngine(selectedFunctionId, 'lead'),
    [selectedFunctionId],
  );
  const engagementCatalog = useMemo(
    () => getAllowedBlocksForFunctionAndEngine(selectedFunctionId, 'engagement'),
    [selectedFunctionId],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a18', margin: 0 }}>
          Relay Blocks
        </h1>
        <PartnerSelector
          partners={partners}
          selected={selectedPartner}
          onChange={setSelectedPartner}
        />
        {loadingHealth && (
          <span style={{ fontSize: 11, color: '#7a7a70' }}>Loading health…</span>
        )}
      </div>

      <EngineTabs active={activeEngine} onChange={setActiveEngine} />

      {activeEngine === 'booking' ? (
        <>
          <div style={{ fontSize: 12, color: '#7a7a70', marginBottom: 4 }}>
            {selectedPartner
              ? `Showing ${bookingCatalog.length} booking blocks for this partner`
              : `Catalog view — ${bookingCatalog.length} booking blocks (select a partner for Health)`}
          </div>
          <BookingPipeline blocks={bookingCatalog} health={health} />
          <details style={{ marginTop: 24, border: '1px solid #e8e4dc', borderRadius: 8, padding: 12, background: '#ffffff' }}>
            <summary style={{ fontSize: 12, fontWeight: 600, color: '#3d3d38', cursor: 'pointer' }}>
              Legacy grid view — all blocks, all verticals
            </summary>
            <div style={{ marginTop: 12 }}>
              <AdminRelayBlocks initialBlocks={initialBlocks} />
            </div>
          </details>
        </>
      ) : activeEngine === 'commerce' ? (
        <>
          <div style={{ fontSize: 12, color: '#7a7a70', marginBottom: 4 }}>
            {selectedPartner
              ? `Showing ${commerceCatalog.length} commerce blocks for this partner`
              : `Catalog view — ${commerceCatalog.length} commerce blocks (select a partner for Health)`}
          </div>
          {/*
            BookingPipeline is engine-agnostic — it just renders blocks
            bucketed by canonical stage. Reusing for Commerce avoids a
            rename-only PR; an engine-neutral alias can come later.
          */}
          <BookingPipeline blocks={commerceCatalog} health={health} />
        </>
      ) : activeEngine === 'lead' ? (
        <>
          <div style={{ fontSize: 12, color: '#7a7a70', marginBottom: 4 }}>
            {selectedPartner
              ? `Showing ${leadCatalog.length} lead blocks for this partner`
              : `Catalog view — ${leadCatalog.length} lead blocks (select a partner for Health)`}
          </div>
          <BookingPipeline blocks={leadCatalog} health={health} />
        </>
      ) : activeEngine === 'engagement' ? (
        <>
          <div style={{ fontSize: 12, color: '#7a7a70', marginBottom: 4 }}>
            {selectedPartner
              ? `Showing ${engagementCatalog.length} engagement blocks for this partner`
              : `Catalog view — ${engagementCatalog.length} engagement blocks (select a partner for Health)`}
          </div>
          <BookingPipeline blocks={engagementCatalog} health={health} />
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
