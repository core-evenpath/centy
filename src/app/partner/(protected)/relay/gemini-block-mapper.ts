'use client';

import { getBlockIdForGeminiType } from '@/lib/relay/vertical-map';

export interface MappedBlock {
  blockId: string;
  data: Record<string, any>;
}

function mapCatalogItems(geminiItems: any[]): any[] {
  return geminiItems.map(item => ({
    name: item.name || '',
    price: item.price ?? 0,
    mrp: item.originalPrice || item.mrp || undefined,
    brand: item.brand || item.subtitle || undefined,
    badge: item.badge || item.badges?.[0] || undefined,
    stock: item.stock || undefined,
    rating: item.rating || undefined,
    reviews: item.reviewCount || item.reviews || undefined,
    tags: item.features || item.tags || undefined,
    imageUrl: item.imageUrl || item.image || undefined,
    description: item.description || item.tagline || undefined,
    category: item.category || undefined,
    currency: item.currency || 'INR',
    id: item.id || undefined,
  }));
}

function mapGreeting(gemini: any): Record<string, any> {
  const brand = gemini.brand || {};
  const actions = brand.quickActions || gemini.quickActions || [];
  return {
    brandName: brand.name || gemini.brandName || 'Store',
    tagline: brand.tagline || gemini.tagline || '',
    welcomeMessage: gemini.text || brand.welcomeMessage || 'Welcome!',
    quickActions: actions.map((a: any) => (typeof a === 'string' ? a : a.label || '')),
  };
}

function mapCompare(gemini: any): Record<string, any> | null {
  const items = gemini.items || [];
  const fields = gemini.compareFields || [];
  if (items.length < 2 || fields.length === 0) return null;

  return {
    itemLabels: items.map((i: any) => i.name || ''),
    rows: fields.map((f: any) => {
      const row = [f.label || f.key || ''];
      items.forEach((item: any) => {
        const val = item[f.key] ?? item.fields?.[f.key] ?? 'N/A';
        row.push(String(val));
      });
      return row;
    }),
    verdict: '',
    verdictProduct: '',
  };
}

function mapContact(gemini: any): Record<string, any> | null {
  const methods = gemini.methods || [];
  const whatsapp = methods.find((m: any) => m.type === 'whatsapp')?.value;
  const phone = methods.find((m: any) => m.type === 'phone')?.value;
  const email = methods.find((m: any) => m.type === 'email')?.value;
  if (!whatsapp && !phone && !email) return null;

  return { whatsapp, phone, email };
}

function mapPromo(gemini: any): Record<string, any> {
  const promo = gemini.promos?.[0] || gemini;
  return {
    title: promo.title || 'Special Offer',
    subtitle: promo.description || promo.subtitle || gemini.text || '',
    code: promo.code || '',
    discount: promo.discount || '',
    ctaLabel: promo.ctaLabel || 'Shop Now',
  };
}

function mapSuggestions(gemini: any): Record<string, any> | null {
  const suggestions = gemini.suggestions || [];
  if (suggestions.length === 0) return null;

  return { items: suggestions };
}

// Catalog-family blocks all accept the same { items } data shape
const CATALOG_BLOCKS = new Set([
  'ecom_product_card', 'hosp_room_card', 'hc_service_card', 'fb_menu_item',
  'biz_service_package', 'edu_course_card', 'pw_service_card', 'auto_vehicle_card',
  'tl_tour_package', 'evt_service_card', 'fin_product_card', 'hp_service_card',
  'fs_product_card', 'pu_service_directory',
]);

const GREETING_BLOCKS = new Set(['ecom_greeting']);
const PROMO_BLOCKS = new Set([
  'ecom_promo', 'fb_daily_specials', 'pw_spa_package',
]);

export function mapGeminiToRegistryBlock(geminiResponse: any, category?: string): MappedBlock | null {
  const type = geminiResponse?.type;
  if (!type) return null;

  const blockId = getBlockIdForGeminiType(type, category || 'general');
  if (!blockId) return null;

  let data: Record<string, any> | null = null;

  if (CATALOG_BLOCKS.has(blockId)) {
    const items = mapCatalogItems(geminiResponse.items || []);
    if (items.length === 0) return null;
    data = { items };
  } else if (GREETING_BLOCKS.has(blockId)) {
    data = mapGreeting(geminiResponse);
  } else if (blockId === 'ecom_compare') {
    data = mapCompare(geminiResponse);
  } else if (blockId === 'shared_contact') {
    data = mapContact(geminiResponse);
  } else if (PROMO_BLOCKS.has(blockId)) {
    data = mapPromo(geminiResponse);
  } else if (blockId === 'shared_suggestions') {
    data = mapSuggestions(geminiResponse);
  } else {
    // For any other vertical block, pass through items or raw data
    const items = geminiResponse.items;
    if (items && Array.isArray(items) && items.length > 0) {
      data = { items: mapCatalogItems(items) };
    } else {
      data = { text: geminiResponse.text || '' };
    }
  }

  if (!data) return null;
  return { blockId, data };
}
