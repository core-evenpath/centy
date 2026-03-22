'use server';

import { db as adminDb } from '@/lib/firebase-admin';

// ── Types ────────────────────────────────────────────────────────────

export interface RelayConfig {
    enabled: boolean;
    brandName: string;
    tagline: string;
    brandEmoji: string;
    accentColor: string;
    welcomeMessage: string;
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
