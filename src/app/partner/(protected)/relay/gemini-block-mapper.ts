'use client';

export interface MappedBlock {
  blockId: string;
  data: Record<string, any>;
}

const TYPE_TO_BLOCK: Record<string, string> = {
  catalog: 'ecom_product_card',
  products: 'ecom_product_card',
  rooms: 'ecom_product_card',
  menu: 'ecom_product_card',
  services: 'ecom_product_card',
  listings: 'ecom_product_card',
  compare: 'ecom_compare',
  greeting: 'ecom_greeting',
  welcome: 'ecom_greeting',
  contact: 'shared_contact',
  promo: 'ecom_promo',
  offer: 'ecom_promo',
  deal: 'ecom_promo',
  text: 'shared_suggestions',
};

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

export function mapGeminiToRegistryBlock(geminiResponse: any): MappedBlock | null {
  const type = geminiResponse?.type;
  if (!type) return null;

  const blockId = TYPE_TO_BLOCK[type];
  if (!blockId) return null;

  let data: Record<string, any> | null = null;

  switch (blockId) {
    case 'ecom_product_card': {
      const items = mapCatalogItems(geminiResponse.items || []);
      if (items.length === 0) return null;
      data = { items };
      break;
    }
    case 'ecom_greeting':
      data = mapGreeting(geminiResponse);
      break;
    case 'ecom_compare':
      data = mapCompare(geminiResponse);
      break;
    case 'shared_contact':
      data = mapContact(geminiResponse);
      break;
    case 'ecom_promo':
      data = mapPromo(geminiResponse);
      break;
    case 'shared_suggestions':
      data = mapSuggestions(geminiResponse);
      break;
    default:
      return null;
  }

  if (!data) return null;
  return { blockId, data };
}
