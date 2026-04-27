'use client';

// ── Apply curated schema button (Step 1) ────────────────────────────
//
// Replaces the Gemini-driven "Suggest richer fields" button. Now:
//
//   1. Click → preview the diff between the curated schema (TS file)
//      and the live relaySchemas/{slug} doc.
//   2. Modal shows fields to add / remove / change type / unchanged.
//   3. Confirm → applyCuratedSchemaAction overwrites schema.fields[]
//      with the curation. Admin's contentCategory + name + non-
//      boilerplate description survive (Step 0 + apply preserve
//      semantics).
//
// When no curation exists for the slug, the button is disabled with
// a hint pointing at where to add one.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  applyCuratedSchemaAction,
  previewCuratedSchemaAction,
  type CuratedSchemaPreview,
} from '@/actions/relay-schema-apply-curated';

interface Props {
  slug: string;
}

export default function EnrichButton({ slug }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<CuratedSchemaPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Probe curation availability on mount so the button can render
  // disabled with an explanation when nothing's authored yet.
  useEffect(() => {
    let cancelled = false;
    setIsPreviewLoading(true);
    previewCuratedSchemaAction(slug)
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .finally(() => {
        if (!cancelled) setIsPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const openModal = async () => {
    // Re-fetch on open so the diff reflects any admin edits made in
    // the SchemaEditor since the page loaded.
    setIsPreviewLoading(true);
    try {
      const res = await previewCuratedSchemaAction(slug);
      setPreview(res);
      setIsOpen(true);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const apply = async () => {
    setIsApplying(true);
    try {
      const res = await applyCuratedSchemaAction(slug);
      if (!res.success) {
        toast.error(res.error ?? 'Apply failed');
        return;
      }
      const preservedBits: string[] = [];
      if (res.preservedContentCategory) preservedBits.push('contentCategory');
      if (res.preservedName) preservedBits.push('name');
      if (res.preservedDescription) preservedBits.push('description');
      toast.success(
        `Applied ${res.appliedFieldCount} fields${
          preservedBits.length > 0 ? ` · preserved ${preservedBits.join(', ')}` : ''
        }`,
      );
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Apply failed');
    } finally {
      setIsApplying(false);
    }
  };

  const available = preview?.available ?? false;
  const hasChanges =
    available &&
    preview &&
    preview.toAdd.length + preview.toRemove.length + preview.toChange.length > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openModal}
        disabled={isPreviewLoading || !available}
        className="gap-1.5"
        title={
          available
            ? 'Apply the curated schema definition from src/lib/relay/schema-curations/'
            : 'No curation file exists for this slug yet. Add one under src/lib/relay/schema-curations/{vertical}/.'
        }
      >
        {isPreviewLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {isPreviewLoading
          ? 'Checking…'
          : available
            ? 'Apply curated schema'
            : 'No curation yet'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Apply curated schema for {slug}
            </DialogTitle>
            <DialogDescription>
              Compares the live <code>relaySchemas/{slug}</code> doc to
              the curated definition under{' '}
              <code>src/lib/relay/schema-curations/</code>. Apply to
              overwrite <code>schema.fields[]</code>; admin-set{' '}
              <code>contentCategory</code>, <code>name</code>, and
              non-boilerplate <code>description</code> are preserved.
            </DialogDescription>
          </DialogHeader>

          {preview && preview.success && preview.available && (
            <div className="space-y-4">
              <DiffSection
                title="To add"
                items={preview.toAdd}
                tone="add"
                emptyMessage="Nothing new — every curated field already exists."
              />
              <DiffSection
                title="To remove"
                items={preview.toRemove}
                tone="remove"
                emptyMessage="Nothing extra in the live schema — clean."
              />
              <ChangeSection items={preview.toChange} />
              <DiffSection
                title="Unchanged"
                items={preview.unchanged}
                tone="neutral"
                emptyMessage="No identical fields between curation and live."
                collapsible
              />

              {!hasChanges && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  Live schema already matches the curation. Apply to refresh
                  field metadata (descriptions, validation, etc.).
                </div>
              )}
            </div>
          )}

          {preview && preview.success && !preview.available && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                No curation file exists for <code>{slug}</code> yet. Create one
                under <code>src/lib/relay/schema-curations/{'{'}vertical{'}'}/</code>{' '}
                and re-open this dialog.
              </span>
            </div>
          )}

          {preview && !preview.success && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {preview.error ?? 'Could not load preview'}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isApplying}>
              Cancel
            </Button>
            <Button
              onClick={apply}
              disabled={isApplying || !available || !preview?.success}
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Apply {preview?.curatedFieldCount ?? 0} fields
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Diff sections ──────────────────────────────────────────────────

function DiffSection({
  title,
  items,
  tone,
  emptyMessage,
  collapsible = false,
}: {
  title: string;
  items: string[];
  tone: 'add' | 'remove' | 'neutral';
  emptyMessage: string;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapsible);
  const toneClasses =
    tone === 'add'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'remove'
        ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-border bg-muted/30 text-muted-foreground';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title} ({items.length})
        </h4>
        {collapsible && items.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((s) => !s)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            {expanded ? 'collapse' : 'expand'}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
      ) : expanded ? (
        <div className={`flex flex-wrap gap-1 rounded border px-2 py-1.5 ${toneClasses}`}>
          {items.map((name) => (
            <code
              key={name}
              className="text-[11px] bg-background/60 rounded px-1.5 py-0.5"
            >
              {name}
            </code>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ChangeSection({
  items,
}: {
  items: Array<{ name: string; was: string; now: string }>;
}) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        Type changes ({items.length})
      </h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No type drifts between curation and live.
        </p>
      ) : (
        <div className="rounded border border-amber-200 bg-amber-50 text-amber-900 px-2 py-1.5 space-y-0.5">
          {items.map(({ name, was, now }) => (
            <div key={name} className="text-[11px] font-mono">
              <strong>{name}</strong>:{' '}
              <code className="bg-background/60 rounded px-1">{was}</code>
              {' → '}
              <code className="bg-background/60 rounded px-1">{now}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
