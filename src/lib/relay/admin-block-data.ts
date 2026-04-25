/**
 * Build real `blockData` for an admin preview component from partner
 * doc + module items. The preview components accept optional `data`
 * props (see src/app/admin/relay/blocks/previews/_preview-props.ts) —
 * when we have data to inject, we emit it here. Otherwise we return
 * `undefined` and the preview falls back to its design sample.
 *
 * This is intentionally a small dispatch: only the blocks that tend to
 * carry dynamic content (greeting, product_card, contact) are handled.
 * Everything else renders as design. Extend here when a new preview
 * grows a data contract.
 */

import type {
  GreetingPreviewData,
  ProductCardPreviewData,
  ContactPreviewData,
} from '@/app/admin/relay/blocks/previews/_preview-props';

interface ModuleLike {
  slug: string;
  name: string;
  items: any[];
}

interface BuildInput {
  blockId: string;
  partnerData: Record<string, any> | null;
  modules: ModuleLike[];
}

export function buildBlockData({
  blockId,
  partnerData,
  modules,
}: BuildInput): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined;
  switch (blockId) {
    case 'greeting':
    case 'ecom_greeting':
      result = buildGreeting(partnerData) as Record<string, unknown> | undefined;
      break;

    case 'product_card':
    case 'ecom_product_card':
    case 'menu':
    case 'fb_menu':
    case 'services':
    case 'menu_item':
    case 'drink_menu':
      result = buildProductCard(modules, blockId) as Record<string, unknown> | undefined;
      break;

    case 'contact':
    case 'shared_contact':
      result = buildContact(partnerData) as Record<string, unknown> | undefined;
      break;

    default:
      result = undefined;
  }

  // ── PR fix-15: thread partner currency into every envelope ────────
  //
  // Block renderers (cart, product-card, rag-context-builder) read
  // `data.currency` to drive formatMoney. Without this thread the
  // renderers fall back to the literal default ('INR'), so a USD
  // partner's test-chat would render rupees regardless of the value
  // they configured in BusinessIdentityCard. Layering the partner
  // currency at envelope level lets the renderer use it while
  // per-item `currency` (when set on a module item) still wins.
  if (result && !result.currency) {
    const personaCurrency =
      partnerData?.businessPersona?.identity?.currency;
    if (typeof personaCurrency === 'string' && personaCurrency.trim()) {
      result.currency = personaCurrency.trim().toUpperCase();
    }
  }

  return result;
}

// ── greeting ─────────────────────────────────────────────────────────

function buildGreeting(
  partnerData: Record<string, any> | null
): GreetingPreviewData | undefined {
  const identity = partnerData?.businessPersona?.identity;
  if (!identity) return undefined;

  const brandName = typeof identity.name === 'string' ? identity.name : undefined;
  const tagline =
    typeof partnerData?.businessPersona?.personality?.tagline === 'string'
      ? partnerData.businessPersona.personality.tagline
      : typeof partnerData?.businessPersona?.knowledge?.tagline === 'string'
      ? partnerData.businessPersona.knowledge.tagline
      : typeof identity.tagline === 'string'
      ? identity.tagline
      : undefined;

  const data: GreetingPreviewData = {};
  if (brandName) {
    data.brandName = brandName;
    data.initial = brandName.charAt(0).toUpperCase();
  }
  if (tagline) data.tagline = tagline;

  return Object.keys(data).length > 0 ? data : undefined;
}

// ── product_card / menu / services ───────────────────────────────────

/**
 * Per-block preferred module-slug list for purpose-aware module
 * selection. Five different block ids (product_card,
 * ecom_product_card, menu, fb_menu, services) all dispatch to
 * buildProductCard; without this mapping, all five would render
 * the same first-non-empty module regardless of intent.
 *
 * Ordering inside each list is preference: leftmost slug wins
 * if multiple matches exist. Fallback to first-with-items only
 * when no preferred slug matches (preserves single-module
 * partner behavior + catches partners using bespoke slugs).
 *
 * See docs/phase-4/test-chat-products-audit.md §root-cause.
 */
const PRODUCT_BLOCK_PREFERRED_SLUGS: Record<string, readonly string[]> = {
  product_card: ['products', 'catalog', 'inventory'],
  ecom_product_card: ['products', 'catalog', 'inventory'],
  menu: ['menu_items', 'menu', 'dishes'],
  fb_menu: ['menu_items', 'menu', 'dishes'],
  services: ['services', 'treatments', 'offerings'],
  // Test-chat-emission follow-up: cafe discovery blocks per
  // food-delivery.ts:22 flow template. Both share items-array
  // shape with menu / product_card; reuse buildProductCard
  // directly. category_browser + dietary_filter deferred — their
  // data shapes (category aggregation, dietary taxonomy) don't
  // fit today's businessModules schema.
  menu_item: ['menu_items', 'menu', 'dishes'],
  drink_menu: ['drinks', 'beverages', 'drink_menu', 'menu_items'],
};

