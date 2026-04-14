'use client';

// Popover shell for editing a single canonical field's binding. Hosts
// the four tabs (Profile / Module / Document / Literal) plus an
// "Unset" action. Commits via the BindingsProvider so every consumer
// (Data Map rows, block cards) updates in lock-step.

import { useState } from 'react';
import { X, User, Database, FileText, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataBinding } from '@/lib/relay/data-bindings';
import { useBindings } from '../bindings-store/BindingsProvider';
import type { PartnerModuleSource, PartnerDocumentSource } from '@/actions/relay-block-sources-actions';
import ProfilePathTab from './ProfilePathTab';
import ModuleTab from './ModuleTab';
import DocumentTab from './DocumentTab';
import LiteralTab from './LiteralTab';

type TabId = 'profile' | 'module' | 'document' | 'literal';

const TABS: Array<{ id: TabId; label: string; Icon: typeof User }> = [
    { id: 'profile', label: 'Profile',  Icon: User },
    { id: 'module',  label: 'Module',   Icon: Database },
    { id: 'document', label: 'Document', Icon: FileText },
    { id: 'literal', label: 'Literal',  Icon: Type },
];

interface Props {
    canonicalId: string;
    title: string;
    modules: PartnerModuleSource[];
    documents: PartnerDocumentSource[];
    onClose: () => void;
}

export default function BindingEditorPopover({
    canonicalId,
    title,
    modules,
    documents,
    onClose,
}: Props) {
    const { partnerId, get, set, isPending } = useBindings();
    const current = get(canonicalId);
    const pending = isPending(canonicalId);
    const [tab, setTab] = useState<TabId>(pickDefaultTab(current));
    const [error, setError] = useState<string | null>(null);

    const commit = async (binding: DataBinding) => {
        setError(null);
        try {
            await set(canonicalId, binding);
            onClose();
        } catch (e: any) {
            setError(e?.message || 'Could not save binding.');
        }
    };

    const clear = async () => {
        setError(null);
        try {
            await set(canonicalId, { kind: 'unset' });
            onClose();
        } catch (e: any) {
            setError(e?.message || 'Could not clear binding.');
        }
    };

    return (
        <div className="absolute right-0 top-full mt-1 z-40 w-[20rem] rounded-lg border bg-popover shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b">
                <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{canonicalId}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex border-b text-[11px]">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 px-2 py-1.5 inline-flex items-center justify-center gap-1 ${tab === t.id ? 'bg-muted/50 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <t.Icon className="h-3 w-3" />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'profile' && (
                <ProfilePathTab partnerId={partnerId} current={current} onCommit={commit} disabled={pending} />
            )}
            {tab === 'module' && (
                <ModuleTab modules={modules} current={current} onCommit={commit} disabled={pending} />
            )}
            {tab === 'document' && (
                <DocumentTab documents={documents} current={current} onCommit={commit} disabled={pending} />
            )}
            {tab === 'literal' && (
                <LiteralTab current={current} onCommit={commit} disabled={pending} />
            )}

            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                <Button size="sm" variant="ghost" onClick={clear} disabled={pending || !current || current.kind === 'unset'}>
                    Disconnect
                </Button>
                {error && <span className="text-[10px] text-destructive truncate">{error}</span>}
            </div>
        </div>
    );
}

function pickDefaultTab(current: DataBinding | undefined): TabId {
    if (!current) return 'profile';
    switch (current.kind) {
        case 'profile':  return 'profile';
        case 'module':   return 'module';
        case 'document': return 'document';
        case 'literal':  return 'literal';
        default:         return 'profile';
    }
}
