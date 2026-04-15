'use server';

/**
 * Content Studio — registry reader.
 *
 * Exposes the block registry (vertical configs + per-block data
 * contracts) as plain data so server actions can consume it without
 * crossing any React / 'use client' boundaries.
 *
 * History: earlier versions of this file imported `VerticalConfig` data
 * and `BlockDefinition` data contracts from `'use client'` modules
 * under `admin/relay/blocks/previews/*` and `lib/relay/blocks/*`. In
 * Next.js production builds those imports resolve to client-reference
 * proxies on the server, so `cfg.blocks` was undefined and
 * `def.dataContract.required` crashed the partner Content Studio page
 * with "Cannot read properties of undefined (reading 'required')".
 *
 * Fix: inline plain-data copies of every vertical config and every
 * block's data contract we actually render. Verticals we haven't
 * inlined yet return an empty stub — which the partner page renders as
 * the "Content Studio for <vertical> is empty" state with a
 * Regenerate button. That's acceptable per product direction: if the
 * server has no data for a vertical, show empty rather than crash.
 */

import { VERTICAL_IDS, type VerticalId } from './verticals';

// ── Data shapes (no React refs) ──────────────────────────────────────

type ServerSafeBlock = {
    id: string;
    family: string;
    label: string;
    stage: string;
    desc: string;
    intents: string[];
    module: string | null;
    status?: 'active' | 'new' | 'planned';
};

type ServerSafeSubVertical = {
    id: string;
    name: string;
    industryId: string;
    blocks: string[];
};

type ServerSafeVerticalConfig = {
    id: string;
    industryId: string;
    name: string;
    iconName: string;
    accentColor: string;
    blocks: ServerSafeBlock[];
    subVerticals: ServerSafeSubVertical[];
    families: Record<string, { label: string; color: string }>;
};

type ServerSafeContractField = {
    field: string;
    type: string;
    label: string;
};

type ServerSafeDataContract = {
    required: ServerSafeContractField[];
    optional: ServerSafeContractField[];
};

export interface VerticalRegistryData {
    verticalId: string;
    config: {
        name: string;
        industryId: string;
        iconName: string;
        accentColor: string;
    };
    blocks: Array<{
        id: string;
        family: string;
        label: string;
        stage: string;
        status: string;
        desc: string;
        intents: string[];
        module: string | null;
        subVerticals: string[];
    }>;
    families: Record<string, { label: string; color: string }>;
    subVerticals: Array<{ id: string; name: string; blockIds: string[] }>;
}

export interface DataContractInfo {
    required: Array<{ field: string; type: string; label: string }>;
    optional: Array<{ field: string; type: string; label: string }>;
}

// ── Inline ecommerce vertical config ────────────────────────────────

