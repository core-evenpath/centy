'use client';

// ── Content category selector (Phase 1B) ────────────────────────────
//
// Small admin-side control sitting on the Relay schema viewer. Lets
// admin pin a partner-facing content category on the schema doc,
// overriding the slug-based inference used at /partner/relay/data.
//
// Auto-saves on change with a toast — there's no Save button. The
// "Auto" option clears the override and falls back to inference.

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { setRelaySchemaContentCategoryAction } from '@/actions/relay-schema-edit';
import {
  CONTENT_CATEGORY_META,
  inferContentCategory,
  orderedCategories,
  type ContentCategory,
} from '@/lib/relay/content-categories';

const AUTO_VALUE = '__auto__';

interface Props {
  slug: string;
  /** Current value pinned on the schema doc (null = inferred). */
  initialOverride: ContentCategory | null;
}

export default function ContentCategorySelector({ slug, initialOverride }: Props) {
  const [override, setOverride] = useState<ContentCategory | null>(initialOverride);
  const [isPending, startTransition] = useTransition();

  const inferred = inferContentCategory(slug);
  const effective = override ?? inferred;

  const handleChange = (next: string) => {
    const target: ContentCategory | null =
      next === AUTO_VALUE ? null : (next as ContentCategory);
    if (target === override) return;
    startTransition(async () => {
      const res = await setRelaySchemaContentCategoryAction(slug, target);
      if (res.success) {
        setOverride(target);
        toast.success(
          target === null
            ? `Reverted to auto (${CONTENT_CATEGORY_META[inferred].label})`
            : `Set to ${CONTENT_CATEGORY_META[target].label}`,
        );
      } else {
        toast.error(res.error ?? 'Could not save category');
      }
    });
  };

  const valueForSelect = override ?? AUTO_VALUE;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Partner category:</span>
      <Select value={valueForSelect} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="h-7 w-[180px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO_VALUE}>
            Auto · {CONTENT_CATEGORY_META[inferred].label}
          </SelectItem>
          {orderedCategories().map((cat) => (
            <SelectItem key={cat} value={cat}>
              {CONTENT_CATEGORY_META[cat].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      {!isPending && override === null && (
        <span className="text-[10px] text-muted-foreground italic">
          inferred from slug
        </span>
      )}
      {!isPending && override !== null && (
        <span className="text-[10px] text-amber-700">
          overrides inferred &quot;{CONTENT_CATEGORY_META[inferred].label}&quot;
        </span>
      )}
      <span className="sr-only">Effective category: {effective}</span>
    </div>
  );
}
