'use client';

// Renders a DataBinding as a compact one-line chip. Used by the Data
// Map rows and (potentially) the binding editor header. No click
// behaviour — pure presentation.

import { Database, FileText, User, Type, CircleOff } from 'lucide-react';
import type { DataBinding } from '@/lib/relay/data-bindings';

interface Props {
    binding: DataBinding | undefined;
    // Optional module/document lookup to show human names instead of
    // raw ids. Caller passes the same arrays used in the explorer.
    moduleNameById?: (id: string) => string | undefined;
    documentNameById?: (id: string) => string | undefined;
    className?: string;
}

export default function BindingChip({
    binding,
    moduleNameById,
    documentNameById,
    className = '',
}: Props) {
    const { Icon, text, tone } = describe(binding, moduleNameById, documentNameById);
    return (
        <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border ${tone} ${className}`}
        >
            <Icon className="h-3 w-3" />
            <span className="truncate max-w-[14rem]">{text}</span>
        </span>
    );
}

function describe(
    b: DataBinding | undefined,
    moduleNameById?: (id: string) => string | undefined,
    documentNameById?: (id: string) => string | undefined,
): { Icon: typeof Database; text: string; tone: string } {
    if (!b || b.kind === 'unset') {
        return {
            Icon: CircleOff,
            text: 'Not connected',
            tone: 'bg-slate-50 text-slate-500 border-slate-200',
        };
    }
    switch (b.kind) {
        case 'profile':
            return {
                Icon: User,
                text: prettyProfilePath(b.path),
                tone: 'bg-sky-50 text-sky-700 border-sky-200',
            };
        case 'module': {
            const name = moduleNameById?.(b.moduleId) ?? b.moduleId;
            return {
                Icon: Database,
                text: `Module: ${name}`,
                tone: 'bg-violet-50 text-violet-700 border-violet-200',
            };
        }
        case 'document': {
            const name = documentNameById?.(b.docId) ?? b.docId;
            return {
                Icon: FileText,
                text: `Doc: ${name}`,
                tone: 'bg-amber-50 text-amber-700 border-amber-200',
            };
        }
        case 'literal':
            return {
                Icon: Type,
                text: `"${String(b.value).slice(0, 24)}"`,
                tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            };
    }
}

function prettyProfilePath(path: string): string {
    const leaf = path.split('.').pop() || path;
    const pretty = leaf.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    return `Profile › ${pretty}`;
}
