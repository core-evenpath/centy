'use client';

import RegistryBlockRenderer from './RegistryBlockRenderer';
import type { BlockTheme } from '@/lib/relay/types';
import type { PreloadedBlock } from '@/lib/relay/preloader';

interface HomeScreenRendererProps {
  preloadedBlocks: PreloadedBlock[];
  theme: BlockTheme;
  onSuggestionTap?: (text: string) => void;
}

export default function HomeScreenRenderer({
  preloadedBlocks,
  theme,
  onSuggestionTap,
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
          <RegistryBlockRenderer
            blockId={block.blockId}
            data={block.data}
            theme={theme}
          />
        </div>
      ))}
    </div>
  );
}
