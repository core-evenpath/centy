'use client';

// ── AI-flow panel ──────────────────────────────────────────────────────
//
// The inline state machine inside a "needs your input" item when the
// partner picks "Let AI collect for you":
//   checking  → searching existing modules
//   found     → show the matching module; offer Connect / Create-new
//   not_found → show generated prompts; offer Activate / Cancel
//
// Keeps the UI tight — data is fetched by two server actions already
// live on main (`matchExistingModuleAction`,
// `generateDataCollectionPromptsAction`).

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '../inline-icon';
import { ACCENT, theme } from '../../constants';
import { matchExistingModuleAction } from '@/actions/content-studio-module-match';
import { generateDataCollectionPromptsAction } from '@/actions/content-studio-generate-prompts';
import type {
  AIFlowState,
  GeneratedPrompt,
  MappedFeature,
  MatchedModule,
} from '../../types';
import { formatRelative } from './format-relative';
import PromptItem from './prompt-item';

interface Props {
  feature: MappedFeature;
  partnerId: string;
  onConnect: (moduleId: string) => void;
  onActivateCollection: (
    prompts: GeneratedPrompt[],
    suggestedModuleName: string,
  ) => void;
  onCancel: () => void;
}

function resolveModuleSlug(feature: MappedFeature): string {
  if (feature.source?.startsWith('module:')) {
    return feature.source.slice('module:'.length);
  }
  return 'moduleItems';
}

