'use client';

// ── Inline block preview for ItemEditor (Phase 3B) ──────────────────
//
// Renders the partner's in-progress item through one of the actual
// chat block renderers, so they can see "what will customers see"
// without leaving the editor. Re-renders on every form change because
// the parent passes `formValues` from react-hook-form's watch().
//
// Block selection: a small picker at the top lets the partner cycle
// through every active block that consumes this content type. The
// list is the same `appearsIn` set the partner already sees on the
// /partner/relay/data tile, so the framing is consistent.
//
// Disabled blocks are still listed so partners can preview them
// before re-enabling.

import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import TestChatBlockPreview from '@/components/partner/relay/test-chat/TestChatBlockPreview';
import { DEFAULT_THEME } from '@/components/relay/blocks/types';
import { normalizeItem } from '@/lib/relay/normalize-item';

interface PreviewBlock {
  id: string;
  label: string;
  description: string;
}

interface Props {
  /** Active blocks consuming this content type. */
  blocks: PreviewBlock[];
  /** Set of partner-disabled block ids (rendered with a hint). */
  disabledBlockIds?: Set<string>;
  /** Live form values from react-hook-form's watch(). */
  formValues: Record<string, any>;
}

export default function BlockPreviewPanel({
  blocks,
  disabledBlockIds,
  formValues,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    blocks[0]?.id ?? null,
  );

  // Synthesize the block-data envelope from the partner's in-progress
  // form state. Mirrors what `buildGenericFromModule` produces server-
  // side for a single-record renderer plus a one-item list.
  const blockData = useMemo(() => {
    const item = normalizeItem({
      id: 'preview',
      name: formValues?.name,
      description: formValues?.description,
      category: formValues?.category,
      price: formValues?.price,
      currency: formValues?.currency,
      isActive: formValues?.isActive ?? true,
      images: Array.isArray(formValues?.images) ? formValues.images : [],
      fields: formValues?.fields ?? {},
    });
    // Single-record renderers read top-level fields; list renderers
    // read `items: [...]`. Spread + items[] covers both shapes.
    const { currency: _itemCurrency, ...firstWithoutCurrency } = item;
    return {
      ...firstWithoutCurrency,
      currency: item.currency,
      items: [item],
    };
  }, [formValues]);

  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
        No active blocks consume this content type yet.
      </div>
    );
  }

  const activeBlock = blocks.find((b) => b.id === activeId) ?? blocks[0];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </div>
          <h3 className="text-sm font-semibold mt-0.5">{activeBlock.label}</h3>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {blocks.length > 1 ? `${blocks.length} blocks` : '1 block'}
        </div>
      </div>

      {activeBlock.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {activeBlock.description}
        </p>
      )}

      {blocks.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {blocks.map((b) => {
            const isActive = b.id === activeBlock.id;
            const isDisabled = disabledBlockIds?.has(b.id) ?? false;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveId(b.id)}
                className={[
                  'inline-flex items-center gap-1 text-[11px] rounded-full border px-2.5 py-1 transition-colors',
                  isActive
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card hover:border-foreground/30',
                  isDisabled && !isActive ? 'opacity-60' : '',
                ].join(' ')}
                title={
                  isDisabled
                    ? `${b.label} (currently hidden in chat)`
                    : b.label
                }
              >
                {isDisabled ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                {b.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 rounded-xl border bg-muted/30 p-3 overflow-y-auto">
        <div className="bg-background rounded-lg p-2 shadow-sm">
          <TestChatBlockPreview
            blockId={activeBlock.id}
            blockData={blockData}
            theme={DEFAULT_THEME}
          />
        </div>
        {disabledBlockIds?.has(activeBlock.id) && (
          <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900">
            This block is currently <strong>hidden</strong> in chat. Customers
            won&apos;t see this until you turn it back on from the
            &ldquo;Appears in&rdquo; menu.
          </div>
        )}
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground italic">
        Preview updates as you type. Save to make it live.
      </p>
    </div>
  );
}
