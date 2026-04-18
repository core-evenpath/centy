'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { EngineHealthDoc } from '@/lib/relay/health';
import type { Engine } from '@/lib/relay/engine-types';
import { getEngineHealth, recomputeEngineHealth } from '@/actions/relay-health-actions';
import { HealthMatrix } from './HealthMatrix';
import { IssueDrillDown } from './IssueDrillDown';
import { PartnerSelector, type PartnerOption } from '../../blocks/components/PartnerSelector';

const AUTO_REFRESH_MS = 60_000;

interface Props {
  partners: PartnerOption[];
  partnerEnginesById: Record<string, Engine[]>;
}

export default function HealthShell({ partners, partnerEnginesById }: Props) {
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [healthByEngine, setHealthByEngine] = useState<Partial<Record<Engine, EngineHealthDoc | null>>>({});
  const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null);
  const [loadCount, setLoadCount] = useState(0); // to diagnose cache hit rate
  const [cacheHitCount, setCacheHitCount] = useState(0);

  const partnerEngines = useMemo<Engine[]>(() => {
    if (!selectedPartner) return [];
    return partnerEnginesById[selectedPartner] ?? [];
  }, [selectedPartner, partnerEnginesById]);

  // Default to the first engine in the partner's set.
  useEffect(() => {
    if (!selectedEngine && partnerEngines.length > 0) {
      setSelectedEngine(partnerEngines[0]);
    }
    if (selectedEngine && !partnerEngines.includes(selectedEngine)) {
      setSelectedEngine(partnerEngines[0] ?? null);
    }
  }, [partnerEngines, selectedEngine]);

  const loadAll = useCallback(async () => {
    if (!selectedPartner) {
      setHealthByEngine({});
      return;
    }
    const t0 = Date.now();
    const pairs = await Promise.all(
      partnerEngines.map(async (engine) => {
        const doc = await getEngineHealth(selectedPartner, engine);
        return [engine, doc] as const;
      }),
    );
    const elapsed = Date.now() - t0;
    // Heuristic cache-hit flag: under 100ms for N engines means cache served.
    if (elapsed < 100 && partnerEngines.length > 0) {
      setCacheHitCount((n) => n + 1);
    }
    setLoadCount((n) => n + 1);
    const next: Partial<Record<Engine, EngineHealthDoc | null>> = {};
    for (const [e, doc] of pairs) next[e] = doc;
    setHealthByEngine(next);
    setLastRefreshed(Date.now());
  }, [selectedPartner, partnerEngines]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Auto-refresh every 60s. Cache keeps most reads cheap.
  useEffect(() => {
    if (!selectedPartner) return;
    const id = setInterval(() => void loadAll(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [selectedPartner, loadAll]);

  async function forceRecompute() {
    if (!selectedPartner || !selectedEngine) return;
    await recomputeEngineHealth(selectedPartner, selectedEngine);
    await loadAll();
  }

  const cacheHitRate = loadCount > 0 ? Math.round((cacheHitCount / loadCount) * 100) : null;
  const selectedDoc = selectedEngine ? healthByEngine[selectedEngine] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a18' }}>
          Relay Health
        </h1>
        <PartnerSelector
          partners={partners}
          selected={selectedPartner}
          onChange={(id) => {
            setSelectedPartner(id);
            setSelectedEngine(null);
          }}
        />
        {lastRefreshed && (
          <span style={{ fontSize: 11, color: '#7a7a70' }}>
            Last refreshed {new Date(lastRefreshed).toLocaleTimeString()}
            {cacheHitRate !== null ? ` · cache hit ${cacheHitRate}%` : ''}
          </span>
        )}
        <button
          onClick={forceRecompute}
          disabled={!selectedPartner || !selectedEngine}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            background: '#ffffff',
            color: '#2d4a3e',
            border: '1px solid #2d4a3e',
            borderRadius: 6,
            cursor: !selectedPartner || !selectedEngine ? 'not-allowed' : 'pointer',
            opacity: !selectedPartner || !selectedEngine ? 0.5 : 1,
          }}
        >
          Force recompute
        </button>
        <button
          disabled
          title="Wired in M13 (Preview Copilot)"
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            background: '#f7f3ec',
            color: '#a8a89e',
            border: '1px solid #e8e4dc',
            borderRadius: 6,
            cursor: 'not-allowed',
          }}
        >
          Open Preview Copilot
        </button>
      </div>

      {!selectedPartner ? (
        <EmptyState
          title="Select a partner to view their engine health"
          body="The matrix below shows engines × status. Rows for engines the partner hasn't enabled render with an em-dash, not a zero."
        />
      ) : partnerEngines.length === 0 ? (
        <EmptyState
          title="This partner has no engines configured"
          body="Run the onboarding picker (M14, coming soon) or set `partner.engines` manually via the partner document."
        />
      ) : (
        <>
          <HealthMatrix
            partnerEngines={partnerEngines}
            healthByEngine={healthByEngine}
            selectedEngine={selectedEngine}
            onSelectEngine={setSelectedEngine}
          />

          {selectedEngine && selectedDoc ? (
            <IssueDrillDown
              partnerId={selectedPartner}
              engine={selectedEngine}
              health={selectedDoc}
              onFixApplied={() => void loadAll()}
            />
          ) : selectedEngine ? (
            <EmptyState
              title={`No Health data for ${selectedEngine}`}
              body="Click 'Force recompute' above, or make any admin save — the save-hook will populate it shadow-mode."
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: '32px 24px',
        background: '#ffffff',
        border: '1px dashed #d4d0c8',
        borderRadius: 12,
        textAlign: 'center',
        color: '#7a7a70',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#3d3d38', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, maxWidth: 480, margin: '0 auto' }}>{body}</div>
    </div>
  );
}
