'use client';

// ── RelayBlockExplorer ───────────────────────────────────────────────
//
// The data workbench for /partner/relay/blocks. Two-pane layout on
// desktop:
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │ Sub-vertical selector · active/inactive counts              │
//   ├─────────────────────────────────────────────────────────────┤
//   │ Blueprint Assistant banner                                  │
//   ├───────────────────────────┬─────────────────────────────────┤
//   │ Data Map (left sidebar)   │ Active / Inactive block cards   │
//   └───────────────────────────┴─────────────────────────────────┘
//
// BindingsProvider owns binding state; resolveFieldValuesAction drives
// both the Data Map rows and the per-card FieldHealthStrip, so a
// binding edit on the left pulses the affected cards on the right.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, ChevronDown, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ALL_SUB_VERTICALS,
  SHARED_BLOCKS,
  getBlocksForFunction,
} from '@/app/admin/relay/blocks/previews/registry';
import { FLOW_STAGE_STYLES } from '@/app/admin/relay/blocks/previews/_types';
import type { VerticalBlockDef } from '@/app/admin/relay/blocks/previews/_types';
import {
  getPartnerCustomizationAction,
  toggleBlockAction,
} from '@/actions/relay-customization-actions';
import {
  listPartnerDataSourcesAction,
  getBlockPreviewDataAction,
  type PartnerModuleSource,
  type PartnerDocumentSource,
} from '@/actions/relay-block-sources-actions';
import {
  getDataBindingsAction,
} from '@/actions/relay-data-bindings-actions';
import {
  resolveFieldValuesAction,
  type ResolvedFieldMap,
} from '@/actions/relay-field-resolver-actions';
import { canonicalIdsForBlocks } from '@/lib/relay/block-data-contracts';
import { isEmpty } from '@/lib/relay/binding-health';
import type { BindingMap } from '@/lib/relay/data-bindings';
import ActiveBlockCard from './ActiveBlockCard';
import BlueprintAssistant from './BlueprintAssistant';
import { BindingsProvider, useBindings } from './bindings-store/BindingsProvider';
import DataMapPanel from './data-map/DataMapPanel';

interface Props {
  partnerId: string;
  defaultFunctionId: string | null;
}

type OverrideMap = Record<string, { enabled: boolean }>;

export default function RelayBlockExplorer(props: Props) {
  const [initialBindings, setInitialBindings] = useState<BindingMap | null>(null);

  useEffect(() => {
    if (!props.partnerId) return;
    getDataBindingsAction(props.partnerId).then(res => {
      setInitialBindings(res.success ? res.bindings || {} : {});
    });
  }, [props.partnerId]);

  if (initialBindings === null) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <BindingsProvider partnerId={props.partnerId} initialBindings={initialBindings}>
      <ExplorerInner {...props} />
    </BindingsProvider>
  );
}

