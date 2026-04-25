'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ALL_BLOCKS } from '@/app/admin/relay/blocks/previews/registry';
import {
  RELAY_VERTICALS,
  getVerticalForSlug,
  type RelayVertical,
} from '@/lib/relay/relay-verticals';
import { setBlockSchemaBindingAction } from '@/actions/relay-block-binding';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  BlockModuleBinding,
  ModuleBlockUsage,
} from '@/lib/relay/module-analytics-types';

// ── Block Gallery (PR fix-7 — status-aware) ─────────────────────────
//
// Vertical-grouped visual gallery of every Relay block, rendered with
// its actual preview component. Each tile carries an inline status
// pill (Healthy / Needs data / Drift / Unbound) so admin sees state
// without bouncing between separate "Dark" / "Connected" tabs (which
// were dropped in this PR — status filter chips on this view replace
// them).
//
// Performance: 200 previews are heavy. Vertical sections lazy-mount
// blocks only when expanded; collapsing unmounts them.

const VERTICAL_LABELS: Record<RelayVertical, string> = {
  automotive: 'Automotive',
  business: 'Business / Professional Services',
  ecommerce: 'E-commerce',
  education: 'Education',
  events_entertainment: 'Events & Entertainment',
  financial_services: 'Financial Services',
  food_beverage: 'Food & Beverage',
  food_supply: 'Food Supply',
  healthcare: 'Healthcare',
  home_property: 'Home & Property',
  hospitality: 'Hospitality',
  personal_wellness: 'Personal Wellness',
  public_nonprofit: 'Public / Nonprofit',
  travel_transport: 'Travel & Transport',
  shared: 'Shared (cross-vertical)',
};

// ── Block status taxonomy ──────────────────────────────────────────
//
// Replaces the legacy "Dark / Connected / Module-less" tabs. Every
// block in the gallery falls into exactly one of these. Status is
// derived from the binding (PR B/E11 fields), not stored.

export type BlockStatus = 'healthy' | 'needs_data' | 'drift' | 'unbound';

interface StatusMeta {
  label: string;
  /** Tailwind colour for the dot + chip border. */
  dot: string;
  border: string;
  bg: string;
  text: string;
  description: string;
}

const STATUS_META: Record<BlockStatus, StatusMeta> = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    description: 'Block + schema match, partner data present.',
  },
  needs_data: {
    label: 'Needs data',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    description:
      'Block binds a schema but the underlying module has no items yet.',
  },
  drift: {
    label: 'Drift',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    description:
      'Block reads fields that aren\'t in its schema — fix the schema or update reads[].',
  },
  unbound: {
    label: 'Unbound',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    description:
      'Admin disabled the block ↔ schema binding. Renders from design sample.',
  },
};

function deriveStatus(
  binding: BlockModuleBinding | undefined,
  localBound: boolean,
): BlockStatus {
  if (!binding) return 'healthy';
  if (!localBound) return 'unbound';
  if ((binding.driftFields?.length ?? 0) > 0) return 'drift';
  if (binding.isDark) return 'needs_data';
  return 'healthy';
}

interface Props {
  bindings: BlockModuleBinding[];
  /**
   * Module → schemaFields lookup. Threaded through so each tile can
   * render the FULL schema field universe with the block's own
   * reads[] highlighted, instead of only showing reads[] (which is
   * a narrow subset). PR fix-10.
   */
  modules: ModuleBlockUsage[];
  statusFilter: BlockStatus | 'all';
  onStatusFilterChange: (s: BlockStatus | 'all') => void;
}

