'use client';

// ── RegisteredBlock ─────────────────────────────────────────────────────
//
// Tiny wrapper that resolves a block by id from the code registry
// (`src/lib/relay/registry.ts`) and renders its component. Used by the
// widget's chat when a message carries `blockId` + `blockData` (e.g. an
// order confirmation injected after checkout).
//
// Primes the registry once at module load so the first paint never
// flashes a "registering…" placeholder.

import { useMemo } from 'react';
import { registerAllBlocks } from '@/lib/relay/blocks';
import { getBlock } from '@/lib/relay/registry';
import type { BlockTheme } from '@/lib/relay/types';

// Fire once per process. `registerAllBlocks` is idempotent (internal map
// keyed by block id), so a second call is a no-op.
let registryReady = false;
function ensureRegistry() {
  if (registryReady) return;
  registerAllBlocks();
  registryReady = true;
}
ensureRegistry();

interface Props {
  blockId: string;
  data?: Record<string, unknown>;
  theme: BlockTheme;
  variant?: string;
}

export default function RegisteredBlock({
  blockId,
  data,
  theme,
  variant,
}: Props) {
  ensureRegistry();
  const entry = useMemo(() => getBlock(blockId), [blockId]);
  if (!entry) return null;
  const Component = entry.component;
  return <Component data={data ?? {}} theme={theme} variant={variant} />;
}
