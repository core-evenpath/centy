'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type { ResettableCollection } from '@/lib/admin/reset/resettable-collections';
import type { ResetFilter } from '@/lib/admin/reset/filter-model';
import { describeFilter } from '@/lib/admin/reset/filter-model';
import { previewReset, executeReset } from '@/actions/admin-reset-actions';

interface Props {
  collections: ResettableCollection[];
  unscopedAllowed: boolean;
}

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; result: DryRunPayload }
  | { kind: 'error'; message: string; details?: string[] };

type ExecuteState =
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'loading' }
  | { kind: 'done'; result: ExecutePayload }
  | { kind: 'error'; message: string; details?: string[] };

// Mirror of the server-action response shapes. We redefine here
// because server-action files are 'use server' and their exports
// shouldn't leak into client-bundle type imports.
interface DryRunPayload {
  collectionId: string;
  firestorePath: string;
  verb: string;
  filter: ResetFilter;
  affectedCount: number;
  sampleIds: string[];
  warnings: string[];
  auditId: string;
}

interface ExecutePayload {
  collectionId: string;
  firestorePath: string;
  verb: string;
  filter: ResetFilter;
  affectedCount: number;
  durationMs: number;
  auditId: string;
  postResetAction?: 'trigger-recompute';
}

const VERB_COLORS: Record<string, string> = {
  recompute: '#2d4a3e',
  clear: '#3d7a8f',
  invalidate: '#8a6d1a',
  delete: '#b91c1c',
};

export default function ResetShell({ collections, unscopedAllowed }: Props) {
  const [selected, setSelected] = useState<ResettableCollection | null>(null);

  if (selected) {
    return (
      <CollectionDetail
        collection={selected}
        onBack={() => setSelected(null)}
        unscopedAllowed={unscopedAllowed}
      />
    );
  }

  return <CollectionList collections={collections} onSelect={setSelected} />;
}

function CollectionList({
  collections,
  onSelect,
}: {
  collections: ResettableCollection[];
  onSelect: (c: ResettableCollection) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 12,
      }}
    >
      {collections.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          style={{
            textAlign: 'left',
            background: '#ffffff',
            border: '1px solid #e8e4dc',
            borderRadius: 10,
            padding: 14,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>{c.label}</div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: VERB_COLORS[c.verb] ?? '#7a7a70',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {c.verb}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#7a7a70', lineHeight: 1.4 }}>{c.description}</div>
          <div style={{ fontSize: 10, color: '#a8a494' }}>
            Path: <code>{c.collection}</code>
          </div>
        </button>
      ))}
    </div>
  );
}

