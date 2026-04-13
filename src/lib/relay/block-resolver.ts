import type { RelaySessionCache } from './session-cache';
import type { Intent, IntentType } from './intent-engine';
import type { SessionModuleItem } from './types';
import type { ModuleAgentConfig } from '@/lib/modules/types';
import { getBlockIdForIntent } from './vertical-map';

export interface BlockResolution {
  blockId: string | null;
  data: Record<string, any>;
  variant?: string;
  confidence: number;
  source: 'intent_match' | 'registry_match' | 'fallback' | 'none';
  itemsUsed: number;
}

/**
 * Resolve a field name or template string against a raw item payload.
 * - Empty/undefined template → undefined
 * - Bare field name (no `{}`)→ raw[name] ?? raw.fields?.[name]
 * - Template "{a} - {b}" → interpolated string using raw (then raw.fields) as source
 */
export function resolveTemplate(
  template: string | undefined,
  raw: Record<string, any> | null | undefined
): any {
  if (!template) return undefined;
  const src = raw || {};
  if (!template.includes('{')) {
    return src[template] ?? src.fields?.[template];
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = src[key] ?? src.fields?.[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

/**
 * Map a SessionModuleItem to a flat block-data record using the module's
 * agentConfig when available. Falls back to raw item fields when agentConfig
 * is null — preserving behavior for client callers that have no server-side
 * agentConfig lookup.
 */
export function mapItemWithAgentConfig(
  item: SessionModuleItem,
  agentConfig: ModuleAgentConfig | null
): Record<string, any> {
  const raw = item.raw || {};

  if (!agentConfig) {
    return {
      id: item.id,
      moduleSlug: item.moduleSlug,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      currency: item.currency || 'INR',
      tags: item.tags,
      status: item.status,
      ...raw,
    };
  }

  const out: Record<string, any> = {
    id: item.id,
    moduleSlug: item.moduleSlug,
    currency: item.currency || 'INR',
    status: item.status,
  };

  const title = resolveTemplate(agentConfig.cardTitle, raw);
  if (title !== undefined) out.name = title;

  const subtitle = resolveTemplate(agentConfig.cardSubtitle, raw);
  if (subtitle !== undefined) out.description = subtitle;

  const price = resolveTemplate(agentConfig.cardPrice, raw);
  out.price = price !== undefined ? price : item.price;

  const imageUrl = resolveTemplate(agentConfig.cardImage, raw);
  out.imageUrl = imageUrl !== undefined ? imageUrl : item.imageUrl;

  if (item.tags && item.tags.length > 0) out.tags = item.tags;

  if (Array.isArray(agentConfig.displayFields)) {
    for (const field of agentConfig.displayFields) {
      if (!field || field in out) continue;
      const v = raw[field] ?? raw.fields?.[field];
      if (v !== undefined) out[field] = v;
    }
  }

  return out;
}

function resolveGreeting(cache: RelaySessionCache): BlockResolution {
  const brand = cache.getBrand();
  const blockId = getBlockIdForIntent('greeting', cache.getCategory());
  return {
    blockId,
    data: {
      brandName: brand.name,
      tagline: brand.tagline,
      welcomeMessage: brand.welcomeMessage || 'Welcome! How can I help you today?',
      logoUrl: brand.logoUrl,
      quickActions: ['New Arrivals', 'Bestsellers', 'Track Order', 'Contact Us'],
    },
    confidence: 0.95,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveBrowse(
  intent: Intent,
  cache: RelaySessionCache,
  agentConfigMap: Map<string, ModuleAgentConfig>
): BlockResolution {
  const filters = intent.filters;
  let items: SessionModuleItem[];

  if (filters?.keywords && filters.keywords.length > 0) {
    const searchResults = cache.searchItems(
      filters.keywords.join(' '),
      8
    );
    items = searchResults.map((r) => r.item);
  } else {
    items = cache.filterItems({
      category: filters?.category || undefined,
      priceMin: filters?.priceMin || undefined,
      priceMax: filters?.priceMax || undefined,
      limit: 6,
    });
  }

  if (filters?.priceMax !== null && filters?.priceMax !== undefined) {
    items = items.filter(
      (item) => item.price !== undefined && item.price <= filters!.priceMax!
    );
  }
  if (filters?.priceMin !== null && filters?.priceMin !== undefined) {
    items = items.filter(
      (item) => item.price !== undefined && item.price >= filters!.priceMin!
    );
  }

  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'price_asc':
        items.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        items.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        items.sort(
          (a, b) =>
            (b.raw?.rating || 0) - (a.raw?.rating || 0)
        );
        break;
    }
  }

  if (items.length === 0) {
    return {
      blockId: null,
      data: {},
      confidence: 0.3,
      source: 'none',
      itemsUsed: 0,
    };
  }

  const blockId = getBlockIdForIntent('browse', cache.getCategory());
  return {
    blockId,
    data: {
      items: items
        .slice(0, 6)
        .map((it) => mapItemWithAgentConfig(it, agentConfigMap.get(it.moduleSlug) ?? null)),
    },
    confidence: items.length >= 3 ? 0.9 : 0.7,
    source: 'intent_match',
    itemsUsed: Math.min(items.length, 6),
  };
}

function resolveProductDetail(
  intent: Intent,
  cache: RelaySessionCache,
  agentConfigMap: Map<string, ModuleAgentConfig>
): BlockResolution {
  let item: SessionModuleItem | undefined;

  if (intent.productRef) {
    item = cache.getItem(intent.productRef);
  }

  if (!item && intent.filters?.productRef) {
    item = cache.getItem(intent.filters.productRef);
  }

  if (!item) {
    const results = cache.searchItems(intent.rawMessage, 1);
    if (results.length > 0 && results[0].score >= 4) {
      item = results[0].item;
    }
  }

  if (!item) {
    return {
      blockId: null,
      data: {},
      confidence: 0.3,
      source: 'none',
      itemsUsed: 0,
    };
  }

  const productData = mapItemWithAgentConfig(
    item,
    agentConfigMap.get(item.moduleSlug) ?? null
  );
  const blockId = getBlockIdForIntent('product_detail', cache.getCategory());

  return {
    blockId,
    data: productData,
    confidence: 0.85,
    source: 'intent_match',
    itemsUsed: 1,
  };
}

function resolveCompare(
  intent: Intent,
  cache: RelaySessionCache
): BlockResolution {
  const refs = intent.itemRefs || [];
  if (refs.length < 2) {
    return {
      blockId: null,
      data: {},
      confidence: 0.3,
      source: 'none',
      itemsUsed: 0,
    };
  }

  const items = refs
    .map((ref) => cache.getItem(ref))
    .filter((item): item is SessionModuleItem => item !== undefined);

  if (items.length < 2) {
    return {
      blockId: null,
      data: {},
      confidence: 0.3,
      source: 'none',
      itemsUsed: 0,
    };
  }

  const itemA = items[0];
  const itemB = items[1];
  const rawA = itemA.raw || {};
  const rawB = itemB.raw || {};

  const rows: string[][] = [];

  if (itemA.price !== undefined || itemB.price !== undefined) {
    const fmtPrice = (p: number | undefined, c: string) =>
      p !== undefined ? (c === 'USD' ? `$${p}` : `₹${p.toLocaleString('en-IN')}`) : 'N/A';
    rows.push([
      'Price',
      fmtPrice(itemA.price, itemA.currency || 'INR'),
      fmtPrice(itemB.price, itemB.currency || 'INR'),
    ]);
  }

  if (itemA.moduleSlug || itemB.moduleSlug) {
    rows.push(['Category', itemA.moduleSlug || 'N/A', itemB.moduleSlug || 'N/A']);
  }

  if (rawA.rating || rawB.rating) {
    rows.push([
      'Rating',
      rawA.rating ? `${rawA.rating} ★` : 'N/A',
      rawB.rating ? `${rawB.rating} ★` : 'N/A',
    ]);
  }

  const blockId = getBlockIdForIntent('compare', cache.getCategory());
  return {
    blockId: blockId || 'ecom_compare',
    data: {
      itemLabels: [itemA.name, itemB.name],
      rows,
      verdict: '',
      verdictProduct: '',
    },
    confidence: 0.85,
    source: 'intent_match',
    itemsUsed: 2,
  };
}

function resolvePromo(cache: RelaySessionCache): BlockResolution {
  const blockId = getBlockIdForIntent('promo_inquiry', cache.getCategory());
  return {
    blockId,
    data: {
      title: 'Current Offers',
      subtitle: `Shop at ${cache.getBrand().name}`,
      ctaLabel: 'Browse Collection',
    },
    variant: 'coupon',
    confidence: 0.7,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveContact(cache: RelaySessionCache): BlockResolution {
  const contact = cache.getContact();
  if (!contact.phone && !contact.email && !contact.whatsapp) {
    return {
      blockId: null,
      data: {},
      confidence: 0.3,
      source: 'none',
      itemsUsed: 0,
    };
  }

  return {
    blockId: 'shared_contact',
    data: {
      whatsapp: contact.whatsapp,
      phone: contact.phone,
      email: contact.email,
    },
    confidence: 0.9,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveOrderTracker(intent: Intent, cache: RelaySessionCache): BlockResolution {
  const blockId = getBlockIdForIntent('order_status', cache.getCategory());
  return {
    blockId,
    data: {
      orderId: intent.orderId || '',
      status: 'Confirmed',
      orderDate: '',
      expectedDate: '',
    },
    confidence: intent.orderId ? 0.9 : 0.6,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveCart(cache: RelaySessionCache): BlockResolution {
  const blockId = getBlockIdForIntent('cart_view', cache.getCategory());
  return {
    blockId,
    data: {
      items: [],
      couponCode: '',
      couponDiscount: 0,
      deliveryFee: 0,
      deliveryLabel: 'FREE',
    },
    variant: 'empty',
    confidence: 0.8,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveBundle(
  intent: Intent,
  cache: RelaySessionCache,
  agentConfigMap: Map<string, ModuleAgentConfig>
): BlockResolution {
  const filters = intent.filters;
  let items: SessionModuleItem[];

  if (filters?.keywords && filters.keywords.length > 0) {
    const searchResults = cache.searchItems(filters.keywords.join(' '), 6);
    items = searchResults.map((r) => r.item);
  } else {
    items = cache.filterItems({ limit: 4 });
  }

  if (items.length === 0) {
    return { blockId: null, data: {}, confidence: 0.3, source: 'none', itemsUsed: 0 };
  }

  const mappedItems = items
    .slice(0, 4)
    .map((it) => mapItemWithAgentConfig(it, agentConfigMap.get(it.moduleSlug) ?? null));
  const totalPrice = mappedItems.reduce((sum, i) => sum + (i.price || 0), 0);
  const blockId = getBlockIdForIntent('bundle_inquiry', cache.getCategory());

  return {
    blockId: blockId || getBlockIdForIntent('browse', cache.getCategory()),
    data: {
      items: mappedItems,
      bundlePrice: Math.round(totalPrice * 0.9),
      originalPrice: totalPrice,
    },
    confidence: 0.75,
    source: 'intent_match',
    itemsUsed: mappedItems.length,
  };
}

function resolveBooking(cache: RelaySessionCache): BlockResolution {
  const brand = cache.getBrand();
  const contact = cache.getContact();
  const blockId = getBlockIdForIntent('booking', cache.getCategory());

  return {
    blockId,
    data: {
      items: [],
      brandName: brand.name,
      whatsapp: contact.whatsapp,
      phone: contact.phone,
      email: contact.email,
    },
    variant: 'booking',
    confidence: 0.75,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveSubscription(
  intent: Intent,
  cache: RelaySessionCache,
  agentConfigMap: Map<string, ModuleAgentConfig>
): BlockResolution {
  let item: SessionModuleItem | undefined;

  if (intent.productRef) {
    item = cache.getItem(intent.productRef);
  }
  if (!item && intent.filters?.productRef) {
    item = cache.getItem(intent.filters.productRef);
  }
  if (!item) {
    const results = cache.searchItems(intent.rawMessage, 1);
    if (results.length > 0 && results[0].score >= 3) {
      item = results[0].item;
    }
  }

  if (!item) {
    return { blockId: null, data: {}, confidence: 0.3, source: 'none', itemsUsed: 0 };
  }

  const blockId = getBlockIdForIntent('subscribe', cache.getCategory());
  return {
    blockId: blockId || getBlockIdForIntent('product_detail', cache.getCategory()),
    data: {
      ...mapItemWithAgentConfig(item, agentConfigMap.get(item.moduleSlug) ?? null),
      subscriptionAvailable: true,
    },
    confidence: 0.7,
    source: 'intent_match',
    itemsUsed: 1,
  };
}

function resolveLoyalty(cache: RelaySessionCache): BlockResolution {
  const brand = cache.getBrand();
  const blockId = getBlockIdForIntent('loyalty_inquiry', cache.getCategory());
  return {
    blockId,
    data: {
      message: `${brand.name} rewards program`,
      ctaLabel: 'View Rewards',
    },
    confidence: 0.7,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveQuiz(cache: RelaySessionCache): BlockResolution {
  const categories = cache.getCategories();
  const suggestions = categories.length > 0
    ? categories.slice(0, 4)
    : ['Show me options', 'What\'s popular?', 'Help me choose'];

  return {
    blockId: 'shared_suggestions',
    data: { items: suggestions },
    confidence: 0.7,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

function resolveReturnRequest(cache: RelaySessionCache): BlockResolution {
  const contact = cache.getContact();
  if (!contact.phone && !contact.email && !contact.whatsapp) {
    return { blockId: null, data: {}, confidence: 0.3, source: 'none', itemsUsed: 0 };
  }

  return {
    blockId: 'shared_contact',
    data: {
      whatsapp: contact.whatsapp,
      phone: contact.phone,
      email: contact.email,
    },
    confidence: 0.8,
    source: 'intent_match',
    itemsUsed: 0,
  };
}

export function resolveBlock(
  intent: Intent,
  cache: RelaySessionCache,
  agentConfigMap: Map<string, ModuleAgentConfig> = new Map()
): BlockResolution {
  switch (intent.type) {
    case 'greeting':
      return resolveGreeting(cache);

    case 'browse':
    case 'search':
      return resolveBrowse(intent, cache, agentConfigMap);

    case 'product_detail':
    case 'price_check':
      return resolveProductDetail(intent, cache, agentConfigMap);

    case 'compare':
      return resolveCompare(intent, cache);

    case 'cart_view':
    case 'checkout':
      return resolveCart(cache);

    case 'order_status':
      return resolveOrderTracker(intent, cache);

    case 'promo_inquiry':
      return resolvePromo(cache);

    case 'contact':
    case 'support':
      return resolveContact(cache);

    case 'cart_add':
      return resolveCart(cache);

    case 'return_request':
      return resolveReturnRequest(cache);

    case 'bundle_inquiry':
      return resolveBundle(intent, cache, agentConfigMap);

    case 'booking':
      return resolveBooking(cache);

    case 'subscribe':
      return resolveSubscription(intent, cache, agentConfigMap);

    case 'loyalty_inquiry':
      return resolveLoyalty(cache);

    case 'quiz':
      return resolveQuiz(cache);

    case 'general':
    default:
      return {
        blockId: null,
        data: {},
        confidence: 0.5,
        source: 'none',
        itemsUsed: 0,
      };
  }
}

export function resolveBlockFromMessage(
  message: string,
  cache: RelaySessionCache,
  classifyFn: (msg: string, c: RelaySessionCache) => Intent,
  agentConfigMap: Map<string, ModuleAgentConfig> = new Map()
): BlockResolution {
  const intent = classifyFn(message, cache);
  return resolveBlock(intent, cache, agentConfigMap);
}
