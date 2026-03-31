'use server';

import { db as adminDb } from '@/lib/firebase-admin';

export async function getRelayKnowledgeConfigAction(partnerId: string) {
    try {
        const doc = await adminDb.collection(`partners/${partnerId}/relayConfig`).doc('config').get();
        const data = doc.data();
        return {
            success: true,
            config: {
                excludedVaultDocIds: (data?.excludedVaultDocIds as string[]) || [],
                updatedAt: (data?.knowledgeUpdatedAt as string) || '',
            },
        };
    } catch (error) {
        console.error('Failed to get relay knowledge config:', error);
        return { success: false, config: { excludedVaultDocIds: [], updatedAt: '' }, error: 'Failed to load config' };
    }
}

export async function updateRelayDocExclusionsAction(partnerId: string, excludedDocIds: string[]) {
    try {
        await adminDb.collection(`partners/${partnerId}/relayConfig`).doc('config').set(
            {
                excludedVaultDocIds: excludedDocIds,
                knowledgeUpdatedAt: new Date().toISOString(),
            },
            { merge: true }
        );

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/partner/relay');

        return { success: true };
    } catch (error) {
        console.error('Failed to update relay doc exclusions:', error);
        return { success: false, error: 'Failed to update exclusions' };
    }
}

export async function getVaultFilesForRelayAction(partnerId: string) {
    try {
        const snapshot = await adminDb
            .collection(`partners/${partnerId}/vaultFiles`)
            .where('state', '==', 'ACTIVE')
            .orderBy('createdAt', 'desc')
            .get();

        const files = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : (data.createdAt as string) || '';

            return {
                id: doc.id,
                name: (data.originalName || data.displayName || data.name || doc.id) as string,
                mimeType: (data.mimeType || '') as string,
                state: data.state as string,
                createdAt,
                size: data.sizeBytes as number | undefined,
            };
        });

        return { success: true, files };
    } catch (error) {
        console.error('Failed to get vault files for relay:', error);
        return { success: false, files: [], error: 'Failed to load vault files' };
    }
}
