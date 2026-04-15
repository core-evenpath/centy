'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import type {
    ContentStudioConfig,
    PartnerContentStudioState,
} from '@/lib/types-content-studio';
import { generateContentStudioConfig } from '@/lib/content-studio/generator';
import { getAllVerticalIds, resolveVerticalFromSlug } from '@/lib/content-studio/registry-reader';
import { getVerticalForCategory, hasVerticalForCategory } from '@/lib/relay/vertical-map';
import { VERTICAL_IDS } from '@/lib/content-studio/verticals';
import { getApiIntegrationsAction } from '@/actions/admin-api-config-actions';

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

/**
 * Pull every plausible vertical/function/industry slug off a partner doc.
 *
 * FIX: `identity.industry.category` is stored as a string OR an array of
 * strings by the settings page (multi-select business type picker). The
 * previous implementation used a string-only `push` helper so array values
 * were silently dropped, leaving `candidates` empty and causing vertical
 * resolution to always fail with "Could not resolve your business vertical."
 */
function collectPartnerVerticalCandidates(
    partnerData: Record<string, any> | undefined
): string[] {
    if (!partnerData) return [];
    const candidates: string[] = [];

    const pushOne = (v: unknown) => {
        if (typeof v === 'string' && v.length > 0) candidates.push(v);
    };

    const pushAll = (v: unknown) => {
        if (Array.isArray(v)) {
            for (const item of v) pushOne(item);
        } else {
            pushOne(v);
        }
    };

    const persona = partnerData.businessPersona;
    const identity = persona?.identity;

    pushOne(identity?.functionId);
    const cats = identity?.businessCategories;
    if (Array.isArray(cats)) {
        for (const c of cats) pushOne(c?.functionId);
    }
    pushOne(partnerData.functionId);

    pushOne(identity?.industryId);
    pushOne(partnerData.industryId);

    pushOne(identity?.industry?.id);
    pushAll(identity?.industry?.category);
    pushOne(partnerData.industry?.id);
    pushAll(partnerData.industry?.category);

    pushOne(partnerData.verticalId);

    return candidates;
}

async function normalizeVerticalForPartner(
    candidates: string[]
): Promise<string | null> {
    const STATIC_ALIASES: Record<string, string> = {
        retail_commerce: 'ecommerce',
        retail: 'ecommerce',
        education_learning: 'education',
        education_training: 'education',
        automotive_mobility: 'automotive',
        business_professional: 'business',
        healthcare_medical: 'healthcare',
        real_estate: 'home_property',
        food_beverage: 'food_beverage',
        healthcare: 'healthcare',
        education: 'education',
        hospitality: 'hospitality',
        automotive: 'automotive',
    };

    for (const raw of candidates) {
        if ((VERTICAL_IDS as readonly string[]).includes(raw)) return raw;
        if (STATIC_ALIASES[raw]) return STATIC_ALIASES[raw];
        if (hasVerticalForCategory(raw)) {
            const fromShared = getVerticalForCategory(raw);
            if ((VERTICAL_IDS as readonly string[]).includes(fromShared)) {
                return fromShared;
            }
        }
        const fromRegistry = await resolveVerticalFromSlug(raw);
        if (fromRegistry) return fromRegistry;
    }
    return null;
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
        const candidates = collectPartnerVerticalCandidates(partnerDoc.data());
        const verticalId = await normalizeVerticalForPartner(candidates);

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

export async function getPartnerVerticalIdAction(
    partnerId: string
): Promise<{ success: boolean; verticalId?: string; error?: string }> {
    try {
        if (!adminDb) return { success: false, error: 'Database not available' };
        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
        if (!partnerDoc.exists) return { success: false, error: 'Partner not found' };
        const candidates = collectPartnerVerticalCandidates(partnerDoc.data());
        const verticalId = await normalizeVerticalForPartner(candidates);
        if (!verticalId) {
            console.warn(
                '[content-studio] no vertical match for partner',
                partnerId,
                'candidates:',
                candidates
            );
            return {
                success: false,
                error:
                    candidates.length === 0
                        ? 'Your business profile is missing an industry. Complete onboarding and try again.'
                        : `Could not resolve your business vertical (tried: ${candidates.join(', ')}).`,
            };
        }
        return { success: true, verticalId };
    } catch (error: any) {
        console.error('[content-studio] partner vertical lookup failed:', error);
        return { success: false, error: error?.message || 'Failed to resolve vertical' };
    }
}
