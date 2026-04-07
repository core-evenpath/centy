import type { RelaySessionCache } from './session-cache';
import type { Intent, IntentType } from './intent-engine';
import type { SessionModuleItem } from './types';

export interface BlockResolution {
  blockId: string | null;
  data: Record<string, any>;
  variant?: string;
  confidence: number;
  source: 'intent_match' | 'registry_match' | 'fallback' | 'none';
  itemsUsed: number;
}

const INTENT_TO_BLOCK: Record<IntentType, string | null> = {
  greeting: 'ecom_greeting',
  browse: 'ecom_product_card',
  search: 'ecom_product_card',
  product_detail: 'ecom_product_detail',
  compare: 'ecom_compare',
  price_check: 'ecom_product_detail',
  cart_view: 'ecom_cart',
  cart_add: 'ecom_cart',
  checkout: 'ecom_cart',
  order_status: 'ecom_order_tracker',
  return_request: 'shared_contact',
  promo_inquiry: 'ecom_promo',
  contact: 'shared_contact',
  support: 'shared_contact',
  bundle_inquiry: 'ecom_product_card',
  booking: 'ecom_cart',
  subscribe: 'ecom_product_detail',
  loyalty_inquiry: 'shared_nudge',
  quiz: 'shared_suggestions',
  general: null,
};

function mapItemToProductData(item: SessionModuleItem): Record<string, any> {
  const raw = item.raw || {};
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    mrp: raw.compareAtPrice || raw.comparePrice || raw.compare_price || null,
    brand: raw.vendor || raw.brand || undefined,
    badge: raw.isFeatured ? 'Bestseller' : undefined,
    stock: raw.stock !== undefined
      ? raw.stock === 0
        ? 'Out of Stock'
        : raw.stock <= 5
          ? 'Low Stock'
          : 'In Stock'
      : undefined,
    rating: raw.rating || raw.averageRating || undefined,
    reviews: raw.reviewCount || raw.reviews || undefined,
    tags: item.tags?.slice(0, 4) || undefined,
    imageUrl: raw.thumbnail || raw.images?.[0] || raw.imageUrl || item.imageUrl || undefined,
    category: item.moduleSlug,
    currency: item.currency || 'INR',
  };
}

function resolveGreeting(cache: RelaySessionCache): BlockResolution {
  const brand = cache.getBrand();
  return {
    blockId: 'ecom_greeting',
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
  cache: RelaySessionCache
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

  return {
    blockId: 'ecom_product_card',
    data: {
      items: items.slice(0, 6).map(mapItemToProductData),
    },
    confidence: items.length >= 3 ? 0.9 : 0.7,
    source: 'intent_match',
    itemsUsed: Math.min(items.length, 6),
  };
}

function resolveProductDetail(
  intent: Intent,
  cache: RelaySessionCache
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

  const productData = mapItemToProductData(item);

  return {
    blockId: 'ecom_product_detail',
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

  return {
    blockId: 'ecom_compare',
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
  return {
    blockId: 'ecom_promo',
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

function resolveOrderTracker(intent: Intent): BlockResolution {
  return {
    blockId: 'ecom_order_tracker',
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

function resolveCart(): BlockResolution {
  return {
    blockId: 'ecom_cart',
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
  cache: RelaySessionCache
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

  const mappedItems = items.slice(0, 4).map(mapItemToProductData);
  const totalPrice = mappedItems.reduce((sum, i) => sum + (i.price || 0), 0);

  return {
    blockId: 'ecom_product_card',
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

  return {
    blockId: 'ecom_cart',
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
  cache: RelaySessionCache
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

  return {
    blockId: 'ecom_product_detail',
    data: {
      ...mapItemToProductData(item),
      subscriptionAvailable: true,
    },
    confidence: 0.7,
    source: 'intent_match',
    itemsUsed: 1,
  };
}

function resolveLoyalty(cache: RelaySessionCache): BlockResolution {
  const brand = cache.getBrand();
  return {
    blockId: 'shared_nudge',
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
  cache: RelaySessionCache
): BlockResolution {
  switch (intent.type) {
    case 'greeting':
      return resolveGreeting(cache);

    case 'browse':
    case 'search':
      return resolveBrowse(intent, cache);

    case 'product_detail':
    case 'price_check':
      return resolveProductDetail(intent, cache);

    case 'compare':
      return resolveCompare(intent, cache);

    case 'cart_view':
    case 'checkout':
      return resolveCart();

    case 'order_status':
      return resolveOrderTracker(intent);

    case 'promo_inquiry':
      return resolvePromo(cache);

    case 'contact':
    case 'support':
      return resolveContact(cache);

    case 'cart_add':
      return resolveCart();

    case 'return_request':
      return resolveReturnRequest(cache);

    case 'bundle_inquiry':
      return resolveBundle(intent, cache);

    case 'booking':
      return resolveBooking(cache);

    case 'subscribe':
      return resolveSubscription(intent, cache);

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
  classifyFn: (msg: string, c: RelaySessionCache) => Intent
): BlockResolution {
  const intent = classifyFn(message, cache);
  return resolveBlock(intent, cache);
}