function CollectionDetail({
  collection,
  onBack,
  unscopedAllowed,
}: {
  collection: ResettableCollection;
  onBack: () => void;
  unscopedAllowed: boolean;
}) {
  const [filter, setFilter] = useState<ResetFilter>({});
  const [previewState, setPreviewState] = useState<PreviewState>({ kind: 'idle' });
  const [executeState, setExecuteState] = useState<ExecuteState>({ kind: 'idle' });
  const [confirmationText, setConfirmationText] = useState('');

  const updateFilter = useCallback((patch: Partial<ResetFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    // Clear previous preview when filter changes — operator must re-run
    // dry-run against the new filter before they can execute.
    setPreviewState({ kind: 'idle' });
    setExecuteState({ kind: 'idle' });
  }, []);

  const runPreview = useCallback(async () => {
    setPreviewState({ kind: 'loading' });
    const r = await previewReset(collection.id, filter);
    if (r.ok) {
      setPreviewState({ kind: 'done', result: r });
    } else {
      setPreviewState({ kind: 'error', message: r.error, details: r.details });
    }
  }, [collection.id, filter]);

  const runExecute = useCallback(async () => {
    if (previewState.kind !== 'done') return;
    setExecuteState({ kind: 'loading' });
    const r = await executeReset(collection.id, filter, previewState.result.auditId);
    if (r.ok) {
      setExecuteState({ kind: 'done', result: r });
    } else {
      setExecuteState({ kind: 'error', message: r.error, details: r.details });
    }
  }, [collection.id, filter, previewState]);

  const canExecute = previewState.kind === 'done' && confirmationText === collection.id;
  const dryRunReady = previewState.kind === 'done';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <button
          onClick={onBack}
          style={{
            fontSize: 11,
            color: '#7a7a70',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ← Back to collection list
        </button>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8e4dc',
          borderRadius: 10,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a18' }}>
              {collection.label}
            </div>
            <div style={{ fontSize: 11, color: '#7a7a70', marginTop: 2 }}>
              {collection.description}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 4,
              background: VERB_COLORS[collection.verb] ?? '#7a7a70',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {collection.verb}
          </span>
        </div>

        <FilterForm
          collection={collection}
          filter={filter}
          onChange={updateFilter}
          unscopedAllowed={unscopedAllowed}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={runPreview}
            disabled={previewState.kind === 'loading'}
            style={{
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: '#2d4a3e',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              cursor: previewState.kind === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {previewState.kind === 'loading' ? 'Running…' : 'Dry-run'}
          </button>

          {dryRunReady && (
            <div
              style={{
                fontSize: 10,
                color: '#7a7a70',
                alignSelf: 'center',
                marginLeft: 4,
              }}
            >
              Type <code>{collection.id}</code> below + click Execute to proceed
            </div>
          )}
        </div>

        {previewState.kind === 'error' && (
          <ErrorPanel message={previewState.message} details={previewState.details} />
        )}
        {previewState.kind === 'done' && <DryRunPanel result={previewState.result} />}
      </div>

      {dryRunReady && (
        <div
          style={{
            background: '#fff8ec',
            border: '1px solid #d4b878',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5a4a1a' }}>
            Confirm execute
          </div>
          <div style={{ fontSize: 11, color: '#7a6a40' }}>
            Type the collection id <code>{collection.id}</code> to unlock the Execute button.
          </div>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={collection.id}
            style={{
              padding: '8px 10px',
              fontSize: 12,
              borderRadius: 4,
              border: '1px solid #d4b878',
              background: '#ffffff',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={runExecute}
              disabled={!canExecute || executeState.kind === 'loading'}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                background: canExecute ? '#b91c1c' : '#d4b878',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                cursor: canExecute && executeState.kind !== 'loading' ? 'pointer' : 'not-allowed',
                opacity: canExecute ? 1 : 0.6,
              }}
            >
              {executeState.kind === 'loading' ? 'Executing…' : 'Execute reset'}
            </button>
          </div>

          {executeState.kind === 'error' && (
            <ErrorPanel message={executeState.message} details={executeState.details} />
          )}
          {executeState.kind === 'done' && <ExecutePanel result={executeState.result} />}
        </div>
      )}
    </div>
  );
}

function FilterForm({
  collection,
  filter,
  onChange,
  unscopedAllowed,
}: {
  collection: ResettableCollection;
  filter: ResetFilter;
  onChange: (patch: Partial<ResetFilter>) => void;
  unscopedAllowed: boolean;
}) {
  const needsPartner =
    collection.requiredScopes.includes('per-partner') ||
    collection.optionalScopes.includes('per-partner');
  const needsEngine =
    collection.requiredScopes.includes('per-engine') ||
    collection.optionalScopes.includes('per-engine');
  const needsModule = collection.requiredScopes.includes('per-module');
  const supportsSession = collection.optionalScopes.includes('per-session');

  return (
    <div
      style={{
        background: '#fafaf7',
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: '#3d3d38' }}>
        Filter ({describeFilter(filter).join(' · ') || 'no fields set'})
      </div>

      {needsPartner && (
        <LabeledInput
          label={`Partner ID ${collection.requiredScopes.includes('per-partner') ? '(required)' : '(optional)'}`}
          value={filter.partnerId ?? ''}
          onChange={(v) => onChange({ partnerId: v || undefined })}
          placeholder="e.g. p_abc123"
          disabled={filter.unscoped === true}
        />
      )}

      {needsEngine && (
        <LabeledSelect
          label="Engine (optional)"
          value={filter.engine ?? ''}
          onChange={(v) => onChange({ engine: v ? (v as ResetFilter['engine']) : undefined })}
          options={['', 'booking', 'commerce', 'lead', 'engagement', 'info', 'service']}
          disabled={filter.unscoped === true}
        />
      )}

      {needsModule && (
        <LabeledInput
          label="Module Slug (required)"
          value={filter.moduleSlug ?? ''}
          onChange={(v) => onChange({ moduleSlug: v || undefined })}
          placeholder="e.g. product_catalog"
          disabled={filter.unscoped === true}
        />
      )}

      {supportsSession && (
        <div style={{ display: 'flex', gap: 8 }}>
          <LabeledInput
            label="Date range from (ISO)"
            value={filter.dateRangeFrom ?? ''}
            onChange={(v) => onChange({ dateRangeFrom: v || undefined })}
            placeholder="2026-04-19"
            disabled={filter.unscoped === true}
          />
          <LabeledInput
            label="Date range to (ISO)"
            value={filter.dateRangeTo ?? ''}
            onChange={(v) => onChange({ dateRangeTo: v || undefined })}
            placeholder="2026-04-20"
            disabled={filter.unscoped === true}
          />
        </div>
      )}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: unscopedAllowed ? '#b91c1c' : '#a8a494',
          cursor: unscopedAllowed ? 'pointer' : 'not-allowed',
        }}
        title={unscopedAllowed ? 'Ignore all filters — DANGEROUS' : 'Env flag RESET_ALLOW_UNSCOPED is disabled'}
      >
        <input
          type="checkbox"
          checked={filter.unscoped === true}
          onChange={(e) => onChange({ unscoped: e.target.checked || undefined })}
          disabled={!unscopedAllowed}
        />
        Ignore filters (requires RESET_ALLOW_UNSCOPED env flag)
      </label>
      {filter.unscoped === true && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #b91c1c',
            color: '#b91c1c',
            borderRadius: 6,
            padding: 8,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          UNSCOPED mode — this will affect every document in the target collection.
        </div>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#3d3d38' }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: '6px 8px',
          fontSize: 11,
          borderRadius: 4,
          border: '1px solid #d4d0c8',
          background: disabled ? '#f0ede6' : '#ffffff',
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#3d3d38' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: '6px 8px',
          fontSize: 11,
          borderRadius: 4,
          border: '1px solid #d4d0c8',
          background: disabled ? '#f0ede6' : '#ffffff',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || '(any)'}
          </option>
        ))}
      </select>
    </label>
  );
}

