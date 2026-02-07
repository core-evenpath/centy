import 'server-only';
import crypto from 'crypto';
import type {
    ShopifyProduct,
    ShopifyCustomer,
    ShopifyOrder,
} from './types-shopify';

const SHOPIFY_API_VERSION = '2026-01';
const RATE_LIMIT_THRESHOLD = 35;
const PAGINATION_DELAY_MS = 500;

function buildApiUrl(shopDomain: string, path: string): string {
    return `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}${path}`;
}

async function shopifyFetch(
    shopDomain: string,
    accessToken: string,
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const url = buildApiUrl(shopDomain, path);
    const response = await fetch(url, {
        ...options,
        headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
    if (callLimit) {
        const [used] = callLimit.split('/').map(Number);
        if (used >= RATE_LIMIT_THRESHOLD) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return response;
}

function parseNextPageUrl(linkHeader: string | null): string | null {
    if (!linkHeader) return null;
    const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return matches ? matches[1] : null;
}

export async function getShopInfo(
    shopDomain: string,
    accessToken: string
): Promise<{ shop: { name: string; domain: string; email: string; plan_name: string } }> {
    const response = await shopifyFetch(shopDomain, accessToken, '/shop.json');
    if (!response.ok) {
        throw new Error(`Failed to fetch shop info: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function fetchAllProducts(
    shopDomain: string,
    accessToken: string
): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = [];
    let url: string | null = buildApiUrl(shopDomain, '/products.json?limit=250');

    while (url) {
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        if (callLimit) {
            const [used] = callLimit.split('/').map(Number);
            if (used >= RATE_LIMIT_THRESHOLD) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const data = await response.json();
        allProducts.push(...(data.products || []));

        const linkHeader = response.headers.get('Link');
        url = parseNextPageUrl(linkHeader);

        if (url) {
            await new Promise(resolve => setTimeout(resolve, PAGINATION_DELAY_MS));
        }
    }

    return allProducts;
}

export async function fetchProductCount(
    shopDomain: string,
    accessToken: string
): Promise<number> {
    const response = await shopifyFetch(shopDomain, accessToken, '/products/count.json');
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
}

export async function fetchAllCustomers(
    shopDomain: string,
    accessToken: string
): Promise<ShopifyCustomer[]> {
    const allCustomers: ShopifyCustomer[] = [];
    let url: string | null = buildApiUrl(shopDomain, '/customers.json?limit=250');

    while (url) {
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
        }

        const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        if (callLimit) {
            const [used] = callLimit.split('/').map(Number);
            if (used >= RATE_LIMIT_THRESHOLD) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const data = await response.json();
        allCustomers.push(...(data.customers || []));

        const linkHeader = response.headers.get('Link');
        url = parseNextPageUrl(linkHeader);

        if (url) {
            await new Promise(resolve => setTimeout(resolve, PAGINATION_DELAY_MS));
        }
    }

    return allCustomers;
}

export async function fetchCustomerCount(
    shopDomain: string,
    accessToken: string
): Promise<number> {
    const response = await shopifyFetch(shopDomain, accessToken, '/customers/count.json');
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
}

export async function fetchAllOrders(
    shopDomain: string,
    accessToken: string
): Promise<ShopifyOrder[]> {
    const allOrders: ShopifyOrder[] = [];
    let url: string | null = buildApiUrl(shopDomain, '/orders.json?status=any&limit=250');

    while (url) {
        const response = await fetch(url, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }

        const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        if (callLimit) {
            const [used] = callLimit.split('/').map(Number);
            if (used >= RATE_LIMIT_THRESHOLD) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        const data = await response.json();
        allOrders.push(...(data.orders || []));

        const linkHeader = response.headers.get('Link');
        url = parseNextPageUrl(linkHeader);

        if (url) {
            await new Promise(resolve => setTimeout(resolve, PAGINATION_DELAY_MS));
        }
    }

    return allOrders;
}

export async function fetchOrderCount(
    shopDomain: string,
    accessToken: string
): Promise<number> {
    const response = await shopifyFetch(shopDomain, accessToken, '/orders/count.json?status=any');
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
}

export async function fetchInventoryLevels(
    shopDomain: string,
    accessToken: string,
    inventoryItemIds: number[]
): Promise<Map<number, number>> {
    const levels = new Map<number, number>();
    const batchSize = 50;

    for (let i = 0; i < inventoryItemIds.length; i += batchSize) {
        const batch = inventoryItemIds.slice(i, i + batchSize);
        const ids = batch.join(',');
        const response = await shopifyFetch(
            shopDomain,
            accessToken,
            `/inventory_levels.json?inventory_item_ids=${ids}`
        );

        if (response.ok) {
            const data = await response.json();
            for (const level of data.inventory_levels || []) {
                const current = levels.get(level.inventory_item_id) || 0;
                levels.set(level.inventory_item_id, current + (level.available || 0));
            }
        }

        if (i + batchSize < inventoryItemIds.length) {
            await new Promise(resolve => setTimeout(resolve, PAGINATION_DELAY_MS));
        }
    }

    return levels;
}

export async function registerWebhook(
    shopDomain: string,
    accessToken: string,
    topic: string,
    callbackUrl: string
): Promise<string> {
    const response = await shopifyFetch(shopDomain, accessToken, '/webhooks.json', {
        method: 'POST',
        body: JSON.stringify({
            webhook: {
                topic,
                address: callbackUrl,
                format: 'json',
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to register webhook ${topic}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return String(data.webhook.id);
}

export async function deleteWebhook(
    shopDomain: string,
    accessToken: string,
    webhookId: string
): Promise<void> {
    const response = await shopifyFetch(shopDomain, accessToken, `/webhooks/${webhookId}.json`, {
        method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete webhook ${webhookId}: ${response.status}`);
    }
}

export function verifyWebhookHmac(
    rawBody: Buffer | string,
    hmacHeader: string,
    secret: string
): boolean {
    const hash = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(hash),
            Buffer.from(hmacHeader)
        );
    } catch {
        return false;
    }
}

export async function exchangeCodeForToken(
    shopDomain: string,
    code: string,
    apiKey: string,
    apiSecret: string
): Promise<{ accessToken: string; scope: string }> {
    const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: apiKey,
            client_secret: apiSecret,
            code,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        scope: data.scope,
    };
}

export function buildAuthUrl(
    shopDomain: string,
    apiKey: string,
    scopes: string[],
    redirectUri: string,
    state: string
): string {
    const params = new URLSearchParams({
        client_id: apiKey,
        scope: scopes.join(','),
        redirect_uri: redirectUri,
        state,
    });
    return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

export function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}
