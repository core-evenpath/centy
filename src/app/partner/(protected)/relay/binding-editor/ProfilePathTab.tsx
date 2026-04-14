'use client';

// ProfilePathTab — autocomplete over flattened businessPersona paths.
// Loads once on mount via listProfilePathsAction; filter is local.
// Selecting a row commits a { kind: 'profile', path } binding.

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { listProfilePathsAction, type ProfilePathRow } from '@/actions/relay-profile-paths-actions';
import type { DataBinding } from '@/lib/relay/data-bindings';

interface Props {
    partnerId: string;
    current: DataBinding | undefined;
    onCommit: (binding: DataBinding) => void;
    disabled?: boolean;
}

export default function ProfilePathTab({ partnerId, current, onCommit, disabled }: Props) {
    const [rows, setRows] = useState<ProfilePathRow[] | null>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        let cancelled = false;
        listProfilePathsAction(partnerId).then(res => {
            if (cancelled) return;
            setRows(res.success ? res.paths || [] : []);
        });
        return () => { cancelled = true; };
    }, [partnerId]);

    const currentPath = current?.kind === 'profile' ? current.path : null;

    const filtered = useMemo(() => {
        if (!rows) return null;
        const q = filter.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            r.path.toLowerCase().includes(q) ||
            r.label.toLowerCase().includes(q) ||
            r.sampleValue.toLowerCase().includes(q)
        );
    }, [rows, filter]);

    return (
        <div className="p-3 space-y-2">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                    className="w-full border rounded pl-7 pr-2 py-1 text-sm"
                    placeholder="Search profile fields…"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    disabled={disabled}
                />
            </div>
            {!filtered ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading profile fields…
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-xs text-muted-foreground py-6 text-center">
                    No matching profile fields. Add them in /partner/settings first.
                </div>
            ) : (
                <ul className="max-h-64 overflow-y-auto divide-y border rounded">
                    {filtered.map(row => {
                        const active = row.path === currentPath;
                        return (
                            <li key={row.path}>
                                <button
                                    type="button"
                                    onClick={() => onCommit({ kind: 'profile', path: row.path })}
                                    disabled={disabled}
                                    className={`w-full text-left px-2 py-1.5 text-xs hover:bg-muted/40 transition-colors ${active ? 'bg-sky-50' : ''}`}
                                >
                                    <div className="font-medium">{row.label}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                        {row.path} {row.sampleValue && <>· <span className="italic">{row.sampleValue}</span></>}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
