// ── Content categories (Phase 1A) ───────────────────────────────────
//
// Partner-facing taxonomy that groups Relay schemas into a handful of
// "what is this?" buckets. The partner's `/partner/relay/data` page
// uses these to render Products / Bookings / Offers / About sections
// instead of exposing the raw vertical-prefixed slugs.
//
// Inference is deterministic — derived from the slug's *family* token
// (the part after the vertical prefix). Categories admins explicitly
// pin on the schema doc win over inference; that override field lands
// in Phase 1B alongside the SchemaEditor UI for it.
//
// Intentionally lossy: the goal is partner-comprehension, not a full
// taxonomy. Plenty of family tokens collapse into the same bucket.

export type ContentCategory =
  | 'products'
  | 'offers'
  | 'bookings'
  | 'about'
  | 'operations'
  | 'other';

export interface ContentCategoryMeta {
  /** Title-case label for partner-facing section headers + buttons. */
  label: string;
  /** Singular noun for the "+ Add {singular}" affordance. */
  singular: string;
  /** Short description shown above empty-state sections. */
  description: string;
  /** Lucide icon name — looked up by the page renderer. */
  icon:
    | 'package'
    | 'tag'
    | 'calendar'
    | 'info'
    | 'wrench'
    | 'sparkles';
  /**
   * Render priority — partner-facing categories first, back-office
   * categories last. Used to order sections on the page.
   */
  priority: number;
}

export const CONTENT_CATEGORY_META: Record<ContentCategory, ContentCategoryMeta> = {
  products: {
    label: 'Products',
    singular: 'product',
    description: 'What customers can browse, order, or buy.',
    icon: 'package',
    priority: 1,
  },
  bookings: {
    label: 'Bookings',
    singular: 'booking',
    description: 'What customers can schedule with you.',
    icon: 'calendar',
    priority: 2,
  },
  offers: {
    label: 'Offers',
    singular: 'offer',
    description: 'Promotions, deals, and campaigns.',
    icon: 'tag',
    priority: 3,
  },
  about: {
    label: 'About & Info',
    singular: 'entry',
    description: 'Who you are, where you are, what customers should know.',
    icon: 'info',
    priority: 4,
  },
  operations: {
    label: 'Operations',
    singular: 'record',
    description: 'Back-office data the platform reads automatically.',
    icon: 'wrench',
    priority: 5,
  },
  other: {
    label: 'Other',
    singular: 'item',
    description: 'Schemas without a known category.',
    icon: 'sparkles',
    priority: 6,
  },
};

// ── Inference rules ────────────────────────────────────────────────
//
// Slugs are `{vertical}_{family}` where the vertical may itself contain
// underscores (e.g. `events_entertainment_booking`). We split on the
// LAST underscore to isolate the family token, then look it up in the
// table below. Multi-word family tokens (e.g. `social_proof`) are
// matched by suffix scan, not last-underscore split — keeps the table
// authoritative without a more elaborate parser.

const FAMILY_TO_CATEGORY: Record<string, ContentCategory> = {
  // products / catalog
  catalog: 'products',
  menu: 'products',
  services: 'products',
  rooms: 'products',
  programs: 'products',
  inventory: 'products',
  parts: 'products',
  retail: 'products',
  beverage: 'products',
  dining: 'products',
  ev: 'products',
  fleet: 'products',
  venues: 'products',
  design: 'products',
  production: 'products',
  virtual: 'products',
  care: 'products',
  pharmacy: 'products',
  veterinary: 'products',
  // bookings
  booking: 'bookings',
  scheduling: 'bookings',
  timetable: 'bookings',
  rides: 'bookings',
  transport: 'bookings',
  // offers / marketing
  marketing: 'offers',
  events: 'offers',
  entertainment: 'offers',
  packages: 'offers',
  engagement: 'offers',
  fundraising: 'offers',
  urgent: 'offers',
  subscription: 'offers',
  // about / info / people / proof
  info: 'about',
  people: 'about',
  providers: 'about',
  community: 'about',
  concierge: 'about',
  proof: 'about',
  trust: 'about',
  protection: 'about',
  quality: 'about',
  credentials: 'about',
  assessment: 'about',
  documents: 'about',
  records: 'about',
  transparency: 'about',
  policies: 'about',
  content: 'about',
  real_estate: 'about',
  property: 'about',
  planning: 'about',
  // operations / back-office
  operations: 'operations',
  tracking: 'operations',
  logistics: 'operations',
  management: 'operations',
  billing: 'operations',
  payments: 'operations',
  checkout: 'operations',
  commerce: 'operations',
  pricing: 'operations',
  conversion: 'operations',
  retention: 'operations',
  ordering: 'operations',
  intake: 'operations',
  onboarding: 'operations',
  accounts: 'operations',
  preferences: 'operations',
  forms: 'operations',
  sales: 'operations',
};

// Multi-word family tokens — checked as a suffix substring before the
// single-token table. Order matters: longest first so e.g. `social_proof`
// wins over a hypothetical `proof` entry.
const MULTI_WORD_FAMILIES: ReadonlyArray<[string, ContentCategory]> = [
  ['social_proof', 'about'],
];

/**
 * Infer the partner-facing content category for a Relay schema slug.
 * Returns 'other' when the family token isn't in the table — every
 * slug always gets a category so the page can render every schema.
 */
export function inferContentCategory(slug: string): ContentCategory {
  if (!slug || typeof slug !== 'string') return 'other';

  // Multi-word suffixes first.
  for (const [suffix, category] of MULTI_WORD_FAMILIES) {
    if (slug.endsWith(`_${suffix}`) || slug === suffix) return category;
  }

  // Single-token suffix.
  const lastUnderscore = slug.lastIndexOf('_');
  const family = lastUnderscore >= 0 ? slug.slice(lastUnderscore + 1) : slug;
  return FAMILY_TO_CATEGORY[family] ?? 'other';
}

/**
 * Strip the vertical prefix from a slug to get the family token, then
 * humanize it for display. Used as a fallback when a schema doc has
 * no `name` field.
 *
 * Examples:
 *   `food_beverage_menu` → "Menu"
 *   `events_entertainment_packages` → "Packages"
 *   `shared_navigation` → "Navigation"
 */
export function humanizeFamilyFromSlug(slug: string): string {
  if (!slug) return '';
  const lastUnderscore = slug.lastIndexOf('_');
  const family = lastUnderscore >= 0 ? slug.slice(lastUnderscore + 1) : slug;
  return family
    .split('_')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Categories ordered for partner-facing rendering. Highest priority
 * first.
 */
export function orderedCategories(): ContentCategory[] {
  return (Object.keys(CONTENT_CATEGORY_META) as ContentCategory[]).sort(
    (a, b) =>
      CONTENT_CATEGORY_META[a].priority - CONTENT_CATEGORY_META[b].priority,
  );
}
