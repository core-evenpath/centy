'use client';

import { getBlockById } from '@/app/admin/relay/blocks/previews/registry';

// ── Admin preview dispatcher ─────────────────────────────────────────
//
// Looks up the admin block preview component by id and renders it.
// The preview components are self-contained designs with hardcoded
// sample data (see src/app/admin/relay/blocks/previews/**). No props,
// no partner data, no RAG population — the Gemini response just picks
// which block design best answers the visitor's message, and this
// component renders the matching preview.
//
// If `blockId` doesn't match any registered preview we return null so
// the caller falls back to a plain text bubble.

export default function TestChatBlockPreview({ blockId }: { blockId: string }) {
  const block = getBlockById(blockId);
  if (!block) return null;

  const Preview = block.preview;
  return (
    <div style={{ transform: 'scale(0.97)', transformOrigin: 'top left' }}>
      <Preview />
    </div>
  );
}
