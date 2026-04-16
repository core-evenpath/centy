'use client';

// ── Block preview dispatcher ───────────────────────────────────────────
//
// Routes by block id: interactive commerce blocks go through the
// production `BlockRenderer` (same renderer the live widget uses, with
// full `BlockCallbacks`), while design-only admin previews continue to
// render via the admin registry component for design review.
//
// This is the fix for "Add to cart is a dead click in Test Chat":
// before, every block rendered through the admin preview which only
// accepts `data`, not callbacks, so interactive events were discarded.

import { getBlockById } from '@/app/admin/relay/blocks/previews/registry';
import BlockRenderer, {
  type RelayBlock,
} from '@/components/relay/blocks/BlockRenderer';
import type {
  BlockCallbacks,
  RelayTheme,
} from '@/components/relay/blocks/types';

// Block ids that should route through the production BlockRenderer
// with live callbacks wired up (cart / booking / checkout / post-sale).
const INTERACTIVE_BLOCKS = new Set<string>([
  'cart',
  'ecom_cart',
  'checkout',
  'ecom_checkout',
  'product_card',
  'product_detail',
  'products',
  'catalog',
  'listings',
  'rooms',
  'services',
  'menu',
  'booking',
  'ecom_order_confirmation',
  'order_confirmation',
  'ecom_order_tracker',
  'order_tracker',
]);

// Map admin-registry block ids (e.g. `ecom_cart`, `product_card`) to
// the `type` union that `BlockRenderer` switches on. Unmapped keys
// pass through as-is so `cart`, `menu`, etc. stay identical.
const RENDERER_TYPE_MAP: Record<string, string> = {
  ecom_cart: 'cart',
  ecom_checkout: 'checkout',
  ecom_order_confirmation: 'order_confirmation',
  ecom_order_tracker: 'order_tracker',
  product_card: 'products',
  product_detail: 'products',
};

interface Props {
  blockId: string;
  blockData?: Record<string, unknown>;
  theme?: RelayTheme;
  callbacks?: BlockCallbacks;
  /** Force the admin-preview path even for interactive blocks. */
  forcePreviewOnly?: boolean;
}

export default function TestChatBlockPreview({
  blockId,
  blockData,
  theme,
  callbacks,
  forcePreviewOnly = false,
}: Props) {
  // Interactive path — only when both theme + callbacks are provided,
  // otherwise fall through to the admin preview (no callbacks to wire).
  if (
    !forcePreviewOnly &&
    INTERACTIVE_BLOCKS.has(blockId) &&
    callbacks &&
    theme
  ) {
    const rendererType = RENDERER_TYPE_MAP[blockId] ?? blockId;
    return (
      <div style={{ padding: '2px 0' }}>
        <BlockRenderer
          block={{
            type: rendererType,
            ...(blockData ?? {}),
          } as RelayBlock}
          theme={theme}
          callbacks={callbacks}
        />
      </div>
    );
  }

  // Design-preview path — admin registry component, no callbacks.
  const block = getBlockById(blockId);
  if (!block) return null;
  const Preview = block.preview;
  return (
    <div style={{ transform: 'scale(0.97)', transformOrigin: 'top left' }}>
      <Preview data={blockData} />
    </div>
  );
}
