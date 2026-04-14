'use client';

// LiteralTab — free-text literal value. Minimal; just an input +
// "Set literal" button. Useful for small overrides like a welcome
// message or a temporary phone number during setup.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { DataBinding } from '@/lib/relay/data-bindings';

interface Props {
    current: DataBinding | undefined;
    onCommit: (binding: DataBinding) => void;
    disabled?: boolean;
}

export default function LiteralTab({ current, onCommit, disabled }: Props) {
    const initial = current?.kind === 'literal' ? String(current.value ?? '') : '';
    const [text, setText] = useState(initial);
    return (
        <div className="p-3 space-y-2">
            <label className="text-xs font-medium">Literal value</label>
            <textarea
                className="w-full border rounded px-2 py-1 text-sm min-h-[72px]"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. +1 555 0100"
                disabled={disabled}
            />
            <div className="flex justify-end">
                <Button
                    size="sm"
                    onClick={() => onCommit({ kind: 'literal', value: text })}
                    disabled={disabled || text.trim() === ''}
                >
                    Set literal
                </Button>
            </div>
        </div>
    );
}
