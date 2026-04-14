'use client';

// ModuleTab — pick a partner module. Lists modules passed from the
// explorer; highlights the currently-bound one if any.

import type { PartnerModuleSource } from '@/actions/relay-block-sources-actions';
import type { DataBinding } from '@/lib/relay/data-bindings';

interface Props {
    modules: PartnerModuleSource[];
    current: DataBinding | undefined;
    onCommit: (binding: DataBinding) => void;
    disabled?: boolean;
}

export default function ModuleTab({ modules, current, onCommit, disabled }: Props) {
    const currentModuleId = current?.kind === 'module' ? current.moduleId : null;

    if (modules.length === 0) {
        return (
            <div className="p-3 text-xs text-muted-foreground">
                No modules enabled yet. The Blueprint Assistant can create one for
                you, or enable a system module from /partner/modules.
            </div>
        );
    }
    return (
        <ul className="max-h-64 overflow-y-auto divide-y border rounded m-3">
            {modules.map(m => {
                const active = m.id === currentModuleId;
                return (
                    <li key={m.id}>
                        <button
                            type="button"
                            onClick={() => onCommit({ kind: 'module', moduleId: m.id })}
                            disabled={disabled}
                            className={`w-full text-left px-2 py-2 text-xs hover:bg-muted/40 transition-colors ${active ? 'bg-violet-50' : ''}`}
                        >
                            <div className="font-medium">{m.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                                slug: {m.slug} · {m.itemCount} item{m.itemCount === 1 ? '' : 's'}
                            </div>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
