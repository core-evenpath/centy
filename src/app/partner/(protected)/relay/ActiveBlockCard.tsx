'use client';

// ── ActiveBlockCard ──────────────────────────────────────────────────
//
// Minimal card for /partner/relay/blocks. Shows the block identity, a
// live preview, and a toggle to disable it. Data mapping lives
// elsewhere — this page is only for enabling/disabling blocks.

import { Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FLOW_STAGE_STYLES } from '@/app/admin/relay/blocks/previews/_types';
import type { VerticalBlockDef } from '@/app/admin/relay/blocks/previews/_types';

export default function ActiveBlockCard({
  block,
  previewData,
  previewLoading,
  togglePending,
  onToggle,
}: {
  block: VerticalBlockDef;
  previewData: Record<string, unknown> | undefined;
  previewLoading: boolean;
  togglePending: boolean;
  onToggle: () => void;
}) {
  const Preview = block.preview;
  const stageStyle = FLOW_STAGE_STYLES[block.stage] || { color: '#eee', textColor: '#555' };

  return (
    <div className="rounded-lg border bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-3 border-b">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">{block.family}</Badge>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: stageStyle.color, color: stageStyle.textColor }}
            >
              {block.stage}
            </span>
          </div>
          <p className="font-medium text-sm truncate">{block.label}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {block.desc}
          </p>
        </div>
        <button
          onClick={onToggle}
          disabled={togglePending}
          className={`relative shrink-0 h-6 w-11 rounded-full transition-colors bg-primary ${
            togglePending ? 'opacity-50 cursor-wait' : 'cursor-pointer'
          }`}
          aria-label="Disable block"
          title="Click to disable"
        >
          <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform translate-x-5" />
        </button>
      </div>

      {/* Live preview */}
      <div className="p-3 bg-muted/30 min-h-[200px] flex items-start justify-center overflow-hidden flex-1">
        <div className="w-full max-w-[320px] pointer-events-none relative">
          {previewLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 rounded">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          <Preview data={previewData} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t">
        <Eye className="h-3 w-3" />
        <span>
          {previewData ? 'Showing real data' : 'Sample preview'}
        </span>
      </div>
    </div>
  );
}
