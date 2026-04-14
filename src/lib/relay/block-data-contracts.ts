/**
 * Block Data Contracts
 *
 * Declarative, per-block description of *what data each preview block
 * needs* and *where that data naturally comes from*. Replaces the
 * vague "Auto" source label with concrete provenance users can read
 * and act on.
 *
 * Each contract answers three questions:
 *  - What fields does this block render? (`fields`)
 *  - Where should each field come from? (`fields[].source`)
 *  - What partner modules could feed this block? (`suggestedModules`)
 *
 * The UI in /partner/relay/blocks uses contracts to:
 *  1. Show a "Data mapping" panel with per-field source chips.
 *  2. Surface deep links to /partner/settings for profile-backed fields.
 *  3. Prompt the partner to create a module when a block needs one and
 *     none exists.
 */

export type FieldSource =
  | {
      kind: 'partner_profile';
      // Dot-path into partnerData. Used both to read data and to show
      // provenance ("Business Profile › Phone").
      path: string;
      // Human label for the field's location.
      label: string;
      // Where in /partner/settings the partner can edit this value.
      settingsHref: string;
    }
  | {
      kind: 'module_item';
      // Module slugs that can satisfy this field (first match wins).
      moduleSlugs: string[];
      // Candidate keys on each item that hold the value.
      itemFields: string[];
    }
  | {
      kind: 'document';
      // The expected document content kind (used to filter vault files
      // when a document source is picked).
      hint: string;
    }
  | {
      kind: 'static';
      // Field is hardcoded / design-only (no data substitution).
      note: string;
    };

export interface BlockField {
  id: string;
  label: string;
  required: boolean;
  source: FieldSource;
  description?: string;
  // Shared vocabulary id across contracts. Multiple blocks consuming
  // the same `canonicalId` share a single binding — the partner
  // configures it once and every block that needs it picks it up.
  canonicalId?: string;
}

export interface SuggestedModule {
  slug: string;
  name: string;
  reason: string;
}

export interface BlockDataContract {
  blockId: string;
  // Short, user-facing explanation of the block's data story.
  summary: string;
  fields: BlockField[];
  // If present, the block is module-driven and these are the modules
  // that could feed it. UI offers "Create module" affordance for
  // partners without a matching module.
  suggestedModules?: SuggestedModule[];
  // True for blocks that just render a design (no partner data).
  designOnly?: boolean;
}

const SETTINGS_IDENTITY = '/partner/settings';
const SETTINGS_PERSONALITY = '/partner/settings';

// ── Shared field recipes ─────────────────────────────────────────────

const F_BRAND_NAME: BlockField = {
  id: 'brandName',
  label: 'Brand name',
  required: true,
  canonicalId: 'business.name',
  source: {
    kind: 'partner_profile',
    path: 'businessPersona.identity.name',
    label: 'Business Profile › Name',
    settingsHref: SETTINGS_IDENTITY,
  },
};

const F_TAGLINE: BlockField = {
  id: 'tagline',
  label: 'Tagline',
  required: false,
  canonicalId: 'business.tagline',
  source: {
    kind: 'partner_profile',
    path: 'businessPersona.personality.tagline',
    label: 'Business Profile › Tagline',
    settingsHref: SETTINGS_PERSONALITY,
  },
};

const F_PHONE: BlockField = {
  id: 'phone',
  label: 'Phone',
  required: false,
  canonicalId: 'business.phone',
  source: {
    kind: 'partner_profile',
    path: 'businessPersona.identity.phone',
    label: 'Business Profile › Phone',
    settingsHref: SETTINGS_IDENTITY,
  },
};

const F_EMAIL: BlockField = {
  id: 'email',
  label: 'Email',
  required: false,
  canonicalId: 'business.email',
  source: {
    kind: 'partner_profile',
    path: 'businessPersona.identity.email',
    label: 'Business Profile › Email',
    settingsHref: SETTINGS_IDENTITY,
  },
};

const F_WHATSAPP: BlockField = {
  id: 'whatsapp',
  label: 'WhatsApp',
  required: false,
  canonicalId: 'business.whatsapp',
  source: {
    kind: 'partner_profile',
    path: 'businessPersona.identity.whatsAppNumber',
    label: 'Business Profile › WhatsApp',
    settingsHref: SETTINGS_IDENTITY,
  },
};

const F_WEBSITE: BlockField = {
  id: 'website',
  label: 'Website',
  required: false,
  canonicalId: 'business.website',
  source: {
    kind: 'partner_profile',
    path: 'businessPersona.identity.website',
    label: 'Business Profile › Website',
    settingsHref: SETTINGS_IDENTITY,
  },
};

// ── Products family ──────────────────────────────────────────────────

const PRODUCT_ITEM_FIELDS = {
  name: ['name', 'title', 'label'],
  desc: ['subtitle', 'shortDescription', 'description'],
  price: ['price', 'amount', 'cost'],
  rating: ['rating', 'stars', 'averageRating'],
  reviews: ['reviewCount', 'reviews', 'numReviews'],
  badge: ['badge', 'tag'],
};

function productFields(moduleSlugs: string[]): BlockField[] {
  return [
    {
      id: 'items[].name',
      label: 'Item name',
      required: true,
      source: { kind: 'module_item', moduleSlugs, itemFields: PRODUCT_ITEM_FIELDS.name },
    },
    {
      id: 'items[].desc',
      label: 'Short description',
      required: false,
      source: { kind: 'module_item', moduleSlugs, itemFields: PRODUCT_ITEM_FIELDS.desc },
    },
    {
      id: 'items[].price',
      label: 'Price',
      required: false,
      source: { kind: 'module_item', moduleSlugs, itemFields: PRODUCT_ITEM_FIELDS.price },
    },
    {
      id: 'items[].rating',
      label: 'Rating',
      required: false,
      source: { kind: 'module_item', moduleSlugs, itemFields: PRODUCT_ITEM_FIELDS.rating },
    },
    {
      id: 'items[].reviews',
      label: 'Review count',
      required: false,
      source: { kind: 'module_item', moduleSlugs, itemFields: PRODUCT_ITEM_FIELDS.reviews },
    },
    {
      id: 'items[].badge',
      label: 'Badge',
      required: false,
      source: { kind: 'module_item', moduleSlugs, itemFields: PRODUCT_ITEM_FIELDS.badge },
    },
  ];
}

