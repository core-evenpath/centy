'use client';

// FieldHealthStrip — compact row of health dots, one per contract
// field, rendered inside an ActiveBlockCard header. Clicking a dot
// scrolls the matching DataMapRow into view and pulses it, creating
// a tight feedback loop between block cards and the data map.

import type { BlockDataContract } from '@/lib/relay/block-data-contracts';
import type { Health } from '@/lib/relay/binding-health';
import { computeHealth } from '@/lib/relay/binding-health';
import { useBindings } from '../bindings-store/BindingsProvider';
import FieldHealthDot from '../ui/FieldHealthDot';

interface Props {
    contract: BlockDataContract;
    // Whether each canonical id currently resolves to real data.
    // Sourced from block diagnostics or a shared resolved map.
    resolvedMap?: Record<string, boolean>;
}

export default function FieldHealthStrip({ contract, resolvedMap }: Props) {
    const { get } = useBindings();

    // Collect one dot per field; for module-driven blocks with no
    // per-field canonical id we add a synthetic collection dot.
    const items = contract.fields
        .filter(f => f.canonicalId)
        .map(f => ({
            canonicalId: f.canonicalId!,
            label: f.label,
            required: f.required,
        }));

    const moduleDriven = contract.fields.some(f => f.source.kind === 'module_item');
    if (moduleDriven && contract.suggestedModules?.[0]) {
        const cid = `${contract.suggestedModules[0].slug}.items`;
        items.push({ canonicalId: cid, label: 'Items', required: true });
    }

    if (items.length === 0) return null;

    return (
        <div className="flex items-center gap-1 flex-wrap">
            {items.map(item => {
                const binding = get(item.canonicalId);
                const resolved = resolvedMap?.[item.canonicalId];
                const health: Health = computeHealth(
                    binding,
                    resolved ? 'ok' : undefined,
                    item.required,
                );
                return (
                    <FieldHealthDot
                        key={item.canonicalId}
                        health={health}
                        label={item.label}
                        title={`${item.label} · click to edit source`}
                        onClick={() => jumpToDataMapRow(item.canonicalId)}
                    />
                );
            })}
        </div>
    );
}

// Scrolls the corresponding DataMapRow into view and adds a short-lived
// ring so the partner sees which field they clicked. Assumes rows
// render with data-canonical-id={id}.
function jumpToDataMapRow(canonicalId: string): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector<HTMLElement>(`[data-canonical-id="${canonicalId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    window.setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
    }, 1400);
}