export default function AIFlowPanel({
  feature,
  partnerId,
  onConnect,
  onActivateCollection,
  onCancel,
}: Props) {
  const [state, setState] = useState<AIFlowState>('checking');
  const [match, setMatch] = useState<MatchedModule | null>(null);
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [suggestedName, setSuggestedName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const moduleSlug = resolveModuleSlug(feature);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const matchRes = await matchExistingModuleAction(partnerId, moduleSlug);
      if (cancelled) return;
      if (matchRes.success && matchRes.match && matchRes.match.itemCount > 0) {
        setMatch(matchRes.match);
        setState('found');
        return;
      }
      const promptsRes = await generateDataCollectionPromptsAction(
        partnerId,
        feature.customer,
        moduleSlug,
        feature.you,
      );
      if (cancelled) return;
      if (promptsRes.success && promptsRes.prompts) {
        setPrompts(promptsRes.prompts);
        setSuggestedName(promptsRes.suggestedModuleName || feature.customer);
        setState('not_found');
      } else {
        setPrompts([]);
        setSuggestedName(feature.customer);
        setState('not_found');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [partnerId, moduleSlug, feature.customer, feature.you]);

  const updatePrompt = (id: string, question: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, question } : p)),
    );
    setEditingId(null);
  };

  const addPrompt = () => {
    setPrompts((prev) => [
      ...prev,
      {
        id: `prompt_custom_${Date.now()}`,
        question: 'New question…',
        editable: true,
      },
    ]);
  };

  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ height: 1, background: theme.accentBg2, marginBottom: 12 }} />

      {state === 'checking' && (
        <div style={{ padding: '13px 13px', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 16,
              height: 16,
              border: `2px solid ${theme.accentBg2}`,
              borderTopColor: ACCENT,
              borderRadius: '50%',
              animation: 'dmap-spin 0.7s linear infinite',
              marginRight: 7,
            }}
          />
          <style>{`@keyframes dmap-spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 11, color: theme.t3 }}>
            Checking your existing modules…
          </span>
        </div>
      )}

      {state === 'found' && match && (
        <FoundPanel
          match={match}
          onConnect={() => onConnect(match.moduleId)}
          onSkip={() => setState('not_found')}
          onCancel={onCancel}
        />
      )}

      {state === 'not_found' && (
        <NotFoundPanel
          prompts={prompts}
          suggestedName={suggestedName}
          editingId={editingId}
          onStartEdit={setEditingId}
          onSavePrompt={updatePrompt}
          onRemovePrompt={(id) =>
            setPrompts((prev) => prev.filter((p) => p.id !== id))
          }
          onAddPrompt={addPrompt}
          onActivate={() => onActivateCollection(prompts, suggestedName)}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

// ── Found state ────────────────────────────────────────────────────────

function FoundPanel({
  match,
  onConnect,
  onSkip,
  onCancel,
}: {
  match: MatchedModule;
  onConnect: () => void;
  onSkip: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ padding: '0 13px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: theme.greenBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={11} color={theme.green} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
            Matching module found
          </div>
          <div style={{ fontSize: 10, color: theme.t3, marginTop: 1 }}>
            We can connect to your existing data.
          </div>
        </div>
      </div>

      <div
        style={{
          background: theme.greenBg,
          borderRadius: 7,
          border: `1px solid ${theme.greenBdr}`,
          padding: '10px 11px',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{ width: 7, height: 7, borderRadius: 99, background: theme.green }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1, flex: 1 }}>
            {match.moduleName}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(22,163,74,0.1)',
              color: theme.green,
              fontWeight: 600,
            }}
          >
            {match.itemCount} items
          </span>
        </div>
        <div style={{ fontSize: 10, color: theme.t3, lineHeight: 1.5 }}>
          Last updated {formatRelative(match.updatedAt)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
          {match.fields.map((f) => (
            <span
              key={f}
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 4,
                background: '#f1f0ee',
                color: theme.t2,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7 }}>
        <button
          type="button"
          onClick={onConnect}
          style={{
            flex: 1,
            background: theme.green,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Connect this module
        </button>
        <button
          type="button"
          onClick={onSkip}
          style={{
            flex: 1,
            background: theme.bg,
            color: theme.t2,
            fontSize: 11,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            border: `1px solid ${theme.bdrL}`,
          }}
        >
          Create new instead
        </button>
      </div>
      <div
        role="button"
        onClick={onCancel}
        style={{
          textAlign: 'center',
          marginTop: 8,
          fontSize: 9.5,
          color: theme.t4,
          cursor: 'pointer',
        }}
      >
        Cancel
      </div>
    </div>
  );
}

// ── Not-found state ────────────────────────────────────────────────────

function NotFoundPanel({
  prompts,
  suggestedName,
  editingId,
  onStartEdit,
  onSavePrompt,
  onRemovePrompt,
  onAddPrompt,
  onActivate,
  onCancel,
}: {
  prompts: GeneratedPrompt[];
  suggestedName: string;
  editingId: string | null;
  onStartEdit: (id: string) => void;
  onSavePrompt: (id: string, next: string) => void;
  onRemovePrompt: (id: string) => void;
  onAddPrompt: () => void;
  onActivate: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ padding: '0 13px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: theme.accentBg2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="zap" size={11} color={ACCENT} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
            No matching module found
          </div>
          <div style={{ fontSize: 10, color: theme.t3, marginTop: 1 }}>
            AI will collect data via these prompts when customers chat.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        {prompts.map((p) => (
          <PromptItem
            key={p.id}
            prompt={p}
            isEditing={editingId === p.id}
            onStartEdit={() => onStartEdit(p.id)}
            onSave={(q) => onSavePrompt(p.id, q)}
            onRemove={() => onRemovePrompt(p.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddPrompt}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10.5,
          color: ACCENT,
          cursor: 'pointer',
          padding: '5px 0',
          marginBottom: 12,
          border: 'none',
          background: 'none',
        }}
      >
        <Icon name="plus" size={13} color={ACCENT} />
        Add a prompt
      </button>

      <div
        style={{
          background: theme.amberBg,
          border: `1px solid ${theme.amberBdr}`,
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 10,
          color: theme.t3,
          lineHeight: 1.5,
          marginBottom: 10,
        }}
      >
        <strong style={{ color: theme.amber, fontWeight: 600 }}>
          New module will be created:
        </strong>{' '}
        &ldquo;{suggestedName}&rdquo; — answers collected will appear under{' '}
        <Link
          href="/partner/relay/data"
          style={{ color: theme.amber, fontWeight: 600, textDecoration: 'underline' }}
        >
          Modules → {suggestedName}
        </Link>{' '}
        in your dashboard.
      </div>

      <div style={{ display: 'flex', gap: 7 }}>
        <button
          type="button"
          onClick={onActivate}
          disabled={prompts.length === 0}
          style={{
            flex: 1,
            background: prompts.length === 0 ? theme.bdrL : ACCENT,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 6,
            cursor: prompts.length === 0 ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          Activate AI collection
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            background: theme.bg,
            color: theme.t2,
            fontSize: 11,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            border: `1px solid ${theme.bdrL}`,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
