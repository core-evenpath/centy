'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import { getActiveBlocksForPartner } from '@/lib/relay/block-config-service';
// ── Types ────────────────────────────────────────────────────────────

export interface RelayConfig {
    enabled: boolean;
    brandName: string;
    tagline: string;
    brandEmoji: string;
    accentColor: string;
    welcomeMessage: string;
    relaySlug?: string;
    updatedAt?: string;
}

export interface DiagnosticCheck {
    label: string;
    status: 'pass' | 'warn' | 'fail';
    description: string;
    fix?: string;
}

export interface RelayConversation {
    id: string;
    visitorName: string;
    lastMessage: string;
    timestamp: string;
    messageCount: number;
}

export interface RelayBlockConfigDetail {
    id: string;
    blockType: string;
    label: string;
    description?: string;
    moduleSlug?: string;
    moduleId?: string;
    applicableIndustries: string[];
    applicableFunctions: string[];
    agentConfig?: Record<string, any>;
    dataSchema?: {
        sourceCollection?: string;
        sourceFields?: string[];
        displayTemplate?: string;
        maxItems?: number;
        sortBy?: string;
        sortOrder?: string;
    };
    blockTypeTemplate?: {
        generatedBy: 'gemini' | 'manual' | 'default';
        generatedAt: string;
        subcategory: string;
        sampleData: Record<string, any>;
        isDefault: boolean;
    };
    status: string;
    createdAt?: string;
}

// ── Get relay config ─────────────────────────────────────────────────

export async function getRelayConfigAction(partnerId: string): Promise<{
    success: boolean;
    config?: RelayConfig;
    error?: string;
}> {
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .get();

        if (snap.exists) {
            return { success: true, config: snap.data() as RelayConfig };
        }
        return { success: true, config: undefined };
    } catch (e: any) {
        console.error('Failed to get relay config:', e);
        return { success: false, error: e.message };
    }
}

// ── Save relay config ────────────────────────────────────────────────

export async function saveRelayConfigAction(
    partnerId: string,
    config: RelayConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .set({
                ...config,
                updatedAt: new Date().toISOString(),
            });
        return { success: true };
    } catch (e: any) {
        console.error('Failed to save relay config:', e);
        return { success: false, error: e.message };
    }
}

// ── Run diagnostics ──────────────────────────────────────────────────

export async function runRelayDiagnosticsAction(partnerId: string): Promise<{
    success: boolean;
    checks: DiagnosticCheck[];
}> {
    const checks: DiagnosticCheck[] = [];

    // Check 1: Widget config
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .get();
        if (snap.exists && snap.data()?.brandName) {
            checks.push({ label: 'Widget Configuration', status: 'pass', description: 'Brand name and config set' });
        } else {
            checks.push({ label: 'Widget Configuration', status: 'warn', description: 'No brand name configured', fix: 'Fill in the Setup tab and save' });
        }
    } catch {
        checks.push({ label: 'Widget Configuration', status: 'fail', description: 'Could not read config', fix: 'Check Firestore setup' });
    }

    // Check 2: RAG Store
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('fileSearchStores')
            .where('status', '==', 'active')
            .get();
        if (snap.size > 0) {
            checks.push({ label: 'RAG Store', status: 'pass', description: `${snap.size} active store(s)` });
        } else {
            checks.push({ label: 'RAG Store', status: 'warn', description: 'No active RAG store', fix: 'Upload documents in Core Memory' });
        }
    } catch {
        checks.push({ label: 'RAG Store', status: 'warn', description: 'No RAG store found', fix: 'Upload documents in Core Memory' });
    }

    // Check 3: Knowledge docs
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('vaultFiles')
            .where('state', '==', 'ACTIVE')
            .get();
        if (snap.size > 0) {
            checks.push({ label: 'Knowledge Documents', status: 'pass', description: `${snap.size} active document(s)` });
        } else {
            checks.push({ label: 'Knowledge Documents', status: 'warn', description: 'No knowledge documents', fix: 'Upload files in Core Memory' });
        }
    } catch {
        checks.push({ label: 'Knowledge Documents', status: 'warn', description: 'Could not check documents' });
    }

    // Check 4: Module data
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('modules')
            .where('isEnabled', '==', true)
            .get();
        if (snap.size > 0) {
            checks.push({ label: 'Module Data', status: 'pass', description: `${snap.size} enabled module(s)` });
        } else {
            checks.push({ label: 'Module Data', status: 'warn', description: 'No enabled modules', fix: 'Enable modules in the Modules tab' });
        }
    } catch {
        checks.push({ label: 'Module Data', status: 'warn', description: 'Could not check modules' });
    }

    // Check 5: Relay block configs (global)
    try {
        const snap = await adminDb.collection('relayBlockConfigs').get();
        if (snap.size > 0) {
            checks.push({ label: 'Relay Block Configs', status: 'pass', description: `${snap.size} block config(s)` });
        } else {
            checks.push({ label: 'Relay Block Configs', status: 'warn', description: 'No relay block configs', fix: 'Generate modules in Admin > Modules' });
        }
    } catch {
        checks.push({ label: 'Relay Block Configs', status: 'warn', description: 'Could not check block configs' });
    }

    // Append full pipeline diagnostics so admins see end-to-end health.
    try {
        const pipeline = await relayPipelineDiagnosticsAction(partnerId);
        if (pipeline.success) checks.push(...pipeline.checks);
    } catch (e) {
        checks.push({
            label: 'Pipeline Diagnostics',
            status: 'warn',
            description: 'Could not run pipeline diagnostics',
            fix: e instanceof Error ? e.message : 'Unknown error',
        });
    }

    return { success: true, checks };
}

