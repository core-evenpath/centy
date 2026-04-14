'use server';

// ── Canonical Field Resolver ─────────────────────────────────────────
//
// Given a partner + a list of canonical field ids, walk their current
// DataBindings (falling back to contract defaults) and return the live
// value that would flow into a block. Used by the Data Map pane to
// show "here's what visitors will actually see" next to each binding.
//
// Resolution order:
//   1. Explicit partner binding (partners/{id}/relayConfig/dataBindings)
//   2. Contract-defined default for the canonical id (e.g. profile path)
//   3. Nothing → value is `undefined`, sourceLabel is "Not connected"

import { db as adminDb } from '@/lib/firebase-admin';
import type { BindingMap, DataBinding } from '@/lib/relay/data-bindings';
import { getPartnerModulesAction, getModuleItemsAction } from '@/actions/modules-actions';
import { getDataBindingsAction } from '@/actions/relay-data-bindings-actions';

export interface ResolvedField {
    value: unknown;           // live value (truncated for collections)
    sourceLabel: string;       // e.g. "Business Profile › Phone", "Module: Products (12 items)"
    error?: string;
}

export type ResolvedFieldMap = Record<string, ResolvedField>;

export async function resolveFieldValuesAction(
    partnerId: string,
    canonicalIds: string[]
): Promise<{ success: boolean; resolved?: ResolvedFieldMap; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const [partnerSnap, modulesRes, bindingsRes] = await Promise.all([
            adminDb.collection('partners').doc(partnerId).get(),
            getPartnerModulesAction(partnerId),
            getDataBindingsAction(partnerId),
        ]);

        const partnerData = partnerSnap.exists ? (partnerSnap.data() as Record<string, any>) : null;
        const partnerModules: Array<{ id: string; slug: string; name: string; itemCount: number }> =
            (modulesRes.success ? modulesRes.data || [] : []).map((m: any) => ({
                id: m.id,
                slug: m.moduleSlug,
                name: m.name || m.moduleSlug,
                itemCount: typeof m.activeItemCount === 'number'
                    ? m.activeItemCount
                    : typeof m.itemCount === 'number' ? m.itemCount : 0,
            }));
        const bindings: BindingMap = bindingsRes.bindings || {};

        const out: ResolvedFieldMap = {};
        for (const cid of canonicalIds) {
            out[cid] = await resolveOne(cid, bindings[cid], partnerId, partnerData, partnerModules);
        }
        return { success: true, resolved: out };
    } catch (error: any) {
        console.error('[resolver] failed:', error);
        return { success: false, error: error.message };
    }
}

async function resolveOne(
    canonicalId: string,
    binding: DataBinding | undefined,
    partnerId: string,
    partnerData: Record<string, any> | null,
    partnerModules: Array<{ id: string; slug: string; name: string; itemCount: number }>,
): Promise<ResolvedField> {
    // Explicit binding
    if (binding && binding.kind !== 'unset') {
        return resolveBinding(binding, partnerId, partnerData, partnerModules);
    }

    // Contract default for known scalars
    const defaultPath = profilePathForCanonical(canonicalId);
    if (defaultPath) {
        const value = readPath(partnerData, defaultPath);
        return {
            value,
            sourceLabel: `Default · Business Profile › ${prettyPath(defaultPath)}`,
        };
    }

    // Collection default: same-slug module if one exists
    if (canonicalId.endsWith('.items')) {
        const slug = canonicalId.slice(0, -'.items'.length);
        const match = partnerModules.find(m => m.slug === slug);
        if (match) {
            return {
                value: { moduleId: match.id, itemCount: match.itemCount },
                sourceLabel: `Default · Module: ${match.name} (${match.itemCount} item${match.itemCount === 1 ? '' : 's'})`,
            };
        }
    }

    return { value: undefined, sourceLabel: 'Not connected' };
}

async function resolveBinding(
    binding: DataBinding,
    partnerId: string,
    partnerData: Record<string, any> | null,
    partnerModules: Array<{ id: string; slug: string; name: string; itemCount: number }>,
): Promise<ResolvedField> {
    switch (binding.kind) {
        case 'profile': {
            const value = readPath(partnerData, binding.path);
            return {
                value,
                sourceLabel: `Business Profile › ${prettyPath(binding.path)}`,
            };
        }
        case 'module': {
            const match = partnerModules.find(m => m.id === binding.moduleId);
            if (!match) {
                return {
                    value: undefined,
                    sourceLabel: `Module (${binding.moduleId})`,
                    error: 'Module not found or not enabled for this partner.',
                };
            }
            // Fetch a small preview — first 3 items — for the Data Map row.
            try {
                const itemsRes = await getModuleItemsAction(partnerId, match.id, { pageSize: 3 });
                const items = itemsRes.success && itemsRes.data ? (itemsRes.data.items || []) : [];
                return {
                    value: { moduleId: match.id, itemCount: match.itemCount, sample: items },
                    sourceLabel: `Module: ${match.name} (${match.itemCount} item${match.itemCount === 1 ? '' : 's'})`,
                };
            } catch {
                return {
                    value: { moduleId: match.id, itemCount: match.itemCount },
                    sourceLabel: `Module: ${match.name}`,
                };
            }
        }
        case 'document':
            return {
                value: { docId: binding.docId },
                sourceLabel: `Document ${binding.docId}`,
            };
        case 'literal':
            return {
                value: binding.value,
                sourceLabel: 'Literal value',
            };
        case 'unset':
            return { value: undefined, sourceLabel: 'Not connected' };
    }
}

// ── Helpers ──────────────────────────────────────────────────────────

function readPath(obj: Record<string, any> | null, path: string): unknown {
    if (!obj) return undefined;
    let cur: any = obj;
    for (const k of path.split('.')) {
        if (cur == null) return undefined;
        cur = cur[k];
    }
    return cur;
}

function prettyPath(path: string): string {
    return path
        .split('.')
        .pop()!
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, c => c.toUpperCase());
}

function profilePathForCanonical(canonicalId: string): string | null {
    switch (canonicalId) {
        case 'business.name':     return 'businessPersona.identity.name';
        case 'business.phone':    return 'businessPersona.identity.phone';
        case 'business.email':    return 'businessPersona.identity.email';
        case 'business.whatsapp': return 'businessPersona.identity.whatsAppNumber';
        case 'business.website':  return 'businessPersona.identity.website';
        case 'business.tagline':  return 'businessPersona.personality.tagline';
        default: return null;
    }
}
