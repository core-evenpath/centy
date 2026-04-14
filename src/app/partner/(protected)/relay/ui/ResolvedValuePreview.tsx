'use client';

// Shows the live resolved value for a canonical field. Accepts any
// shape (scalar, module-collection descriptor, literal) and renders a
// short, readable summary. Handles loading + error states.

import { Loader2, AlertTriangle } from 'lucide-react';

interface Props {
    value: unknown;
    loading?: boolean;
    error?: string;
    emptyText?: string;
}

export default function ResolvedValuePreview({
    value,
    loading,
    error,
    emptyText = 'No value yet',
}: Props) {
    if (loading) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Resolving…
            </span>
        );
    }
    if (error) {
        return (
            <span
                className="inline-flex items-center gap-1 text-[11px] text-rose-700"
                title={error}
            >
                <AlertTriangle className="h-3 w-3" />
                {truncate(error, 60)}
            </span>
        );
    }
    const text = summarize(value);
    if (!text) {
        return <span className="text-[11px] italic text-muted-foreground">{emptyText}</span>;
    }
    return (
        <span className="text-[11px] text-foreground/80 font-mono" title={text}>
            {truncate(text, 80)}
        </span>
    );
}

// Best-effort stringification. Module-descriptor shape
// ({moduleId, itemCount, sample?}) gets a friendly "N items" summary
// instead of a raw JSON dump.
function summarize(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if (typeof obj.itemCount === 'number') {
            const count = obj.itemCount;
            const sampleLen = Array.isArray(obj.sample) ? obj.sample.length : 0;
            return sampleLen > 0
                ? `${count} item${count === 1 ? '' : 's'} (showing ${sampleLen})`
                : `${count} item${count === 1 ? '' : 's'}`;
        }
        if (typeof obj.docId === 'string') return `document ${obj.docId}`;
        try {
            return JSON.stringify(value);
        } catch {
            return '[object]';
        }
    }
    return '';
}

function truncate(s: string, n: number): string {
    return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
