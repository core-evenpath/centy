'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { GoogleGenAI, Type } from '@google/genai';
import { getBlockMappingForFunction } from '@/lib/relay-block-taxonomy';

// ── Gemini client for block template generation ─────────────────────
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
const BLOCK_GEN_MODEL = 'gemini-3.1-pro-preview';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error: any) {
            const status = error?.status || error?.code || 0;
            const message = error?.message || '';
            const isRetryable =
                status === 429 || status >= 500 ||
                message.includes('429') || message.includes('quota') ||
                message.includes('RESOURCE_EXHAUSTED');
            if (isRetryable && attempt < retries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                await wait(delay);
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries exceeded');
}

// ── Types ────────────────────────────────────────────────────────────

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
        generatedBy: 'gemini' | 'manual' | 'default';
        generatedAt: string;
        subcategory: string;
        sampleData: Record<string, any>;
        isDefault: boolean;
    };
    status: string;
    createdAt?: string;
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

// ── Get all relay block configs with module details ─────────────────

export async function getRelayBlockConfigsWithModulesAction(): Promise<{
    success: boolean;
    configs: RelayBlockConfigDetail[];
    error?: string;
}> {
    try {
        const snapshot = await adminDb.collection('relayBlockConfigs').get();

        const configs: RelayBlockConfigDetail[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                blockType: data.blockType || 'card',
                label: data.label || doc.id,
                description: data.description || undefined,
                moduleSlug: data.moduleSlug || undefined,
                moduleId: data.moduleId || undefined,
                applicableIndustries: data.applicableIndustries || [],
                applicableFunctions: data.applicableFunctions || [],
                agentConfig: data.agentConfig || undefined,
                dataSchema: data.dataSchema || undefined,
                blockTypeTemplate: data.blockTypeTemplate || undefined,
                status: data.status || 'active',
                createdAt: data.createdAt || undefined,
            };
        });

        configs.sort((a, b) => {
            const typeCompare = a.blockType.localeCompare(b.blockType);
            if (typeCompare !== 0) return typeCompare;
            return a.label.localeCompare(b.label);
        });

        return { success: true, configs };
    } catch (e: any) {
        console.error('Failed to get relay block configs:', e);
        return { success: false, configs: [], error: e.message };
    }
}

// ── Update a relay block config ─────────────────────────────────────

export async function updateRelayBlockConfigAction(
    id: string,
    updates: Partial<Omit<RelayBlockConfigDetail, 'id'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = adminDb.collection('relayBlockConfigs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        await docRef.update({
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to update relay block config:', e);
        return { success: false, error: e.message };
    }
}

// ── Delete a relay block config ─────────────────────────────────────

export async function deleteRelayBlockConfigAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = adminDb.collection('relayBlockConfigs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        await docRef.delete();

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete relay block config:', e);
        return { success: false, error: e.message };
    }
}

// ── Generate relay block for a module (AI-powered) ──────────────────

export interface GenerateRelayBlockModuleInput {
    id: string;
    name: string;
    slug: string;
    description?: string;
    schema?: { fields?: Array<{ name: string; type: string; label?: string }> };
    applicableIndustries?: string[];
    applicableFunctions?: string[];
    agentConfig?: Record<string, any>;
}