// ── Pipeline diagnostics: end-to-end health of the unified Firestore pipeline ─

export async function relayPipelineDiagnosticsAction(partnerId: string): Promise<{
    success: boolean;
    checks: DiagnosticCheck[];
}> {
    const checks: DiagnosticCheck[] = [];

    // 1. Partner exists
    let partnerData: Record<string, any> | null = null;
    try {
        const snap = await adminDb.collection('partners').doc(partnerId).get();
        if (snap.exists) {
            partnerData = (snap.data() as Record<string, any>) || null;
            checks.push({ label: 'Partner exists', status: 'pass', description: `partners/${partnerId} found` });
        } else {
            checks.push({
                label: 'Partner exists',
                status: 'fail',
                description: `partners/${partnerId} not found`,
                fix: 'Check the partnerId or onboard the partner',
            });
            return { success: true, checks };
        }
    } catch (e) {
        checks.push({
            label: 'Partner exists',
            status: 'fail',
            description: 'Could not read partner doc',
            fix: e instanceof Error ? e.message : 'Unknown error',
        });
        return { success: true, checks };
    }

    // 2. Business category set
    const functionId = partnerData?.businessPersona?.identity?.businessCategories?.[0]?.functionId;
    if (functionId) {
        checks.push({
            label: 'Business category set',
            status: 'pass',
            description: `Category: ${functionId}`,
        });
    } else {
        checks.push({
            label: 'Business category set',
            status: 'warn',
            description: 'No business category configured',
            fix: 'Pick a business category in Persona setup',
        });
    }

    // 3. Modules enabled (partner-level)
    const partnerModulesResult = await getPartnerModulesAction(partnerId);
    const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];
    if (partnerModules.length > 0) {
        checks.push({
            label: 'Modules enabled',
            status: 'pass',
            description: `${partnerModules.length} partner module(s)`,
        });
    } else {
        checks.push({
            label: 'Modules enabled',
            status: 'warn',
            description: 'No partner modules in businessModules',
            fix: 'Enable modules in the Modules tab',
        });
    }

    // 4-6 require iterating partner modules: items, system link, agent config
    let itemsTotal = 0;
    let modulesWithItems = 0;
    let systemLinked = 0;
    let withAgentConfig = 0;
    let blockConfigsPresent = 0;
    const itemSampleErrors: string[] = [];

    for (const pm of partnerModules.slice(0, 10)) {
        // Items
        try {
            const itemsResult = await getModuleItemsAction(partnerId, pm.id, { isActive: true, pageSize: 1 });
            const cnt = itemsResult.success ? itemsResult.data?.items?.length || 0 : 0;
            if (cnt > 0) {
                modulesWithItems += 1;
                itemsTotal += itemsResult.data?.total ?? cnt;
            }
        } catch (e) {
            itemSampleErrors.push(`${pm.moduleSlug}: ${e instanceof Error ? e.message : 'error'}`);
        }

        // System module
        const sysResult = await getSystemModuleAction(pm.moduleSlug);
        if (sysResult.success && sysResult.data) {
            systemLinked += 1;
            if (sysResult.data.agentConfig) withAgentConfig += 1;
        }

        // Relay block config doc (current naming: module_{slug}; legacy: block_{slug})
        try {
            const moduleDoc = await adminDb.collection('relayBlockConfigs').doc(`module_${pm.moduleSlug}`).get();
            const legacyDoc = moduleDoc.exists
                ? null
                : await adminDb.collection('relayBlockConfigs').doc(`block_${pm.moduleSlug}`).get();
            if (moduleDoc.exists || legacyDoc?.exists) blockConfigsPresent += 1;
        } catch {
            // ignore
        }
    }

    // 4. Module items exist
    if (modulesWithItems > 0) {
        checks.push({
            label: 'Module items exist',
            status: 'pass',
            description: `${modulesWithItems}/${partnerModules.length} module(s) have items (~${itemsTotal} total)`,
        });
    } else {
        checks.push({
            label: 'Module items exist',
            status: partnerModules.length > 0 ? 'warn' : 'fail',
            description: 'No active items in any module',
            fix: 'Import or seed items into the partner module subcollections',
        });
    }
    if (itemSampleErrors.length > 0) {
        checks.push({
            label: 'Module item read errors',
            status: 'warn',
            description: itemSampleErrors.slice(0, 3).join('; '),
        });
    }

    // 5. System modules linked
    if (partnerModules.length === 0) {
        checks.push({
            label: 'System modules linked',
            status: 'warn',
            description: 'No partner modules to link',
        });
    } else if (systemLinked === partnerModules.length) {
        checks.push({
            label: 'System modules linked',
            status: 'pass',
            description: `${systemLinked}/${partnerModules.length} resolved`,
        });
    } else {
        checks.push({
            label: 'System modules linked',
            status: 'fail',
            description: `${systemLinked}/${partnerModules.length} resolved — some moduleSlugs do not exist in systemModules`,
            fix: 'Re-derive partner modules from valid system modules',
        });
    }

    // 6. Agent configs present
    if (partnerModules.length === 0) {
        checks.push({
            label: 'Agent configs present',
            status: 'warn',
            description: 'No partner modules to inspect',
        });
    } else if (withAgentConfig === partnerModules.length) {
        checks.push({
            label: 'Agent configs present',
            status: 'pass',
            description: `${withAgentConfig}/${partnerModules.length} have agentConfig`,
        });
    } else {
        checks.push({
            label: 'Agent configs present',
            status: 'fail',
            description: `${withAgentConfig}/${partnerModules.length} have agentConfig — Relay will fall back to raw fields`,
            fix: 'Regenerate the affected system modules so they include agentConfig',
        });
    }

    // 7. Relay block configs exist for partner modules
    if (partnerModules.length === 0) {
        checks.push({
            label: 'Relay block configs (per module)',
            status: 'warn',
            description: 'No partner modules to map',
        });
    } else if (blockConfigsPresent === partnerModules.length) {
        checks.push({
            label: 'Relay block configs (per module)',
            status: 'pass',
            description: `${blockConfigsPresent}/${partnerModules.length} module-scoped block configs found`,
        });
    } else {
        checks.push({
            label: 'Relay block configs (per module)',
            status: 'warn',
            description: `${blockConfigsPresent}/${partnerModules.length} have a relayBlockConfigs doc`,
            fix: 'Generate or upgrade modules in Admin > Modules to seed relayBlockConfigs/module_{slug}',
        });
    }

    // 8. Block schemas generated
    try {
        const activeBlocks = await getActiveBlocksForPartner(partnerId);
        const withSchemas = activeBlocks.filter(b => b.promptSchema && b.promptSchema.length > 0);
        if (withSchemas.length > 0) {
            checks.push({
                label: 'Block schemas generated',
                status: 'pass',
                description: `${withSchemas.length}/${activeBlocks.length} active block(s) carry a promptSchema`,
            });
        } else {
            checks.push({
                label: 'Block schemas generated',
                status: 'fail',
                description: 'No active blocks with a promptSchema for this partner',
                fix: 'Seed promptSchema on relayBlockConfigs docs or check applicableCategories',
            });
        }
    } catch (e) {
        checks.push({
            label: 'Block schemas generated',
            status: 'warn',
            description: 'Could not load active blocks',
            fix: e instanceof Error ? e.message : 'Unknown error',
        });
    }

    // 9. Relay config saved
    try {
        const cfgSnap = await adminDb
            .collection('partners').doc(partnerId)
            .collection('relayConfig').doc('config').get();
        if (cfgSnap.exists && cfgSnap.data()?.enabled === true) {
            checks.push({
                label: 'Relay config saved',
                status: 'pass',
                description: 'relayConfig/config exists and is enabled',
            });
        } else if (cfgSnap.exists) {
            checks.push({
                label: 'Relay config saved',
                status: 'warn',
                description: 'relayConfig/config exists but is not enabled',
                fix: 'Toggle Relay on in the Setup tab',
            });
        } else {
            checks.push({
                label: 'Relay config saved',
                status: 'fail',
                description: 'relayConfig/config not found',
                fix: 'Save the Setup tab to create the config',
            });
        }
    } catch (e) {
        checks.push({
            label: 'Relay config saved',
            status: 'warn',
            description: 'Could not read relayConfig/config',
            fix: e instanceof Error ? e.message : 'Unknown error',
        });
    }

    return { success: true, checks };
}

