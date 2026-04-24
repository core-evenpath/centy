'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { invalidateBlockConfigCache } from '@/lib/relay/block-config-service';
import { VERTICAL_MANIFEST } from '@/app/admin/relay/blocks/previews/_manifest';
import type { UnifiedBlockConfig } from '@/lib/relay/types';

// ── Code-registry ID alignment ───────────────────────────────────────
// Legacy seed IDs (short: `greeting`, `product_card`, …) are remapped to
// the prefixed IDs (`ecom_*`, `shared_*`) used by `src/lib/relay/blocks/**`
// at write time. BlockRenderer dispatches on `block.type` (gemini response
// type) so this alignment is a backstop for any consumer that still reads
// the Firestore block IDs directly.

const CODE_REGISTRY_ID_MAP: Record<string, string> = {
  greeting: 'ecom_greeting',
  product_card: 'ecom_product_card',
  product_detail: 'ecom_product_detail',
  compare: 'ecom_compare',
  cart: 'ecom_cart',
  order_confirmation: 'ecom_order_confirmation',
  order_tracker: 'ecom_order_tracker',
  promo: 'ecom_promo',
  nudge: 'shared_nudge',
  suggestions: 'shared_suggestions',
  contact: 'shared_contact',
};

function mapToRegistryId(id: string): string {
  return CODE_REGISTRY_ID_MAP[id] ?? id;
}

// ── Prompt schema templates by block type ────────────────────────────
// One promptSchema per block type. Each entry is written into Firestore
// `relayBlockConfigs` so the chat route can read it dynamically.

const PROMPT_SCHEMAS: Record<string, string> = {
  catalog: '{"type":"catalog","text":"...","items":[{"id":"...","name":"...","price":0,"currency":"INR","subtitle":"...","emoji":"...","color":"#...","rating":4.5,"reviewCount":100,"features":["..."],"specs":[{"label":"...","value":"..."}]}],"suggestions":["..."]}',
  compare: '{"type":"compare","text":"...","items":[{"id":"...","name":"...","price":0,"currency":"INR","subtitle":"...","features":["..."]}],"compareFields":[{"label":"...","key":"..."}],"suggestions":["..."]}',
  activities: '{"type":"activities","text":"...","items":[{"id":"...","name":"...","description":"...","icon":"🏷️","price":"₹X,XXX","duration":"X hours","category":"...","bookable":true}],"suggestions":["..."]}',
  book: '{"type":"book","text":"...","items":[{"id":"...","name":"...","price":0}],"conversionPaths":[{"id":"...","label":"...","icon":"📞","type":"primary","action":"whatsapp"}],"dateMode":"single","guestMode":"counter","headerLabel":"Book Now","selectLabel":"Select","suggestions":["..."]}',
  location: '{"type":"location","text":"...","location":{"name":"...","address":"...","area":"...","directions":[{"icon":"✈️","label":"Airport","detail":"45 min"}]},"suggestions":["..."]}',
  contact: '{"type":"contact","text":"...","methods":[{"type":"whatsapp","label":"WhatsApp","value":"+91...","icon":"💬"},{"type":"phone","label":"Call","value":"+91...","icon":"📞"},{"type":"email","label":"Email","value":"...@...","icon":"📧"}],"suggestions":["..."]}',
  gallery: '{"type":"gallery","text":"...","items":[{"emoji":"📸","label":"...","span":1}],"suggestions":["..."]}',
  info: '{"type":"info","text":"...","items":[{"label":"...","value":"..."}],"suggestions":["..."]}',
  greeting: '{"type":"greeting","text":"...","brand":{"name":"...","emoji":"👋","tagline":"...","quickActions":[{"label":"...","prompt":"...","emoji":"..."}]},"suggestions":["..."]}',
  pricing: '{"type":"pricing","text":"...","pricingTiers":[{"id":"...","name":"...","price":0,"currency":"INR","unit":"/session","features":["..."],"isPopular":false,"emoji":"..."}],"suggestions":["..."]}',
  testimonials: '{"type":"testimonials","text":"...","testimonials":[{"id":"...","name":"...","text":"...","rating":5,"date":"1 week ago","source":"Google"}],"suggestions":["..."]}',
  quick_actions: '{"type":"quick_actions","text":"...","quickActions":[{"id":"...","label":"...","emoji":"...","prompt":"...","description":"..."}],"suggestions":["..."]}',
  schedule: '{"type":"schedule","text":"...","schedule":[{"id":"...","time":"10:00 AM","endTime":"11:00 AM","title":"...","instructor":"...","spots":4,"price":"₹500","emoji":"...","isAvailable":true}],"suggestions":["..."]}',
  promo: '{"type":"promo","text":"...","promos":[{"id":"...","title":"...","description":"...","discount":"25% OFF","code":"SAVE25","validUntil":"...","emoji":"🎉","ctaLabel":"Claim Offer"}],"suggestions":["..."]}',
  lead_capture: '{"type":"lead_capture","text":"...","fields":[{"id":"...","label":"Your Name","type":"text","placeholder":"...","required":true}],"title":"...","subtitle":"...","suggestions":["..."]}',
  handoff: '{"type":"handoff","text":"...","handoffOptions":[{"id":"...","type":"whatsapp","label":"WhatsApp Us","value":"+91...","icon":"💬","description":"Usually replies within 5 min"}],"title":"...","subtitle":"...","suggestions":["..."]}',
  text: '{"type":"text","text":"...","suggestions":["suggestion 1","suggestion 2","suggestion 3"]}',
};