const BLOCK_TYPE_PROMPT = `You are a UI/UX expert designing UNIQUE, visually engaging chat widget block templates. Each template MUST feel distinct and industry-specific — never generic.

Available block types and their REQUIRED sampleData shapes:

CATALOG FAMILY (use for browsable items with prices):
Types: "catalog", "rooms", "products", "services", "menu", "listings"
- "rooms" for hotel/accommodation, "menu" for food/drink, "products" for retail, "services" for service businesses, "listings" for directories
sampleData shape: { items: CatalogItem[] } where CatalogItem = {
  id: string, name: string, price: number, currency: "USD"|"EUR"|etc,
  originalPrice?: number (for discounts), unit?: string ("per night","each"),
  subtitle?: string, tagline?: string, emoji?: string,
  color?: string (hex gradient start), colorEnd?: string (hex gradient end),
  rating?: number (1-5), reviewCount?: number,
  badges?: string[] (e.g. ["Best Seller","New"]),
  features?: string[] (e.g. ["WiFi","Pool"]),
  specs?: {label:string, value:string}[] (e.g. [{label:"Size",value:"42sqm"}]),
  maxCapacity?: number
}
Generate 3-4 items with VARIED prices, ratings, badges, colors, and features. Use industry-appropriate emojis. Include at least one item with originalPrice (discount), one with specs, one with badges.

ACTIVITY FAMILY (use for bookable services/experiences):
Types: "activities", "experiences", "classes", "treatments"
- "experiences" for tours/events, "classes" for education, "treatments" for spa/medical
sampleData shape: { items: ActivityItem[] } where ActivityItem = {
  id: string, name: string, description: string,
  icon: string (emoji), price: string ("$50" or "Free"),
  duration: string ("60 min"), category: string,
  bookable: boolean
}
Generate 4-5 items across 2-3 categories. Mix free and paid. Use vivid descriptions.

BOOKING FAMILY (use for reservation/conversion flows):
Types: "book", "reserve", "appointment", "inquiry"
sampleData shape: {
  items: CatalogItem[] (2-3 bookable items),
  conversionPaths: ConversionPath[],
  dateMode: "range"|"single"|"none",
  guestMode: "counter"|"none",
  headerLabel: string, selectLabel: string
}
ConversionPath = { id: string, label: string, icon: string (emoji), type: "primary"|"secondary", color?: string (hex), action: "direct"|"whatsapp"|"callback"|"save"|"share"|"ask"|"external" }
Generate 2-3 conversion paths (mix primary/secondary).

LOCATION (for business locations):
Types: "location", "directions"
sampleData shape: { location: { name: string, address: string, area: string, emoji?: string, mapGradient?: [string,string] (two hex colors), directions?: {icon:string,label:string,detail:string}[], actions?: string[] } }

CONTACT (for contact methods):
Type: "contact"
sampleData shape: { methods: ContactMethod[] } where ContactMethod = { type: "whatsapp"|"phone"|"email"|"website"|"chat", label: string, value: string, icon: string (emoji) }
Generate 3-4 methods.

GALLERY (for visual grids):
Types: "gallery", "photos"
sampleData shape: { items: GalleryItem[] } where GalleryItem = { emoji: string, label: string, span?: number (1 or 2, use 2 for featured items) }
Generate 5-6 items, at least one with span:2.

INFO FAMILY (for structured information):
Types: "info", "faq", "details"
sampleData shape: { items: InfoItem[] } where InfoItem = { label: string, value: string }
Generate 5-7 items.

GREETING (for welcome screens):
Types: "greeting", "welcome"
sampleData shape: { brand: { name: string, emoji: string, tagline: string, quickActions: {label:string,prompt:string,emoji:string}[] } }
Generate 3-4 quick actions.

TEXT (for rich text responses):
Type: "text"
sampleData shape: { text: string, suggestions: string[] }
Generate engaging text with 3-4 follow-up suggestions.

CRITICAL RULES:
1. Choose the MOST SPECIFIC type for the module's industry (never default to "catalog" if a better fit exists)
2. sampleData MUST match the exact shape above — this drives the live preview
3. Make every template VISUALLY UNIQUE: use different color palettes, emojis, creative names, varied item counts
4. Think like a customer browsing on mobile — what would ENGAGE them and feel different from a text chat?
5. Use the module's actual field names in displayTemplate with {{fieldName}} syntax
6. Prices, names, and descriptions should be realistic for the specific industry

PRICING FAMILY (for tiered service packages):
Types: "pricing", "packages", "plans"
- "pricing" for general, "packages" for bundled offerings, "plans" for subscription-style
sampleData shape: { items: PricingTier[] } where PricingTier = {
  id: string, name: string, price: number, currency: string,
  unit?: string ("per session","per month"), features: string[],
  isPopular?: boolean, emoji?: string, color?: string (hex)
}
Generate 2-3 tiers with varied prices. Mark one as isPopular. Include 3-5 features per tier.

TESTIMONIAL (for social proof and reviews):
Types: "testimonials", "reviews"
sampleData shape: { items: Testimonial[] } where Testimonial = {
  id: string, name: string, text: string (1-2 sentences),
  rating?: number (1-5), date?: string ("2 weeks ago"), source?: string ("Google","WhatsApp")
}
Generate 3-4 testimonials with varied ratings (mostly 4-5). Use realistic first names.

QUICK ACTIONS (for intent entry points):
Types: "quick_actions", "menu_actions"
sampleData shape: { items: QuickAction[] } where QuickAction = {
  id: string, label: string (2-4 words), emoji: string,
  prompt: string (message sent on tap), description?: string
}
Generate 4-6 actions relevant to the business type.

SCHEDULE (for time-based availability):
Types: "schedule", "timetable", "slots"
sampleData shape: { items: ScheduleSlot[] } where ScheduleSlot = {
  id: string, time: string ("10:00 AM"), endTime?: string ("11:00 AM"),
  title: string, instructor?: string, spots?: number,
  price?: string ("₹500"), emoji?: string, isAvailable: boolean
}
Generate 5-7 slots. Mix available and unavailable.

PROMO (for offers and discounts):
Types: "promo", "offer", "deal"
sampleData shape: { items: PromoOffer[] } where PromoOffer = {
  id: string, title: string, description: string,
  discount?: string ("30% OFF"), code?: string ("WEEKEND30"),
  validUntil?: string, emoji?: string, color?: string (hex), ctaLabel?: string
}
Generate 1-2 promos with eye-catching details.

LEAD CAPTURE (for inquiry/quote forms):
Types: "lead_capture", "form", "inquiry_form"
sampleData shape: { fields: LeadField[] } where LeadField = {
  id: string, label: string, type: "text"|"phone"|"email"|"select",
  placeholder?: string, required?: boolean, options?: string[] (for select)
}
Generate 3-4 fields (name + phone + email + one industry-specific select).

HANDOFF (for connecting to humans):
Types: "handoff", "connect", "human"
sampleData shape: { options: HandoffOption[] } where HandoffOption = {
  id: string, type: "whatsapp"|"phone"|"callback"|"chat",
  label: string, value?: string, icon: string (emoji), description?: string
}
Generate 2-3 options. Always include whatsapp.`;

