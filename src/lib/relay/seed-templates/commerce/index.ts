// Commerce seed templates (P2.commerce.M07).
//
// Plausible, schema-valid starter items for the commerce-facing
// modules. All generic content (no real names/addresses/phone/PII),
// INR currency, empty image arrays (partners upload their own).
//
// Mirrors the Booking seed-templates pattern from Phase 1 M15.

export interface SeedTemplateItem {
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency: string;
  images: string[];
  fields: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export interface SeedTemplate {
  id: string;
  label: string;
  description: string;
  moduleSlug: string;
  items: SeedTemplateItem[];
}

// ── PRODUCTS — 5 items, product_catalog, generic D2C retail ──────────

export const PRODUCTS_SEED: SeedTemplate = {
  id: 'commerce.products',
  label: 'Sample products',
  description: '5 D2C retail products across price tiers; demonstrates catalog + product-detail blocks',
  moduleSlug: 'product_catalog',
  items: [
    {
      name: 'Starter Product',
      description: 'Entry-level item suitable for first-time buyers',
      category: 'featured',
      price: 499,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'STR-001', brand: 'Sample', stock_quantity: 50,
        weight: 200, is_new: true, tags: ['starter', 'basic'],
      },
      sortOrder: 1, isActive: true,
    },
    {
      name: 'Mid-tier Product',
      description: 'Balanced feature set for regular customers',
      category: 'featured',
      price: 1499,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'MID-002', brand: 'Sample', stock_quantity: 80,
        weight: 350, is_bestseller: true, tags: ['popular', 'value'],
      },
      sortOrder: 2, isActive: true,
    },
    {
      name: 'Premium Product',
      description: 'Upgraded materials and extended warranty',
      category: 'premium',
      price: 3999,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'PRM-003', brand: 'Sample', stock_quantity: 25,
        weight: 500, warranty: '2 Years', tags: ['premium', 'upgrade'],
      },
      sortOrder: 3, isActive: true,
    },
    {
      name: 'Bundle Pack',
      description: 'Popular items combined for savings',
      category: 'bundle',
      price: 4999,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'BND-004', brand: 'Sample', stock_quantity: 40,
        is_bestseller: true, tags: ['bundle', 'savings'],
      },
      sortOrder: 4, isActive: true,
    },
    {
      name: 'Flagship Product',
      description: 'Top-tier flagship with full warranty and extras',
      category: 'premium',
      price: 9999,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'FLG-005', brand: 'Sample', stock_quantity: 10,
        warranty: '3 Years', is_new: true, tags: ['flagship', 'premium'],
      },
      sortOrder: 5, isActive: true,
    },
  ],
};

// ── MENU ITEMS — 5 items, food_menu, F&B retail ──────────────────────

export const MENU_ITEMS_SEED: SeedTemplate = {
  id: 'commerce.menu_items',
  label: 'Sample menu items',
  description: '5 menu items across appetizer/main/beverage/dessert for restaurant-style partners',
  moduleSlug: 'food_menu',
  items: [
    {
      name: 'House Garden Salad',
      description: 'Mixed greens, seasonal vegetables, house dressing',
      category: 'appetizer',
      price: 220,
      currency: 'INR',
      images: [],
      fields: {
        dietary: ['Vegetarian', 'Gluten Free'],
        spice_level: 'None',
        prep_time: 8,
        calories: 180,
        is_bestseller: false,
      },
      sortOrder: 1, isActive: true,
    },
    {
      name: 'Paneer Tikka Masala',
      description: 'Marinated paneer cubes in rich tomato-cashew gravy',
      category: 'main',
      price: 420,
      currency: 'INR',
      images: [],
      fields: {
        dietary: ['Vegetarian'],
        spice_level: 'Medium',
        prep_time: 22,
        calories: 520,
        is_bestseller: true,
      },
      sortOrder: 2, isActive: true,
    },
    {
      name: 'Grilled Fish of the Day',
      description: 'Catch-of-the-day grilled with lemon butter and herbs',
      category: 'main',
      price: 580,
      currency: 'INR',
      images: [],
      fields: {
        dietary: ['Gluten Free', 'Pescatarian'],
        spice_level: 'Mild',
        prep_time: 18,
        calories: 420,
        is_new: true,
      },
      sortOrder: 3, isActive: true,
    },
    {
      name: 'Mango Lassi',
      description: 'Sweet yogurt-based mango beverage, chilled',
      category: 'beverage',
      price: 140,
      currency: 'INR',
      images: [],
      fields: {
        dietary: ['Vegetarian'],
        spice_level: 'None',
        prep_time: 4,
        calories: 260,
      },
      sortOrder: 4, isActive: true,
    },
    {
      name: 'Classic Gulab Jamun',
      description: 'Two pieces, warm, in rose-cardamom syrup',
      category: 'dessert',
      price: 180,
      currency: 'INR',
      images: [],
      fields: {
        dietary: ['Vegetarian'],
        spice_level: 'None',
        prep_time: 5,
        calories: 320,
        is_bestseller: true,
      },
      sortOrder: 5, isActive: true,
    },
  ],
};

// ── PRODUCT CATEGORIES — 5 items, product_catalog navigation ────────

