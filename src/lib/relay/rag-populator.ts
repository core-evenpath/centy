import type { IntentType } from './intent-engine';
import { classifyIntent } from './intent-engine';
import { RelaySessionCache } from './session-cache';
import { resolveBlock } from './block-resolver';
import type { BlockResolution } from './block-resolver';
import type {
  RelaySessionData,
  SessionBrand,
  SessionContact,
  SessionModuleItem,
} from './types';

// ── Build session data from partner doc + module items ──────────────
//
// Core = partners/{id} root doc (brand, contact, persona)
// Modules = partners/{id}/businessModules/{slug}/items
// Blocks = UI shells populated from the above.

interface PartnerModuleConfig {
  slug: string;
  name: string;
  items: any[];
}

export function buildSessionData(
  partnerId: string,
  partnerData: Record<string, any> | null,
  moduleConfigs: PartnerModuleConfig[]
): RelaySessionData {
  const identity = partnerData?.businessPersona?.identity || {};
  const relayConfig = partnerData?.relayConfig || {};

  const brand: SessionBrand = {
    name: identity.name || partnerData?.name || '',
    tagline: identity.tagline || '',
    emoji: relayConfig.brandEmoji || '💬',
    accentColor: relayConfig.accentColor || '#6366f1',
    logoUrl: identity.logoUrl || undefined,
    welcomeMessage: relayConfig.welcomeMessage || undefined,
  };

  const contact: SessionContact = {
    whatsapp: identity.whatsapp || identity.phone || undefined,
    phone: identity.phone || undefined,
    email: identity.email || undefined,
  };

  const items: SessionModuleItem[] = moduleConfigs.flatMap(mc =>
    (mc.items || []).map(raw => ({
      id: raw.id,
      moduleSlug: mc.slug,
      name: raw.name || raw.fields?.name || '',
      description: raw.description || raw.fields?.description || undefined,
      price: raw.price ?? raw.fields?.price ?? undefined,
      currency: raw.currency || 'INR',
      imageUrl: raw.imageUrl || raw.fields?.imageUrl || undefined,
      tags: raw.tags || raw.fields?.tags || [],
      status: raw.isActive !== false ? 'active' : 'inactive',
      raw: raw.fields || raw,
    }))
  );

  return {
    partnerId,
    category: identity.businessCategories?.[0]?.functionId || 'general',
    brand,
    contact,
    items,
    blocks: [],
    blockOverrides: [],
    cachedAt: Date.now(),
  };
}

// ── Gemini "type" hint → intent override ────────────────────────────
//
// Gemini's job is to classify the user's request into a high-level type
// (catalog, pricing, contact, greeting, promo, etc.). We map that onto an
// IntentType so resolveBlock can populate block data from cache — even when
// the regex-based classifier would have landed on "general".

const GEMINI_TYPE_TO_INTENT: Record<string, IntentType> = {
  catalog: 'browse',
  products: 'browse',
  listings: 'browse',
  menu: 'browse',
  rooms: 'browse',
  services: 'browse',
  pricing: 'price_check',
  price: 'price_check',
  product_detail: 'product_detail',
  detail: 'product_detail',
  compare: 'compare',
  comparison: 'compare',
  cart: 'cart_view',
  checkout: 'checkout',
  order: 'order_status',
  order_status: 'order_status',
  tracking: 'order_status',
  booking: 'booking',
  schedule: 'booking',
  appointment: 'booking',
  reservation: 'booking',
  quick_actions: 'greeting',
  greeting: 'greeting',
  welcome: 'greeting',
  promo: 'promo_inquiry',
  offer: 'promo_inquiry',
  deal: 'promo_inquiry',
  bundle: 'bundle_inquiry',
  contact: 'contact',
  support: 'support',
  handoff: 'contact',
  return_request: 'return_request',
  subscribe: 'subscribe',
  loyalty: 'loyalty_inquiry',
  quiz: 'quiz',
  suggestions: 'quiz',
  testimonials: 'general',
  lead_capture: 'contact',
  info: 'general',
  text: 'general',
};

function mapGeminiType(geminiType: string | undefined): IntentType | null {
  if (!geminiType) return null;
  return GEMINI_TYPE_TO_INTENT[geminiType.toLowerCase()] || null;
}

// ── Main entrypoint: given user msg + Gemini hint, populate block ────

const PREFIXES = ['ecom_', 'hosp_', 'hc_', 'fb_', 'biz_', 'edu_', 'pw_', 'auto_', 'tl_', 'evt_', 'fin_', 'hp_', 'fs_', 'pu_', 'shared_'];
function toShortId(prefixedId: string): string {
  for (const p of PREFIXES) if (prefixedId.startsWith(p)) return prefixedId.slice(p.length);
  return prefixedId;
}

export interface PopulatedBlock {
  blockId: string | null;
  blockData: Record<string, any>;
  variant?: string;
  source: BlockResolution['source'];
  itemsUsed: number;
}

export function populateBlock(
  userMessage: string,
  geminiType: string | undefined,
  sessionData: RelaySessionData,
  allowedShortBlockIds: string[]
): PopulatedBlock {
  const cache = new RelaySessionCache(sessionData);
  const regexIntent = classifyIntent(userMessage, cache);
  const hintedType = mapGeminiType(geminiType);

  // If Gemini gave a confident type hint and the regex classifier fell back to
  // 'general', promote the hint. Otherwise trust the regex classifier which
  // has more structured filter parsing.
  const intent =
    hintedType && regexIntent.type === 'general'
      ? { ...regexIntent, type: hintedType, confidence: 0.75 }
      : regexIntent;

  const resolution = resolveBlock(intent, cache);

  if (!resolution.blockId) {
    return { blockId: null, blockData: {}, source: resolution.source, itemsUsed: 0 };
  }

  if (allowedShortBlockIds.length > 0 && !allowedShortBlockIds.includes(toShortId(resolution.blockId))) {
    return { blockId: null, blockData: {}, source: 'none', itemsUsed: 0 };
  }

  return {
    blockId: resolution.blockId,
    blockData: resolution.data,
    variant: resolution.variant,
    source: resolution.source,
    itemsUsed: resolution.itemsUsed,
  };
}
