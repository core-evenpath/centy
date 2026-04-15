'use server';

// ── Profile Path Introspection ───────────────────────────────────────
//
// Flattens the partner's `businessPersona` (and a couple of related
// top-level scalars) into `{ path, label, sampleValue }` rows for the
// profile-path autocomplete inside the binding editor.
//
// Only exposes leaf scalars / strings — arrays and deeply nested
// objects are skipped to keep the list readable and the binding
// target well-defined.

import { db as adminDb } from '@/lib/firebase-admin';

export interface ProfilePathRow {
    path: string;          // e.g. "businessPersona.identity.phone"
    label: string;         // e.g. "Business Profile › Identity › Phone"
    sampleValue: string;   // truncated string representation of current value
}

const MAX_DEPTH = 4;
const MAX_ROWS = 120;
const ROOT_KEYS = ['businessPersona', 'contact', 'settings'];

export async function listProfilePathsAction(
    partnerId: string
): Promise<{ success: boolean; paths?: ProfilePathRow[]; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const snap = await adminDb.collection('partners').doc(partnerId).get();
        if (!snap.exists) return { success: true, paths: [] };
        const data = snap.data() as Record<string, any>;

        const rows: ProfilePathRow[] = [];
        for (const rootKey of ROOT_KEYS) {
            const subtree = data[rootKey];
            if (subtree && typeof subtree === 'object') {
                walk(subtree, [rootKey], rows, 0);
            }
        }
        rows.sort((a, b) => a.path.localeCompare(b.path));
        return { success: true, paths: rows.slice(0, MAX_ROWS) };
    } catch (error: any) {
        console.error('[profile-paths] failed:', error);
        return { success: false, error: error.message };
    }
}

function walk(
    node: any,
    pathParts: string[],
    out: ProfilePathRow[],
    depth: number,
): void {
    if (out.length >= MAX_ROWS) return;
    if (depth > MAX_DEPTH) return;
    if (node == null) return;

    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
        out.push({
            path: pathParts.join('.'),
            label: labelFor(pathParts),
            sampleValue: truncate(String(node), 60),
        });
        return;
    }
    if (Array.isArray(node)) {
        // Skip arrays — bindings target scalar leaves only.
        return;
    }
    if (typeof node === 'object') {
        for (const key of Object.keys(node)) {
            walk(node[key], [...pathParts, key], out, depth + 1);
        }
    }
}

function labelFor(pathParts: string[]): string {
    const [root, ...rest] = pathParts;
    const rootPretty =
        root === 'businessPersona' ? 'Business Profile' :
        root === 'contact'          ? 'Contact' :
        root === 'settings'         ? 'Settings' :
        prettify(root);
    return [rootPretty, ...rest.map(prettify)].join(' › ');
}

function prettify(k: string): string {
    return k
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/^./, c => c.toUpperCase());
}

function truncate(s: string, n: number): string {
    return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