// Maps block stage/family to the closest prompt schema type
function resolvePromptSchemaType(block: { family: string; stage: string; id: string }): string {
  // Direct ID matches (short + prefixed code-registry IDs)
  const idMap: Record<string, string> = {
    greeting: 'greeting', suggestions: 'quick_actions', contact: 'contact',
    promo: 'promo', cart: 'catalog', compare: 'compare',
    product_card: 'catalog', product_detail: 'catalog',
    nudge: 'info', loyalty: 'info', booking: 'book',
    order_tracker: 'info', order_confirmation: 'info',
    subscription: 'pricing', bundle: 'catalog', skin_quiz: 'lead_capture',
    // Prefixed code-registry IDs
    ecom_greeting: 'greeting', ecom_product_card: 'catalog', ecom_product_detail: 'catalog',
    ecom_compare: 'compare', ecom_cart: 'catalog', ecom_order_confirmation: 'info',
    ecom_order_tracker: 'info', ecom_promo: 'promo',
    shared_suggestions: 'quick_actions', shared_contact: 'contact', shared_nudge: 'info',
  };
  if (idMap[block.id]) return idMap[block.id];

  // Family-based mapping
  const familyMap: Record<string, string> = {
    catalog: 'catalog', rooms: 'catalog', menu: 'catalog', practitioners: 'catalog',
    services: 'catalog', booking: 'book', reservation: 'book', conversion: 'book',
    ordering: 'catalog', social_proof: 'testimonials', people: 'catalog',
    pricing: 'pricing', insurance: 'info', clinical: 'info', tracking: 'info',
    content: 'info', credentials: 'info', info: 'info', property: 'gallery',
    timetable: 'schedule', scheduling: 'schedule', concierge: 'activities',
    events: 'catalog', transport: 'catalog', dining: 'catalog',
    operations: 'lead_capture', kitchen: 'info',
  };
  if (familyMap[block.family]) return familyMap[block.family];

  // Stage-based fallback
  const stageMap: Record<string, string> = {
    greeting: 'greeting', discovery: 'catalog', showcase: 'catalog',
    comparison: 'compare', conversion: 'book', followup: 'info',
    social_proof: 'testimonials', handoff: 'handoff', objection: 'info',
  };
  return stageMap[block.stage] || 'text';
}

// ── Core block definitions (shared + ecommerce) ─────────────────────

