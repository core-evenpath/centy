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
  const [Component, setComponent] = useState<React.ComponentType<BlockComponentProps> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureRegistry();
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
