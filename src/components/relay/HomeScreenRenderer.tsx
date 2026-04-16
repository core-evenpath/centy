'use client';

import BlockRenderer from './blocks/BlockRenderer';
import type { RelayBlock } from './blocks/BlockRenderer';
import type { BlockCallbacks, RelayTheme } from './blocks/types';
import type { PreloadedBlock } from '@/lib/relay/preloader';

interface HomeScreenRendererProps {
  preloadedBlocks: PreloadedBlock[];
  theme: RelayTheme;
  onSuggestionTap?: (text: string) => void;
  callbacks?: BlockCallbacks;
}

export default function HomeScreenRenderer({
  preloadedBlocks,
  theme,
  callbacks,
}: HomeScreenRendererProps) {
  if (preloadedBlocks.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: theme.t3, fontSize: '13px' }}>
        Setting up your experience...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {preloadedBlocks.map((block) => (
        <div key={block.blockId}>
          <BlockRenderer
            block={{ type: block.blockId, ...(block.data || {}) } as RelayBlock}
            theme={theme}
            callbacks={callbacks}
          />
        </div>
      ))}
    </div>
  );
}
