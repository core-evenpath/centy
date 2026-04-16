// ── Shared chat message shape for the relay widget ──────────────────────
//
// Lives in its own file (no `'use client'` — type-only) so `RelayWidget`,
// `ChatInterface`, and helpers like the checkout overlay can agree on
// the schema without circular imports.

import type { BlockResolution } from '@/lib/relay/block-resolver';

export interface RelayChatMessage {
  id: string;
  role: 'customer' | 'assistant';
  text: string;
  followUps?: string[];
  timestamp: number;

  // Legacy block-resolver path (intent-engine driven).
  block?: BlockResolution;

  // Registry-driven block render. Set when a system event (e.g. order
  // confirmation) needs to display a specific block with typed data.
  blockId?: string;
  blockData?: Record<string, unknown>;
}
