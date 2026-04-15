'use server';

// ── Data Bindings & Blueprint Agent ──────────────────────────────────
//
// This file owns the lifeline of partner-level data flow for Relay:
//
//   1. Data Bindings (partners/{id}/relayConfig/dataBindings)
//      — A map from canonical field id (e.g. 'business.phone',
//      'products.items') to a DataBinding describing *where the value
//      comes from*: partner profile path, a module id, a document id,
//      or a literal. Bindings are shared across blocks, so one piece
//      of partner data lights up every block that needs it.
//
//   2. Blueprint Agent — Gemini-backed advisor. Given active blocks +
//      current partner state (profile gaps, missing modules, unset
//      bindings) it proposes a typed list of actions:
//
//        { kind: 'create_module', slug, name }
//        { kind: 'bind', canonicalId, binding }
//        { kind: 'fill_profile', path, hint }
//
//      The partner reviews and approves; nothing is written without
//      approval.

import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import type { BindingMap, DataBinding } from '@/lib/relay/data-bindings';
import {
    getContractFor,
    canonicalIdsForBlocks,
    isModuleDriven,
} from '@/lib/relay/block-data-contracts';
import { getPartnerModulesAction, enablePartnerModuleAction } from '@/actions/modules-actions';

// ── Bindings CRUD ────────────────────────────────────────────────────

export async function getDataBindingsAction(
    partnerId: string
): Promise<{ success: boolean; bindings?: BindingMap; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const doc = await adminDb
            .collection(`partners/${partnerId}/relayConfig`)
            .doc('dataBindings')
            .get();
        const bindings = (doc.exists ? (doc.data()?.bindings as BindingMap) : null) || {};
        return { success: true, bindings };
    } catch (error: any) {
        console.error('[bindings] get failed:', error);
        return { success: false, error: error.message };
    }
}

export async function setDataBindingAction(
    partnerId: string,
    canonicalId: string,
    binding: DataBinding
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const docRef = adminDb
            .collection(`partners/${partnerId}/relayConfig`)
            .doc('dataBindings');
        const doc = await docRef.get();
        const existing = (doc.exists ? (doc.data()?.bindings as BindingMap) : null) || {};
        existing[canonicalId] = binding;
        await docRef.set(
            { bindings: existing, updatedAt: new Date().toISOString() },
            { merge: true }
        );
        revalidatePath('/partner/relay');
        revalidatePath('/partner/relay/blocks');
        return { success: true };
    } catch (error: any) {
        console.error('[bindings] set failed:', error);
        return { success: false, error: error.message };
    }
}

export async function setManyDataBindingsAction(
    partnerId: string,
    entries: Array<{ canonicalId: string; binding: DataBinding }>
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const docRef = adminDb
            .collection(`partners/${partnerId}/relayConfig`)
            .doc('dataBindings');
        const doc = await docRef.get();
        const existing = (doc.exists ? (doc.data()?.bindings as BindingMap) : null) || {};
        for (const { canonicalId, binding } of entries) {
            existing[canonicalId] = binding;
        }
        await docRef.set(
            { bindings: existing, updatedAt: new Date().toISOString() },
            { merge: true }
        );
        revalidatePath('/partner/relay');
        revalidatePath('/partner/relay/blocks');
        return { success: true };
    } catch (error: any) {
        console.error('[bindings] setMany failed:', error);
        return { success: false, error: error.message };
    }
}

// ── Blueprint types ──────────────────────────────────────────────────

export type BlueprintAction =
    | { kind: 'create_module'; slug: string; name: string; reason: string }
    | { kind: 'bind'; canonicalId: string; binding: DataBinding; reason: string }
    | { kind: 'fill_profile'; path: string; hint: string; reason: string };

export interface BlueprintPlan {
    summary: string;
    actions: BlueprintAction[];
    // Reference info for the UI.
    readiness: {
        totalBlocks: number;
        readyBlocks: number;
        unmetCanonicalIds: string[];
    };
}

