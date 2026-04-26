'use client';

// ── Block visibility drawer (Phase 2) ───────────────────────────────
//
// Side sheet triggered from the "Appears in" row on each partner
// inventory tile. Lists every active block that consumes this content
// type's data, with a toggle per block. Default state for every block
// is enabled — only the disabled set is persisted on the partner doc.
//
// UX principles:
//   • One-click toggle, optimistic UI, auto-save (no Save button).
//   • Status pill makes the on/off state legible at a glance.
//   • Block descriptions sit next to the toggle so partners know
//     what they're hiding without learning block ids.
//   • Footer link bounces them straight to test-chat to verify.

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { setPartnerBlockEnabledAction } from '@/actions/partner-block-overrides';

export interface BlockOverridesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  userId: string;
  /** Display title — typically the schema's friendly name. */
  schemaDisplayName: string;
  /** Singular noun for the content category, e.g. "product". */
  categorySingular: string;
  /** Active blocks consuming this schema. */
  blocks: Array<{ id: string; label: string; description: string }>;
  /** Currently disabled block ids across the whole partner. */
  disabledBlockIds: Set<string>;
  /** Notify parent when the disabled set changes (post-toggle). */
  onDisabledChange: (next: Set<string>) => void;
}

export function BlockOverridesDrawer({
  open,
  onOpenChange,
  partnerId,
  userId,
  schemaDisplayName,
  categorySingular,
  blocks,
  disabledBlockIds,
  onDisabledChange,
}: BlockOverridesDrawerProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleToggle = async (blockId: string, nextEnabled: boolean) => {
    setPendingId(blockId);

    // Optimistic update — write the parent state immediately so the
    // toggle animates without waiting for the round-trip. Reverts on
    // failure below.
    const previous = new Set(disabledBlockIds);
    const optimistic = new Set(disabledBlockIds);
    if (nextEnabled) optimistic.delete(blockId);
    else optimistic.add(blockId);
    onDisabledChange(optimistic);

    try {
      const res = await setPartnerBlockEnabledAction(
        partnerId,
        blockId,
        nextEnabled,
        userId,
      );
      if (!res.success) {
        // Revert + surface the error.
        onDisabledChange(previous);
        toast.error(res.error ?? 'Could not save change');
        return;
      }
      // Reconcile against the server's authoritative set.
      if (res.disabled) onDisabledChange(new Set(res.disabled));
      toast.success(
        nextEnabled
          ? 'Now showing in chat'
          : 'Hidden from chat',
      );
    } catch (err: any) {
      onDisabledChange(previous);
      toast.error(err?.message ?? 'Could not save change');
    } finally {
      setPendingId(null);
    }
  };

  const enabledCount = blocks.filter((b) => !disabledBlockIds.has(b.id)).length;
  const totalCount = blocks.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Customer experience
          </div>
          <SheetTitle className="text-xl">
            Where {schemaDisplayName.toLowerCase()} appears
          </SheetTitle>
          <SheetDescription className="text-xs">
            Each card below is a place in chat where your{' '}
            {categorySingular}s show up. Turn any of them off if you
            don&apos;t want that placement right now.
          </SheetDescription>
          <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>
              <strong className="text-foreground">{enabledCount}</strong> of{' '}
              {totalCount} showing
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {blocks.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              No active blocks consume this content type yet.
            </div>
          ) : (
            blocks.map((block) => {
              const isDisabled = disabledBlockIds.has(block.id);
              const isEnabled = !isDisabled;
              const pending = pendingId === block.id;
              return (
                <div
                  key={block.id}
                  className={[
                    'rounded-lg border p-4 transition-colors flex gap-3 items-start',
                    isEnabled
                      ? 'bg-card hover:border-foreground/20'
                      : 'bg-muted/30 border-dashed',
                  ].join(' ')}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">
                        {block.label}
                      </h3>
                      <StatusPill enabled={isEnabled} />
                    </div>
                    {block.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {block.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center pl-2 pt-0.5">
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(v) => handleToggle(block.id, v)}
                        aria-label={`Toggle ${block.label}`}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t px-6 py-4 text-xs text-muted-foreground flex items-center justify-between">
          <span>Changes apply instantly</span>
          <Link
            href="/partner/relay/test-chat"
            className="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground hover:underline"
          >
            Preview in test chat
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={[
        'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide rounded-full px-1.5 py-0.5',
        enabled
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-muted text-muted-foreground border border-border',
      ].join(' ')}
    >
      {enabled ? 'Showing' : 'Hidden'}
    </span>
  );
}
