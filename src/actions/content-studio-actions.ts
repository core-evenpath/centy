'use server';

/**
 * Content Studio — storage and retrieval.
 *
 * Firestore layout:
 *   contentStudioConfigs/{verticalId}                         — generated config cache
 *   partners/{partnerId}/contentStudio/state                  — per-partner block state
 *
 * The config cache is generated lazily on first read and can be
 * regenerated explicitly (single vertical or all) by admins.
 */

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import type {
    ContentStudioConfig,
    PartnerContentStudioState,
} from '@/lib/types-content-studio';
import { generateContentStudioConfig } from '@/lib/content-studio/generator';
import { getAllVerticalIds } from '@/lib/content-studio/registry-reader';
import { VERTICAL_IDS } from '@/lib/content-studio/verticals';
import { getApiIntegrationsAction } from '@/actions/admin-api-config-actions';

// ── Config cache ─────────────────────────────────────────────────────

function configDocRef(verticalId: string) {
    if (!adminDb) throw new Error('Database not available');
    return adminDb.collection('contentStudioConfigs').doc(verticalId);
}

export async function getContentStudioConfigAction(verticalId: string): Promise<{
    success: boolean;
    config?: ContentStudioConfig;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const ref = configDocRef(verticalId);
        const snap = await ref.get();
        if (snap.exists) {
            return { success: true, config: snap.data() as ContentStudioConfig };
        }

        const generated = await generateContentStudioConfig(verticalId);
        if (!generated) {
            return { success: false, error: `Unknown vertical: ${verticalId}` };
        }

        await ref.set(generated);
        return { success: true, config: generated };
    } catch (error: any) {
        console.error('[content-studio] get failed:', error);
        return { success: false, error: error?.message || 'Failed to load config' };
    }
}

export async function regenerateContentStudioConfigAction(verticalId: string): Promise<{
    success: boolean;
    config?: ContentStudioConfig;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const ref = configDocRef(verticalId);
        const existing = await ref.get();
        const existingVersion = existing.exists
            ? ((existing.data() as ContentStudioConfig).version || 0)
            : 0;

        const generated = await generateContentStudioConfig(verticalId);
        if (!generated) {
            return { success: false, error: `Unknown vertical: ${verticalId}` };
        }
        generated.version = existingVersion + 1;

        await ref.set(generated);
        revalidatePath('/partner/relay/datamap');
        revalidatePath('/admin/relay/api-config');
        return { success: true, config: generated };
    } catch (error: any) {
        console.error('[content-studio] regenerate failed:', error);
        return { success: false, error: error?.message || 'Failed to regenerate config' };
    }
}

export async function regenerateAllContentStudioConfigsAction(): Promise<{
    success: boolean;
    results?: Array<{ verticalId: string; ok: boolean; error?: string }>;
    error?: string;
}> {
    try {
        const ids = await getAllVerticalIds();
        const results: Array<{ verticalId: string; ok: boolean; error?: string }> = [];
        for (const id of ids) {
            const res = await regenerateContentStudioConfigAction(id);
            results.push({ verticalId: id, ok: res.success, error: res.error });
        }
        return { success: true, results };
    } catch (error: any) {
        console.error('[content-studio] regenerate-all failed:', error);
        return { success: false, error: error?.message || 'Failed to regenerate all configs' };
    }
}

// ── Partner state ────────────────────────────────────────────────────

function partnerStateRef(partnerId: string) {
    if (!adminDb) throw new Error('Database not available');
    return adminDb.collection(`partners/${partnerId}/contentStudio`).doc('state');
}

function emptyPartnerState(partnerId: string): PartnerContentStudioState {
    return {
        partnerId,
        verticalId: '',
        blockStates: {},
        lastViewedAt: new Date().toISOString(),
    };
}

export async function getPartnerContentStudioStateAction(partnerId: string): Promise<{
    success: boolean;
    state?: PartnerContentStudioState;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const snap = await partnerStateRef(partnerId).get();
        if (!snap.exists) {
            return { success: true, state: emptyPartnerState(partnerId) };
        }
        const data = snap.data() as PartnerContentStudioState;
        return {
            success: true,
            state: {
                partnerId: data.partnerId || partnerId,
                verticalId: data.verticalId || '',
                blockStates: data.blockStates || {},
                lastViewedAt: data.lastViewedAt || new Date().toISOString(),
            },
        };
    } catch (error: any) {
        console.error('[content-studio] get partner state failed:', error);
        return { success: false, error: error?.message || 'Failed to load partner state' };
    }
}