const VALID_BLOCK_TYPES = [
    'catalog', 'rooms', 'products', 'services', 'menu', 'listings',
    'compare', 'activities', 'experiences', 'classes', 'treatments',
    'book', 'reserve', 'appointment', 'inquiry',
    'location', 'directions', 'contact',
    'gallery', 'photos',
    'info', 'faq', 'details',
    'greeting', 'welcome',
    'text',
    'pricing', 'packages', 'plans',
    'testimonials', 'reviews',
    'quick_actions', 'menu_actions',
    'schedule', 'timetable', 'slots',
    'promo', 'offer', 'deal',
    'lead_capture', 'form', 'inquiry_form',
    'handoff', 'connect', 'human',
];

async function callGeminiForBlockTemplate(module: GenerateRelayBlockModuleInput): Promise<{
    blockType: string;
    displayTemplate: string;
    suggestedTitle: string;
    suggestedDescription: string;
    maxItems: number;
    sortBy: string;
    sampleData: Record<string, any>;
}> {
    const fieldInfo = module.schema?.fields?.map(f => ({
        name: f.name,
        type: f.type,
        label: f.label || f.name,
    })) || [];

    const prompt = `${BLOCK_TYPE_PROMPT}

Module Details:
- Name: ${module.name}
- Slug: ${module.slug}
- Description: ${module.description || 'N/A'}
- Fields: ${JSON.stringify(fieldInfo)}
- Industry: ${(module.applicableIndustries || []).join(', ') || 'general'}
- Business Functions: ${(module.applicableFunctions || []).join(', ') || 'other'}
- Item Label: ${module.agentConfig?.itemLabel || module.name}
- Price Type: ${module.agentConfig?.priceType || 'one_time'}`;

    const functionId = (module.applicableFunctions || [])[0] || 'general';
    const taxonomyMapping = getBlockMappingForFunction(functionId);
    const taxonomyContext = `\n\nTaxonomy Constraints for "${functionId}":\n- PREFERRED types (choose from these first): ${taxonomyMapping.primaryBlocks.join(', ')}\n- ACCEPTABLE types (use if primary doesn't fit): ${taxonomyMapping.secondaryBlocks.join(', ')}\n- NEVER use these: ${taxonomyMapping.excludedBlocks.join(', ')}\n\nYour blockType MUST be from PREFERRED or ACCEPTABLE. Do NOT default to "catalog" if a more specific type fits.`;

    const fullPrompt = prompt + taxonomyContext;

    const response = await retryWithBackoff(() => genAI.models.generateContent({
        model: BLOCK_GEN_MODEL,
        contents: fullPrompt,
        config: {
            temperature: 0.9,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    blockType: { type: Type.STRING },
                    displayTemplate: { type: Type.STRING },
                    suggestedTitle: { type: Type.STRING },
                    suggestedDescription: { type: Type.STRING },
                    maxItems: { type: Type.NUMBER },
                    sortBy: { type: Type.STRING },
                    sampleData: { type: Type.OBJECT, properties: {} },
                },
                required: ["blockType", "displayTemplate", "suggestedTitle", "suggestedDescription", "maxItems", "sortBy", "sampleData"],
            },
        },
    }));

    const jsonText = response.text;
    if (!jsonText) throw new Error('No response from Gemini');
    const parsed = JSON.parse(jsonText);

    if (!VALID_BLOCK_TYPES.includes(parsed.blockType)) {
        parsed.blockType = 'catalog';
    }

    return {
        blockType: parsed.blockType,
        displayTemplate: parsed.displayTemplate || '',
        suggestedTitle: parsed.suggestedTitle || module.name,
        suggestedDescription: parsed.suggestedDescription || '',
        maxItems: Math.min(Math.max(parsed.maxItems || 5, 1), 10),
        sortBy: parsed.sortBy || 'createdAt',
        sampleData: parsed.sampleData || {},
    };
}

