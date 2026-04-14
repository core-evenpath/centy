'use client';

// ── ActiveBlockCard ──────────────────────────────────────────────────
//
// Slimmed-down card for /partner/relay/blocks. Bindings are now edited
// in the Data Map pane, so this component only:
//   - Renders the live preview
//   - Shows a per-field health strip (dots link back to Data Map rows)
//   - Offers the natural-language AI prompt for block-level tweaks
//   - Lets the partner disable the block

import { useState } from 'react';
import {
  Loader2,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FLOW_STAGE_STYLES } from '@/app/admin/relay/blocks/previews/_types';
import type { VerticalBlockDef } from '@/app/admin/relay/blocks/previews/_types';
import { applyBlockPromptAction } from '@/actions/relay-customization-actions';
import { getContractFor } from '@/lib/relay/block-data-contracts';
import FieldHealthStrip from './block-card/FieldHealthStrip';

export default function ActiveBlockCard({
  partnerId,
  block,
  previewData,
  previewLoading,
  togglePending,
  resolvedMap,
  onToggle,
  onCustomized,
}: {
  partnerId: string;
  block: VerticalBlockDef;
  previewData: Record<string, unknown> | undefined;
  previewLoading: boolean;
  togglePending: boolean;
  resolvedMap?: Record<string, boolean>;
  onToggle: () => void;
  onCustomized: () => void;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const Preview = block.preview;
  const stageStyle = FLOW_STAGE_STYLES[block.stage] || { color: '#eee', textColor: '#555' };
  const contract = getContractFor(block.id);

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
          <div className="mt-2">
            <FieldHealthStrip contract={contract} resolvedMap={resolvedMap} />
          </div>
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

      {/* AI prompt */}
      <div className="px-3 py-2 border-t">
        <AiPromptPanel
          open={aiOpen}
          onToggle={() => setAiOpen(o => !o)}
          partnerId={partnerId}
          blockId={block.id}
          onApplied={onCustomized}
        />
      </div>

      {/* Footer */}
      <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t">
        <Eye className="h-3 w-3" />
        <span>
          {previewData
            ? 'Showing real data'
            : 'Sample preview — connect sources in the data map'}
        </span>
      </div>
    </div>
  );
}

// ── AI prompt (kept from prior card; unchanged behaviour) ────────────

function AiPromptPanel({
  open,
  onToggle,
  partnerId,
  blockId,
  onApplied,
}: {
  open: boolean;
  onToggle: () => void;
  partnerId: string;
  blockId: string;
  onApplied: () => void;
}) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRun = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await applyBlockPromptAction(partnerId, blockId, value.trim());
      if (!res.success) {
        setResult(res.error || 'Could not apply request.');
        return;
      }
      if (!res.changes || res.changes.length === 0) {
        setResult('No changes applied — try being more specific.');
        return;
      }
      setResult(`Applied ${res.changes.length} change${res.changes.length === 1 ? '' : 's'}.`);
      setValue('');
      onApplied();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border bg-muted/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium text-left hover:bg-muted/40 rounded-md"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="flex-1">Customize with AI</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="p-2.5 space-y-2 border-t">
          <textarea
            rows={2}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder='e.g. "Rename the price label to From" or "Show rating and reviews first"'
            className="w-full text-xs border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            disabled={busy}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              Changes apply to this block only.
            </p>
            <Button size="sm" className="h-6 text-[11px] px-2" onClick={handleRun} disabled={busy || !value.trim()}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
            </Button>
          </div>
          {result && (
            <p className="text-[11px] text-muted-foreground">{result}</p>
          )}
        </div>
      )}
    </div>
  );
}
