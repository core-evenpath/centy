'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { registerAllBlocks } from '@/lib/relay/blocks/index';
import { listBlocks, getRegistrySize } from '@/lib/relay/registry';

let registryReady = false;

function ensureRegistry(): void {
  if (!registryReady) {
    registerAllBlocks();
    registryReady = true;
  }
}

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
        generatedBy: 'gemini' | 'manual' | 'default' | 'registry';
        generatedAt: string;
        subcategory: string;
        sampleData: Record<string, any>;
        isDefault: boolean;
    };
    status: string;
    createdAt?: string;
}

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

export async function runRelayDiagnosticsAction(partnerId: string): Promise<{
    success: boolean;
    checks: DiagnosticCheck[];
}> {
    const checks: DiagnosticCheck[] = [];

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

    try {
        ensureRegistry();
        const blockCount = getRegistrySize();
        if (blockCount > 0) {
            checks.push({ label: 'Block Registry', status: 'pass', description: `${blockCount} block(s) in code registry` });
        } else {
            checks.push({ label: 'Block Registry', status: 'fail', description: 'No blocks registered', fix: 'Check @/lib/relay/blocks/ for block definitions' });
        }
    } catch {
        checks.push({ label: 'Block Registry', status: 'fail', description: 'Registry failed to load' });
    }

    return { success: true, checks };
}

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
        return { success: true, conversations: [] };
    }
}

export async function getRelayBlockConfigsWithModulesAction(filters?: {
    family?: string;
    category?: string;
}): Promise<{
    success: boolean;
    configs: RelayBlockConfigDetail[];
    totalCount: number;
    families: string[];
    error?: string;
}> {
    try {
        ensureRegistry();

        const allBlocks = listBlocks(filters ? {
            family: filters.family,
            category: filters.category,
        } : undefined);

        const configs: RelayBlockConfigDetail[] = allBlocks.map((d) => ({
            id: d.id,
            blockType: d.family,
            label: d.label,
            description: d.description,
            applicableIndustries: d.applicableCategories,
            applicableFunctions: [],
            agentConfig: {
                intentKeywords: d.intentTriggers.keywords,
                queryPatterns: d.intentTriggers.queryPatterns,
                variants: d.variants,
                preloadable: d.preloadable,
                streamable: d.streamable,
                cacheDuration: d.cacheDuration,
            },
            dataSchema: {
                sourceFields: [
                    ...d.dataContract.required.map((f) => f.field),
                    ...d.dataContract.optional.map((f) => f.field),
                ],
                maxItems: 10,
                sortBy: 'sortOrder',
                sortOrder: 'asc',
            },
            blockTypeTemplate: {
                generatedBy: 'registry' as const,
                generatedAt: '',
                subcategory: d.applicableCategories[0] || 'general',
                sampleData: d.sampleData || {},
                isDefault: false,
            },
            status: 'active',
        }));

        const familySet = new Set<string>();
        const unfilteredBlocks = listBlocks();
        unfilteredBlocks.forEach((d) => familySet.add(d.family));

        return {
            success: true,
            configs,
            totalCount: getRegistrySize(),
            families: Array.from(familySet).sort(),
        };
    } catch (e: any) {
        console.error('Failed to get relay block configs from registry:', e);
        return { success: false, configs: [], totalCount: 0, families: [], error: e.message };
    }
}
