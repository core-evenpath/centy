'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ALL_BLOCKS } from '@/app/admin/relay/blocks/previews/registry';
import { RELAY_VERTICALS, getVerticalForSlug, type RelayVertical } from '@/lib/relay/relay-verticals';
import { setBlockSchemaBindingAction } from '@/actions/relay-block-binding';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlockModuleBinding } from '@/lib/relay/module-analytics-types';

// ── Block Gallery (PR fix-6) ────────────────────────────────────────
//
// Vertical-grouped visual gallery of every Relay block, rendered with
// its actual preview component (the same React tree used in
// /admin/relay/blocks). Each block tile shows:
//   - the live design preview
//   - label + family badge
//   - reads chips
//   - per-block "Bound" toggle (PR E11) — flipping it from here
//     persists the same way as on the schema viewer
//
// Performance: 200 previews are too many to mount at once. Each
// vertical accordion section lazy-mounts its blocks only when
// expanded. Collapsing unmounts them.

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

interface Props {
  bindings: BlockModuleBinding[];
}

export default function BlockGalleryView({ bindings }: Props) {
  // Build a vertical → schema slug → blocks index from the runtime
  // registry. Includes EVERY block, even those not currently in the
  // bindings prop (defensive — the registry is the visual source of
  // truth).
  const tree = useMemo(() => {
    type SchemaGroup = { slug: string; blocks: typeof ALL_BLOCKS };
    const verticalMap = new Map<RelayVertical, SchemaGroup[]>();
    const slugMap = new Map<string, typeof ALL_BLOCKS>();

    for (const b of ALL_BLOCKS) {
      const slug = b.module ?? null;
      if (!slug) continue;
      const arr = slugMap.get(slug) ?? [];
      arr.push(b);
      slugMap.set(slug, arr);
    }

    for (const [slug, blocks] of slugMap) {
      const vertical = getVerticalForSlug(slug);
      if (!vertical) continue;
      const groups = verticalMap.get(vertical) ?? [];
      groups.push({ slug, blocks });
      verticalMap.set(vertical, groups);
    }

    // Stable display order: predefined vertical list first, then
    // alphabetised schemas within each vertical.
    return RELAY_VERTICALS
      .filter((v) => verticalMap.has(v))
      .map((v) => ({
        vertical: v,
        groups: (verticalMap.get(v) ?? []).slice().sort((a, b) => a.slug.localeCompare(b.slug)),
      }));
  }, []);

  // bindings prop is keyed by blockId — lookup map for quick access.
  const bindingByBlockId = useMemo(() => {
    const m = new Map<string, BlockModuleBinding>();
    for (const b of bindings) m.set(b.blockId, b);
    return m;
  }, [bindings]);

  // Local override mirror so toggles feel instant without a full
  // server round-trip + page refresh. Keys are blockIds; values are
  // the latest known bindsSchema.
  const [localBindings, setLocalBindings] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<RelayVertical>>(new Set());

  const isBound = (blockId: string): boolean => {
    if (blockId in localBindings) return localBindings[blockId];
    const b = bindingByBlockId.get(blockId);
    if (b && b.bindsSchema === false) return false;
    return true;
  };

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
      <p className="text-xs text-muted-foreground">
        Visual gallery of every Relay block, grouped by vertical and schema.
        Expand a vertical to see its blocks rendered with their actual design
        previews. Each tile lets you toggle the block's binding to its family
        schema (same effect as the toggle on the schema viewer).
      </p>

      {tree.map(({ vertical, groups }) => {
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
                                <div className="flex items-center gap-1 mt-0.5">
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

                            <div
                              className={[
                                'rounded-md border bg-muted/40 p-2 overflow-hidden',
                                bound ? '' : 'grayscale',
                              ].join(' ')}
                              style={{ minHeight: 64 }}
                            >
                              {/* Render the block's actual preview component.
                                  Wrapped in a width-constrained container so
                                  large layouts don't overflow the tile. */}
                              <div style={{ width: 240, maxWidth: '100%' }}>
                                <Preview />
                              </div>
                            </div>

                            {b.reads && b.reads.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {b.reads.slice(0, 6).map((r) => (
                                  <span
                                    key={r}
                                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border bg-background"
                                  >
                                    {r}
                                  </span>
                                ))}
                                {b.reads.length > 6 && (
                                  <span className="text-[10px] text-muted-foreground self-center">
                                    +{b.reads.length - 6}
                                  </span>
                                )}
                              </div>
                            )}
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
      })}
    </div>
  );
}