const ECOMMERCE_CONFIG: ServerSafeVerticalConfig = {
    id: 'ecommerce',
    industryId: 'retail_commerce',
    name: 'Retail & E-commerce',
    iconName: 'ShoppingBag',
    accentColor: '#2d4a3e',
    blocks: [
        { id: 'skin_quiz', family: 'entry', label: 'Quiz / Survey', stage: 'discovery', desc: 'Multi-step qualification quiz with progress tracking', intents: ['quiz', 'help me find', 'recommend'], module: null, status: 'new' },
        { id: 'product_card', family: 'catalog', label: 'Product Card', stage: 'discovery', desc: 'Browsable item card with price, image, rating, and add-to-cart', intents: ['show', 'browse', 'products', 'menu', 'catalog'], module: 'moduleItems', status: 'active' },
        { id: 'product_detail', family: 'catalog', label: 'Product Detail', stage: 'showcase', desc: 'Full item view with images, variants, specs, and actions', intents: ['details', 'tell me more', 'specs', 'about'], module: 'moduleItems', status: 'active' },
        { id: 'compare', family: 'catalog', label: 'Compare', stage: 'comparison', desc: 'Side-by-side comparison table for 2-4 items', intents: ['compare', 'difference', 'vs', 'which one'], module: 'moduleItems', status: 'active' },
        { id: 'bundle', family: 'marketing', label: 'Bundle / Set', stage: 'showcase', desc: 'Multi-item bundle with combined pricing and savings indicator', intents: ['bundle', 'set', 'package', 'combo'], module: 'moduleItems', status: 'new' },
        { id: 'promo', family: 'marketing', label: 'Promotions & offers', stage: 'showcase', desc: 'Flash sales, coupon codes, and festive offers', intents: ['offer', 'deal', 'discount', 'promo', 'sale'], module: null, status: 'active' },
        { id: 'cart', family: 'commerce', label: 'Shopping cart', stage: 'conversion', desc: 'Cart with line items, coupons, and in-chat checkout', intents: ['cart', 'checkout', 'order', 'buy'], module: null, status: 'active' },
        { id: 'order_confirmation', family: 'commerce', label: 'Order Confirmation', stage: 'followup', desc: 'Post-purchase confirmation with order ID and delivery info', intents: ['confirm', 'receipt', 'thank'], module: null, status: 'active' },
        { id: 'order_tracker', family: 'commerce', label: 'Order Tracker', stage: 'followup', desc: 'Live order status with timeline steps and tracking link', intents: ['track', 'status', 'where is', 'delivery'], module: null, status: 'active' },
        { id: 'booking', family: 'conversion', label: 'Booking / Appointment', stage: 'conversion', desc: 'Time slot picker for consultations or appointments', intents: ['book', 'appointment', 'schedule', 'reserve'], module: null, status: 'new' },
        { id: 'subscription', family: 'commerce', label: 'Subscribe & Save', stage: 'conversion', desc: 'Auto-replenish subscription with frequency options and savings', intents: ['subscribe', 'auto', 'recurring', 'replenish'], module: 'moduleItems', status: 'new' },
        { id: 'loyalty', family: 'engagement', label: 'Loyalty / Rewards', stage: 'social_proof', desc: 'Points balance, tier progress, and redeemable rewards', intents: ['points', 'rewards', 'loyalty', 'tier'], module: null, status: 'new' },
        { id: 'greeting', family: 'shared', label: 'Welcome & quick actions', stage: 'greeting', desc: 'Welcome message with brand identity and quick action buttons', intents: ['hello', 'hi', 'start', 'hey'], module: null, status: 'active' },
    ],
    subVerticals: [
        { id: 'ecommerce_d2c', name: 'E-commerce / D2C Brand', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'bundle', 'promo', 'cart', 'order_confirmation', 'order_tracker', 'booking', 'subscription', 'loyalty', 'skin_quiz'] },
        { id: 'physical_retail', name: 'Physical Retail Store', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'promo', 'order_confirmation', 'loyalty'] },
        { id: 'fashion_apparel', name: 'Fashion & Apparel', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'bundle', 'promo', 'cart', 'order_confirmation', 'order_tracker', 'subscription', 'loyalty', 'skin_quiz'] },
        { id: 'electronics_gadgets', name: 'Electronics & Gadgets', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'bundle', 'promo', 'cart', 'order_confirmation', 'order_tracker'] },
        { id: 'jewelry_luxury', name: 'Jewelry & Luxury Goods', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'booking', 'order_confirmation'] },
        { id: 'furniture_home', name: 'Furniture & Home Goods', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'cart', 'order_confirmation', 'order_tracker'] },
        { id: 'grocery_convenience', name: 'Grocery & Convenience', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'promo', 'cart', 'order_confirmation', 'order_tracker', 'subscription'] },
        { id: 'health_wellness_retail', name: 'Health & Wellness Retail', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'cart', 'subscription', 'skin_quiz', 'order_confirmation', 'order_tracker', 'loyalty'] },
        { id: 'books_stationery', name: 'Books & Stationery', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'cart', 'order_confirmation', 'order_tracker'] },
        { id: 'sports_outdoor', name: 'Sports & Outdoor Goods', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'bundle', 'cart', 'order_confirmation', 'order_tracker'] },
        { id: 'baby_kids', name: 'Baby & Kids Products', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'bundle', 'cart', 'subscription', 'order_confirmation', 'order_tracker'] },
        { id: 'pet_supplies', name: 'Pet Supplies', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'cart', 'subscription', 'order_confirmation', 'order_tracker'] },
        { id: 'wholesale_distribution', name: 'Wholesale & Distribution', industryId: 'retail_commerce', blocks: ['greeting', 'product_card', 'product_detail', 'compare', 'order_confirmation', 'order_tracker'] },
    ],
    families: {
        entry: { label: 'Entry & Discovery', color: '#2d4a3e' },
        catalog: { label: 'Product & Catalog', color: '#1d4ed8' },
        marketing: { label: 'Pricing & Promos', color: '#c4704b' },
        commerce: { label: 'Cart & Commerce', color: '#b45309' },
        conversion: { label: 'Conversion', color: '#2d6a4f' },
        engagement: { label: 'Engagement', color: '#be185d' },
        shared: { label: 'Shared', color: '#6b7280' },
    },
};

const VERTICAL_DATA: Partial<Record<VerticalId, ServerSafeVerticalConfig>> = {
    ecommerce: ECOMMERCE_CONFIG,
    // Other verticals are intentionally empty here; the partner page
    // will render the "empty" state with a Regenerate button for any
    // vertical we haven't filled in yet.
};

