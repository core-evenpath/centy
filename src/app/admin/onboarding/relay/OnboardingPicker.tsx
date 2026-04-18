'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Engine } from '@/lib/relay/engine-types';
import { ENGINES } from '@/lib/relay/engine-types';
import {
  applyEngineRecipe,
  previewEngineRecipe,
  type ApplyRecipeResult,
} from '@/actions/onboarding-actions';

interface FunctionOption {
  functionId: string;
  name: string;
  industryId: string;
}

interface PartnerOption {
  id: string;
  label: string;
}

interface Props {
  partners: PartnerOption[];
  functions: FunctionOption[];
}

// Customer-journey labels surface the ENGINES tuple in user-facing terms.
const JOURNEY_LABELS: Record<Engine, string> = {
  commerce: 'Buy goods',
  booking: 'Reserve time',
  lead: 'Submit inquiry',
  engagement: 'Donate / sign up',
  info: 'Look up info',
  service: 'Track or manage afterwards',
};

// Journeys shown in Q2 (service is Q3-controlled, not a Q2 toggle)
const Q2_ENGINES: Engine[] = ENGINES.filter((e) => e !== 'service');

export default function OnboardingPicker({ partners, functions }: Props) {
  const [partnerId, setPartnerId] = useState<string>('');
  const [functionId, setFunctionId] = useState<string>('');
  const [selectedEngines, setSelectedEngines] = useState<Engine[]>([]);
  const [includeService, setIncludeService] = useState<boolean>(true);
  const [editedFromDefault, setEditedFromDefault] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [result, setResult] = useState<ApplyRecipeResult | null>(null);
  const [override, setOverride] = useState<boolean>(false);

  // Q1 change → refresh Q2 derivation (only if user hasn't manually edited
  // Q2 since the last functionId change).
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (!functionId) {
        setSelectedEngines([]);
        return;
      }
      const p = await previewEngineRecipe(functionId);
      if (cancelled) return;
      // Split derived engines into Q2 (non-service) and the Q3 toggle.
      const q2Engines = p.derivedEngines.filter((e) => e !== 'service');
      const hasService = p.derivedEngines.includes('service');
      if (!editedFromDefault) {
        setSelectedEngines(q2Engines);
        setIncludeService(hasService);
      }
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [functionId, editedFromDefault]);

  const functionsByIndustry = useMemo(() => {
    const map: Record<string, FunctionOption[]> = {};
    for (const f of functions) {
      (map[f.industryId] ??= []).push(f);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [functions]);

  function toggleEngine(engine: Engine) {
    setEditedFromDefault(true);
    setSelectedEngines((prev) =>
      prev.includes(engine) ? prev.filter((e) => e !== engine) : [...prev, engine],
    );
  }

  async function handleSubmit() {
    if (!partnerId || !functionId) return;
    setApplying(true);
    setResult(null);
    try {
      const allEngines: Engine[] = includeService
        ? [...selectedEngines, 'service']
        : [...selectedEngines];
      // Dedupe + stable sort for deterministic writes.
      const deduped = Array.from(new Set(allEngines));
      const res = await applyEngineRecipe(partnerId, {
        functionId,
        engines: deduped,
        recipeKind: editedFromDefault ? 'custom' : 'auto',
        overrideExistingFlow: override,
      });
      setResult(res);
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setApplying(false);
    }
  }

  const canSubmit = !!partnerId && !!functionId && selectedEngines.length > 0 && !applying;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <section style={sectionStyle}>
        <label style={labelStyle}>Partner</label>
        <select
          value={partnerId}
          onChange={(e) => {
            setPartnerId(e.target.value);
            setResult(null);
          }}
          style={inputStyle}
        >
          <option value="">— select a partner —</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </section>

      <section style={sectionStyle}>
        <label style={labelStyle}>1. Business function</label>
        <select
          value={functionId}
          onChange={(e) => {
            setFunctionId(e.target.value);
            setEditedFromDefault(false);
            setResult(null);
          }}
          style={inputStyle}
        >
          <option value="">— select a function —</option>
          {Object.keys(functionsByIndustry)
            .sort()
            .map((industry) => (
              <optgroup key={industry} label={industry}>
                {functionsByIndustry[industry].map((f) => (
                  <option key={f.functionId} value={f.functionId}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>
      </section>

      <section style={sectionStyle}>
        <label style={labelStyle}>2. Customer journey type (pre-filled from Q1)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Q2_ENGINES.map((engine) => (
            <label
              key={engine}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
                background: selectedEngines.includes(engine) ? 'rgba(45,74,62,0.05)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={selectedEngines.includes(engine)}
                onChange={() => toggleEngine(engine)}
              />
              <span style={{ fontWeight: 500 }}>{JOURNEY_LABELS[engine]}</span>
              <span style={{ fontSize: 10, color: '#7a7a70', fontFamily: 'ui-monospace, monospace' }}>
                ({engine})
              </span>
            </label>
          ))}
        </div>
        {editedFromDefault && (
          <div style={{ fontSize: 10, color: '#b45309', marginTop: 4 }}>
            Edited from default — recipe will be recorded as <code>custom</code>.
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={includeService}
            onChange={(e) => {
              setIncludeService(e.target.checked);
              setEditedFromDefault(true);
            }}
          />
          3. Track or manage afterwards?
        </label>
        <div style={{ fontSize: 11, color: '#7a7a70', marginTop: 4, marginLeft: 22 }}>
          When checked, the <code>service</code> engine is auto-added for post-conversion flows (tracking, cancel, modify).
        </div>
      </section>

      <section style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={override}
            onChange={(e) => setOverride(e.target.checked)}
          />
          Override existing Booking flow (if any)
        </label>
      </section>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          padding: '10px 16px',
          background: canSubmit ? '#2d4a3e' : '#d4d0c8',
          color: '#ffffff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          alignSelf: 'flex-start',
        }}
      >
        {applying ? 'Applying…' : 'Apply engine recipe'}
      </button>

      {result && <ResultView result={result} />}
    </div>
  );
}

function ResultView({ result }: { result: ApplyRecipeResult }) {
  if (result.ok) {
    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(45,106,79,0.08)',
          border: '1px solid rgba(45,106,79,0.25)',
          borderRadius: 8,
          color: '#2d6a4f',
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <strong>✓ Recipe applied</strong>
        <span>Starter blocks enabled: {result.starterBlocksEnabled ?? 0}</span>
        <span>Flow cloned: {result.flowCloned ? 'yes' : 'no'}</span>
        <span>Health recomputed: {result.healthRecomputed?.join(', ') ?? '(none)'}</span>
      </div>
    );
  }
  if (result.warning) {
    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(180,83,9,0.08)',
          border: '1px solid rgba(180,83,9,0.25)',
          borderRadius: 8,
          color: '#b45309',
          fontSize: 12,
        }}
      >
        <strong>⚠ Warning</strong>
        <div style={{ marginTop: 4 }}>{result.warning}</div>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: '12px 16px',
        background: 'rgba(185,28,28,0.05)',
        border: '1px solid rgba(185,28,28,0.25)',
        borderRadius: 8,
        color: '#b91c1c',
        fontSize: 12,
      }}
    >
      <strong>Error:</strong> {result.error ?? 'Unknown error'}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  background: '#ffffff',
  border: '1px solid #e8e4dc',
  borderRadius: 8,
  padding: '12px 16px',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#1a1a18',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  border: '1px solid #e8e4dc',
  borderRadius: 6,
  background: '#ffffff',
  color: '#1a1a18',
};