// ── Registry ─────────────────────────────────────────────────────────

const CONTRACTS: BlockDataContract[] = [
  {
    blockId: 'ecom_greeting',
    summary: 'Welcomes visitors with your business name and tagline. Data comes from your Business Profile.',
    fields: [
      F_BRAND_NAME,
      F_TAGLINE,
      {
        id: 'welcomeMessage',
        label: 'Welcome message',
        required: false,
        source: {
          kind: 'static',
          note: 'Set per-relay in widget config; falls back to a friendly default.',
        },
      },
    ],
  },
  {
    blockId: 'shared_contact',
    summary: 'Shows the contact options visitors can use to reach you. All fields come from your Business Profile.',
    fields: [F_PHONE, F_WHATSAPP, F_EMAIL, F_WEBSITE],
  },
  {
    blockId: 'ecom_product_card',
    summary: 'Highlights up to four products from a module you connect below.',
    fields: productFields(['products', 'ecommerce_products']),
    suggestedModules: [
      { slug: 'products', name: 'Products', reason: 'Standard catalog with name, price, rating fields.' },
    ],
  },
  {
    blockId: 'ecom_product_detail',
    summary: 'Deep-dive card for a single product. Connect a products module so the assistant can pick the right one.',
    fields: productFields(['products', 'ecommerce_products']),
    suggestedModules: [
      { slug: 'products', name: 'Products', reason: 'Provides name, description, price, and rating.' },
    ],
  },
  {
    blockId: 'ecom_compare',
    summary: 'Side-by-side comparison of two or three products. Needs at least a products module with pricing.',
    fields: productFields(['products', 'ecommerce_products']),
    suggestedModules: [
      { slug: 'products', name: 'Products', reason: 'Comparison table pulls name + price from each item.' },
    ],
  },
  {
    blockId: 'menu',
    summary: 'Menu listing for food & beverage partners. Connect a menu module with dishes, prices, and categories.',
    fields: productFields(['menu', 'fb_menu', 'food_menu']),
    suggestedModules: [
      { slug: 'menu', name: 'Menu', reason: 'Dish names, descriptions, and prices.' },
    ],
  },
  {
    blockId: 'fb_menu',
    summary: 'Menu listing for food & beverage partners. Connect a menu module with dishes and prices.',
    fields: productFields(['menu', 'fb_menu', 'food_menu']),
    suggestedModules: [
      { slug: 'menu', name: 'Menu', reason: 'Dish names, descriptions, and prices.' },
    ],
  },
  {
    blockId: 'services',
    summary: 'List of services you offer. Connect a services module so the block shows real offerings.',
    fields: productFields(['services', 'service_catalog']),
    suggestedModules: [
      { slug: 'services', name: 'Services', reason: 'Service name, duration, and price.' },
    ],
  },
];

// ── Public API ───────────────────────────────────────────────────────

// Blocks that don't appear in CONTRACTS are assumed to be design-only
// (suggestions, nudge, promo, greeting variants, etc). The UI uses the
// fallback contract to avoid a gap.
function fallbackContract(blockId: string): BlockDataContract {
  return {
    blockId,
    summary: 'This block renders a design-only UI. Connect a document if you want the assistant to contextualize the text shown.',
    fields: [],
    designOnly: true,
  };
}

export function getContractFor(blockId: string): BlockDataContract {
  const found = CONTRACTS.find(c => c.blockId === blockId);
  if (found) return found;

  // Accept short-form ids too (ecom_ and shared_ prefixes)
  const withPrefix = CONTRACTS.find(c =>
    c.blockId.endsWith(`_${blockId}`) || c.blockId === blockId
  );
  if (withPrefix) return withPrefix;

  return fallbackContract(blockId);
}

export function allSuggestedModules(blockIds: string[]): SuggestedModule[] {
  const seen = new Map<string, SuggestedModule>();
  for (const id of blockIds) {
    const c = getContractFor(id);
    for (const m of c.suggestedModules || []) {
      if (!seen.has(m.slug)) seen.set(m.slug, m);
    }
  }
  return Array.from(seen.values());
}

export function isModuleDriven(contract: BlockDataContract): boolean {
  return contract.fields.some(f => f.source.kind === 'module_item');
}

export function isProfileDriven(contract: BlockDataContract): boolean {
  return contract.fields.some(f => f.source.kind === 'partner_profile');
}

// Collect every canonical field id referenced by the given blocks.
// Used by the Blueprint agent to know which bindings need to exist.
export function canonicalIdsForBlocks(blockIds: string[]): string[] {
  const ids = new Set<string>();
  for (const bid of blockIds) {
    const c = getContractFor(bid);
    for (const f of c.fields) {
      if (f.canonicalId) ids.add(f.canonicalId);
    }
    // Module-driven blocks share an implicit collection canonical id
    // keyed off the first suggested module slug. Lets blueprint rows
    // talk about "products.items" once instead of per-field.
    if (isModuleDriven(c) && c.suggestedModules?.[0]) {
      ids.add(`${c.suggestedModules[0].slug}.items`);
    }
  }
  return Array.from(ids);
}