function DryRunPanel({ result }: { result: DryRunPayload }) {
  return (
    <div
      style={{
        background: '#f0f8f4',
        border: '1px solid #b3d4c0',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#2d4a3e' }}>
        Dry-run complete — {result.affectedCount} document(s) would be affected
      </div>
      <div style={{ fontSize: 10, color: '#7a7a70' }}>
        Path: <code>{result.firestorePath}</code>
      </div>
      {result.warnings.length > 0 && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #d4b878',
            borderRadius: 4,
            padding: 8,
            fontSize: 11,
            color: '#b91c1c',
          }}
        >
          {result.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}
      {result.sampleIds.length > 0 && (
        <details>
          <summary style={{ fontSize: 11, color: '#3d3d38', cursor: 'pointer' }}>
            Sample ids ({result.sampleIds.length}{result.affectedCount > result.sampleIds.length ? ` of ${result.affectedCount}` : ''})
          </summary>
          <ul style={{ fontSize: 10, color: '#7a7a70', margin: '6px 0 0 18px' }}>
            {result.sampleIds.map((id) => (
              <li key={id}>
                <code>{id}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
      <div style={{ fontSize: 10, color: '#a8a494' }}>
        Audit id: <code>{result.auditId}</code>
      </div>
    </div>
  );
}

function ExecutePanel({ result }: { result: ExecutePayload }) {
  return (
    <div
      style={{
        background: '#f0f8f4',
        border: '1px solid #2d4a3e',
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#2d4a3e' }}>
        Executed — {result.affectedCount} document(s) affected in {result.durationMs}ms
      </div>
      <div style={{ fontSize: 10, color: '#7a7a70', marginTop: 4 }}>
        Audit id: <code>{result.auditId}</code>
        {result.postResetAction === 'trigger-recompute' && (
          <span style={{ marginLeft: 8, color: '#3d7a8f' }}>
            Hint: next read will trigger automatic recompute
          </span>
        )}
      </div>
    </div>
  );
}

function ErrorPanel({ message, details }: { message: string; details?: string[] }) {
  return (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #b91c1c',
        borderRadius: 8,
        padding: 12,
        fontSize: 11,
        color: '#b91c1c',
      }}
    >
      <div style={{ fontWeight: 700 }}>{message}</div>
      {details && details.length > 0 && (
        <ul style={{ margin: '6px 0 0 18px' }}>
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
