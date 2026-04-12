'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ALL_SUB_VERTICALS,
  SHARED_BLOCKS,
  getBlocksForFunction,
} from '@/app/admin/relay/blocks/previews/registry';
import { FLOW_STAGE_STYLES } from '@/app/admin/relay/blocks/previews/_types';
import type { VerticalBlockDef } from '@/app/admin/relay/blocks/previews/_types';
import {
  getPartnerCustomizationAction,
  toggleBlockAction,
} from '@/actions/relay-customization-actions';

interface Props {
  partnerId: string;
  defaultFunctionId: string | null;
}

export default function RelayBlockExplorer({ partnerId, defaultFunctionId }: Props) {
  const [selectedId, setSelectedId] = useState<string>(defaultFunctionId || '');
  const [overrides, setOverrides] = useState<Record<string, { enabled: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await getPartnerCustomizationAction(partnerId);
        if (res.success && res.customization) {
          const norm: Record<string, { enabled: boolean }> = {};
          for (const [id, v] of Object.entries(res.customization.blockOverrides || {})) {
            norm[id] = { enabled: (v as any)?.enabled !== false };
          }
          setOverrides(norm);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [partnerId]);

  useEffect(() => {
    if (defaultFunctionId && !selectedId) setSelectedId(defaultFunctionId);
  }, [defaultFunctionId, selectedId]);

  const blocks: VerticalBlockDef[] = useMemo(() => {
    if (!selectedId) return SHARED_BLOCKS;
    return getBlocksForFunction(selectedId);
  }, [selectedId]);

  const selectedSub = useMemo(
    () => ALL_SUB_VERTICALS.find(s => s.id === selectedId),
    [selectedId]
  );

  const isEnabled = (blockId: string): boolean => {
    // Default: enabled unless explicitly disabled by partner
    const o = overrides[blockId];
    return o ? o.enabled : true;
  };

  const handleToggle = async (blockId: string) => {
    if (pendingBlockId) return;
    const next = !isEnabled(blockId);
    setPendingBlockId(blockId);
    // Optimistic update
    setOverrides(prev => ({ ...prev, [blockId]: { enabled: next } }));
    try {
      const res = await toggleBlockAction(partnerId, blockId, next);
      if (!res.success) {
        // Revert on failure
        setOverrides(prev => ({ ...prev, [blockId]: { enabled: !next } }));
      }
    } finally {
      setPendingBlockId(null);
    }
  };

  const enabledCount = blocks.filter(b => isEnabled(b.id)).length;

  return (
    <div className="space-y-4">
      {/* Sub-vertical selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Sub-category:</label>
        <div className="relative flex-1 max-w-sm">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full appearance-none border rounded-md px-3 py-2 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Shared blocks only</option>
            {ALL_SUB_VERTICALS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.id === defaultFunctionId ? ' (yours)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <div className="text-xs text-muted-foreground">
          {enabledCount} of {blocks.length} active
        </div>
      </div>

      {selectedSub && (
        <div className="text-xs text-muted-foreground">
          Showing blocks for <span className="font-medium text-foreground">{selectedSub.name}</span>
          {' '}— toggle each one to control whether your AI assistant may render it.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {blocks.map(b => {
            const on = isEnabled(b.id);
            const Preview = b.preview;
            const stageStyle = FLOW_STAGE_STYLES[b.stage] || { color: '#eee', textColor: '#555' };
            const pending = pendingBlockId === b.id;
            return (
              <div
                key={b.id}
                className={`rounded-lg border bg-card transition-all ${on ? '' : 'opacity-60'}`}
              >
                <div className="flex items-center justify-between gap-2 p-3 border-b">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{b.family}</Badge>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: stageStyle.color, color: stageStyle.textColor }}
                      >
                        {b.stage}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate">{b.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{b.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(b.id)}
                    disabled={pending}
                    className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${
                      on ? 'bg-primary' : 'bg-muted'
                    } ${pending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    aria-label={on ? 'Disable block' : 'Enable block'}
                    title={on ? 'Click to disable' : 'Click to enable'}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        on ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="p-3 bg-muted/30 min-h-[180px] flex items-start justify-center overflow-hidden">
                  <div className="w-full max-w-[320px] pointer-events-none">
                    <Preview />
                  </div>
                </div>
                <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t">
                  {on ? (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Active — AI can render this block</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span>Hidden — AI will skip this block</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
