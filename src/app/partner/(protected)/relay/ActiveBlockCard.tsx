'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Eye,
  Database,
  FileText,
  Slash,
  UserRound,
  ExternalLink,
  CircleCheck,
  CircleAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FLOW_STAGE_STYLES } from '@/app/admin/relay/blocks/previews/_types';
import type { VerticalBlockDef } from '@/app/admin/relay/blocks/previews/_types';
import type { BlockDataSource } from '@/actions/relay-customization-actions';
import type {
  PartnerModuleSource,
  PartnerDocumentSource,
  BlockDiagnostic,
  BlockFieldDiagnosticEntry,
} from '@/actions/relay-block-sources-actions';
import { applyBlockPromptAction } from '@/actions/relay-customization-actions';

// ── ActiveBlockCard ──────────────────────────────────────────────────
//
// Renders a single active block in /partner/relay/blocks with:
//  - The live preview (real data when available)
//  - Contract-derived "Data mapping" panel showing per-field provenance
//  - Source picker scoped to the block's contract (no opaque "Auto")
//  - "Create missing module" CTAs when the block is module-driven
//  - Per-block natural-language AI prompt input

export default function ActiveBlockCard({
  partnerId,
  block,
  source,
  diagnostic,
  modules,
  documents,
  previewData,
  previewLoading,
  togglePending,
  onToggle,
  onSourceChange,
  onCustomized,
}: {
  partnerId: string;
  block: VerticalBlockDef;
  source: BlockDataSource;
  diagnostic: BlockDiagnostic | undefined;
  modules: PartnerModuleSource[];
  documents: PartnerDocumentSource[];
  previewData: Record<string, unknown> | undefined;
  previewLoading: boolean;
  togglePending: boolean;
  onToggle: () => void;
  onSourceChange: (s: BlockDataSource) => void;
  onCustomized: () => void;
}) {
  const [mappingOpen, setMappingOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const Preview = block.preview;
  const stageStyle = FLOW_STAGE_STYLES[block.stage] || { color: '#eee', textColor: '#555' };

  const sourceLabel = deriveSourceLabel(source, diagnostic, modules, documents);

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
            {diagnostic && (
              <ReadyChip ready={diagnostic.ready} summary={diagnostic.readySummary} />
            )}
          </div>
          <p className="font-medium text-sm truncate">{block.label}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {diagnostic?.summary || block.desc}
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

      {/* Data source row */}
      <div className="px-3 py-2 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <SourceIcon kind={sourceLabel.kind} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Data source</p>
            <p className="text-xs font-medium truncate">{sourceLabel.label}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[11px] px-2"
            onClick={() => setMappingOpen(o => !o)}
          >
            {mappingOpen ? (
              <><ChevronUp className="h-3 w-3 mr-0.5" />Hide</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-0.5" />Mapping</>
            )}
          </Button>
        </div>
      </div>

      {/* Mapping panel (collapsible) */}
      {mappingOpen && (
        <div className="px-3 py-3 border-b bg-background space-y-3">
          {/* Per-field provenance */}
          {diagnostic && diagnostic.fields.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Fields</p>
              <ul className="space-y-1">
                {diagnostic.fields.map(f => (
                  <FieldRow key={f.id} field={f} />
                ))}
              </ul>
            </div>
          )}

          {/* Module affordance: existing + missing */}
          {diagnostic && diagnostic.driver === 'module' && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Modules</p>
              {diagnostic.compatibleModules.length > 0 && (
                <div className="space-y-1 mb-2">
                  {diagnostic.compatibleModules.map(m => (
                    <SourceOption
                      key={m.id}
                      label={m.name}
                      description={`${m.itemCount} item${m.itemCount === 1 ? '' : 's'} · ${m.slug}`}
                      icon={<Database className="h-3.5 w-3.5" />}
                      selected={source.type === 'module' && source.id === m.id}
                      onClick={() => onSourceChange({ type: 'module', id: m.id })}
                    />
                  ))}
                </div>
              )}
              {diagnostic.missingModules.length > 0 && (
                <div className="space-y-1">
                  {diagnostic.missingModules.map(mm => (
                    <Link
                      key={mm.slug}
                      href={mm.href}
                      className="flex items-start gap-2 rounded-md border border-dashed px-2.5 py-1.5 hover:bg-muted/40 transition-colors"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">Create “{mm.name}” module</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mm.reason}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Document source option (only meaningful when available) */}
          {documents.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Documents</p>
              <div className="space-y-1">
                {documents.slice(0, 3).map(d => (
                  <SourceOption
                    key={d.id}
                    label={d.name}
                    description={d.mimeType || 'Document'}
                    icon={<FileText className="h-3.5 w-3.5" />}
                    selected={source.type === 'document' && source.id === d.id}
                    onClick={() => onSourceChange({ type: 'document', id: d.id })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Design only */}
          <div>
            <SourceOption
              label="Design only"
              description="Render the sample design without partner data."
              icon={<Slash className="h-3.5 w-3.5" />}
              selected={source.type === 'none'}
              onClick={() => onSourceChange({ type: 'none' })}
            />
          </div>

          {/* AI prompt */}
          <AiPromptPanel
            open={aiOpen}
            onToggle={() => setAiOpen(o => !o)}
            partnerId={partnerId}
            blockId={block.id}
            onApplied={onCustomized}
          />
        </div>
      )}

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
          {diagnostic?.designOnly
            ? 'Active — design preview'
            : previewData
            ? 'Active — showing real data'
            : 'Active — sample preview (connect a source)'}
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function ReadyChip({ ready, summary }: { ready: boolean; summary: string }) {
  if (ready) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
        title={summary}
      >
        <CircleCheck className="h-3 w-3" />
        Ready
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700"
      title={summary}
    >
      <CircleAlert className="h-3 w-3" />
      Needs data
    </span>
  );
}

function FieldRow({ field }: { field: BlockFieldDiagnosticEntry }) {
  const Icon =
    field.sourceKind === 'partner_profile'
      ? UserRound
      : field.sourceKind === 'module_item'
      ? Database
      : field.sourceKind === 'document'
      ? FileText
      : Slash;
  return (
    <li className="flex items-start gap-2 text-[11px]">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{field.label}</span>
          {field.required && <span className="text-muted-foreground">·</span>}
          {field.required && <span className="text-[9px] uppercase tracking-wide text-muted-foreground">required</span>}
          {!field.resolved && (
            <span className="text-[9px] uppercase tracking-wide text-amber-600">missing</span>
          )}
        </div>
        <div className="text-muted-foreground truncate">
          From: <span className="text-foreground/80">{field.sourceLabel}</span>
          {field.settingsHref && (
            <>
              {' · '}
              <Link href={field.settingsHref} className="underline hover:text-foreground">
                Edit in settings
              </Link>
            </>
          )}
        </div>
        {field.value && (
          <div className="text-muted-foreground truncate">
            Current: <span className="text-foreground/80 font-mono text-[10px]">{field.value}</span>
          </div>
        )}
      </div>
    </li>
  );
}

function SourceOption({
  label,
  description,
  icon,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  icon: JSX.Element;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-md border px-2.5 py-1.5 flex items-start gap-2 transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
      }`}
    >
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium truncate">{label}</span>
        <span className="block text-[10px] text-muted-foreground truncate">{description}</span>
      </span>
      {selected && (
        <span className="shrink-0 text-[10px] font-medium text-primary mt-0.5">Selected</span>
      )}
    </button>
  );
}

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

// ── helpers ──────────────────────────────────────────────────────────

function SourceIcon({ kind }: { kind: 'profile' | 'module' | 'document' | 'none' | 'unset' }) {
  const Icon =
    kind === 'profile' ? UserRound :
    kind === 'module' ? Database :
    kind === 'document' ? FileText :
    kind === 'none' ? Slash :
    CircleAlert;
  const cls =
    kind === 'unset' ? 'text-amber-600' : 'text-muted-foreground';
  return <Icon className={`h-4 w-4 ${cls} shrink-0`} />;
}

function deriveSourceLabel(
  source: BlockDataSource,
  diagnostic: BlockDiagnostic | undefined,
  modules: PartnerModuleSource[],
  documents: PartnerDocumentSource[]
): { kind: 'profile' | 'module' | 'document' | 'none' | 'unset'; label: string } {
  if (source.type === 'none') return { kind: 'none', label: 'Design only' };
  if (source.type === 'module') {
    const m = modules.find(x => x.id === source.id);
    return { kind: 'module', label: m ? m.name : 'Module (unavailable)' };
  }
  if (source.type === 'document') {
    const d = documents.find(x => x.id === source.id);
    return { kind: 'document', label: d ? d.name : 'Document (unavailable)' };
  }
  // source.type === 'auto' — use contract to describe what "auto" means
  // for this specific block.
  if (!diagnostic) return { kind: 'profile', label: 'Business Profile' };
  if (diagnostic.designOnly) return { kind: 'none', label: 'Design only' };
  if (diagnostic.driver === 'profile') return { kind: 'profile', label: 'Business Profile' };
  if (diagnostic.driver === 'module') {
    if (diagnostic.compatibleModules.length > 0) {
      return { kind: 'module', label: `${diagnostic.compatibleModules[0].name} (default)` };
    }
    return { kind: 'unset', label: 'Not connected — pick a module' };
  }
  return { kind: 'profile', label: 'Business Profile' };
}
