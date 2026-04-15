'use server';

/**
 * Content Studio — config generator.
 *
 * Translates the block registry for a vertical into partner-friendly
 * entries using Gemini (with a deterministic fallback when the API is
 * unavailable or returns unusable JSON).
 */

import { GoogleGenAI } from '@google/genai';
import type {
    ContentStudioBlockEntry,
    ContentStudioConfig,
    ContentStudioFamilyDef,
} from '@/lib/types-content-studio';
import {
    getVerticalRegistryData,
    getBlockDataContract,
    type VerticalRegistryData,
    type DataContractInfo,
} from './registry-reader';

// ── Fallback heuristics ──────────────────────────────────────────────

const FAMILY_ICON: Record<string, string> = {
    entry: 'Sparkles',
    discovery: 'Search',
    catalog: 'ShoppingBag',
    marketing: 'Tag',
    commerce: 'CreditCard',
    conversion: 'Zap',
    engagement: 'Heart',
    comparison: 'BarChart',
    support: 'Headphones',
    education: 'BookOpen',
    content: 'FileText',
    social: 'Users',
    logistics: 'Truck',
};

const FAMILY_PRIORITY_ORDER = [
    'entry',
    'catalog',
    'discovery',
    'commerce',
    'conversion',
    'marketing',
    'engagement',
    'comparison',
    'support',
    'content',
];

const AUTO_CONFIGURED_BLOCK_IDS = new Set([
    'greeting',
    'contact',
    'nudge',
    'suggestions',
]);

/**
 * Hand-tuned customer/partner copy per block id, used both as a quality
 * fallback when Gemini is unavailable AND as a seed that Gemini can
 * refine. Keyed by the short registry id (e.g. `product_card`). Any
 * block id not in this map falls through to heuristic generation from
 * the block's `label`/`desc`.
 */
const BLOCK_COPY_SEEDS: Record<
    string,
    {
        customerLabel: string;
        partnerAction: string;
        missReason?: string | null;
        icon?: string;
    }
> = {
    // ── Ecommerce ──
    skin_quiz: {
        customerLabel: 'Take a guided quiz to find the right product',
        partnerAction: 'Build the quiz questions and product-matching rules',
        missReason: 'Without a quiz, customers rely on trial-and-error to find fits',
        icon: 'ClipboardList',
    },
    product_card: {
        customerLabel: 'Browse products with images, prices, and ratings',
        partnerAction: 'Upload your product list or connect your store',
        missReason: 'Customers can\'t buy products you haven\'t added',
        icon: 'ShoppingBag',
    },
    product_detail: {
        customerLabel: 'View full details — sizes, colors, specs, reviews',
        partnerAction: 'Add detailed fields to your products (auto from product data)',
        missReason: 'Short product info causes abandonment on high-intent questions',
        icon: 'Search',
    },
    compare: {
        customerLabel: 'Compare two products side by side with an AI verdict',
        partnerAction: 'Works automatically when products have detailed specs',
        missReason: null,
        icon: 'BarChart',
    },
    bundle: {
        customerLabel: 'See curated product bundles with combined pricing',
        partnerAction: 'Create bundles from your products with a bundle price',
        missReason: 'Bundles lift AOV — skipping them leaves revenue on the table',
        icon: 'Gift',
    },
    promo: {
        customerLabel: 'See flash sales, coupon codes, and festive offers',
        partnerAction: 'Add your current promotions or discount codes',
        missReason: 'Without promo info customers ask anyway and get generic answers',
        icon: 'Tag',
    },
    cart: {
        customerLabel: 'Add items to cart, apply coupons, and checkout',
        partnerAction: 'Connect a payment method for in-chat checkout',
        missReason: 'Without checkout, customers leave the chat to buy',
        icon: 'ShoppingCart',
    },
    order_confirmation: {
        customerLabel: 'See order placed confirmation with summary',
        partnerAction: 'Connect your order system — this triggers automatically',
        missReason: null,
        icon: 'Check',
    },
    order_tracker: {
        customerLabel: 'Track order status with live shipment progress',
        partnerAction: 'Connect your order/shipping system for live tracking',
        missReason: '"Where is my order?" is the #1 post-purchase question',
        icon: 'Truck',
    },
    booking: {
        customerLabel: 'Book a consultation or try-on appointment',
        partnerAction: 'Connect your calendar or scheduling tool',
        missReason: 'High-ticket items convert 3× better with a consultation step',
        icon: 'Calendar',
    },
    subscription: {
        customerLabel: 'Set up auto-replenish subscriptions with savings',
        partnerAction: 'Define which products support subscriptions and frequency options',
        missReason: 'Subscriptions lock in retention — each skipped signup is lost LTV',
        icon: 'Repeat',
    },
    loyalty: {
        customerLabel: 'View points balance, tier progress, and rewards',
        partnerAction: 'Set up your loyalty program rules and tiers',
        missReason: 'Repeat buyers spend 3× more when they see their rewards progress',
        icon: 'Award',
    },
    greeting: {
        customerLabel: 'See a welcome message with quick action buttons',
        partnerAction: 'Set your brand name, tagline, and welcome message',
        missReason: null,
        icon: 'Radio',
    },
};

