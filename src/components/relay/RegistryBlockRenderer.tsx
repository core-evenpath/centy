'use client';

import { useEffect, useState } from 'react';
import { getBlock } from '@/lib/relay/registry';
import { registerAllBlocks } from '@/lib/relay/blocks/index';
import type { BlockTheme, BlockComponentProps } from '@/lib/relay/types';

let registryReady = false;

function ensureRegistry(): void {
  if (!registryReady) {
    registerAllBlocks();
    registryReady = true;
  }
}

// Prime the registry at module load so the first render can resolve
// getBlock() synchronously without a Loading... flash.
ensureRegistry();

interface RegistryBlockRendererProps {
  blockId: string;
  data: Record<string, any>;
  theme: BlockTheme;
  variant?: string;
  overrides?: BlockComponentProps['overrides'];
  onAction?: (action: string, payload?: any) => void;
}

export default function RegistryBlockRenderer({
  blockId,
  data,
  theme,
  variant,
  overrides,
}: RegistryBlockRendererProps) {
  // Belt-and-braces: also ensure the registry is primed before any getBlock()
  // call, in case a lazy/SSR entry point imports the component without running
  // the module-level initializer.
  ensureRegistry();

  const [Component, setComponent] = useState<React.ComponentType<BlockComponentProps> | null>(
    () => getBlock(blockId)?.component ?? null
  );
  const [error, setError] = useState<string | null>(
    () => (getBlock(blockId) ? null : `Block "${blockId}" not found`)
  );

  useEffect(() => {
    const entry = getBlock(blockId);
    if (entry) {
      setComponent(() => entry.component);
      setError(null);
    } else {
      setError(`Block "${blockId}" not found`);
    }
  }, [blockId]);

  if (error) {
    return null;
  }

  if (!Component) {
    return (
      <div style={{ padding: '12px', textAlign: 'center', color: theme.t4, fontSize: '12px' }}>
        Loading...
      </div>
    );
  }

  return <Component data={data} theme={theme} variant={variant} overrides={overrides} />;
}