// ── Inline ecommerce data contracts ─────────────────────────────────

const ECOMMERCE_DATA_CONTRACTS: Record<string, ServerSafeDataContract> = {
    skin_quiz: {
        required: [
            { field: 'questions', type: 'tags', label: 'Quiz questions' },
            { field: 'resultMap', type: 'tags', label: 'Result → product mapping' },
        ],
        optional: [{ field: 'progress', type: 'number', label: 'Progress tracking' }],
    },
    product_card: {
        required: [
            { field: 'name', type: 'text', label: 'Product Name' },
            { field: 'price', type: 'currency', label: 'Price' },
        ],
        optional: [
            { field: 'mrp', type: 'currency', label: 'MRP' },
            { field: 'brand', type: 'text', label: 'Brand' },
            { field: 'badge', type: 'text', label: 'Badge' },
            { field: 'stock', type: 'select', label: 'Stock Status' },
            { field: 'rating', type: 'rating', label: 'Rating' },
            { field: 'reviews', type: 'number', label: 'Review Count' },
            { field: 'tags', type: 'tags', label: 'Tags' },
            { field: 'imageUrl', type: 'image', label: 'Image' },
        ],
    },
    product_detail: {
        required: [
            { field: 'name', type: 'text', label: 'Product name' },
            { field: 'price', type: 'currency', label: 'Price' },
            { field: 'description', type: 'textarea', label: 'Description' },
        ],
        optional: [
            { field: 'sizes', type: 'tags', label: 'Sizes' },
            { field: 'colors', type: 'tags', label: 'Colors' },
            { field: 'features', type: 'tags', label: 'Features' },
            { field: 'specs', type: 'tags', label: 'Specifications' },
        ],
    },
    compare: {
        required: [
            { field: 'items', type: 'tags', label: 'Items to compare' },
            { field: 'rows', type: 'tags', label: 'Comparison rows' },
        ],
        optional: [{ field: 'verdict', type: 'text', label: 'AI verdict' }],
    },
    bundle: {
        required: [
            { field: 'bundleName', type: 'text', label: 'Bundle name' },
            { field: 'items', type: 'tags', label: 'Bundle items' },
            { field: 'bundlePrice', type: 'currency', label: 'Bundle price' },
        ],
        optional: [{ field: 'savings', type: 'text', label: 'Savings label' }],
    },
    promo: {
        required: [{ field: 'title', type: 'text', label: 'Offer title' }],
        optional: [
            { field: 'subtitle', type: 'text', label: 'Subtitle' },
            { field: 'code', type: 'text', label: 'Coupon code' },
            { field: 'discount', type: 'text', label: 'Discount' },
            { field: 'minOrder', type: 'text', label: 'Minimum order' },
            { field: 'expiresIn', type: 'text', label: 'Expires in' },
        ],
    },
    cart: {
        required: [{ field: 'items', type: 'tags', label: 'Cart items' }],
        optional: [
            { field: 'couponCode', type: 'text', label: 'Coupon code' },
            { field: 'deliveryFee', type: 'currency', label: 'Delivery fee' },
        ],
    },
    order_confirmation: {
        required: [
            { field: 'orderId', type: 'text', label: 'Order ID' },
            { field: 'total', type: 'currency', label: 'Total' },
        ],
        optional: [
            { field: 'items', type: 'tags', label: 'Order items' },
            { field: 'deliveryEstimate', type: 'text', label: 'Delivery estimate' },
            { field: 'updateChannel', type: 'text', label: 'Updates via' },
        ],
    },
    order_tracker: {
        required: [
            { field: 'orderId', type: 'text', label: 'Order ID' },
            { field: 'status', type: 'select', label: 'Status' },
        ],
        optional: [
            { field: 'orderDate', type: 'text', label: 'Order date' },
            { field: 'expectedDate', type: 'text', label: 'Expected delivery' },
            { field: 'carrier', type: 'text', label: 'Carrier' },
        ],
    },
    booking: {
        required: [
            { field: 'serviceType', type: 'select', label: 'Service type' },
            { field: 'date', type: 'date', label: 'Date' },
            { field: 'time', type: 'time', label: 'Time slot' },
        ],
        optional: [{ field: 'notes', type: 'textarea', label: 'Notes' }],
    },
    subscription: {
        required: [
            { field: 'product', type: 'text', label: 'Product' },
            { field: 'frequency', type: 'select', label: 'Frequency' },
            { field: 'price', type: 'currency', label: 'Subscription price' },
        ],
        optional: [{ field: 'savings', type: 'text', label: 'Savings vs one-time' }],
    },
    loyalty: {
        required: [
            { field: 'points', type: 'number', label: 'Points balance' },
            { field: 'tier', type: 'text', label: 'Current tier' },
        ],
        optional: [
            { field: 'nextTier', type: 'text', label: 'Next tier' },
            { field: 'pointsToNext', type: 'number', label: 'Points needed' },
            { field: 'rewards', type: 'tags', label: 'Available rewards' },
        ],
    },
    greeting: {
        required: [
            { field: 'brandName', type: 'text', label: 'Brand name' },
            { field: 'tagline', type: 'text', label: 'Tagline' },
        ],
        optional: [
            { field: 'welcomeMessage', type: 'textarea', label: 'Welcome message' },
            { field: 'quickActions', type: 'tags', label: 'Quick actions' },
            { field: 'logoUrl', type: 'image', label: 'Logo' },
        ],
    },
};

