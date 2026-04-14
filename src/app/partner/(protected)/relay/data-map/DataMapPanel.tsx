'use client';

// DataMapPanel — top-level Data Map pane. Reads active block ids,
// derives the canonical fields they depend on, fetches live resolved
// values (re-fetching whenever the BindingsProvider bumps its version),
// and renders grouped rows.

import { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import {
    canonicalIdsForBlocks,
    getContractFor,
    isModuleDriven,
} from '@/lib/relay/block-data-contracts';
import { groupCanonicalIds } from '@/lib/relay/canonical-fields';
import {
    resolveFieldValuesAction,
    type ResolvedFieldMap,
} from '@/actions/relay-field-resolver-actions';
import type {
    PartnerModuleSource,
    PartnerDocumentSource,
} from '@/actions/relay-block-sources-actions';
import { useBindings } from '../bindings-store/BindingsProvider';
import DataMapGroup from './DataMapGroup';

interface Props {
    activeBlockIds: string[];
    modules: PartnerModuleSource[];
    documents: PartnerDocumentSource[];
}

export default function DataMapPanel({ activeBlockIds, modules, documents }: Props) {
    const { partnerId, version } = useBindings();

    const canonicalIds = useMemo(
        () => canonicalIdsForBlocks(activeBlockIds),
        [activeBlockIds],
    );

    const consumersByCanonicalId = useMemo(
        () => buildConsumersIndex(activeBlockIds),
        [activeBlockIds],
    );

    const groups = useMemo(() => groupCanonicalIds(canonicalIds), [canonicalIds]);

    const [resolved, setResolved] = useState<ResolvedFieldMap | null>(null);
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        if (!partnerId || canonicalIds.length === 0) {
            setResolved({});
            return;
        }
        let cancelled = false;
        setResolving(true);
        resolveFieldValuesAction(partnerId, canonicalIds)
            .then(res => {
                if (cancelled) return;
                setResolved(res.success ? res.resolved || {} : {});
            })
            .finally(() => {
                if (!cancelled) setResolving(false);
            });
        return () => { cancelled = true; };
        // canonicalIds is a stable array from useMemo; version bumps on
        // every successful binding change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partnerId, canonicalIds.join('|'), version]);

    if (activeBlockIds.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                <Database className="h-5 w-5 mx-auto mb-2 opacity-60" />
                Enable blocks on the right to see their data here.
            </div>
        );
    }

    return (
        <aside className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm font-semibold">Your data map</h2>
                    <p className="text-[11px] text-muted-foreground">
                        Every field your active blocks read, and where each one comes from.
                    </p>
                </div>
                {resolving && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Refreshing
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {groups.map(g => (
                    <DataMapGroup
                        key={g.group}
                        groupName={g.group}
                        fields={g.fields}
                        resolved={resolved}
                        resolving={resolving}
                        consumersByCanonicalId={consumersByCanonicalId}
                        modules={modules}
                        documents={documents}
                    />
                ))}
            </div>
        </aside>
    );
}

// Build a { canonicalId -> blockIds[] } index so each row can say
// "used by Product Card, Compare".
function buildConsumersIndex(activeBlockIds: string[]): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const bid of activeBlockIds) {
        const c = getContractFor(bid);
        const ids = new Set<string>();
        for (const f of c.fields) {
            if (f.canonicalId) ids.add(f.canonicalId);
        }
        if (isModuleDriven(c) && c.suggestedModules?.[0]) {
            ids.add(`${c.suggestedModules[0].slug}.items`);
        }
        for (const id of ids) {
            (out[id] ||= []).push(bid);
        }
    }
    return out;
}
