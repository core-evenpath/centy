import type { BlocksDesignResponse } from './types';

export interface FetchBlocksDesignOpts {
    /** Public path: resolves partnerId from the widget record. */
    widgetId?: string;
    /** Admin path: requires a Firebase ID token. */
    partnerId?: string;
    /** Bearer ID token, required when using `partnerId`. */
    idToken?: string;
    /** Optional filter by block family. */
    family?: string;
    /** Optional filter by applicable category. */
    category?: string;
    /** Override base URL (e.g. for server-side calls). Defaults to relative `/api/relay/blocks`. */
    baseUrl?: string;
    /** Forwarded to fetch() for cancellation. */
    signal?: AbortSignal;
}

/**
 * Fetch merged block designs (global design + partner overrides) from
 * `GET /api/relay/blocks`. Used by the embedded Relay widget and by the
 * partner admin Blocks Tab.
 */
export async function fetchBlocksDesign(
    opts: FetchBlocksDesignOpts,
): Promise<BlocksDesignResponse> {
    if (!opts.widgetId && !opts.partnerId) {
        throw new Error('fetchBlocksDesign: widgetId or partnerId is required');
    }

    const params = new URLSearchParams();
    if (opts.widgetId) params.set('widgetId', opts.widgetId);
    if (opts.partnerId) params.set('partnerId', opts.partnerId);
    if (opts.family) params.set('family', opts.family);
    if (opts.category) params.set('category', opts.category);

    const base = opts.baseUrl ?? '';
    const url = `${base}/api/relay/blocks?${params.toString()}`;

    const headers: Record<string, string> = {};
    if (opts.idToken) {
        headers['Authorization'] = `Bearer ${opts.idToken}`;
    }

    const res = await fetch(url, { headers, signal: opts.signal });
    if (!res.ok) {
        let message = `Failed to fetch blocks design (${res.status})`;
        try {
            const body = await res.json();
            if (body?.error) message = body.error;
        } catch {
            // ignore JSON parse errors
        }
        throw new Error(message);
    }

    return (await res.json()) as BlocksDesignResponse;
}