function inferSourceType(
    block: VerticalRegistryData['blocks'][number]
): ContentStudioBlockEntry['sourceType'] {
    if (AUTO_CONFIGURED_BLOCK_IDS.has(block.id)) return 'auto';
    if (block.module) return 'module';
    return 'manual';
}

function truncateWords(text: string, maxWords: number): string {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '…';
}

function buildFallback(
    block: VerticalRegistryData['blocks'][number],
    contract: DataContractInfo
): Pick<
    ContentStudioBlockEntry,
    | 'customerLabel'
    | 'partnerAction'
    | 'missReason'
    | 'icon'
    | 'templateColumns'
    | 'priority'
    | 'autoConfigured'
    | 'sourceType'
> {
    const isAuto = AUTO_CONFIGURED_BLOCK_IDS.has(block.id);
    const priority =
        FAMILY_PRIORITY_ORDER.indexOf(block.family) >= 0
            ? FAMILY_PRIORITY_ORDER.indexOf(block.family) + 1
            : 10;

    const seed = BLOCK_COPY_SEEDS[block.id];

    return {
        customerLabel: seed?.customerLabel || truncateWords(block.desc, 12),
        partnerAction:
            seed?.partnerAction ||
            (isAuto
                ? `No setup required — ${block.label.toLowerCase()} works automatically.`
                : `Add your ${block.label.toLowerCase()} data.`),
        missReason: isAuto
            ? null
            : seed && seed.missReason !== undefined
              ? seed.missReason
              : `Customers can't use ${block.label.toLowerCase()} without this data.`,
        icon: seed?.icon || FAMILY_ICON[block.family] || 'Package',
        templateColumns: contract.required.length
            ? contract.required.map(f => f.label)
            : null,
        priority,
        autoConfigured: isAuto,
        sourceType: inferSourceType(block),
    };
}

// ── Gemini call ──────────────────────────────────────────────────────

interface GeminiBlockResponse {
    blockId: string;
    customerLabel?: string;
    partnerAction?: string;
    missReason?: string | null;
    templateColumns?: string[] | null;
    priority?: number;
    icon?: string;
    sourceType?: ContentStudioBlockEntry['sourceType'];
    autoConfigured?: boolean;
}

const GEMINI_SYSTEM = `You are a UX copywriter for a business messaging platform. Given a block registry for a specific business vertical, generate customer-facing labels and partner instructions.

Rules:
- customerLabel: What the CUSTOMER can do. Plain English. Under 12 words. No jargon.
  Example: "Browse products with images, prices, and ratings"
- partnerAction: What the PARTNER needs to do. Imperative. Specific. Under 15 words.
  Example: "Upload your product list or connect your store"
- missReason: Why this matters if missing. Business impact. Under 15 words. null if autoConfigured.
- templateColumns: Human-readable CSV column headers from required fields. null if not applicable.
- priority: 1-10 where 1 is most important for this vertical.
- icon: Lucide icon name that best represents this block. Choose from: ShoppingBag, Tag, CreditCard, Truck, RotateCcw, MessageSquare, Calendar, Star, Award, Heart, Zap, Shield, Users, Clock, Search, Gift, Repeat, ClipboardList, Package, Headphones, Radio, Eye, Upload, Database, Plug, PenLine, BarChart, MapPin, Home, Utensils, Bed, Image, FileText, HelpCircle, BookOpen, Sparkles.
- sourceType: Where data comes from. One of: profile, module, upload, api, manual, auto.
- autoConfigured: true if this block works without partner input.

Return ONLY a JSON array. One object per input block. No markdown fences. No explanation.
Each object MUST include "blockId" matching the input, plus the fields above.`;

function stripJsonFences(raw: string): string {
    let t = raw.trim();
    if (t.startsWith('```')) {
        // remove leading fence with optional language tag
        t = t.replace(/^```(?:json)?\s*/i, '');
        // remove trailing fence
        t = t.replace(/```\s*$/i, '');
    }
    return t.trim();
}