function ExplorerInner({ partnerId, defaultFunctionId }: Props) {
  const { version, bump } = useBindings();

  const [selectedId, setSelectedId] = useState<string>(defaultFunctionId || '');
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  const [modules, setModules] = useState<PartnerModuleSource[]>([]);
  const [documents, setDocuments] = useState<PartnerDocumentSource[]>([]);

  const [previewData, setPreviewData] = useState<Record<string, Record<string, unknown> | undefined>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

  // Shared resolved-values map → feeds both DataMapPanel's consumers
  // and each ActiveBlockCard's FieldHealthStrip via resolvedMap.
  const [resolved, setResolved] = useState<ResolvedFieldMap>({});

  // Initial load: overrides + partner data sources.
  useEffect(() => {
    if (!partnerId) return;
    setLoading(true);
    (async () => {
      try {
        const [custRes, srcRes] = await Promise.all([
          getPartnerCustomizationAction(partnerId),
          listPartnerDataSourcesAction(partnerId),
        ]);

        if (custRes.success && custRes.customization) {
          const norm: OverrideMap = {};
          for (const [id, v] of Object.entries(custRes.customization.blockOverrides || {})) {
            const raw = v as any;
            norm[id] = { enabled: raw?.enabled !== false };
          }
          setOverrides(norm);
        }
        if (srcRes.success) {
          setModules(srcRes.modules || []);
          setDocuments(srcRes.documents || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [partnerId, version]);

  useEffect(() => {
    if (defaultFunctionId && !selectedId) setSelectedId(defaultFunctionId);
  }, [defaultFunctionId, selectedId]);

  const blocks: VerticalBlockDef[] = useMemo(() => {
    if (!selectedId) return SHARED_BLOCKS;
    return getBlocksForFunction(selectedId);
  }, [selectedId]);

  const selectedSub = useMemo(
    () => ALL_SUB_VERTICALS.find(s => s.id === selectedId),
    [selectedId]
  );

  const isEnabled = useCallback((blockId: string): boolean => {
    const o = overrides[blockId];
    return o ? o.enabled : true;
  }, [overrides]);

  const activeBlocks = useMemo(
    () => blocks.filter(b => isEnabled(b.id)),
    [blocks, isEnabled]
  );
  const inactiveBlocks = useMemo(
    () => blocks.filter(b => !isEnabled(b.id)),
    [blocks, isEnabled]
  );

  const activeIdsKey = activeBlocks.map(b => b.id).join('|');

  // Fetch live resolved values for every canonical id the active blocks
  // reference. Re-runs when active set or bindings change.
  useEffect(() => {
    if (!partnerId || loading || activeBlocks.length === 0) {
      setResolved({});
      return;
    }
    const canonicalIds = canonicalIdsForBlocks(activeBlocks.map(b => b.id));
    if (canonicalIds.length === 0) {
      setResolved({});
      return;
    }
    let cancelled = false;
    resolveFieldValuesAction(partnerId, canonicalIds).then(res => {
      if (cancelled) return;
      setResolved(res.success ? res.resolved || {} : {});
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, loading, activeIdsKey, version]);

  // Derived: for each canonicalId, did it resolve to a non-empty value?
  // Used by FieldHealthStrip to draw green/amber/rose dots.
  const resolvedBoolMap = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const cid of Object.keys(resolved)) {
      const rf = resolved[cid];
      out[cid] = !isEmpty(rf.value) && !rf.error;
    }
    return out;
  }, [resolved]);

  // Block previews (same as before — per-block fetch).
  useEffect(() => {
    if (!partnerId || loading) return;
    for (const b of activeBlocks) {
      const key = b.id;
      if (previewData[key] !== undefined || previewLoading[key]) continue;
      setPreviewLoading(prev => ({ ...prev, [key]: true }));
      getBlockPreviewDataAction(partnerId, b.id)
        .then(res => {
          if (res.success) {
            setPreviewData(prev => ({ ...prev, [key]: res.data }));
          }
        })
        .finally(() => {
          setPreviewLoading(prev => ({ ...prev, [key]: false }));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdsKey, partnerId, loading, version]);

  // Invalidate previews when bindings change so cards update in sync
  // with the Data Map edits.
  useEffect(() => {
    if (version === 0) return;
    setPreviewData({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handleToggle = async (blockId: string) => {
    if (pendingBlockId) return;
    const next = !isEnabled(blockId);
    setPendingBlockId(blockId);
    const prior = overrides[blockId];
    setOverrides(prev => ({
      ...prev,
      [blockId]: { enabled: next },
    }));
    try {
      const res = await toggleBlockAction(partnerId, blockId, next);
      if (!res.success) {
        setOverrides(prev => ({ ...prev, [blockId]: prior || { enabled: !next } }));
      }
    } finally {
      setPendingBlockId(null);
    }
  };

  const handleCustomized = (blockId: string) => {
    setPreviewData(prev => {
      const next = { ...prev };
      delete next[blockId];
      return next;
    });
  };

  const handleBlueprintApplied = () => {
    setPreviewData({});
    bump();
  };

  return (
    <div className="space-y-6">
      {/* Sub-vertical selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Sub-category:</label>
        <div className="relative flex-1 max-w-sm">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full appearance-none border rounded-md px-3 py-2 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Shared blocks only</option>
            {ALL_SUB_VERTICALS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.id === defaultFunctionId ? ' (yours)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="text-xs text-muted-foreground">
          {activeBlocks.length} active · {inactiveBlocks.length} inactive
        </div>
      </div>

      {selectedSub && (
        <div className="text-xs text-muted-foreground">
          Showing blocks for <span className="font-medium text-foreground">{selectedSub.name}</span>.
          Edit sources in the Data Map on the left — changes flow into every card that uses that field.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <BlueprintAssistant
            partnerId={partnerId}
            activeBlockIds={activeBlocks.map(b => b.id)}
            onApplied={handleBlueprintApplied}
          />

          <div className="grid gap-6 lg:grid-cols-[22rem_1fr] items-start">
            {/* Left pane: Data Map */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <DataMapPanel
                activeBlockIds={activeBlocks.map(b => b.id)}
                modules={modules}
                documents={documents}
              />
            </div>

            {/* Right pane: block cards */}
            <div className="space-y-6 min-w-0">
              <Section
                title="Active"
                count={activeBlocks.length}
                description="Blocks your AI assistant is allowed to render. Health dots under each card's title link back to the data map."
              >
                {activeBlocks.length === 0 ? (
                  <EmptyState text="No active blocks — enable some from the inactive list below." />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeBlocks.map(b => (
                      <ActiveBlockCard
                        key={b.id}
                        partnerId={partnerId}
                        block={b}
                        previewData={previewData[b.id]}
                        previewLoading={!!previewLoading[b.id]}
                        togglePending={pendingBlockId === b.id}
                        resolvedMap={resolvedBoolMap}
                        onToggle={() => handleToggle(b.id)}
                        onCustomized={() => handleCustomized(b.id)}
                      />
                    ))}
                  </div>
                )}
              </Section>

              <Section
                title="Inactive"
                count={inactiveBlocks.length}
                description="Blocks the AI assistant will skip. Enable a block to start showing it to visitors."
              >
                {inactiveBlocks.length === 0 ? (
                  <EmptyState text="All blocks for this category are active." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {inactiveBlocks.map(b => (
                      <InactiveBlockCard
                        key={b.id}
                        block={b}
                        onEnable={() => handleToggle(b.id)}
                        pending={pendingBlockId === b.id}
                      />
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Section shell ────────────────────────────────────────────────────

function Section({
  title,
  count,
  description,
  children,
}: {
  title: string;
  count: number;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-baseline gap-2 flex-wrap">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">({count})</span>
        <p className="text-xs text-muted-foreground basis-full sm:basis-auto sm:ml-2">
          {description}
        </p>
      </header>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 py-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}

// ── Inactive block card ─────────────────────────────────────────────

function InactiveBlockCard({
  block,
  onEnable,
  pending,
}: {
  block: VerticalBlockDef;
  onEnable: () => void;
  pending: boolean;
}) {
  const stageStyle = FLOW_STAGE_STYLES[block.stage] || { color: '#eee', textColor: '#555' };
  return (
    <div className="rounded-lg border bg-card p-3 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Badge variant="secondary" className="text-[10px]">{block.family}</Badge>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ background: stageStyle.color, color: stageStyle.textColor }}
        >
          {block.stage}
        </span>
      </div>
      <p className="font-medium text-sm truncate">{block.label}</p>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 mb-3">{block.desc}</p>
      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 text-xs"
        onClick={onEnable}
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : (
          <>
            <EyeOff className="h-3 w-3 mr-1" />
            Enable block
          </>
        )}
      </Button>
    </div>
  );
}
