'use client';

// ── Single extracted-item row ──────────────────────────────────────────
//
// Split out so the review modal stays focused on the list / footer.
// Keeps its own inline editing state for the name field.

import { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ExtractedItem } from '@/lib/relay/ai-ingest/types';

interface Props {
  item: ExtractedItem;
  onUpdate: (patch: Partial<ExtractedItem>) => void;
  onRemove: () => void;
}

const PREVIEW_FIELD_LIMIT = 3;

export default function ReviewItemRow({ item, onUpdate, onRemove }: Props) {
  const [editingName, setEditingName] = useState(false);
  const lowConfidence = item.confidence < 0.6;

  const previewFields = Object.entries(item.fields ?? {})
    .filter(([key]) => !key.startsWith('__'))
    .slice(0, PREVIEW_FIELD_LIMIT);

  return (
    <div
      className={cn(
        'border rounded-lg p-3',
        lowConfidence
          ? 'border-yellow-200 bg-yellow-50/50'
          : 'border-border bg-background',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <Input
              autoFocus
              value={item.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false);
              }}
              className="font-medium"
            />
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{item.name}</h4>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Edit name"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          )}

          {item.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {item.category && <Badge variant="outline">{item.category}</Badge>}
            {typeof item.price === 'number' && item.price > 0 && (
              <Badge variant="outline">
                {item.currency === 'INR' ? '₹' : `${item.currency ?? ''} `}
                {item.price}
              </Badge>
            )}
            <Badge
              variant={item.confidence >= 0.7 ? 'default' : 'secondary'}
              className="text-[10px]"
            >
              {(item.confidence * 100).toFixed(0)}% confidence
            </Badge>
          </div>

          {previewFields.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              {previewFields.map(([k, v]) => (
                <span key={k}>
                  <span className="font-medium">{k}:</span>{' '}
                  {typeof v === 'object' && v !== null
                    ? JSON.stringify(v)
                    : String(v ?? '')}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="flex-shrink-0"
          aria-label={`Remove ${item.name}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