const DATA_CONTRACTS: Partial<Record<VerticalId, Record<string, ServerSafeDataContract>>> = {
    ecommerce: ECOMMERCE_DATA_CONTRACTS,
};

// ── Helpers ─────────────────────────────────────────────────────────

function titleCase(id: string): string {
    return id
        .replace(/[_-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function emptyStub(verticalId: string): VerticalRegistryData {
    return {
        verticalId,
        config: {
            name: titleCase(verticalId),
            industryId: verticalId,
            iconName: 'Package',
            accentColor: '#6b7280',
        },
        blocks: [],
        families: {},
        subVerticals: [],
    };
}

// ── Public API ──────────────────────────────────────────────────────

export async function getAllVerticalIds(): Promise<string[]> {
    return [...VERTICAL_IDS];
}

/**
 * Given an arbitrary slug from a partner doc (vertical id, sub-vertical id,
 * or industry id), resolve it to a Content Studio vertical id — or null if
 * no match.
 */
export async function resolveVerticalFromSlug(slug: string): Promise<string | null> {
    if (!slug) return null;
    if ((VERTICAL_IDS as readonly string[]).includes(slug)) return slug;
    for (const vId of VERTICAL_IDS) {
        const cfg = VERTICAL_DATA[vId as VerticalId];
        if (!cfg) continue;
        if (cfg.subVerticals.some(sv => sv.id === slug)) return vId;
        if (cfg.industryId === slug) return vId;
    }
    return null;
}

export async function getVerticalRegistryData(
    verticalId: string
): Promise<VerticalRegistryData | null> {
    // Unknown vertical id → null (caller treats as "no config").
    if (!(VERTICAL_IDS as readonly string[]).includes(verticalId)) {
        return null;
    }

    const cfg = VERTICAL_DATA[verticalId as VerticalId];
    if (!cfg || !Array.isArray(cfg.blocks) || cfg.blocks.length === 0) {
        // Known vertical with no inlined data — render the empty state.
        return emptyStub(verticalId);
    }

    // Invert sub-vertical membership so each block knows which
    // sub-verticals it belongs to.
    const blockSubVerticals: Record<string, string[]> = {};
    for (const sv of cfg.subVerticals) {
        for (const blockId of sv.blocks) {
            if (!blockSubVerticals[blockId]) blockSubVerticals[blockId] = [];
            blockSubVerticals[blockId].push(sv.id);
        }
    }

    return {
        verticalId: cfg.id,
        config: {
            name: cfg.name,
            industryId: cfg.industryId,
            iconName: cfg.iconName,
            accentColor: cfg.accentColor,
        },
        blocks: cfg.blocks.map(b => ({
            id: b.id,
            family: b.family,
            label: b.label,
            stage: b.stage,
            status: b.status || 'active',
            desc: b.desc,
            intents: Array.isArray(b.intents) ? b.intents : [],
            module: b.module ?? null,
            subVerticals: blockSubVerticals[b.id] || [],
        })),
        families: { ...cfg.families },
        subVerticals: cfg.subVerticals.map(sv => ({
            id: sv.id,
            name: sv.name,
            blockIds: sv.blocks,
        })),
    };
}

export async function getBlockDataContract(
    verticalId: string,
    blockId: string
): Promise<DataContractInfo> {
    const map = DATA_CONTRACTS[verticalId as VerticalId];
    const raw = map?.[blockId];
    if (!raw) return { required: [], optional: [] };

    const required = Array.isArray(raw.required) ? raw.required : [];
    const optional = Array.isArray(raw.optional) ? raw.optional : [];

    return {
        required: required.map(f => ({
            field: f.field,
            type: f.type,
            label: f.label || titleCase(f.field),
        })),
        optional: optional.map(f => ({
            field: f.field,
            type: f.type,
            label: f.label || titleCase(f.field),
        })),
    };
}