async function callGemini(
    registry: VerticalRegistryData,
    blocksWithContracts: Array<{
        block: VerticalRegistryData['blocks'][number];
        contract: DataContractInfo;
    }>
): Promise<{ responses: GeminiBlockResponse[]; model: string } | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
        console.warn(
            '[content-studio] GEMINI_API_KEY not set — using heuristic fallback for',
            registry.verticalId
        );
        return null;
    }

    const model = process.env.RELAY_AI_MODEL || 'gemini-2.5-flash';

    try {
        const ai = new GoogleGenAI({ apiKey });
        const userPayload = {
            vertical: {
                id: registry.verticalId,
                name: registry.config.name,
                industryId: registry.config.industryId,
            },
            blocks: blocksWithContracts.map(({ block, contract }) => ({
                blockId: block.id,
                family: block.family,
                label: block.label,
                stage: block.stage,
                status: block.status,
                desc: block.desc,
                intents: block.intents,
                module: block.module,
                dataContract: contract,
            })),
        };

        const result = await ai.models.generateContent({
            model,
            contents: JSON.stringify(userPayload),
            config: {
                systemInstruction: GEMINI_SYSTEM,
                temperature: 0.3,
                maxOutputTokens: 4096,
            },
        });

        const raw = (result.text || '').trim();
        if (!raw) return null;
        const cleaned = stripJsonFences(raw);

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch (err) {
            console.error('[content-studio] Gemini JSON parse failed:', err, cleaned.slice(0, 200));
            return null;
        }

        if (!Array.isArray(parsed)) return null;
        return { responses: parsed as GeminiBlockResponse[], model };
    } catch (err) {
        console.error('[content-studio] Gemini call failed:', err);
        return null;
    }
}

// ── Public entry point ───────────────────────────────────────────────

export async function generateContentStudioConfig(
    verticalId: string
): Promise<ContentStudioConfig | null> {
    const registry = await getVerticalRegistryData(verticalId);
    if (!registry) return null;

    const nowIso = new Date().toISOString();

    // Stub verticals: return an empty shell so the partner UI can render
    // an "unsupported vertical" state without an AI call.
    if (registry.blocks.length === 0) {
        return {
            verticalId: registry.verticalId,
            verticalName: registry.config.name,
            industryId: registry.config.industryId,
            iconName: registry.config.iconName,
            accentColor: registry.config.accentColor,
            blocks: [],
            families: {},
            subVerticals: [],
            generatedAt: nowIso,
            generatedBy: 'manual',
            version: 1,
        };
    }

    // Attach data contracts in parallel.
    const blocksWithContracts = await Promise.all(
        registry.blocks.map(async block => ({
            block,
            contract: await getBlockDataContract(verticalId, block.id),
        }))
    );

    const gemini = await callGemini(registry, blocksWithContracts);
    const responseById = new Map<string, GeminiBlockResponse>();
    if (gemini) {
        for (const r of gemini.responses) {
            if (r && typeof r.blockId === 'string') {
                responseById.set(r.blockId, r);
            }
        }
        console.log(
            `[content-studio] Gemini (${gemini.model}) generated ${responseById.size}/${blocksWithContracts.length} blocks for ${verticalId}`
        );
    } else {
        console.log(
            `[content-studio] Using heuristic fallback for ${verticalId} (${blocksWithContracts.length} blocks)`
        );
    }

    const studioBlocks: ContentStudioBlockEntry[] = blocksWithContracts.map(({ block, contract }) => {
        const fallback = buildFallback(block, contract);
        const ai = responseById.get(block.id);

        const autoConfigured = ai?.autoConfigured ?? fallback.autoConfigured;
        const rawMiss = ai?.missReason;
        const missReason = autoConfigured
            ? null
            : typeof rawMiss === 'string' && rawMiss.length > 0
              ? rawMiss
              : fallback.missReason;

        return {
            blockId: block.id,
            registryId: block.id,
            family: block.family,
            label: block.label,
            stage: block.stage,
            status: (block.status as ContentStudioBlockEntry['status']) || 'active',
            customerLabel: ai?.customerLabel || fallback.customerLabel,
            partnerAction: ai?.partnerAction || fallback.partnerAction,
            missReason,
            icon: ai?.icon || fallback.icon,
            dataContract: contract,
            templateColumns:
                ai?.templateColumns !== undefined ? ai.templateColumns : fallback.templateColumns,
            priority:
                typeof ai?.priority === 'number' && ai.priority > 0 ? ai.priority : fallback.priority,
            moduleDependent: Boolean(block.module),
            backendRequired: false,
            autoConfigured,
            sourceType: ai?.sourceType || fallback.sourceType,
            dependsOn: null,
            subVerticals: Array.isArray(block.subVerticals) && block.subVerticals.length > 0 ? block.subVerticals : 'all',
        };
    });

    const families: Record<string, ContentStudioFamilyDef> = Object.fromEntries(
        Object.entries(registry.families).map(([id, f]) => [id, { id, label: f.label, color: f.color }])
    );

    return {
        verticalId: registry.verticalId,
        verticalName: registry.config.name,
        industryId: registry.config.industryId,
        iconName: registry.config.iconName,
        accentColor: registry.config.accentColor,
        blocks: studioBlocks,
        families,
        subVerticals: registry.subVerticals,
        generatedAt: nowIso,
        generatedBy: gemini ? 'ai' : 'manual',
        aiModel: gemini?.model,
        version: 1,
    };
}
