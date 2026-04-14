'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronDown, Eye, EyeOff, Database, FileText, Sparkles, Slash } from 'lucide-react';
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
  setBlockDataSourceAction,
  type BlockDataSource,
} from '@/actions/relay-customization-actions';
import {
  listPartnerDataSourcesAction,
  getBlockPreviewDataAction,
  type PartnerModuleSource,
  type PartnerDocumentSource,
} from '@/actions/relay-block-sources-actions';

interface Props {
  partnerId: string;
  defaultFunctionId: string | null;
}

type OverrideMap = Record<string, { enabled: boolean; dataSource?: BlockDataSource }>;

export default function RelayBlockExplorer({ partnerId, defaultFunctionId }: Props) {
  const [selectedId, setSelectedId] = useState<string>(defaultFunctionId || '');
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  const [modules, setModules] = useState<PartnerModuleSource[]>([]);
  const [documents, setDocuments] = useState<PartnerDocumentSource[]>([]);

  // Per-block live preview data (produced server-side from the partner's
  // picked source, or auto default). `undefined` means "fall back to
  // design sample".
  const [previewData, setPreviewData] = useState<Record<string, Record<string, unknown> | undefined>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

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
            norm[id] = {
              enabled: raw?.enabled !== false,
              dataSource: raw?.dataSource || undefined,
            };
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
  }, [partnerId]);

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

  const isEnabled = (blockId: string): boolean => {
    const o = overrides[blockId];
    return o ? o.enabled : true;
  };

  const dataSourceFor = (blockId: string): BlockDataSource => {
    return overrides[blockId]?.dataSource || { type: 'auto' };
  };

  // Whenever the active set changes, lazily pull preview data for each
  // active block. Not Promise.all'd — we want the grid to fill in as
  // each request lands rather than block on the slowest one.
  const activeBlocks = useMemo(
    () => blocks.filter(b => isEnabled(b.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, overrides]
  );
  const inactiveBlocks = useMemo(
    () => blocks.filter(b => !isEnabled(b.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks, overrides]
  );

  useEffect(() => {
    if (!partnerId || loading) return;
    for (const b of activeBlocks) {
      // Only fetch if we don't already have data for this (block, source)
      // combo. We key purely on blockId + source signature.
      const key = previewKey(b.id, dataSourceFor(b.id));
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
  }, [activeBlocks, partnerId, loading]);

  const handleToggle = async (blockId: string) => {
    if (pendingBlockId) return;
    const next = !isEnabled(blockId);
    setPendingBlockId(blockId);
    const prior = overrides[blockId];
    setOverrides(prev => ({
      ...prev,
      [blockId]: { ...(prev[blockId] || {}), enabled: next },
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

  const handleSourceChange = async (blockId: string, source: BlockDataSource) => {
    const prior = overrides[blockId]?.dataSource;
    // Optimistic update
    setOverrides(prev => ({
      ...prev,
      [blockId]: { ...(prev[blockId] || { enabled: true }), dataSource: source },
    }));
    // Drop cached preview data for this block so it re-fetches with the
    // new source selection.
    setPreviewData(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith(`${blockId}:`)) delete next[k];
      }
      return next;
    });
    try {
      const res = await setBlockDataSourceAction(partnerId, blockId, source);
      if (!res.success) {
        setOverrides(prev => ({
          ...prev,
          [blockId]: { ...(prev[blockId] || { enabled: true }), dataSource: prior },
        }));
      }
    } catch {
      setOverrides(prev => ({
        ...prev,
        [blockId]: { ...(prev[blockId] || { enabled: true }), dataSource: prior },
      }));
    }
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
          Connect each active block to a data source so the AI assistant serves real content to your visitors.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Section title="Active" count={activeBlocks.length} description="Blocks your AI assistant is allowed to render. Wire each one to a data source so the preview mirrors what visitors see.">
            {activeBlocks.length === 0 ? (
              <EmptyState text="No active blocks — enable some from the inactive list below." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeBlocks.map(b => {
                  const source = dataSourceFor(b.id);
                  const key = previewKey(b.id, source);
                  return (
                    <ActiveBlockCard
                      key={b.id}
                      block={b}
                      source={source}
                      modules={modules}
                      documents={documents}
                      previewData={previewData[key]}
                      previewLoading={!!previewLoading[key]}
                      onToggle={() => handleToggle(b.id)}
                      onSourceChange={(s) => handleSourceChange(b.id, s)}
                      togglePending={pendingBlockId === b.id}
                    />
                  );
                })}
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

// ── Active block card ───────────────────────────────────────────────

function ActiveBlockCard({
  block,
  source,
  modules,
  documents,
  previewData,
  previewLoading,
  onToggle,
  onSourceChange,
  togglePending,
}: {
  block: VerticalBlockDef;
  source: BlockDataSource;
  modules: PartnerModuleSource[];
  documents: PartnerDocumentSource[];
  previewData: Record<string, unknown> | undefined;
  previewLoading: boolean;
  onToggle: () => void;
  onSourceChange: (source: BlockDataSource) => void;
  togglePending: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const Preview = block.preview;
  const stageStyle = FLOW_STAGE_STYLES[block.stage] || { color: '#eee', textColor: '#555' };

  const sourceLabel = formatSourceLabel(source, modules, documents);
  const SourceIcon = sourceIcon(source.type);

  return (
    <div className="rounded-lg border bg-card flex flex-col">
      <div className="flex items-start justify-between gap-2 p-3 border-b">
        <div className="min-w-0 flex-1">
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
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{block.desc}</p>
        </div>
        <button
          onClick={onToggle}
          disabled={togglePending}
          className={`relative shrink-0 h-6 w-11 rounded-full transition-colors bg-primary ${
            togglePending ? 'opacity-50 cursor-wait' : 'cursor-pointer'
          }`}
          aria-label="Disable block"
          title="Click to disable"
        >
          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-5" />
        </button>
      </div>

      {/* Data source row */}
      <div className="px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <SourceIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground shrink-0">Data:</span>
            <span className="text-xs font-medium truncate">{sourceLabel}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[11px] px-2"
            onClick={() => setPickerOpen(o => !o)}
          >
            {pickerOpen ? 'Close' : 'Change'}
          </Button>
        </div>
        {pickerOpen && (
          <SourcePicker
            current={source}
            modules={modules}
            documents={documents}
            onPick={(s) => {
              onSourceChange(s);
              setPickerOpen(false);
            }}
          />
        )}
      </div>

      {/* Live preview with real data */}
      <div className="p-3 bg-muted/30 min-h-[200px] flex items-start justify-center overflow-hidden flex-1">
        <div className="w-full max-w-[320px] pointer-events-none relative">
          {previewLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 rounded">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <Preview data={previewData} />
        </div>
      </div>

      <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t">
        <Eye className="h-3 w-3" />
        <span>Active — {previewData ? 'showing real data' : 'design sample (no matching data)'}</span>
      </div>
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

// ── Source picker panel ─────────────────────────────────────────────

function SourcePicker({
  current,
  modules,
  documents,
  onPick,
}: {
  current: BlockDataSource;
  modules: PartnerModuleSource[];
  documents: PartnerDocumentSource[];
  onPick: (source: BlockDataSource) => void;
}) {
  const isCurrent = (s: BlockDataSource) =>
    s.type === current.type && (s.id || null) === (current.id || null);

  return (
    <div className="mt-2 space-y-2">
      <SourceOption
        label="Auto (recommended)"
        description="Pingbox picks the best-fitting data automatically."
        icon={<Sparkles className="h-3.5 w-3.5" />}
        selected={isCurrent({ type: 'auto' })}
        onClick={() => onPick({ type: 'auto' })}
      />

      {modules.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">Modules</p>
          {modules.map(m => (
            <SourceOption
              key={`module:${m.id}`}
              label={m.name}
              description={`${m.itemCount} item${m.itemCount === 1 ? '' : 's'} · ${m.slug}`}
              icon={<Database className="h-3.5 w-3.5" />}
              selected={isCurrent({ type: 'module', id: m.id })}
              onClick={() => onPick({ type: 'module', id: m.id })}
            />
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1">Documents</p>
          {documents.map(d => (
            <SourceOption
              key={`document:${d.id}`}
              label={d.name}
              description={d.mimeType || 'Document'}
              icon={<FileText className="h-3.5 w-3.5" />}
              selected={isCurrent({ type: 'document', id: d.id })}
              onClick={() => onPick({ type: 'document', id: d.id })}
            />
          ))}
        </div>
      )}

      <SourceOption
        label="Design only"
        description="Render the sample design with no partner data."
        icon={<Slash className="h-3.5 w-3.5" />}
        selected={isCurrent({ type: 'none' })}
        onClick={() => onPick({ type: 'none' })}
      />

      {modules.length === 0 && documents.length === 0 && (
        <p className="text-[11px] text-muted-foreground px-1">
          No modules or documents yet — add some to wire real data into this block.
        </p>
      )}
    </div>
  );
}

function SourceOption({
  label,
  description,
  icon,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border px-2.5 py-1.5 flex items-start gap-2 transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
      }`}
    >
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium truncate">{label}</span>
        <span className="block text-[10px] text-muted-foreground truncate">{description}</span>
      </span>
      {selected && (
        <span className="shrink-0 text-[10px] font-medium text-primary mt-0.5">Selected</span>
      )}
    </button>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function previewKey(blockId: string, source: BlockDataSource): string {
  return `${blockId}:${source.type}:${source.id || ''}`;
}

function formatSourceLabel(
  source: BlockDataSource,
  modules: PartnerModuleSource[],
  documents: PartnerDocumentSource[]
): string {
  if (source.type === 'auto') return 'Auto';
  if (source.type === 'none') return 'Design only';
  if (source.type === 'module') {
    const m = modules.find(x => x.id === source.id);
    return m ? m.name : 'Module (unavailable)';
  }
  if (source.type === 'document') {
    const d = documents.find(x => x.id === source.id);
    return d ? d.name : 'Document (unavailable)';
  }
  return 'Auto';
}

function sourceIcon(type: BlockDataSource['type']) {
  switch (type) {
    case 'module': return Database;
    case 'document': return FileText;
    case 'none': return Slash;
    default: return Sparkles;
  }
}
