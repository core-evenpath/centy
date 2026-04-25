'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServerBlockData } from '@/app/admin/relay/blocks/previews/_registry-data';
import type { BlockTag } from '@/lib/relay/engine-types';
import { setBlockSchemaBindingAction } from '@/actions/relay-block-binding';
import EngineChips from '../EngineChips';

// ── Schema consumers sidebar (PR E11 — interactive) ────────────────
//
// Shows which blocks consume this Relay schema + which engines they
// belong to. Each row now has a per-block "Bound" toggle: admin can
// unbind a block from its family schema at runtime, no deploy
// required. Unbound blocks render dimmed and skip drift detection
// (analytics action treats them as if they had no module).
//
// Storage: relayBlockConfigs/{blockId}.bindsSchema (boolean,
// default true). Toggle persists via setBlockSchemaBindingAction
// (revalidatePath drives an automatic refresh of the schema viewer
// on next request).

interface Props {
  moduleSlug: string;
  blocks: ServerBlockData[];
  engines: BlockTag[];
  /**
   * Map of blockId → bindsSchema. Only contains explicit overrides;
   * absent ids default to bound (true). Computed server-side and
   * passed in so first paint reflects current state.
   */
  initialBindings: Record<string, boolean>;
}

export default function SchemaConsumersPanel({
  moduleSlug,
  blocks,
  engines,
  initialBindings,
}: Props) {
  // Local state mirror so the toggle feels instant. Server is the
  // source of truth; revalidatePath in the action triggers a refresh
  // that brings client state back in line on the next render.
  const [bindings, setBindings] = useState<Record<string, boolean>>(initialBindings);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const isBound = (blockId: string): boolean => bindings[blockId] !== false;

  const toggle = async (blockId: string) => {
    const next = !isBound(blockId);
    setBindings((prev) => ({ ...prev, [blockId]: next }));
    setPending((prev) => new Set(prev).add(blockId));
    try {
      const res = await setBlockSchemaBindingAction(blockId, next);
      if (!res.success) {
        // Revert local state if the write failed.
        setBindings((prev) => ({ ...prev, [blockId]: !next }));
        toast.error(res.error ?? 'Could not update binding');
      } else {
        toast.success(
          next
            ? `${blockId} bound to ${moduleSlug}`
            : `${blockId} unbound from ${moduleSlug}`,
        );
      }
    } catch (e: any) {
      setBindings((prev) => ({ ...prev, [blockId]: !next }));
      toast.error(e?.message ?? 'Could not update binding');
    } finally {
      setPending((prev) => {
        const copy = new Set(prev);
        copy.delete(blockId);
        return copy;
      });
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Consumers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Engines
          </div>
          <EngineChips engines={engines} emptyLabel="No engines tagged" />
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Blocks ({blocks.length})
          </div>
          {blocks.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              No blocks bind <code>{moduleSlug}</code> in the registry.
            </p>
          ) : (
            <div className="space-y-2">
              {blocks.map((b) => {
                const bound = isBound(b.id);
                const isPending = pending.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={[
                      'rounded-md border px-2.5 py-1.5 transition-opacity',
                      bound ? 'bg-muted/30' : 'bg-muted/10 opacity-60',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
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
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {b.family}
                      </Badge>
                      {/* Bind/unbind toggle. Disabled while a write
                          is in flight to prevent rapid double-clicks
                          racing each other on the same doc. */}
                      <label
                        className="inline-flex items-center gap-1 cursor-pointer select-none shrink-0"
                        title={
                          bound
                            ? 'Bound — drift checks + consumer counts apply.'
                            : 'Unbound — analytics skips this block.'
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
                    {b.reads && b.reads.length > 0 && (
                      <div
                        className={[
                          'mt-1.5 flex flex-wrap gap-1',
                          bound ? '' : 'opacity-70',
                        ].join(' ')}
                      >
                        {b.reads.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border bg-background"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