function pickModuleByPurpose(
  modules: ModuleLike[],
  blockId: string,
): ModuleLike | undefined {
  const preferred = PRODUCT_BLOCK_PREFERRED_SLUGS[blockId];
  if (preferred) {
    for (const slug of preferred) {
      const match = modules.find(
        (m) => m.slug === slug && Array.isArray(m.items) && m.items.length > 0,
      );
      if (match) return match;
    }
  }
  // Fallback: first module with any items. Preserves prior behavior
  // for partners with one module or bespoke slugs.
  return modules.find((m) => Array.isArray(m.items) && m.items.length > 0);
}

function buildProductCard(
  modules: ModuleLike[],
  blockId: string,
): ProductCardPreviewData | undefined {
  const mod = pickModuleByPurpose(modules, blockId);
  if (!mod) return undefined;

  const items = mod.items.slice(0, 4).map((raw: any) => {
    const name =
      pickString(raw, ['name', 'title', 'label']) || 'Untitled item';
    const desc =
      pickString(raw, ['subtitle', 'shortDescription', 'description', 'variant', 'category']) ||
      undefined;
    const rawPrice = pickNumber(raw, ['price', 'amount', 'cost']);
    const priceLabel =
      pickString(raw, ['priceLabel', 'displayPrice']) || undefined;
    const badge =
      pickString(raw, ['badge', 'tag', 'label']) ||
      (raw?.isPopular ? 'Popular' : raw?.isNew ? 'New' : undefined);
    const rating = pickNumber(raw, ['rating', 'stars', 'averageRating']);
    const reviews = pickNumber(raw, ['reviewCount', 'reviews', 'numReviews']);
    const id = pickString(raw, ['id']);
    const currency = pickString(raw, ['currency']);
    const originalPrice = pickNumber(raw, ['compareAtPrice', 'originalPrice']);
    const imageUrl =
      pickString(raw, ['thumbnail', 'imageUrl', 'image']) ||
      (Array.isArray(raw?.images) && typeof raw.images[0] === 'string'
        ? raw.images[0]
        : undefined);

    const out: NonNullable<ProductCardPreviewData['items']>[number] = { name };
    if (id) out.id = id;
    if (desc) {
      out.desc = desc;
      // Duplicated to `subtitle` so CatalogCards (BlockRenderer) renders
      // the description line — its type reads `subtitle`, not `desc`.
      out.subtitle = desc;
    }
    if (typeof rawPrice === 'number') out.price = rawPrice;
    if (priceLabel) out.priceLabel = priceLabel;
    if (currency) out.currency = currency;
    if (typeof originalPrice === 'number') out.originalPrice = originalPrice;
    if (badge) {
      out.badge = badge;
      // Duplicated to `badges` (array) for CatalogCards.
      out.badges = [badge];
    }
    if (typeof rating === 'number') out.rating = rating;
    if (typeof reviews === 'number') {
      out.reviews = reviews;
      // Duplicated to `reviewCount` for CatalogCards.
      out.reviewCount = reviews;
    }
    if (imageUrl) out.imageUrl = imageUrl;
    out.moduleSlug = mod.slug;
    return out;
  });

  return items.length > 0 ? { items, moduleSlug: mod.slug } : undefined;
}

// ── contact ──────────────────────────────────────────────────────────

function buildContact(
  partnerData: Record<string, any> | null
): ContactPreviewData | undefined {
  const identity = partnerData?.businessPersona?.identity;
  if (!identity) return undefined;

  const rows: NonNullable<ContactPreviewData['items']> = [];
  if (identity.phone) rows.push({ label: 'Phone', value: String(identity.phone), icon: '☎' });
  const wa = identity.whatsAppNumber || identity.whatsapp;
  if (wa) rows.push({ label: 'WhatsApp', value: String(wa), icon: '◎' });
  if (identity.email) rows.push({ label: 'Email', value: String(identity.email), icon: '✉' });
  if (identity.website) rows.push({ label: 'Website', value: String(identity.website), icon: '◧' });

  return rows.length > 0 ? { items: rows } : undefined;
}

// ── helpers ──────────────────────────────────────────────────────────

function pickString(obj: any, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(obj: any, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return undefined;
}
