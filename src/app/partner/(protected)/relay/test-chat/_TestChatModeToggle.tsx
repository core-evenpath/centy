'use client';

// ── Sample/Live mode toggle (PR fix-16b) ────────────────────────────
//
// Switches the test-chat between two data sources:
//   • Sample (default) — block registry's sampleData, no Firestore
//                        item reads. New partners can drive the bot
//                        through every block immediately.
//   • Live              — partner's businessModules items via the
//                        legacy admin-block-data dispatch.
//
// Toggle drives `mode` passed to getBlockPreviewDataAction.

import { Sparkles, Database } from 'lucide-react';
import type { SampleOrLive } from '@/lib/relay/block-context-types';

interface Props {
  mode: SampleOrLive;
  onChange: (mode: SampleOrLive) => void;
}

export function TestChatModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-background p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange('sample')}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors',
          mode === 'sample'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
        title="Render every block against its built-in sample data. Best for first-time setup."
      >
        <Sparkles className="h-3.5 w-3.5" />
        Sample data
      </button>
      <button
        type="button"
        onClick={() => onChange('live')}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors',
          mode === 'live'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
        title="Render against your live businessModules data. Empty when modules aren't configured."
      >
        <Database className="h-3.5 w-3.5" />
        Live data
      </button>
    </div>
  );
}
