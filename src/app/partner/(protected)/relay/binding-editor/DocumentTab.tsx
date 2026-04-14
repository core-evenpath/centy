'use client';

// DocumentTab — pick a vault document. Mirrors ModuleTab in shape.

import type { PartnerDocumentSource } from '@/actions/relay-block-sources-actions';
import type { DataBinding } from '@/lib/relay/data-bindings';

interface Props {
    documents: PartnerDocumentSource[];
    current: DataBinding | undefined;
    onCommit: (binding: DataBinding) => void;
    disabled?: boolean;
}

export default function DocumentTab({ documents, current, onCommit, disabled }: Props) {
    const currentDocId = current?.kind === 'document' ? current.docId : null;

    if (documents.length === 0) {
        return (
            <div className="p-3 text-xs text-muted-foreground">
                No documents in the vault. Upload content in /partner/vault to bind
                a block to it.
            </div>
        );
    }
    return (
        <ul className="max-h-64 overflow-y-auto divide-y border rounded m-3">
            {documents.map(d => {
                const active = d.id === currentDocId;
                return (
                    <li key={d.id}>
                        <button
                            type="button"
                            onClick={() => onCommit({ kind: 'document', docId: d.id })}
                            disabled={disabled}
                            className={`w-full text-left px-2 py-2 text-xs hover:bg-muted/40 transition-colors ${active ? 'bg-amber-50' : ''}`}
                        >
                            <div className="font-medium truncate">{d.name}</div>
                            <div className="text-[10px] text-muted-foreground">{d.mimeType || 'document'}</div>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
