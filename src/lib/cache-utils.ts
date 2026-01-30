'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Invalidate all caches related to a partner's business data
 */
export async function invalidatePartnerBusinessCache(partnerId: string) {
    console.log(`[Cache] Invalidating all business data caches for ${partnerId}`);

    // Paths
    const paths = [
        '/partner/settings',
        '/partner/settings/core-data',
        '/partner/settings/dashboard',
        '/partner/inbox',
        '/partner/agents',
    ];

    paths.forEach(path => {
        try {
            revalidatePath(path);
        } catch (e) {
            // Ignore errors (e.g. if called outside request context)
            console.warn(`[Cache] Failed to revalidate path ${path}:`, e);
        }
    });

    // Tags
    const tags = [
        `partner-${partnerId}`,
        'business-persona',
        'core-data',
    ];

    tags.forEach(tag => {
        try {
            revalidateTag(tag);
        } catch (e) {
            // Ignore errors
            console.warn(`[Cache] Failed to revalidate tag ${tag}:`, e);
        }
    });

    console.log(`[Cache] ✅ Invalidated ${paths.length} paths and ${tags.length} tags`);
}
