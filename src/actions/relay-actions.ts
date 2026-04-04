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

// ── Block Type Prompt for AI Generation ──────────────────────────────

export const BLOCK_TYPE_PROMPT = `Available block types for relay widget responses:

CATALOG: type "catalog" (also "rooms", "products", "services", "menu", "listings")
— Product/service cards with name, price, rating, emoji, features, specs
— Use for browsing, product lists, menus, room listings

COMPARE: type "compare"
— Side-by-side comparison table for 2-3 items
— Requires compareFields array

ACTIVITIES: type "activities" (also "experiences", "classes", "treatments")
— Service/activity list with duration, price, bookable flag

BOOKING: type "book" (also "reserve", "appointment", "inquiry")
— Booking flow with date/guest selection, conversion paths

LOCATION: type "location" (also "directions")
— Address card with directions and map placeholder

CONTACT: type "contact"
— Contact methods list (whatsapp, phone, email, website)

GALLERY: type "gallery" (also "photos")
— Visual grid with emoji placeholders and labels

INFO: type "info" (also "faq", "details")
— Key-value information table

GREETING: type "greeting" (also "welcome")
— Welcome card with brand info and quick actions

PRICING: type "pricing" (also "packages", "plans")
— Tiered pricing table with features

TESTIMONIALS: type "testimonials" (also "reviews")
— Customer review cards with ratings

QUICK ACTIONS: type "quick_actions" (also "menu_actions")
— Action shortcuts grid with emoji + prompt

SCHEDULE: type "schedule" (also "timetable", "slots")
— Time-based availability grid

PROMO: type "promo" (also "offer", "deal")
— Promotional offer cards with discount codes

LEAD CAPTURE: type "lead_capture" (also "form", "inquiry_form")
— Form with text/phone/email/select fields

HANDOFF: type "handoff" (also "connect", "human")
— Human agent handoff options

SKIN QUIZ: type "skin_quiz"
— Step-by-step quiz with selectable options and progress bar
— sampleData: { quizStep: { question, hint, options: [{label, selected}], currentStep, totalSteps } }

CONCERN PICKER: type "concern_picker" (also "concerns")
— 3-column grid of selectable concern cards with icons
— sampleData: { concerns: [{ id, label, icon }] }

PRODUCT DETAIL: type "product_detail" (also "product_page")
— Full product page with image, price, sizes, features, CTA
— sampleData: { productDetail: { id, name, brand, description, price, currency, originalPrice, rating, reviewCount, badge, emoji, color, sizes, features, ctaLabel } }

INGREDIENTS: type "ingredients" (also "ingredient_list")
— Ingredient list with concentrations and certifications
— sampleData: { ingredients: [{ name, role, concentration }], certifications: ["Vegan", "Cruelty-free"] }

SHADE FINDER: type "shade_finder" (also "shade_match")
— Undertone selector with shade match result
— sampleData: { shadeOptions: [{ label, gradient, selected }], shadeMatch: { name, subtitle, swatchGradient } }

ROUTINE BUILDER: type "routine_builder" (also "routine")
— AM/PM skincare routine with steps, prices, bundle discount
— sampleData: { routine: { amSteps: [{name, price}], pmSteps: [{name, price}], totalPrice, discountPercent, skinProfile } }

BUNDLE: type "bundle" (also "bundle_set", "gift_set")
— Curated product set with savings highlight
— sampleData: { bundleData: { title, items: [{name, price}], originalTotal, bundlePrice, badge, color } }

GIFT CARD: type "gift_card"
— Gift card with amount selector and send CTA
— sampleData: { giftCard: { amounts: [25, 50, 100], currency: "$", brandName } }

CART: type "cart" (also "bag", "shopping_bag")
— Shopping cart with items, promo, subtotal/discount/shipping/total breakdown
— sampleData: { cart: { items: [{name, variant, price, emoji}], subtotal, discount, discountLabel, shipping, total, promoCode } }

CHECKOUT: type "checkout" (also "payment")
— Payment method selector with radio cards
— sampleData: { checkout: { total, currency, methods: [{label, subtitle, selected}] } }

ORDER CONFIRMATION: type "order_confirmed" (also "confirmation")
— Green success header with order details
— sampleData: { confirmation: { orderId, items: [{name, price}], total, currency, shipping, estimatedDelivery } }

ORDER TRACKER: type "order_tracker" (also "track_order", "shipment")
— Horizontal progress stepper with carrier info
— sampleData: { tracker: { orderId, steps: ["Placed","Packed","Shipped","Out","Delivered"], currentStep: "Shipped", carrier, estimatedArrival } }

RETURN/EXCHANGE: type "return_exchange" (also "return", "exchange")
— Return flow with reason picker, refund/exchange/credit options
— sampleData: { returnData: { productName, orderId, reasons: [{label, selected}], options: [{label, subtitle}], policyNote } }

QUICK REORDER: type "quick_reorder" (also "reorder")
— Previous order items with one-tap reorder
— sampleData: { reorderData: { items: [{name, price, emoji}], total, currency, daysSinceOrder } }

SUBSCRIPTION: type "subscription" (also "subscribe_save")
— Subscribe & save with frequency options and discount
— sampleData: { subscriptionData: { productName, oneTimePrice, currency, frequencies: [{label, discount, price, selected}], emoji } }

LOYALTY: type "loyalty" (also "rewards", "points")
— Tier progress bar with points and perks grid
— sampleData: { loyaltyData: { tierName, points, nextTier, pointsToNext, progressPercent, perks: [{label, value, emoji}] } }

WISHLIST: type "wishlist" (also "saved_items", "favorites")
— Saved items list with add-to-bag buttons
— sampleData: { wishlistItems: [{ name, price, originalPrice, flag, emoji }] }

REFERRAL: type "referral" (also "refer_friend")
— Give/get referral card with code and share buttons
— sampleData: { referralData: { givesAmount: "$10", getsAmount: "$10", code: "FRIEND10", currency: "$", friendsJoined, totalEarned } }

SOCIAL PROOF: type "social_proof" (also "trust_badges")
— Stats row + badges + certifications
— sampleData: { socialProofData: { stats: [{value, label}], badges: ["Editor's Pick"], certifications: ["Dermatologist Tested"] } }

FEEDBACK: type "feedback_request" (also "review_request")
— Star rating selector for post-purchase feedback
— sampleData: { feedbackData: { productName, deliveredAgo: "3 days ago", rewardPoints: 50 } }

CONSULTATION BOOKING: type "consultation" (also "book_consultation")
— Time slot picker with includes list and book CTA
— sampleData: { bookingData: { title, subtitle, slots: [{time, selected}], includes: ["Skin analysis"], price: "Free" } }

TEXT: type "text"
— Plain text with suggestion chips (default fallback)
— ALWAYS include 2-3 suggestions
`;