// ── Readiness calc (cheap, deterministic) ────────────────────────────

export async function computeBlueprintContextAction(
    partnerId: string,
    activeBlockIds: string[]
): Promise<{
    success: boolean;
    context?: {
        partnerProfile: Record<string, any> | null;
        partnerModules: Array<{ id: string; slug: string; name: string; itemCount: number }>;
        bindings: BindingMap;
        canonicalIds: string[];
        unresolved: string[];
    };
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const [partnerSnap, modulesRes, bindingsRes] = await Promise.all([
            adminDb.collection('partners').doc(partnerId).get(),
            getPartnerModulesAction(partnerId),
            getDataBindingsAction(partnerId),
        ]);

        const partnerProfile = partnerSnap.exists ? (partnerSnap.data() as Record<string, any>) : null;
        const partnerModules = (modulesRes.success ? modulesRes.data || [] : []).map((m: any) => ({
            id: m.id,
            slug: m.moduleSlug,
            name: m.name || m.moduleSlug,
            itemCount: typeof m.activeItemCount === 'number'
                ? m.activeItemCount
                : typeof m.itemCount === 'number' ? m.itemCount : 0,
        }));
        const bindings = bindingsRes.bindings || {};

        const canonicalIds = canonicalIdsForBlocks(activeBlockIds);
        const unresolved = canonicalIds.filter(id => {
            const b = bindings[id];
            if (b && b.kind !== 'unset') return false;
            // If no explicit binding, check if the contract default
            // resolves against partner data.
            return !resolvesViaDefault(id, partnerProfile, partnerModules);
        });

        return {
            success: true,
            context: { partnerProfile, partnerModules, bindings, canonicalIds, unresolved },
        };
    } catch (error: any) {
        console.error('[blueprint] context failed:', error);
        return { success: false, error: error.message };
    }
}

