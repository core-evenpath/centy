'use client';

// ── RelayBlockExplorer ───────────────────────────────────────────────
//
// Simple enable/disable UI for the blocks this partner's AI assistant
// is allowed to render. Data mapping is handled elsewhere — this page
// only shows which blocks are active and lets the partner flip them
// on or off.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { getBlockPreviewDataAction } from '@/actions/relay-block-sources-actions';
import ActiveBlockCard from './ActiveBlockCard';

interface Props {
  partnerId: string;
  defaultFunctionId: string | null;
}

type OverrideMap = Record<string, { enabled: boolean }>;

export default function RelayBlockExplorer({ partnerId, defaultFunctionId }: Props) {
  const [selectedId, setSelectedId] = useState<string>(defaultFunctionId || '');
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [loading, setLoading] = useState(true);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<Record<string, Record<string, unknown> | undefined>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!partnerId) return;
    setLoading(true);
    (async () => {
      try {
        const custRes = await getPartnerCustomizationAction(partnerId);
        if (custRes.success && custRes.customization) {
          const norm: OverrideMap = {};
          for (const [id, v] of Object.entries(custRes.customization.blockOverrides || {})) {
            const raw = v as any;
            norm[id] = { enabled: raw?.enabled !== false };
          }
          setOverrides(norm);
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

  // Fetch preview data per active block so the card shows what the
  // assistant would actually render.
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
  }, [activeIdsKey, partnerId, loading]);

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
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <Section
            title="Active"
            count={activeBlocks.length}
            description="Blocks your AI assistant is allowed to render."
          >
            {activeBlocks.length === 0 ? (
              <EmptyState text="No active blocks — enable some from the inactive list below." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeBlocks.map(b => (
                  <ActiveBlockCard
                    key={b.id}
                    block={b}
                    previewData={previewData[b.id]}
                    previewLoading={!!previewLoading[b.id]}
                    togglePending={pendingBlockId === b.id}
                    onToggle={() => handleToggle(b.id)}
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
      <div className="flex items-start justify-between gap-2">
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
        {pending ? (
          <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={false}
            onCheckedChange={onEnable}
            aria-label="Enable block"
            title="Click to enable"
            className="mt-0.5"
          />
        )}
      </div>
    </div>
  );
}