export async function generateRelayBlockForModule(
    module: GenerateRelayBlockModuleInput
): Promise<{ success: boolean; blockId?: string; error?: string }> {
    const blockConfigId = `module_${module.slug}`;
    const now = new Date().toISOString();
    const subcategory = (module.applicableFunctions || [])[0] || 'general';

    try {
        let aiResult: Awaited<ReturnType<typeof callGeminiForBlockTemplate>>;
        let generatedBy: 'gemini' | 'default' = 'gemini';
        let isDefault = false;

        try {
            aiResult = await callGeminiForBlockTemplate(module);
        } catch (aiError) {
            console.error(`AI generation failed for ${module.slug}, using fallback:`, aiError);
            const fieldNames = module.schema?.fields?.map(f => f.name) || module.agentConfig?.displayFields || [];
            aiResult = {
                blockType: (() => { const fid = (module.applicableFunctions || [])[0] || 'general'; return getBlockMappingForFunction(fid).primaryBlocks[0] || 'catalog'; })(),
                displayTemplate: fieldNames.map(f => `{{${f}}}`).join(' | '),
                suggestedTitle: module.name,
                suggestedDescription: module.description || '',
                maxItems: 5,
                sortBy: 'createdAt',
                sampleData: Object.fromEntries(fieldNames.map(f => [f, `Sample ${f}`])),
            };
            generatedBy = 'default';
            isDefault = true;
        }

        const relayBlockConfig = {
            id: blockConfigId,
            blockType: aiResult.blockType,
            label: aiResult.suggestedTitle,
            description: aiResult.suggestedDescription,
            moduleSlug: module.slug,
            moduleId: module.id,
            applicableIndustries: module.applicableIndustries || [],
            applicableFunctions: module.applicableFunctions || [],
            agentConfig: module.agentConfig || {},
            dataSchema: {
                sourceCollection: `modules/${module.id}/entries`,
                sourceFields: module.schema?.fields?.map(f => f.name) || [],
                displayTemplate: aiResult.displayTemplate,
                maxItems: aiResult.maxItems,
                sortBy: aiResult.sortBy,
                sortOrder: 'desc',
            },
            blockTypeTemplate: {
                generatedBy,
                generatedAt: now,
                subcategory,
                sampleData: aiResult.sampleData,
                isDefault,
            },
            status: 'active',
            createdAt: now,
            updatedAt: now,
        };

        await adminDb.collection('relayBlockConfigs').doc(blockConfigId).set(relayBlockConfig);

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true, blockId: blockConfigId };
    } catch (e: any) {
        console.error(`Failed to generate relay block for ${module.slug}:`, e);
        return { success: false, error: e.message };
    }
}

