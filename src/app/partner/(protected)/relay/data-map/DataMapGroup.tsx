'use client';

// DataMapGroup — header + rows for one canonical-field group
// (Business profile, Catalogs, etc). Purely presentational.

import type { CanonicalFieldMeta } from '@/lib/relay/canonical-fields';
import type {
    PartnerModuleSource,
    PartnerDocumentSource,
} from '@/actions/relay-block-sources-actions';
import type { ResolvedFieldMap } from '@/actions/relay-field-resolver-actions';
import DataMapRow from './DataMapRow';

interface Props {
    groupName: string;
    fields: CanonicalFieldMeta[];
    resolved: ResolvedFieldMap | null;
    resolving: boolean;
    consumersByCanonicalId: Record<string, string[]>;
    modules: PartnerModuleSource[];
    documents: PartnerDocumentSource[];
}

export default function DataMapGroup({
    groupName,
    fields,
    resolved,
    resolving,
    consumersByCanonicalId,
    modules,
    documents,
}: Props) {
    return (
        <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-1">
                {groupName}
            </h3>
            <div className="space-y-1.5">
                {fields.map(f => (
                    <DataMapRow
                        key={f.id}
                        meta={f}
                        resolved={resolved ? resolved[f.id] : undefined}
                        resolving={resolving && !resolved}
                        consumerBlocks={consumersByCanonicalId[f.id] || []}
                        modules={modules}
                        documents={documents}
                    />
                ))}
            </div>
        </div>
    );
}