const CORE_BLOCKS: Array<Omit<UnifiedBlockConfig, 'createdAt' | 'updatedAt' | 'sampleData' | 'promptSchema'>> = [
  {
    id: 'ecom_greeting', verticalId: 'shared', family: 'entry', label: 'Greeting', description: 'Welcome message with brand identity and quick action buttons',
    stage: 'greeting', status: 'active',
    fields_req: ['brandName', 'tagline', 'welcomeMessage'], fields_opt: ['quickActions', 'brandEmoji', 'logoUrl'],
    intents: ['hello', 'hi', 'start', 'hey'], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
  {
    id: 'skin_quiz', verticalId: 'shared', family: 'entry', label: 'Quiz / Survey', description: 'Multi-step qualification quiz with progress tracking',
    stage: 'discovery', status: 'new',
    fields_req: ['questions', 'steps'], fields_opt: ['progressBar', 'skipEnabled'],
    intents: ['quiz', 'help me find', 'recommend'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'ecom_product_card', verticalId: 'ecommerce', family: 'catalog', label: 'Product Card', description: 'Browsable item card with price, image, rating, and add-to-cart',
    stage: 'discovery', status: 'active',
    fields_req: ['name', 'price', 'currency'], fields_opt: ['image', 'rating', 'badges', 'subtitle', 'specs', 'reviewCount'],
    intents: ['show', 'browse', 'products', 'menu', 'catalog'], module: 'items',
    applicableCategories: [], variants: [], preloadable: true, streamable: true, cacheDuration: 1800,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 10 },
  },
  {
    id: 'ecom_product_detail', verticalId: 'ecommerce', family: 'catalog', label: 'Product Detail', description: 'Full item view with images, variants, specs, and actions',
    stage: 'showcase', status: 'active',
    fields_req: ['name', 'price', 'description'], fields_opt: ['images', 'variants', 'specs', 'reviews', 'sizes'],
    intents: ['details', 'tell me more', 'specs', 'about'], module: 'items',
    applicableCategories: [], variants: [], preloadable: true, streamable: true, cacheDuration: 1800,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 1 },
  },
  {
    id: 'ecom_compare', verticalId: 'shared', family: 'catalog', label: 'Compare', description: 'Side-by-side comparison table for 2-4 items',
    stage: 'comparison', status: 'active',
    fields_req: ['items', 'comparisonFields'], fields_opt: ['highlightWinner', 'recommendation'],
    intents: ['compare', 'difference', 'vs', 'which one'], module: 'items',
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 900,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 4 },
  },
  {
    id: 'ecom_promo', verticalId: 'shared', family: 'marketing', label: 'Promo Banner', description: 'Promotional offer with discount code, countdown, or sale info',
    stage: 'showcase', status: 'active',
    fields_req: ['title', 'description'], fields_opt: ['code', 'expiresAt', 'discountPercent', 'ctaLabel'],
    intents: ['offer', 'deal', 'discount', 'promo', 'sale'], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
  {
    id: 'bundle', verticalId: 'ecommerce', family: 'marketing', label: 'Bundle / Set', description: 'Multi-item bundle with combined pricing and savings indicator',
    stage: 'showcase', status: 'new',
    fields_req: ['items', 'bundlePrice'], fields_opt: ['originalPrice', 'savingsPercent', 'title'],
    intents: ['bundle', 'set', 'package', 'combo'], module: 'items',
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 1800,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 5 },
  },
  {
    id: 'ecom_cart', verticalId: 'shared', family: 'commerce', label: 'Cart', description: 'Shopping cart with line items, discounts, and checkout CTA',
    stage: 'conversion', status: 'active',
    fields_req: ['items', 'total', 'currency'], fields_opt: ['discount', 'deliveryFee', 'tax', 'promoCode'],
    intents: ['cart', 'checkout', 'order', 'buy', 'bag'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'ecom_order_confirmation', verticalId: 'shared', family: 'commerce', label: 'Order Confirmation', description: 'Post-purchase confirmation with order ID and delivery info',
    stage: 'followup', status: 'active',
    fields_req: ['orderId', 'items', 'total'], fields_opt: ['estimatedDelivery', 'trackingUrl'],
    intents: ['confirm', 'receipt', 'thank'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'ecom_order_tracker', verticalId: 'shared', family: 'commerce', label: 'Order Tracker', description: 'Live order status with timeline steps and tracking link',
    stage: 'followup', status: 'active',
    fields_req: ['orderId', 'status', 'steps'], fields_opt: ['estimatedArrival', 'carrier'],
    intents: ['track', 'status', 'where is', 'delivery'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 300,
    moduleBinding: null,
  },
  {
    id: 'booking', verticalId: 'shared', family: 'conversion', label: 'Booking / Appointment', description: 'Time slot picker for consultations or appointments',
    stage: 'conversion', status: 'new',
    fields_req: ['availableSlots', 'serviceType'], fields_opt: ['duration', 'price', 'staffName'],
    intents: ['book', 'appointment', 'schedule', 'reserve'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: null,
  },
  {
    id: 'subscription', verticalId: 'ecommerce', family: 'commerce', label: 'Subscribe & Save', description: 'Auto-replenish subscription with frequency options and savings',
    stage: 'conversion', status: 'new',
    fields_req: ['item', 'frequencies'], fields_opt: ['currentPrice', 'savingsPerFrequency'],
    intents: ['subscribe', 'auto', 'recurring', 'replenish'], module: 'items',
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 0,
    moduleBinding: { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 1 },
  },
  {
    id: 'loyalty', verticalId: 'shared', family: 'engagement', label: 'Loyalty / Rewards', description: 'Points balance, tier progress, and redeemable rewards',
    stage: 'social_proof', status: 'new',
    fields_req: ['points', 'tier'], fields_opt: ['nextTier', 'redeemable', 'multiplier'],
    intents: ['points', 'rewards', 'loyalty', 'tier'], module: null,
    applicableCategories: [], variants: [], preloadable: false, streamable: false, cacheDuration: 600,
    moduleBinding: null,
  },
  {
    id: 'shared_nudge', verticalId: 'shared', family: 'engagement', label: 'Smart Nudge', description: 'Non-blocking contextual suggestion, upsell, or info tip',
    stage: 'social_proof', status: 'active',
    fields_req: ['message'], fields_opt: ['ctaLabel', 'ctaAction', 'icon', 'variant'],
    intents: [], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 1800,
    moduleBinding: null,
  },
  {
    id: 'shared_suggestions', verticalId: 'shared', family: 'shared', label: 'Quick Replies', description: 'Tappable suggestion chips for guided conversation flow',
    stage: 'greeting', status: 'active',
    fields_req: ['items'], fields_opt: ['title'],
    intents: [], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
  {
    id: 'shared_contact', verticalId: 'shared', family: 'support', label: 'Contact Card', description: 'Business contact info with click-to-call, email, WhatsApp',
    stage: 'handoff', status: 'active',
    fields_req: ['businessName'], fields_opt: ['phone', 'email', 'whatsapp', 'address', 'hours'],
    intents: ['contact', 'phone', 'email', 'reach', 'call'], module: null,
    applicableCategories: [], variants: [], preloadable: true, streamable: false, cacheDuration: 3600,
    moduleBinding: null,
  },
];

// ── Build all blocks from core + vertical manifest ───────────────────

function buildAllBlockConfigs(): Array<Omit<UnifiedBlockConfig, 'createdAt' | 'updatedAt'>> {
  const allBlocks: Array<Omit<UnifiedBlockConfig, 'createdAt' | 'updatedAt'>> = [];
  const seenIds = new Set<string>();

  // 1. Core blocks (shared + ecommerce)
  for (const block of CORE_BLOCKS) {
    const id = mapToRegistryId(block.id);
    const schemaType = resolvePromptSchemaType(block);
    allBlocks.push({
      ...block,
      id,
      sampleData: {},
      promptSchema: PROMPT_SCHEMAS[schemaType] || PROMPT_SCHEMAS.text,
    });
    seenIds.add(id);
  }

  // 2. Vertical blocks from manifest
  for (const vertical of VERTICAL_MANIFEST) {
    for (const mb of vertical.blocks) {
      // Prefix bare vertical IDs with their vertical slug so they match
      // the code registry (e.g. `room_card` → `hosp_room_card`).
      const rawId = mb.id.includes('_') ? mb.id : `${vertical.id}_${mb.id}`;
      const id = mapToRegistryId(rawId);
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      const stub: Omit<UnifiedBlockConfig, 'createdAt' | 'updatedAt' | 'sampleData' | 'promptSchema'> = {
        id,
        verticalId: vertical.id,
        family: mb.family,
        label: mb.label,
        description: mb.desc,
        stage: mb.stage,
        status: 'new',
        intents: mb.intents,
        fields_req: [],
        fields_opt: [],
        module: mb.module,
        moduleBinding: mb.module === 'items'
          ? { sourceCollection: 'items', titleField: 'name', priceField: 'price', imageField: 'image', sortBy: 'popular', maxItems: 10 }
          : null,
        preloadable: false,
        streamable: false,
        cacheDuration: 300,
        variants: [],
        applicableCategories: [],
      };

      const schemaType = resolvePromptSchemaType(stub);
      allBlocks.push({
        ...stub,
        sampleData: {},
        promptSchema: PROMPT_SCHEMAS[schemaType] || PROMPT_SCHEMAS.text,
      });
    }
  }

  return allBlocks;
}

const DEFAULT_STAGES = [
  { id: 'greeting', label: 'Greeting', type: 'greeting', blockIds: ['ecom_greeting', 'shared_suggestions'], intentTriggers: ['browsing'], leadScoreImpact: 1, isEntry: true },
  { id: 'discovery', label: 'Discovery', type: 'discovery', blockIds: ['ecom_product_card', 'shared_suggestions', 'skin_quiz'], intentTriggers: ['browsing', 'returning'], leadScoreImpact: 2 },
  { id: 'showcase', label: 'Showcase', type: 'showcase', blockIds: ['ecom_product_detail', 'ecom_promo', 'bundle'], intentTriggers: ['pricing', 'promo'], leadScoreImpact: 3 },
  { id: 'comparison', label: 'Comparison', type: 'comparison', blockIds: ['ecom_compare'], intentTriggers: ['comparing'], leadScoreImpact: 2 },
  { id: 'social_proof', label: 'Social Proof', type: 'social_proof', blockIds: ['shared_nudge', 'loyalty'], intentTriggers: ['inquiry'], leadScoreImpact: 1 },
  { id: 'conversion', label: 'Conversion', type: 'conversion', blockIds: ['ecom_cart', 'booking', 'subscription', 'ecom_order_confirmation'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
  { id: 'handoff', label: 'Handoff', type: 'handoff', blockIds: ['shared_contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  { id: 'followup', label: 'Follow-up', type: 'followup', blockIds: ['ecom_order_tracker', 'shared_nudge'], intentTriggers: ['returning'], leadScoreImpact: 1 },
];

const DEFAULT_TRANSITIONS = [
  { from: 'greeting', to: 'discovery', trigger: 'browsing' },
  { from: 'greeting', to: 'conversion', trigger: 'booking', priority: 1 },
  { from: 'greeting', to: 'handoff', trigger: 'urgent', priority: 2 },
  { from: 'discovery', to: 'showcase', trigger: 'pricing' },
  { from: 'discovery', to: 'comparison', trigger: 'comparing' },
  { from: 'discovery', to: 'conversion', trigger: 'booking', priority: 1 },
  { from: 'discovery', to: 'handoff', trigger: 'complaint' },
  { from: 'showcase', to: 'conversion', trigger: 'booking', priority: 1 },
  { from: 'showcase', to: 'discovery', trigger: 'browsing' },
  { from: 'showcase', to: 'comparison', trigger: 'comparing' },
  { from: 'comparison', to: 'conversion', trigger: 'booking' },
  { from: 'comparison', to: 'showcase', trigger: 'pricing' },
  { from: 'social_proof', to: 'conversion', trigger: 'booking' },
  { from: 'conversion', to: 'followup', trigger: 'returning' },
  { from: 'conversion', to: 'handoff', trigger: 'contact' },
  { from: 'followup', to: 'discovery', trigger: 'browsing' },
  { from: 'followup', to: 'handoff', trigger: 'complaint' },
];

/**
 * Build a map of blockId → array of sub-vertical functionIds that use this block.
 * Shared blocks (present in SHARED_BLOCK_IDS) map to [] meaning "applies to all".
 */
function buildApplicableCategoriesMap(
  subVerticals: Array<{ id: string; blocks: string[] }>,
  sharedIds: string[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const sub of subVerticals) {
    for (const blockId of sub.blocks) {
      if (!map.has(blockId)) map.set(blockId, []);
      map.get(blockId)!.push(sub.id);
    }
  }
  // Shared blocks: empty array (semantic "all categories")
  for (const id of sharedIds) map.set(id, []);
  return map;
}

export async function seedDefaultBlocksAction(): Promise<{ success: boolean; seeded: number; skipped: number; error?: string }> {
  let seeded = 0;
  let skipped = 0;

  try {
    const { ALL_BLOCKS_DATA, ALL_SUB_VERTICALS_DATA, SHARED_BLOCK_IDS_DATA } =
      await import('@/app/admin/relay/blocks/previews/_registry-data');
    const rawCategoriesMap = buildApplicableCategoriesMap(ALL_SUB_VERTICALS_DATA, SHARED_BLOCK_IDS_DATA);
    // Remap applicableCategories keys so lookups by the prefixed doc ID work.
    const categoriesMap = new Map<string, string[]>(
      Array.from(rawCategoriesMap, ([k, v]) => [mapToRegistryId(k), v])
    );

    // Read existing docs — skip blocks that already exist (preserves admin toggles)
    const existingSnap = await adminDb.collection('relayBlockConfigs').get();
    const existingIds = new Set(existingSnap.docs.map(d => d.id));

    const now = new Date().toISOString();

    for (const block of ALL_BLOCKS_DATA) {
      const docId = mapToRegistryId(block.id);
      if (existingIds.has(docId)) {
        skipped++;
        continue;
      }

      const schemaType = resolvePromptSchemaType(block);
      await adminDb.collection('relayBlockConfigs').doc(docId).set({
        id: docId,
        verticalId: '',
        family: block.family,
        label: block.label,
        description: block.desc,
        stage: block.stage,
        status: block.status || 'active',
        intents: block.intents,
        fields_req: [],
        fields_opt: [],
        module: block.module,
        moduleBinding: null,
        sampleData: {},
        promptSchema: PROMPT_SCHEMAS[schemaType] || PROMPT_SCHEMAS.text,
        preloadable: false,
        streamable: false,
        cacheDuration: 300,
        variants: [],
        applicableCategories: categoriesMap.get(docId) ?? [],
        createdAt: now,
        updatedAt: now,
      });
      seeded++;
    }

    invalidateBlockConfigCache();
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true, seeded, skipped };
  } catch (err: unknown) {
    return { success: false, seeded, skipped, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function syncRegistryToFirestoreAction(): Promise<{
  success: boolean; added: number; deprecated: number; unchanged: number; error?: string;
}> {
  let added = 0;
  let deprecated = 0;
  let unchanged = 0;

  try {
    const { ALL_BLOCKS_DATA, ALL_SUB_VERTICALS_DATA, SHARED_BLOCK_IDS_DATA } =
      await import('@/app/admin/relay/blocks/previews/_registry-data');
    const rawCategoriesMap = buildApplicableCategoriesMap(ALL_SUB_VERTICALS_DATA, SHARED_BLOCK_IDS_DATA);
    // Remap applicableCategories keys so lookups by the prefixed doc ID work.
    const categoriesMap = new Map<string, string[]>(
      Array.from(rawCategoriesMap, ([k, v]) => [mapToRegistryId(k), v])
    );
    const registryIds = new Set(ALL_BLOCKS_DATA.map(b => mapToRegistryId(b.id)));

    const existingSnap = await adminDb.collection('relayBlockConfigs').get();
    const existingMap = new Map(existingSnap.docs.map(d => [d.id, d]));

    const now = new Date().toISOString();

    for (const block of ALL_BLOCKS_DATA) {
      const docId = mapToRegistryId(block.id);
      const applicableCategories = categoriesMap.get(docId) ?? [];

      if (existingMap.has(docId)) {
        // Keep existing doc but refresh applicableCategories so filter keeps working
        // after registry changes without blowing away admin-managed fields.
        const existing = existingMap.get(docId)!.data();
        const needsUpdate =
          JSON.stringify(existing.applicableCategories ?? []) !== JSON.stringify(applicableCategories);
        if (needsUpdate) {
          await adminDb.collection('relayBlockConfigs').doc(docId).update({
            applicableCategories,
            updatedAt: now,
          });
        }
        unchanged++;
        continue;
      }

      const schemaType = resolvePromptSchemaType(block);
      await adminDb.collection('relayBlockConfigs').doc(docId).set({
        id: docId,
        verticalId: '',
        family: block.family,
        label: block.label,
        description: block.desc,
        stage: block.stage,
        status: block.status || 'active',
        intents: block.intents,
        fields_req: [],
        fields_opt: [],
        module: block.module,
        moduleBinding: null,
        sampleData: {},
        promptSchema: PROMPT_SCHEMAS[schemaType] || PROMPT_SCHEMAS.text,
        preloadable: false,
        streamable: false,
        cacheDuration: 300,
        variants: [],
        applicableCategories,
        createdAt: now,
        updatedAt: now,
      });
      added++;
    }

    for (const [id, doc] of existingMap) {
      if (!registryIds.has(id) && doc.data().status !== 'deprecated') {
        await adminDb.collection('relayBlockConfigs').doc(id).update({
          status: 'deprecated',
          updatedAt: now,
        });
        deprecated++;
      }
    }

    invalidateBlockConfigCache();
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    console.log('[syncRegistry] wrote', { added, deprecated, unchanged });
    return { success: true, added, deprecated, unchanged };
  } catch (err: unknown) {
    return { success: false, added, deprecated, unchanged, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function seedDefaultFlowAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    await adminDb.collection('systemFlowTemplates').doc('default_flow').set({
      id: 'default_flow',
      name: 'Default Conversation Flow',
      description: 'Standard e-commerce conversation flow with 8 stages',
      industry: 'General',
      status: 'active',
      stages: DEFAULT_STAGES,
      transitions: DEFAULT_TRANSITIONS,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function resetAllBlockConfigsAction(): Promise<{ success: boolean; deleted: number; error?: string }> {
  try {
    const snapshot = await adminDb.collection('relayBlockConfigs').get();
    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true, deleted: snapshot.size };
  } catch (err: unknown) {
    return { success: false, deleted: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function toggleBlockStatusAction(blockId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb.collection('relayBlockConfigs').doc(blockId).update({
      status: enabled ? 'active' : 'disabled',
      updatedAt: new Date().toISOString(),
    });
    invalidateBlockConfigCache();
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getRelayDiagnosticsAction(): Promise<{
  success: boolean;
  checks: Array<{ label: string; status: 'pass' | 'warn' | 'fail'; desc: string; icon: string }>;
}> {
  try {
    const checks: Array<{ label: string; status: 'pass' | 'warn' | 'fail'; desc: string; icon: string }> = [];

    const blocksSnap = await adminDb.collection('relayBlockConfigs').get();
    const totalBlocks = blocksSnap.size;
    const activeBlocks = blocksSnap.docs.filter(d => d.data().status === 'active').length;
    checks.push({
      label: 'Block Registry',
      status: totalBlocks > 0 ? 'pass' : 'fail',
      desc: `${totalBlocks} blocks registered (${activeBlocks} active)`,
      icon: '◫',
    });

    const flowSnap = await adminDb.collection('systemFlowTemplates').doc('default_flow').get();
    checks.push({
      label: 'Flow Engine',
      status: flowSnap.exists ? 'pass' : 'fail',
      desc: flowSnap.exists ? `Default flow with ${flowSnap.data()?.stages?.length || 0} stages` : 'No default flow template found',
      icon: '⤳',
    });

    const moduleBound = blocksSnap.docs.filter(d => d.data().module != null).length;
    const moduleUnbound = blocksSnap.docs.filter(d => d.data().module == null).length;
    checks.push({
      label: 'Module Connection',
      status: moduleUnbound > 0 ? 'warn' : 'pass',
      desc: `${moduleBound} blocks have module binding`,
      icon: '⬡',
    });

    checks.push({
      label: 'RAG Store',
      status: 'pass',
      desc: 'Check RAG stores manually',
      icon: '◎',
    });

    checks.push({
      label: 'Widget Config',
      status: 'pass',
      desc: 'Check widget config in partner settings',
      icon: '◇',
    });

    const allIntents = new Set<string>();
    blocksSnap.docs.forEach(d => {
      const intents = d.data().intents;
      if (Array.isArray(intents)) intents.forEach((i: string) => allIntents.add(i));
    });
    checks.push({
      label: 'Intent Coverage',
      status: allIntents.size > 0 ? 'pass' : 'warn',
      desc: `${allIntents.size} unique intents mapped across blocks`,
      icon: '✦',
    });

    return { success: true, checks };
  } catch (err: unknown) {
    return { success: false, checks: [] };
  }
}

export async function getRelayStatsAction(): Promise<{
  success: boolean;
  stats: { activeBlocks: number; totalBlocks: number; flowStages: number; transitions: number; intents: number };
}> {
  try {
    const blocksSnap = await adminDb.collection('relayBlockConfigs').get();
    const totalBlocks = blocksSnap.size;
    const activeBlocks = blocksSnap.docs.filter(d => d.data().status === 'active').length;

    const flowSnap = await adminDb.collection('systemFlowTemplates').doc('default_flow').get();
    const flowData = flowSnap.exists ? flowSnap.data() : null;
    const flowStages = flowData?.stages?.length || 0;
    const transitions = flowData?.transitions?.length || 0;

    const allIntents = new Set<string>();
    blocksSnap.docs.forEach(d => {
      const intents = d.data().intents;
      if (Array.isArray(intents)) intents.forEach((i: string) => allIntents.add(i));
    });

    return { success: true, stats: { activeBlocks, totalBlocks, flowStages, transitions, intents: allIntents.size } };
  } catch (err: unknown) {
    return { success: false, stats: { activeBlocks: 0, totalBlocks: 0, flowStages: 0, transitions: 0, intents: 0 } };
  }
}

export async function getFlowTemplatesListAction(): Promise<{
  success: boolean;
  templates: Array<{ id: string; name: string; desc: string; industry: string; stages: number; status: string }>;
}> {
  try {
    const snapshot = await adminDb.collection('systemFlowTemplates').get();
    const templates = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        desc: data.description || '',
        industry: data.industry || 'General',
        stages: data.stages?.length || 0,
        status: data.status || 'active',
      };
    });
    return { success: true, templates };
  } catch (err: unknown) {
    return { success: false, templates: [] };
  }
}

export async function bulkToggleBlockStatusAction(
  blockIds: string[],
  enabled: boolean
): Promise<{ success: boolean; updated: number; error?: string }> {
  try {
    if (!blockIds.length) return { success: true, updated: 0 };

    const status = enabled ? 'active' : 'disabled';
    const now = new Date().toISOString();
    const batchSize = 500; // Firestore batch limit
    let updated = 0;

    for (let i = 0; i < blockIds.length; i += batchSize) {
      const chunk = blockIds.slice(i, i + batchSize);
      const batch = adminDb.batch();
      for (const id of chunk) {
        batch.set(
          adminDb.collection('relayBlockConfigs').doc(id),
          { status, updatedAt: now },
          { merge: true }
        );
      }
      await batch.commit();
      updated += chunk.length;
    }

    invalidateBlockConfigCache();
    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');

    return { success: true, updated };
  } catch (err: unknown) {
    return { success: false, updated: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
