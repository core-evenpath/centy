'use client';

import { getBlockById } from '@/app/admin/relay/blocks/previews/registry';

// ── Admin preview dispatcher ─────────────────────────────────────────
//
// Looks up the admin block preview component by id and renders it,
// forwarding any server-built `blockData` (real partner/module data)
// into the preview. A subset of previews (greeting, product_card,
// contact, …) accept an optional `data` prop with a typed shape; all
// others ignore it and render their hardcoded design sample.
//
// If `blockId` doesn't match any registered preview we return null so
// the caller falls back to a plain text bubble.

export default function TestChatBlockPreview({
  blockId,
  blockData,
}: {
  blockId: string;
  blockData?: Record<string, unknown>;
}) {
  const block = getBlockById(blockId);
  if (!block) return null;

  const Preview = block.preview;
  return (
    <div style={{ transform: 'scale(0.97)', transformOrigin: 'top left' }}>
      <Preview data={blockData} />
    </div>
  );
}
