'use client';

// Tiny colored dot with tooltip, one per block field. Click optional
// (used by the block card's health strip to jump to a Data Map row).

import type { Health } from '@/lib/relay/binding-health';
import { HEALTH_STYLES } from '@/lib/relay/binding-health';

interface Props {
    health: Health;
    label: string;
    onClick?: () => void;
    title?: string;   // optional override for the native tooltip
}

export default function FieldHealthDot({ health, label, onClick, title }: Props) {
    const style = HEALTH_STYLES[health];
    const tooltip = title ?? `${label} · ${style.label}`;
    const content = (
        <span
            className={`inline-block h-2 w-2 rounded-full ${style.dot}`}
            aria-hidden
        />
    );
    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                title={tooltip}
                aria-label={tooltip}
                className="inline-flex items-center justify-center p-0.5 rounded hover:bg-muted/60 transition-colors"
            >
                {content}
            </button>
        );
    }
    return (
        <span className="inline-flex items-center" title={tooltip} aria-label={tooltip}>
            {content}
        </span>
    );
}