function resolvesViaDefault(
    canonicalId: string,
    partnerProfile: Record<string, any> | null,
    partnerModules: Array<{ slug: string; itemCount: number }>
): boolean {
    // Module collection defaults (products.items, menu.items, …).
    if (canonicalId.endsWith('.items')) {
        const slug = canonicalId.slice(0, -'.items'.length);
        const match = partnerModules.find(m => m.slug === slug);
        return !!match && match.itemCount > 0;
    }
    // Profile scalar defaults.
    const profilePath = profilePathForCanonical(canonicalId);
    if (profilePath) {
        const v = readPath(partnerProfile, profilePath);
        return typeof v === 'string' && !!v.trim();
    }
    return false;
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

function readPath(obj: Record<string, any> | null, path: string): unknown {
    if (!obj) return undefined;
    let cur: any = obj;
    for (const k of path.split('.')) {
        if (cur == null) return undefined;
        cur = cur[k];
    }
    return cur;
}

// ── Blueprint agent: propose ─────────────────────────────────────────

export async function proposeBlueprintAction(
    partnerId: string,
    activeBlockIds: string[]
): Promise<{ success: boolean; plan?: BlueprintPlan; error?: string }> {
    try {
        const ctxRes = await computeBlueprintContextAction(partnerId, activeBlockIds);
        if (!ctxRes.success || !ctxRes.context) {
            return { success: false, error: ctxRes.error || 'Could not load context' };
        }
        const { partnerProfile, partnerModules, canonicalIds, unresolved } = ctxRes.context;

        // Short-circuit: nothing unresolved → empty plan.
        if (unresolved.length === 0) {
            return {
                success: true,
                plan: {
                    summary: 'All active blocks have data. You\'re good to go.',
                    actions: [],
                    readiness: {
                        totalBlocks: activeBlockIds.length,
                        readyBlocks: activeBlockIds.length,
                        unmetCanonicalIds: [],
                    },
                },
            };
        }

        // Deterministic baseline: every unresolved canonical gets a
        // default-shape proposal. Gemini then rewrites the summary and
        // may merge / reorder but never invents actions for ids we
        // don't know about.
        const baseline = buildBaselineActions(unresolved, partnerModules, activeBlockIds);

        // Ask Gemini for a human-friendly summary + optional re-phrasing
        // of reasons. Keep temperature low and output tightly bounded.
        const summary = await geminiSummary(
            partnerProfile,
            partnerModules,
            canonicalIds,
            unresolved,
            baseline
        );

        const readyBlocks = activeBlockIds.filter(id => {
            const c = getContractFor(id);
            const neededIds = c.fields.map(f => f.canonicalId).filter(Boolean) as string[];
            if (isModuleDriven(c) && c.suggestedModules?.[0]) {
                neededIds.push(`${c.suggestedModules[0].slug}.items`);
            }
            return neededIds.every(nid => !unresolved.includes(nid));
        }).length;

        return {
            success: true,
            plan: {
                summary,
                actions: baseline,
                readiness: {
                    totalBlocks: activeBlockIds.length,
                    readyBlocks,
                    unmetCanonicalIds: unresolved,
                },
            },
        };
    } catch (error: any) {
        console.error('[blueprint] propose failed:', error);
        return { success: false, error: error.message };
    }
}

function buildBaselineActions(
    unresolved: string[],
    partnerModules: Array<{ id: string; slug: string; name: string; itemCount: number }>,
    activeBlockIds: string[]
): BlueprintAction[] {
    const actions: BlueprintAction[] = [];

    // Build a block-by-canonical index so we can cite which block is
    // waiting on a given canonical id.
    const citesFor = (canonicalId: string): string => {
        const cites = activeBlockIds.filter(bid => {
            const c = getContractFor(bid);
            const ids = c.fields.map(f => f.canonicalId).filter(Boolean) as string[];
            if (isModuleDriven(c) && c.suggestedModules?.[0]) {
                ids.push(`${c.suggestedModules[0].slug}.items`);
            }
            return ids.includes(canonicalId);
        });
        if (cites.length === 0) return '';
        if (cites.length === 1) return ` (needed by ${labelForBlock(cites[0])})`;
        return ` (needed by ${cites.slice(0, 2).map(labelForBlock).join(', ')}${cites.length > 2 ? ` +${cites.length - 2}` : ''})`;
    };

    for (const id of unresolved) {
        // Collection ids like 'products.items' → propose enabling or
        // pointing at a module.
        if (id.endsWith('.items')) {
            const slug = id.slice(0, -'.items'.length);
            const existing = partnerModules.find(m => m.slug === slug);
            if (existing && existing.itemCount === 0) {
                actions.push({
                    kind: 'bind',
                    canonicalId: id,
                    binding: { kind: 'module', moduleId: existing.id },
                    reason: `Bind to your existing ${existing.name} module and add items to it${citesFor(id)}.`,
                });
            } else if (!existing) {
                actions.push({
                    kind: 'create_module',
                    slug,
                    name: slugToName(slug),
                    reason: `Create a ${slugToName(slug)} module${citesFor(id)}.`,
                });
            }
            continue;
        }

        // Profile scalar
        const path = profilePathForCanonical(id);
        if (path) {
            actions.push({
                kind: 'fill_profile',
                path,
                hint: humanizeCanonical(id),
                reason: `Add your ${humanizeCanonical(id)} in Business Profile${citesFor(id)}.`,
            });
        }
    }
    return actions;
}

function slugToName(slug: string): string {
    return slug
        .split(/[_-]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function humanizeCanonical(id: string): string {
    const map: Record<string, string> = {
        'business.name':     'business name',
        'business.phone':    'phone number',
        'business.email':    'email',
        'business.whatsapp': 'WhatsApp number',
        'business.website':  'website',
        'business.tagline':  'tagline',
    };
    return map[id] || id;
}

function labelForBlock(blockId: string): string {
    // Minimal label derivation without importing client registry.
    return blockId
        .replace(/^[a-z]+_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// ── Gemini: summary only ─────────────────────────────────────────────

async function geminiSummary(
    partnerProfile: Record<string, any> | null,
    partnerModules: Array<{ slug: string; name: string; itemCount: number }>,
    canonicalIds: string[],
    unresolved: string[],
    baseline: BlueprintAction[]
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        // Graceful fallback: deterministic summary.
        return fallbackSummary(unresolved, baseline);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You're Pingbox, a business assistant. You wrote a mini-plan to help a partner connect real data to their chat widget blocks. In 1–2 sentences (max 220 chars), summarize the plan warmly and concretely. No markdown, no lists. Speak directly to the partner.`;

        const result = await ai.models.generateContent({
            model: process.env.RELAY_AI_MODEL || 'gemini-2.5-flash',
            contents: JSON.stringify({
                businessName: partnerProfile?.businessPersona?.identity?.name || 'your business',
                totalBlocksNeedingData: unresolved.length,
                modulesYouHave: partnerModules.map(m => m.slug),
                proposedActions: baseline.map(a => ({ kind: a.kind, reason: a.reason })),
            }),
            config: {
                systemInstruction,
                temperature: 0.3,
                maxOutputTokens: 120,
            },
        });
        const text = (result.text || '').trim();
        return text || fallbackSummary(unresolved, baseline);
    } catch (err) {
        console.error('[blueprint] Gemini summary failed:', err);
        return fallbackSummary(unresolved, baseline);
    }
}

function fallbackSummary(unresolved: string[], baseline: BlueprintAction[]): string {
    if (baseline.length === 0) return 'All active blocks already resolve to partner data.';
    const n = baseline.length;
    return `Here's a ${n}-step plan to connect real data to your ${unresolved.length} unmet block field${unresolved.length === 1 ? '' : 's'}.`;
}

// ── Apply: execute approved actions ──────────────────────────────────

export async function applyBlueprintAction(
    partnerId: string,
    actions: BlueprintAction[]
): Promise<{
    success: boolean;
    executed?: Array<{ kind: string; detail: string; ok: boolean; error?: string }>;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const executed: Array<{ kind: string; detail: string; ok: boolean; error?: string }> = [];

        // Apply bindings in one batch.
        const bindEntries: Array<{ canonicalId: string; binding: DataBinding }> = [];

        for (const a of actions) {
            if (a.kind === 'create_module') {
                const res = await enablePartnerModuleAction(partnerId, a.slug, a.name);
                if (res.success && res.data?.moduleId) {
                    executed.push({ kind: 'create_module', detail: `Enabled ${a.name}`, ok: true });
                    // Auto-bind the collection canonical id to the new module.
                    bindEntries.push({
                        canonicalId: `${a.slug}.items`,
                        binding: { kind: 'module', moduleId: res.data.moduleId },
                    });
                } else {
                    executed.push({
                        kind: 'create_module',
                        detail: `Could not enable ${a.name}`,
                        ok: false,
                        error: res.error || 'Unknown error',
                    });
                }
            } else if (a.kind === 'bind') {
                bindEntries.push({ canonicalId: a.canonicalId, binding: a.binding });
                executed.push({ kind: 'bind', detail: `Bound ${a.canonicalId}`, ok: true });
            } else if (a.kind === 'fill_profile') {
                // We can't fill the profile automatically — surface it
                // as "needs partner action" with a link to settings.
                executed.push({
                    kind: 'fill_profile',
                    detail: `Add ${a.hint} in /partner/settings`,
                    ok: false,
                    error: 'Partner must fill this in Settings.',
                });
            }
        }

        if (bindEntries.length > 0) {
            const res = await setManyDataBindingsAction(partnerId, bindEntries);
            if (!res.success) {
                executed.push({
                    kind: 'bind',
                    detail: 'Write bindings',
                    ok: false,
                    error: res.error || 'Bindings write failed',
                });
            }
        }

        revalidatePath('/partner/relay');
        revalidatePath('/partner/relay/blocks');
        return { success: true, executed };
    } catch (error: any) {
        console.error('[blueprint] apply failed:', error);
        return { success: false, error: error.message };
    }
}