// ── Get conversations ────────────────────────────────────────────────

export async function getRelayConversationsAction(partnerId: string): Promise<{
    success: boolean;
    conversations: RelayConversation[];
}> {
    try {
        const snap = await adminDb
            .collection('relayConversations')
            .where('partnerId', '==', partnerId)
            .orderBy('updatedAt', 'desc')
            .limit(20)
            .get();

        const conversations: RelayConversation[] = snap.docs.map(d => {
            const data = d.data();
            let ts = '';
            if (data.updatedAt) {
                ts = typeof data.updatedAt.toDate === 'function'
                    ? data.updatedAt.toDate().toISOString()
                    : data.updatedAt;
            }
            return {
                id: d.id,
                visitorName: data.visitorName || 'Anonymous',
                lastMessage: data.lastMessage || '',
                timestamp: ts,
                messageCount: data.messageCount || 0,
            };
        });

        return { success: true, conversations };
    } catch {
        // Collection may not exist yet
        return { success: true, conversations: [] };
    }
}

// ── Get all relay block configs with module details ─────────────────

export async function getRelayBlockConfigsWithModulesAction(): Promise<{
    success: boolean;
    configs: RelayBlockConfigDetail[];
    error?: string;
}> {
    try {
        const snapshot = await adminDb.collection('relayBlockConfigs').get();

        const configs: RelayBlockConfigDetail[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                blockType: data.blockType || 'card',
                label: data.label || doc.id,
                description: data.description || undefined,
                moduleSlug: data.moduleSlug || undefined,
                moduleId: data.moduleId || undefined,
                applicableIndustries: data.applicableIndustries || [],
                applicableFunctions: data.applicableFunctions || [],
                agentConfig: data.agentConfig || undefined,
                dataSchema: data.dataSchema || undefined,
                blockTypeTemplate: data.blockTypeTemplate || undefined,
                status: data.status || 'active',
                createdAt: data.createdAt || undefined,
            };
        });

        configs.sort((a, b) => {
            const typeCompare = a.blockType.localeCompare(b.blockType);
            if (typeCompare !== 0) return typeCompare;
            return a.label.localeCompare(b.label);
        });

        return { success: true, configs };
    } catch (e: any) {
        console.error('Failed to get relay block configs:', e);
        return { success: false, configs: [], error: e.message };
    }
}

// ── Update a relay block config ─────────────────────────────────────

export async function updateRelayBlockConfigAction(
    id: string,
    updates: Partial<Omit<RelayBlockConfigDetail, 'id'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = adminDb.collection('relayBlockConfigs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        await docRef.update({
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to update relay block config:', e);
        return { success: false, error: e.message };
    }
}

// ── Delete a relay block config ─────────────────────────────────────

export async function deleteRelayBlockConfigAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = adminDb.collection('relayBlockConfigs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        await docRef.delete();

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete relay block config:', e);
        return { success: false, error: e.message };
    }
}
