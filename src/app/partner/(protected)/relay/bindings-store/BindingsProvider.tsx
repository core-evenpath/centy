'use client';

// ── BindingsProvider ─────────────────────────────────────────────────
//
// Client-side store for the partner's BindingMap. Owns two
// responsibilities:
//
//   1. Mirror the current bindings in React state (the source of truth
//      while the user is on the page).
//   2. Persist changes via setDataBindingAction with optimistic updates
//      and revert-on-failure.
//
// Exposes a `version` counter that bumps on every successful change —
// consumers like the block cards and resolver hooks can depend on
// `version` to re-fetch their previews without tracking individual
// canonical ids themselves.

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { BindingMap, DataBinding } from '@/lib/relay/data-bindings';
import { setDataBindingAction } from '@/actions/relay-data-bindings-actions';

interface BindingsContextValue {
    partnerId: string;
    bindings: BindingMap;
    version: number;
    // Returns the binding for a canonical id, or undefined if none.
    get: (canonicalId: string) => DataBinding | undefined;
    // Optimistically updates + persists. Rejects on persist failure after
    // reverting local state.
    set: (canonicalId: string, binding: DataBinding) => Promise<void>;
    // Opt-in, for consumers that applied bindings out-of-band (e.g. the
    // blueprint agent) and want the rest of the tree to re-fetch.
    bump: () => void;
    // Tracks in-flight writes so the UI can disable controls per-row.
    isPending: (canonicalId: string) => boolean;
}

const BindingsContext = createContext<BindingsContextValue | null>(null);

interface ProviderProps {
    partnerId: string;
    initialBindings: BindingMap;
    children: ReactNode;
}

export function BindingsProvider({ partnerId, initialBindings, children }: ProviderProps) {
    const [bindings, setBindings] = useState<BindingMap>(initialBindings);
    const [version, setVersion] = useState(0);
    const [pending, setPending] = useState<Record<string, true>>({});

    const bump = useCallback(() => setVersion(v => v + 1), []);

    const get = useCallback((canonicalId: string) => bindings[canonicalId], [bindings]);

    const isPending = useCallback((canonicalId: string) => !!pending[canonicalId], [pending]);

    const set = useCallback(
        async (canonicalId: string, binding: DataBinding) => {
            const prior = bindings[canonicalId];
            // Optimistic
            setBindings(prev => ({ ...prev, [canonicalId]: binding }));
            setPending(prev => ({ ...prev, [canonicalId]: true }));
            try {
                const res = await setDataBindingAction(partnerId, canonicalId, binding);
                if (!res.success) {
                    // Revert
                    setBindings(prev => {
                        const next = { ...prev };
                        if (prior === undefined) delete next[canonicalId];
                        else next[canonicalId] = prior;
                        return next;
                    });
                    throw new Error(res.error || 'Failed to save binding');
                }
                setVersion(v => v + 1);
            } finally {
                setPending(prev => {
                    const { [canonicalId]: _, ...rest } = prev;
                    return rest;
                });
            }
        },
        [partnerId, bindings],
    );

    const value = useMemo<BindingsContextValue>(
        () => ({ partnerId, bindings, version, get, set, bump, isPending }),
        [partnerId, bindings, version, get, set, bump, isPending],
    );

    return <BindingsContext.Provider value={value}>{children}</BindingsContext.Provider>;
}

export function useBindings(): BindingsContextValue {
    const ctx = useContext(BindingsContext);
    if (!ctx) throw new Error('useBindings must be used inside <BindingsProvider>');
    return ctx;
}