export default function BlockGalleryView({
  bindings,
  modules,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  const bindingByBlockId = useMemo(() => {
    const m = new Map<string, BlockModuleBinding>();
    for (const b of bindings) m.set(b.blockId, b);
    return m;
  }, [bindings]);

  // Slug → schema field list. Empty array if schema has no fields.
  const schemaFieldsBySlug = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const mod of modules) {
      m.set(mod.moduleSlug, mod.schemaFields ?? []);
    }
    return m;
  }, [modules]);

  const [localBindings, setLocalBindings] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<RelayVertical>>(new Set());

  const isBound = (blockId: string): boolean => {
    if (blockId in localBindings) return localBindings[blockId];
    const b = bindingByBlockId.get(blockId);
    if (b && b.bindsSchema === false) return false;
    return true;
  };

  // Compute status for every block in the current scope. Used for
  // the filter-chip counts AND for the per-tile pill rendering.
  const blocksByStatus = useMemo(() => {
    const idToStatus = new Map<string, BlockStatus>();
    const counts: Record<BlockStatus, number> = {
      healthy: 0,
      needs_data: 0,
      drift: 0,
      unbound: 0,
    };
    for (const b of ALL_BLOCKS) {
      if (!b.module) continue;
      // Only count blocks that survived the upstream
      // vertical/sub-vertical filter (i.e. ones present in
      // `bindings`).
      if (!bindingByBlockId.has(b.id)) continue;
      const s = deriveStatus(bindingByBlockId.get(b.id), isBound(b.id));
      idToStatus.set(b.id, s);
      counts[s]++;
    }
    return { idToStatus, counts };
    // localBindings included — when admin toggles, counts re-roll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindings, localBindings]);

  const totalCount = bindings.length;

  // Build vertical → schema slug → blocks tree, applying status
  // filter at the block level so users see exactly what they asked
  // for.
  const tree = useMemo(() => {
    type SchemaGroup = { slug: string; blocks: typeof ALL_BLOCKS };
    const verticalMap = new Map<RelayVertical, SchemaGroup[]>();
    const slugMap = new Map<string, typeof ALL_BLOCKS>();

    for (const b of ALL_BLOCKS) {
      if (!b.module) continue;
      if (!bindingByBlockId.has(b.id)) continue;
      if (statusFilter !== 'all') {
        const s = blocksByStatus.idToStatus.get(b.id);
        if (s !== statusFilter) continue;
      }
      const arr = slugMap.get(b.module) ?? [];
      arr.push(b);
      slugMap.set(b.module, arr);
    }

    for (const [slug, blocks] of slugMap) {
      const vertical = getVerticalForSlug(slug);
      if (!vertical) continue;
      const groups = verticalMap.get(vertical) ?? [];
      groups.push({ slug, blocks });
      verticalMap.set(vertical, groups);
    }

    return RELAY_VERTICALS
      .filter((v) => verticalMap.has(v))
      .map((v) => ({
        vertical: v,
        groups: (verticalMap.get(v) ?? [])
          .slice()
          .sort((a, b) => a.slug.localeCompare(b.slug)),
      }));
  }, [bindings, statusFilter, blocksByStatus]);

  const toggle = async (blockId: string) => {
    const next = !isBound(blockId);
    setLocalBindings((prev) => ({ ...prev, [blockId]: next }));
    setPending((prev) => new Set(prev).add(blockId));
    try {
      const res = await setBlockSchemaBindingAction(blockId, next);
      if (!res.success) {
        setLocalBindings((prev) => ({ ...prev, [blockId]: !next }));
        toast.error(res.error ?? 'Could not update binding');
      } else {
        toast.success(next ? `${blockId} bound` : `${blockId} unbound`);
      }
    } catch (e: any) {
      setLocalBindings((prev) => ({ ...prev, [blockId]: !next }));
      toast.error(e?.message ?? 'Could not update binding');
    } finally {
      setPending((prev) => {
        const copy = new Set(prev);
        copy.delete(blockId);
        return copy;
      });
    }
  };

  const toggleVertical = (v: RelayVertical) => {
    setExpanded((prev) => {
      const copy = new Set(prev);
      if (copy.has(v)) copy.delete(v);
      else copy.add(v);
      return copy;
    });
  };

  return (
    <div className="space-y-3">
      {/* ── Status filter chips ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        <FilterChip
          label="All"
          count={totalCount}
          active={statusFilter === 'all'}
          onClick={() => onStatusFilterChange('all')}
        />
        {(['healthy', 'needs_data', 'drift', 'unbound'] as BlockStatus[]).map((s) => (
          <FilterChip
            key={s}
            label={STATUS_META[s].label}
            count={blocksByStatus.counts[s]}
            active={statusFilter === s}
            onClick={() => onStatusFilterChange(s)}
            dotClass={STATUS_META[s].dot}
            title={STATUS_META[s].description}
          />
        ))}
      </div>

      {tree.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No blocks match the current filter.
          </CardContent>
        </Card>
      ) : (
        tree.map(({ vertical, groups }) => {
          const isOpen = expanded.has(vertical);
          const totalBlocks = groups.reduce((sum, g) => sum + g.blocks.length, 0);

          return (
            <Card key={vertical}>
              <button
                type="button"
                onClick={() => toggleVertical(vertical)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-sm">{VERTICAL_LABELS[vertical]}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {groups.length} schema{groups.length === 1 ? '' : 's'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {totalBlocks} block{totalBlocks === 1 ? '' : 's'}
                  </Badge>
                </div>
              </button>

              {isOpen && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {groups.map((g) => (
                    <div key={g.slug} className="space-y-2">
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <code className="text-xs font-medium">{g.slug}</code>
                        <Badge variant="secondary" className="text-[10px]">
                          {g.blocks.length} block{g.blocks.length === 1 ? '' : 's'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {g.blocks.map((b) => {
                          const Preview = b.preview;
                          const bound = isBound(b.id);
                          const isPending = pending.has(b.id);
                          const status = deriveStatus(bindingByBlockId.get(b.id), bound);
                          const meta = STATUS_META[status];
                          return (
                            <div
                              key={b.id}
                              className={[
                                'rounded-md border p-3 space-y-2 transition-opacity',
                                bound ? 'bg-background' : 'bg-muted/40 opacity-70',
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={[
                                      'text-sm font-medium truncate',
                                      bound ? '' : 'line-through',
                                    ].join(' ')}
                                    title={b.label}
                                  >
                                    {b.label}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                    <Badge variant="outline" className="text-[10px]">
                                      {b.family}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {b.stage}
                                    </span>
                                  </div>
                                </div>
                                <label
                                  className="inline-flex items-center gap-1 cursor-pointer select-none shrink-0"
                                  title={
                                    bound
                                      ? 'Bound — block reads from this schema. Untick to unbind.'
                                      : 'Unbound — block falls back to design sample.'
                                  }
                                >
                                  {isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={bound}
                                      onChange={() => toggle(b.id)}
                                      disabled={isPending}
                                      className="cursor-pointer"
                                    />
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    Bound
                                  </span>
                                </label>
                              </div>

                              {/* Inline status pill — replaces the
                                  AlertTriangle pile-up. Color +
                                  word, with hover description. */}
                              <span
                                title={meta.description}
                                className={[
                                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                  meta.border,
                                  meta.bg,
                                  meta.text,
                                ].join(' ')}
                              >
                                <span
                                  className={['h-1.5 w-1.5 rounded-full', meta.dot].join(' ')}
                                  aria-hidden
                                />
                                {meta.label}
                              </span>

                              <div
                                className={[
                                  'rounded-md border bg-muted/40 p-2 overflow-hidden',
                                  bound ? '' : 'grayscale',
                                ].join(' ')}
                                style={{ minHeight: 64 }}
                              >
                                <div style={{ width: 240, maxWidth: '100%' }}>
                                  <Preview />
                                </div>
                              </div>

                              <SchemaFieldChips
                                reads={b.reads ?? []}
                                schemaFields={
                                  b.module
                                    ? schemaFieldsBySlug.get(b.module) ?? []
                                    : []
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

// ── Schema field chips (PR fix-10) ─────────────────────────────────
//
// Replaces the old "show first 6 reads[]" chip strip. Now shows the
// full schema field set with each chip styled to indicate whether
// the block actually consumes it:
//
//   • Read     — block.reads includes this field (active blue chip)
//   • Schema-only — schema has this field, block doesn't read it
//                   yet (muted gray chip)
//   • Drift    — block reads a field NOT in the schema (amber chip
//                with a leading dot, signals broken contract)
//
// Why: the schema is the canonical contract; reads[] is just one
// block's slice. Surfacing both side-by-side makes it obvious which
// fields each block ignores and where reads[] has drifted from the
// schema.

function SchemaFieldChips({
  reads,
  schemaFields,
}: {
  reads: string[];
  schemaFields: string[];
}) {
  const readSet = new Set(reads);
  const schemaSet = new Set(schemaFields);

  // Drift: things the block reads that aren't in the schema. Always
  // surfaced first so admin notices the broken contract.
  const driftFields = reads.filter((r) => !schemaSet.has(r));

  // Empty universe: no schema fields AND no reads. Caller-side
  // fallback so the tile doesn't stay blank.
  if (schemaFields.length === 0 && reads.length === 0) return null;

  // Schema-empty fallback: no relaySchemas doc yet — render reads[]
  // as plain chips so we don't gate UI on schema generation.
  if (schemaFields.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {reads.slice(0, 8).map((r) => (
          <Chip key={r} kind="read" label={r} />
        ))}
        {reads.length > 8 && (
          <span className="text-[10px] text-muted-foreground self-center">
            +{reads.length - 8}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="font-medium">Schema</span>
        <span>·</span>
        <span>
          {readSet.size} read{readSet.size === 1 ? '' : 's'} of{' '}
          {schemaFields.length} field{schemaFields.length === 1 ? '' : 's'}
        </span>
        {driftFields.length > 0 && (
          <>
            <span>·</span>
            <span className="text-amber-700">
              {driftFields.length} drift
            </span>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {/* Drift fields first — they need attention. */}
        {driftFields.map((f) => (
          <Chip key={`drift-${f}`} kind="drift" label={f} />
        ))}
        {schemaFields.map((f) => (
          <Chip
            key={f}
            kind={readSet.has(f) ? 'read' : 'schema_only'}
            label={f}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  kind,
  label,
}: {
  kind: 'read' | 'schema_only' | 'drift';
  label: string;
}) {
  const styles = {
    read:
      'border-blue-200 bg-blue-50 text-blue-800',
    schema_only:
      'border-border bg-muted/40 text-muted-foreground',
    drift:
      'border-amber-300 bg-amber-50 text-amber-800',
  }[kind];
  const title = {
    read: `Block reads "${label}" from the schema.`,
    schema_only: `Schema has "${label}" but this block doesn't read it.`,
    drift: `Block reads "${label}" but the schema has no such field — drift.`,
  }[kind];
  return (
    <span
      title={title}
      className={[
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border',
        styles,
      ].join(' ')}
    >
      {kind === 'drift' && (
        <span
          className="h-1 w-1 rounded-full bg-amber-500"
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

// ── Filter chip ────────────────────────────────────────────────────

function FilterChip({
  label,
  count,
  active,
  onClick,
  dotClass,
  title,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        active
          ? 'border-foreground/40 bg-foreground/10 text-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
      ].join(' ')}
    >
      {dotClass && (
        <span className={['h-1.5 w-1.5 rounded-full', dotClass].join(' ')} aria-hidden />
      )}
      {label}
      <span
        className={[
          'inline-flex items-center justify-center rounded px-1 min-w-[18px] text-[10px]',
          active ? 'bg-foreground/15' : 'bg-muted text-foreground/70',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  );
}
