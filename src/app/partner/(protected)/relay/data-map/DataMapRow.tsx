'use client';

// DataMapRow — one canonical field, fully editable:
//   [health dot]  Label                          [chip]  [resolved value]  [Edit]
//                 caption (group/description)
//
// Click the row body or the Edit button to open a BindingEditorPopover
// anchored to this row. Uses data-canonical-id={id} so the block-card
// health strip can scroll + pulse this row when a field dot is clicked.

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CanonicalFieldMeta } from '@/lib/relay/canonical-fields';
import type { Health } from '@/lib/relay/binding-health';
import { computeHealth } from '@/lib/relay/binding-health';
import { useBindings } from '../bindings-store/BindingsProvider';
import FieldHealthDot from '../ui/FieldHealthDot';
import BindingChip from '../ui/BindingChip';
import ResolvedValuePreview from '../ui/ResolvedValuePreview';
import BindingEditorPopover from '../binding-editor/BindingEditorPopover';
import type {
    PartnerModuleSource,
    PartnerDocumentSource,
} from '@/actions/relay-block-sources-actions';
import type { ResolvedField } from '@/actions/relay-field-resolver-actions';

interface Props {
    meta: CanonicalFieldMeta;
    resolved: ResolvedField | undefined;
    resolving: boolean;
    consumerBlocks: string[];        // block ids that read this field
    modules: PartnerModuleSource[];
    documents: PartnerDocumentSource[];
}

export default function DataMapRow({
    meta,
    resolved,
    resolving,
    consumerBlocks,
    modules,
    documents,
}: Props) {
    const { get, isPending } = useBindings();
    const binding = get(meta.id);
    const pending = isPending(meta.id);
    const [open, setOpen] = useState(false);

    const health: Health = computeHealth(binding, resolved?.value, meta.required);

    const moduleNameById = (id: string) => modules.find(m => m.id === id)?.name;
    const documentNameById = (id: string) => documents.find(d => d.id === id)?.name;

    return (
        <div
            data-canonical-id={meta.id}
            className="relative rounded-md border bg-card px-3 py-2 transition-shadow hover:shadow-sm"
        >
            <div className="flex items-start gap-2">
                <div className="pt-1 shrink-0">
                    <FieldHealthDot health={health} label={meta.label} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold truncate">{meta.label}</p>
                        {meta.required && (
                            <span className="text-[9px] uppercase tracking-wide text-rose-600 font-medium">
                                required
                            </span>
                        )}
                        {pending && (
                            <span className="text-[10px] text-muted-foreground italic">saving…</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <BindingChip
                            binding={binding}
                            moduleNameById={moduleNameById}
                            documentNameById={documentNameById}
                        />
                        <ResolvedValuePreview
                            value={resolved?.value}
                            loading={resolving}
                            error={resolved?.error}
                        />
                    </div>
                    {consumerBlocks.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            Used by {consumerBlocks.length} block{consumerBlocks.length === 1 ? '' : 's'}
                            {consumerBlocks.length <= 3 && <>: {consumerBlocks.map(prettyBlock).join(', ')}</>}
                        </p>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs shrink-0"
                    onClick={() => setOpen(o => !o)}
                >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                </Button>
            </div>

            {open && (
                <BindingEditorPopover
                    canonicalId={meta.id}
                    title={meta.label}
                    modules={modules}
                    documents={documents}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}

function prettyBlock(id: string): string {
    return id
        .replace(/^[a-z]+_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
