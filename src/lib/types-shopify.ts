export interface ShopifyIntegrationConfig {
    status: 'connected' | 'disconnected' | 'syncing' | 'error';
    shopName: string;
    shopDomain: string;
    encryptedAccessToken: string;
    scopes: string[];
    linkedModuleId: string | null;
    linkedModuleSlug: string | null;
    syncConfig: {
        products: ShopifySyncStatus;
        customers: ShopifySyncStatus;
        orders: ShopifySyncStatus;
    };
    syncDirection: 'pull';
    lastSyncAt: string | null;
    lastSyncStatus: 'success' | 'partial' | 'failed' | null;
    webhookIds: Record<string, string>;
    error?: string;
    installedAt: string;
    updatedAt: string;
}

export interface ShopifySyncStatus {
    enabled: boolean;
    lastSyncAt: string | null;
    itemsSynced: number;
    status: 'idle' | 'syncing' | 'success' | 'error';
    error?: string;
}

export interface ShopifyProduct {
    id: number;
    title: string;
    body_html: string | null;
    vendor: string;
    product_type: string;
    handle: string;
    status: 'active' | 'archived' | 'draft';
    tags: string;
    variants: ShopifyVariant[];
    images: ShopifyImage[];
    created_at: string;
    updated_at: string;
}

export interface ShopifyVariant {
    id: number;
    product_id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string | null;
    inventory_quantity: number;
    inventory_item_id: number;
    weight: number;
    weight_unit: string;
    requires_shipping: boolean;
    taxable: boolean;
}

export interface ShopifyImage {
    id: number;
    product_id: number;
    src: string;
    alt: string | null;
    position: number;
    width: number;
    height: number;
}

export interface ShopifyCustomer {
    id: number;
    email: string | null;
    first_name: string;
    last_name: string;
    phone: string | null;
    addresses: ShopifyAddress[];
    orders_count: number;
    total_spent: string;
    tags: string;
    note: string | null;
    state: 'disabled' | 'invited' | 'enabled' | 'declined';
    verified_email: boolean;
    created_at: string;
    updated_at: string;
}

export interface ShopifyAddress {
    id: number;
    address1: string | null;
    address2: string | null;
    city: string | null;
    province: string | null;
    province_code: string | null;
    country: string | null;
    country_code: string | null;
    zip: string | null;
    phone: string | null;
    default: boolean;
}

export interface ShopifyOrder {
    id: number;
    order_number: number;
    email: string | null;
    created_at: string;
    updated_at: string;
    cancelled_at: string | null;
    total_price: string;
    subtotal_price: string;
    total_tax: string;
    currency: string;
    financial_status: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
    fulfillment_status: 'fulfilled' | 'partial' | 'restocked' | null;
    line_items: ShopifyLineItem[];
    customer: ShopifyCustomer | null;
    shipping_address: ShopifyAddress | null;
    billing_address: ShopifyAddress | null;
    note: string | null;
    tags: string;
}

export interface ShopifyLineItem {
    id: number;
    product_id: number | null;
    variant_id: number | null;
    title: string;
    name: string;
    quantity: number;
    price: string;
    sku: string | null;
}

export interface ShopifyWebhookPayload {
    id: number;
    [key: string]: any;
}

export interface ShopifyContactRecord {
    name: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    addresses: ShopifyAddress[];
    tags: string[];
    notes: string;
    totalSpent: string;
    ordersCount: number;
    source: 'shopify';
    externalId: string;
    lastSyncedAt: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ShopifyOrderActivity {
    type: 'shopify_order';
    externalId: string;
    orderNumber: number;
    totalPrice: string;
    currency: string;
    financialStatus: string;
    fulfillmentStatus: string | null;
    lineItems: { name: string; quantity: number; price: string }[];
    createdAt: string;
    updatedAt: string;
    cancelledAt?: string;
}

export interface ShopifyWebhookLogEntry {
    topic: string;
    receivedAt: string;
    status: 'success' | 'error';
    payload: Record<string, any>;
    error?: string;
    processingTimeMs: number;
}