export const PRODUCT_CATEGORIES_SEED: SeedTemplate = {
  id: 'commerce.product_categories',
  label: 'Sample product categories',
  description: '5 navigation categories useful for any retail partner to organize their catalog',
  moduleSlug: 'product_catalog',
  items: [
    {
      name: 'New Arrivals',
      description: 'Just added to the store — discover what\'s new',
      category: 'navigation',
      currency: 'INR',
      images: [],
      fields: { tags: ['new', 'featured'] },
      sortOrder: 1, isActive: true,
    },
    {
      name: 'Bestsellers',
      description: 'Customer favourites, high-rated top-sellers',
      category: 'navigation',
      currency: 'INR',
      images: [],
      fields: { tags: ['popular', 'trending'] },
      sortOrder: 2, isActive: true,
    },
    {
      name: 'On Sale',
      description: 'Limited-time discounts and promotional pricing',
      category: 'navigation',
      currency: 'INR',
      images: [],
      fields: { tags: ['sale', 'discount'] },
      sortOrder: 3, isActive: true,
    },
    {
      name: 'Gift Ideas',
      description: 'Curated picks for special occasions',
      category: 'navigation',
      currency: 'INR',
      images: [],
      fields: { tags: ['gift', 'special'] },
      sortOrder: 4, isActive: true,
    },
    {
      name: 'Clearance',
      description: 'Final reductions — while stocks last',
      category: 'navigation',
      currency: 'INR',
      images: [],
      fields: { tags: ['clearance', 'final'] },
      sortOrder: 5, isActive: true,
    },
  ],
};

// ── BULK OFFERS — 5 items, product_catalog, B2B wholesale ───────────

export const BULK_OFFERS_SEED: SeedTemplate = {
  id: 'commerce.bulk_offers',
  label: 'Sample bulk offers',
  description: '5 wholesale pricing tiers for food-supply / B2B partners',
  moduleSlug: 'product_catalog',
  items: [
    {
      name: 'Starter Tier (25 units)',
      description: 'Minimum order quantity for new accounts',
      category: 'bulk',
      price: 12500,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'BULK-25', stock_quantity: 200,
        tags: ['minimum', 'starter', 'b2b'],
      },
      sortOrder: 1, isActive: true,
    },
    {
      name: 'Growth Tier (50 units)',
      description: 'Standard wholesale quantity with 5% discount',
      category: 'bulk',
      price: 23750,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'BULK-50', stock_quantity: 150,
        tags: ['standard', 'b2b', 'discount'],
      },
      sortOrder: 2, isActive: true,
    },
    {
      name: 'Volume Tier (100 units)',
      description: 'Volume pricing with 10% discount',
      category: 'bulk',
      price: 45000,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'BULK-100', stock_quantity: 100,
        tags: ['volume', 'b2b', 'discount'],
      },
      sortOrder: 3, isActive: true,
    },
    {
      name: 'Enterprise Tier (250 units)',
      description: 'Enterprise-scale order with 15% discount',
      category: 'bulk',
      price: 106250,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'BULK-250', stock_quantity: 40,
        tags: ['enterprise', 'b2b', 'discount'],
      },
      sortOrder: 4, isActive: true,
    },
    {
      name: 'Flagship Tier (500 units)',
      description: 'Flagship volume tier with 20% discount + priority delivery',
      category: 'bulk',
      price: 200000,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'BULK-500', stock_quantity: 20,
        tags: ['flagship', 'b2b', 'discount', 'priority'],
      },
      sortOrder: 5, isActive: true,
    },
  ],
};

// ── SUBSCRIPTION PLANS — 3 items, product_catalog, recurring commerce ──

export const SUBSCRIPTION_PLANS_SEED: SeedTemplate = {
  id: 'commerce.subscription_plans',
  label: 'Sample subscription plans',
  description: '3 subscription tiers (monthly / quarterly / annual) for recurring-commerce partners',
  moduleSlug: 'product_catalog',
  items: [
    {
      name: 'Monthly Plan',
      description: 'Pay-as-you-go flexibility, cancel anytime',
      category: 'subscription',
      price: 499,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'SUB-M', tags: ['monthly', 'flexible'],
        is_new: true,
      },
      sortOrder: 1, isActive: true,
    },
    {
      name: 'Quarterly Plan',
      description: 'Save 10% vs monthly, billed every 3 months',
      category: 'subscription',
      price: 1349,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'SUB-Q', tags: ['quarterly', 'savings'],
        is_bestseller: true,
      },
      sortOrder: 2, isActive: true,
    },
    {
      name: 'Annual Plan',
      description: 'Best value — save 20% vs monthly, billed yearly',
      category: 'subscription',
      price: 4799,
      currency: 'INR',
      images: [],
      fields: {
        sku: 'SUB-A', tags: ['annual', 'best-value'],
      },
      sortOrder: 3, isActive: true,
    },
  ],
};

// ── Registry ────────────────────────────────────────────────────────

export const COMMERCE_SEED_TEMPLATES: Readonly<Record<string, SeedTemplate>> = {
  [PRODUCTS_SEED.id]: PRODUCTS_SEED,
  [MENU_ITEMS_SEED.id]: MENU_ITEMS_SEED,
  [PRODUCT_CATEGORIES_SEED.id]: PRODUCT_CATEGORIES_SEED,
  [BULK_OFFERS_SEED.id]: BULK_OFFERS_SEED,
  [SUBSCRIPTION_PLANS_SEED.id]: SUBSCRIPTION_PLANS_SEED,
};

export function getCommerceSeedTemplate(id: string): SeedTemplate | undefined {
  return COMMERCE_SEED_TEMPLATES[id];
}

export function listCommerceSeedTemplates(): SeedTemplate[] {
  return Object.values(COMMERCE_SEED_TEMPLATES);
}
