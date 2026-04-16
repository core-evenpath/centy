'use client';

// ── useAIIngest ─────────────────────────────────────────────────────────
//
// State machine around the two-step AI ingest flow:
//   1. User picks a source + payload in `SourcePickerModal`
//   2. We call `/api/relay/ai-ingest` with `action: 'ingest'`
//   3. On success we open `ReviewModal` with the extracted items
//   4. User approves → we call the same endpoint with `action: 'save'`
// Shape mirrors `useRelaySession` / `useRelayCheckout` — pickerOpen /
// reviewOpen / loading / saving / result, and handlers for each step.

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type {
  ExtractedItem,
  IngestInput,
  IngestResult,
  SaveIngestedResult,
} from '@/lib/relay/ai-ingest/types';

export type IngestSourceInput = Omit<
  IngestInput,
  'partnerId' | 'moduleId' | 'moduleSlug'
>;

interface UseAIIngestOptions {
  partnerId: string;
  moduleId: string;
  moduleSlug: string;
  userId: string;
  onSaveComplete?: (result: SaveIngestedResult) => void;
}

const ENDPOINT = '/api/relay/ai-ingest';

export function useAIIngest(opts: UseAIIngestOptions) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);

  const startIngest = useCallback(() => {
    setResult(null);
    setPickerOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setPickerOpen(false);
    setReviewOpen(false);
    setResult(null);
  }, []);

  const handleSourceSubmit = useCallback(
    async (sourceInput: IngestSourceInput) => {
      if (!opts.partnerId || !opts.moduleId) {
        toast.error('Module not ready — refresh and try again');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ingest',
            ...sourceInput,
            partnerId: opts.partnerId,
            moduleId: opts.moduleId,
            moduleSlug: opts.moduleSlug,
          }),
        });
        const data = (await res.json()) as IngestResult;

        if (!data.success) {
          toast.error(data.error || 'Extraction failed');
          return;
        }
        if (data.items.length === 0) {
          toast.error('AI could not extract any items from this source');
          return;
        }

        setResult(data);
        setPickerOpen(false);
        setReviewOpen(true);
        toast.success(
          `Extracted ${data.items.length} items in ${(data.processingTimeMs / 1000).toFixed(1)}s`,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Extraction failed');
      } finally {
        setLoading(false);
      }
    },
    [opts.partnerId, opts.moduleId, opts.moduleSlug],
  );

  const handleConfirm = useCallback(
    async (approved: ExtractedItem[]) => {
      if (!result) return;
      setSaving(true);
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            partnerId: opts.partnerId,
            moduleId: opts.moduleId,
            items: approved,
            userId: opts.userId,
            source: result.source,
          }),
        });
        const data = (await res.json()) as SaveIngestedResult;

        if (!data.success) {
          toast.error(data.error || 'Save failed');
          return;
        }

        const created = data.created ?? 0;
        const failed = data.failed ?? 0;
        toast.success(
          `Saved ${created} item${created === 1 ? '' : 's'}${failed > 0 ? ` (${failed} failed)` : ''}`,
        );
        setReviewOpen(false);
        setResult(null);
        opts.onSaveComplete?.(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed');
      } finally {
        setSaving(false);
      }
    },
    [result, opts],
  );

  return {
    pickerOpen,
    reviewOpen,
    loading,
    saving,
    result,
    startIngest,
    closeAll,
    handleSourceSubmit,
    handleConfirm,
  };
}

export type UseAIIngestReturn = ReturnType<typeof useAIIngest>;
