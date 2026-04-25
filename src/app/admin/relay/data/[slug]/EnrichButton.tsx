'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, Check } from 'lucide-react';
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
  enrichRelaySchemaAction,
  appendFieldsToRelaySchemaAction,
  type EnrichSuggestion,
} from '@/actions/relay-schema-enrich';

// ── AI enrichment button + diff modal (PR E9) ───────────────────────
//
// Lives on the per-schema viewer (/admin/relay/data/[slug]). Click
// "Suggest richer fields" → Gemini proposes additional industry-
// standard fields → admin checks the ones to keep → "Add selected"
// appends them to relaySchemas/{slug}.schema.fields.
//
// Two-step UX is deliberate: AI suggestions are noisy and you want
// admin curation before they land in production. Persist-on-accept
// is scoped to PR E9; full edit/reorder/delete UX is PR E10.

interface Props {
  slug: string;
}

export default function EnrichButton({ slug }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<EnrichSuggestion[] | null>(null);
  const [duplicatesDropped, setDuplicatesDropped] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runEnrich = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuggestions(null);
    setAccepted(new Set());
    try {
      const res = await enrichRelaySchemaAction(slug);
      if (res.success) {
        setSuggestions(res.suggestions);
        setDuplicatesDropped(res.duplicatesDropped);
        // Default-accept everything so a partner just reviewing fast
        // can hit "Add selected" without a click per row. Easy to opt
        // out — uncheck individually.
        setAccepted(new Set(res.suggestions.map((s) => s.name)));
        setIsOpen(true);
      } else {
        setErrorMsg(res.error ?? 'Enrichment failed');
        toast.error(res.error ?? 'Enrichment failed');
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Enrichment failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccepted = (name: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const saveAccepted = async () => {
    if (!suggestions) return;
    const toAppend = suggestions.filter((s) => accepted.has(s.name));
    if (toAppend.length === 0) {
      toast.error('Select at least one field to add.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await appendFieldsToRelaySchemaAction(slug, toAppend);
      if (res.success) {
        toast.success(
          `Added ${res.appended} field${res.appended === 1 ? '' : 's'} to ${slug}`,
        );
        setIsOpen(false);
        setSuggestions(null);
        // Reload so the schema viewer picks up the new fields.
        window.location.reload();
      } else {
        toast.error(res.error ?? 'Save failed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={runEnrich}
        disabled={isLoading}
        className="gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {isLoading ? 'Asking Gemini…' : 'Suggest richer fields'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI suggestions for {slug}
            </DialogTitle>
            <DialogDescription>
              Gemini proposed these additional fields. Uncheck anything
              you don't want; the rest will append to the schema.
            </DialogDescription>
          </DialogHeader>

          {suggestions && suggestions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No new field suggestions
              {duplicatesDropped.length > 0 && (
                <> — {duplicatesDropped.length} suggestions matched existing fields and were dropped.</>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions?.map((s) => {
                const isChecked = accepted.has(s.name);
                return (
                  <label
                    key={s.name}
                    className={`flex items-start gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAccepted(s.name)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{s.name}</span>
                        <code className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5">
                          {s.type}
                        </code>
                        {s.isRequired && (
                          <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5">
                            Required
                          </span>
                        )}
                        <span className="inline-flex gap-1 text-[10px] text-muted-foreground">
                          {[
                            s.showInList && 'List',
                            s.showInCard && 'Card',
                            s.isSearchable && 'Search',
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
              {duplicatesDropped.length > 0 && (
                <div className="text-[11px] text-muted-foreground pt-2">
                  {duplicatesDropped.length} suggestion
                  {duplicatesDropped.length === 1 ? '' : 's'} matched existing fields and{' '}
                  {duplicatesDropped.length === 1 ? 'was' : 'were'} dropped:{' '}
                  {duplicatesDropped.map((n) => (
                    <code key={n} className="bg-slate-100 rounded px-1 mr-1">
                      {n}
                    </code>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-800 text-sm px-3 py-2">
              {errorMsg}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={saveAccepted}
              disabled={isSaving || !suggestions || accepted.size === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Add {accepted.size} field{accepted.size === 1 ? '' : 's'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
