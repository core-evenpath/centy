'use client';

// ── ReviewModal ────────────────────────────────────────────────────────
//
// Owns the "local edit" state for the extracted items (seeded from the
// server response, discarded on close). Users can edit the name, drop
// items, then approve → `onConfirm` hands the filtered list back to
// the parent hook for save.

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  ExtractedItem,
  IngestResult,
} from '@/lib/relay/ai-ingest/types';
import ReviewItemRow from './ReviewItemRow';

interface Props {
  open: boolean;
  onClose: () => void;
  result: IngestResult | null;
  onConfirm: (items: ExtractedItem[]) => void;
  saving: boolean;
}

export default function ReviewModal({
  open,
  onClose,
  result,
  onConfirm,
  saving,
}: Props) {
  const [items, setItems] = useState<ExtractedItem[]>([]);

  // Seed the edit list every time a new ingest result arrives.
  useEffect(() => {
    if (result?.items) setItems(result.items);
  }, [result]);

  const handleUpdate = (idx: number, patch: Partial<ExtractedItem>) => {
    setItems((prev) =>
      prev.map((i, k) => (k === idx ? { ...i, ...patch } : i)),
    );
  };

  const handleRemove = (idx: number) => {
    setItems((prev) => prev.filter((_, k) => k !== idx));
  };

  const handleConfirm = () => {
    if (items.length === 0) return;
    onConfirm(items);
  };

  if (!result) return null;

  const avgConfidence = items.length
    ? items.reduce((s, i) => s + i.confidence, 0) / items.length
    : 0;
  const lowConfCount = items.filter((i) => i.confidence < 0.6).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Review extracted items
          </DialogTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              From <strong>{result.sourceLabel || 'source'}</strong>
            </span>
            <span>·</span>
            <span>
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
            <span>·</span>
            <span>
              avg confidence{' '}
              <Badge variant={avgConfidence > 0.7 ? 'default' : 'secondary'}>
                {(avgConfidence * 100).toFixed(0)}%
              </Badge>
            </span>
          </div>
        </DialogHeader>

        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 mb-1">AI warnings</p>
                <ul className="list-disc ml-4 text-amber-800 text-xs space-y-0.5">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {lowConfCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
            <strong>{lowConfCount}</strong> item
            {lowConfCount === 1 ? '' : 's'} have low confidence — review
            carefully before saving.
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 my-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items to review.</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <ReviewItemRow
                key={idx}
                item={item}
                onUpdate={(patch) => handleUpdate(idx, patch)}
                onRemove={() => handleRemove(idx)}
              />
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={items.length === 0 || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {saving
              ? 'Saving…'
              : `Approve & save ${items.length} item${items.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