export async function updatePartnerBlockStateAction(
    partnerId: string,
    blockId: string,
    update: {
        dataProvided: boolean;
        sourceType: PartnerContentStudioState['blockStates'][string]['sourceType'];
        sourceRef: string | null;
        itemCount: number;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const now = new Date().toISOString();
        const ref = partnerStateRef(partnerId);

        const entry = {
            dataProvided: update.dataProvided,
            sourceType: update.sourceType,
            sourceRef: update.sourceRef,
            itemCount: update.itemCount,
            lastUpdatedAt: now,
        };

        await ref.set(
            {
                partnerId,
                blockStates: { [blockId]: entry },
                lastViewedAt: now,
            },
            { merge: true }
        );

        revalidatePath('/partner/relay/datamap');
        return { success: true };
    } catch (error: any) {
        console.error('[content-studio] update partner block state failed:', error);
        return { success: false, error: error?.message || 'Failed to update block state' };
    }
}

// ── API integrations filtered for a partner ──────────────────────────

function resolvePartnerVertical(partnerData: Record<string, any> | undefined): string | null {
    if (!partnerData) return null;
    // Preferred: partner.industry.id (Industry object on the partner doc).
    const industryId = partnerData.industry?.id;
    if (typeof industryId === 'string' && industryId.length > 0) return industryId;
    // Fallback: businessPersona.identity.industry (string slug).
    const persona = partnerData.businessPersona;
    const personaIndustry = persona?.identity?.industry;
    if (typeof personaIndustry === 'string' && personaIndustry.length > 0) return personaIndustry;
    // Last resort: direct vertical/function fields some onboarding flows set.
    if (typeof partnerData.verticalId === 'string') return partnerData.verticalId;
    if (typeof partnerData.functionId === 'string') return partnerData.functionId;
    return null;
}

/**
 * Map the resolved partner industry to one of our VERTICAL_IDS. A partner's
 * stored `industry.id` might be `retail_commerce` while our vertical id is
 * `ecommerce`. We accept a match on either the vertical id or its industryId.
 */
function normalizeVerticalForPartner(raw: string | null): string | null {
    if (!raw) return null;
    if ((VERTICAL_IDS as readonly string[]).includes(raw)) return raw;
    // Minimal industry → vertical alias map. Extend as more verticals gain
    // preview configs.
    const ALIASES: Record<string, string> = {
        retail_commerce: 'ecommerce',
        retail: 'ecommerce',
        education_training: 'education',
    };
    return ALIASES[raw] || raw;
}

export async function getEnabledApiIntegrationsForPartnerAction(
    partnerId: string
): Promise<{
    success: boolean;
    integrations?: Array<{ id: string; name: string; category: string; iconName: string }>;
    verticalId?: string;
    error?: string;
}> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };

        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
        if (!partnerDoc.exists) {
            return { success: false, error: 'Partner not found' };
        }
        const raw = resolvePartnerVertical(partnerDoc.data());
        const verticalId = normalizeVerticalForPartner(raw);

        const apiRes = await getApiIntegrationsAction();
        if (!apiRes.success || !apiRes.configs) {
            return { success: false, error: apiRes.error || 'Failed to load integrations' };
        }

        const enabled = apiRes.configs.filter(c => {
            if (!c.enabled) return false;
            if (c.applicableVerticals === 'all') return true;
            if (!verticalId) return false;
            return c.applicableVerticals.includes(verticalId);
        });

        return {
            success: true,
            verticalId: verticalId || undefined,
            integrations: enabled.map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                iconName: c.iconName,
            })),
        };
    } catch (error: any) {
        console.error('[content-studio] enabled APIs for partner failed:', error);
        return { success: false, error: error?.message || 'Failed to load enabled APIs' };
    }
}

/**
 * Resolves a partner's Content Studio vertical id (used by the partner page
 * to know which config to fetch).
 */
export async function getPartnerVerticalIdAction(
    partnerId: string
): Promise<{ success: boolean; verticalId?: string; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
        if (!partnerDoc.exists) return { success: false, error: 'Partner not found' };
        const raw = resolvePartnerVertical(partnerDoc.data());
        const verticalId = normalizeVerticalForPartner(raw);
        return { success: true, verticalId: verticalId || undefined };
    } catch (error: any) {
        console.error('[content-studio] partner vertical lookup failed:', error);
        return { success: false, error: error?.message || 'Failed to resolve vertical' };
    }
}