// ── Regenerate a block template via AI ──────────────────────────────

export async function regenerateBlockTemplateAction(
    blockId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const blockRef = adminDb.collection('relayBlockConfigs').doc(blockId);
        const blockDoc = await blockRef.get();

        if (!blockDoc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        const blockData = blockDoc.data()!;
        const moduleId = blockData.moduleId;

        if (!moduleId) {
            return { success: false, error: 'No linked module found' };
        }

        const moduleDoc = await adminDb.collection('systemModules').doc(moduleId).get();
        if (!moduleDoc.exists) {
            return { success: false, error: 'Linked module not found' };
        }

        const mod = moduleDoc.data()!;
        const aiResult = await callGeminiForBlockTemplate({
            id: moduleId,
            name: mod.name,
            slug: mod.slug,
            description: mod.description,
            schema: mod.schema,
            applicableIndustries: mod.applicableIndustries,
            applicableFunctions: mod.applicableFunctions,
            agentConfig: mod.agentConfig,
        });

        const now = new Date().toISOString();
        const subcategory = (mod.applicableFunctions || [])[0] || 'general';

        await blockRef.update({
            blockType: aiResult.blockType,
            label: aiResult.suggestedTitle,
            description: aiResult.suggestedDescription,
            dataSchema: {
                sourceCollection: `modules/${moduleId}/entries`,
                sourceFields: mod.schema?.fields?.map((f: any) => f.name) || [],
                displayTemplate: aiResult.displayTemplate,
                maxItems: aiResult.maxItems,
                sortBy: aiResult.sortBy,
                sortOrder: 'desc',
            },
            blockTypeTemplate: {
                generatedBy: 'gemini',
                generatedAt: now,
                subcategory,
                sampleData: aiResult.sampleData,
                isDefault: false,
            },
            updatedAt: now,
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to regenerate block template:', e);
        return { success: false, error: e.message };
    }
}

// ── Clear all relay block configs ───────────────────────────────────

export async function clearAllRelayBlockConfigsAction(): Promise<{
    success: boolean;
    count: number;
    error?: string;
}> {
    try {
        const snapshot = await adminDb.collection('relayBlockConfigs').get();

        if (snapshot.empty) {
            return { success: true, count: 0 };
        }

        let count = 0;
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += 500) {
            const batch = adminDb.batch();
            const chunk = docs.slice(i, i + 500);
            for (const doc of chunk) {
                batch.delete(doc.ref);
                count++;
            }
            await batch.commit();
        }

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true, count };
    } catch (e: any) {
        console.error('Failed to clear relay block configs:', e);
        return { success: false, count: 0, error: e.message };
    }
}

// ── Generate blocks for all modules missing configs ─────────────────

export async function generateMissingRelayBlocksAction(): Promise<{
    success: boolean;
    generated: number;
    errors: string[];
}> {
    let generated = 0;
    const errors: string[] = [];

    try {
        const modulesSnapshot = await adminDb.collection('systemModules')
            .where('status', '==', 'active')
            .get();

        const existingSnapshot = await adminDb.collection('relayBlockConfigs').get();
        const existingIds = new Set(existingSnapshot.docs.map(d => d.id));

        for (const doc of modulesSnapshot.docs) {
            const mod = doc.data();
            const blockId = `module_${mod.slug}`;

            if (existingIds.has(blockId)) {
                continue;
            }

            try {
                const result = await generateRelayBlockForModule({
                    id: doc.id,
                    name: mod.name,
                    slug: mod.slug,
                    description: mod.description,
                    schema: mod.schema,
                    applicableIndustries: mod.applicableIndustries,
                    applicableFunctions: mod.applicableFunctions,
                    agentConfig: mod.agentConfig,
                });

                if (result.success) {
                    generated++;
                } else {
                    errors.push(`${mod.slug}: ${result.error}`);
                }
            } catch (e: any) {
                errors.push(`${mod.slug}: ${e.message}`);
            }
        }

        return { success: true, generated, errors };
    } catch (e: any) {
        console.error('Failed to generate missing relay blocks:', e);
        return { success: false, generated, errors: [e.message] };
    }
}
