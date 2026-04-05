'use client';

import { BLOCK_PREVIEWS } from '../../BlockPreviews';
import type { VerticalBlockDef, SubVerticalDef, VerticalFamilyDef, VerticalConfig } from '../_types';

// ── E-commerce Block Definitions ────────────────────────────────────

export const ECOM_BLOCKS: VerticalBlockDef[] = [
  {
    id: 'ecom_skin_quiz',
    family: 'entry',
    label: 'Quiz / Survey',
    stage: 'discovery',
    desc: 'Multi-step qualification quiz with progress tracking',
    preview: BLOCK_PREVIEWS.skin_quiz,
    intents: ['quiz', 'help me find', 'recommend'],
    module: null,
    status: 'new',
  },
  {
    id: 'ecom_product_card',
    family: 'catalog',
    label: 'Product Card',
    stage: 'discovery',
    desc: 'Browsable item card with price, image, rating, and add-to-cart',
    preview: BLOCK_PREVIEWS.product_card,
    intents: ['show', 'browse', 'products', 'menu', 'catalog'],
    module: 'moduleItems',
    status: 'active',
  },
  {
    id: 'ecom_product_detail',
    family: 'catalog',
    label: 'Product Detail',
    stage: 'showcase',
    desc: 'Full item view with images, variants, specs, and actions',
    preview: BLOCK_PREVIEWS.product_detail,
    intents: ['details', 'tell me more', 'specs', 'about'],
    module: 'moduleItems',
    status: 'active',
  },
  {
    id: 'ecom_compare',
    family: 'catalog',
    label: 'Compare',
    stage: 'comparison',
    desc: 'Side-by-side comparison table for 2-4 items',
    preview: BLOCK_PREVIEWS.compare,
    intents: ['compare', 'difference', 'vs', 'which one'],
    module: 'moduleItems',
    status: 'active',
  },
  {
    id: 'ecom_bundle',
    family: 'marketing',
    label: 'Bundle / Set',
    stage: 'showcase',
    desc: 'Multi-item bundle with combined pricing and savings indicator',
    preview: BLOCK_PREVIEWS.bundle,
    intents: ['bundle', 'set', 'package', 'combo'],
    module: 'moduleItems',
    status: 'new',
  },
  {
    id: 'ecom_order_confirmation',
    family: 'commerce',
    label: 'Order Confirmation',
    stage: 'followup',
    desc: 'Post-purchase confirmation with order ID and delivery info',
    preview: BLOCK_PREVIEWS.order_confirmation,
    intents: ['confirm', 'receipt', 'thank'],
    module: null,
    status: 'active',
  },
  {
    id: 'ecom_order_tracker',
    family: 'commerce',
    label: 'Order Tracker',
    stage: 'followup',
    desc: 'Live order status with timeline steps and tracking link',
    preview: BLOCK_PREVIEWS.order_tracker,
    intents: ['track', 'status', 'where is', 'delivery'],
    module: null,
    status: 'active',
  },
  {
    id: 'ecom_booking',
    family: 'conversion',
    label: 'Booking / Appointment',
    stage: 'conversion',
    desc: 'Time slot picker for consultations or appointments',
    preview: BLOCK_PREVIEWS.booking,
    intents: ['book', 'appointment', 'schedule', 'reserve'],
    module: null,
    status: 'new',
  },
  {
    id: 'ecom_subscription',
    family: 'commerce',
    label: 'Subscribe & Save',
    stage: 'conversion',
    desc: 'Auto-replenish subscription with frequency options and savings',
    preview: BLOCK_PREVIEWS.subscription,
    intents: ['subscribe', 'auto', 'recurring', 'replenish'],
    module: 'moduleItems',
    status: 'new',
  },
  {
    id: 'ecom_loyalty',
    family: 'engagement',
    label: 'Loyalty / Rewards',
    stage: 'social_proof',
    desc: 'Points balance, tier progress, and redeemable rewards',
    preview: BLOCK_PREVIEWS.loyalty,
    intents: ['points', 'rewards', 'loyalty', 'tier'],
    module: null,
    status: 'new',
  },
];

// ── Sub-Verticals ───────────────────────────────────────────────────

const allEcomBlockIds = ECOM_BLOCKS.map(b => b.id);

export const ECOM_SUBVERTICALS: SubVerticalDef[] = [
  {
    id: 'physical_retail',
    name: 'Physical Retail Store',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_order_confirmation', 'ecom_loyalty'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_contact'],
  },
  {
    id: 'ecommerce_d2c',
    name: 'E-commerce / D2C Brand',
    industryId: 'retail_commerce',
    blocks: allEcomBlockIds,
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_nudge', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'fashion_apparel',
    name: 'Fashion & Apparel',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_bundle', 'ecom_order_confirmation', 'ecom_order_tracker', 'ecom_loyalty'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'electronics_gadgets',
    name: 'Electronics & Gadgets',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_order_confirmation', 'ecom_order_tracker', 'ecom_subscription'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_contact'],
  },
  {
    id: 'jewelry_luxury',
    name: 'Jewelry & Luxury Goods',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_booking', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'furniture_home',
    name: 'Furniture & Home Goods',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_bundle', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_contact'],
  },
  {
    id: 'grocery_convenience',
    name: 'Grocery & Convenience Retail',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_order_confirmation', 'ecom_order_tracker', 'ecom_subscription'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'health_wellness_retail',
    name: 'Health & Wellness Retail',
    industryId: 'retail_commerce',
    blocks: ['ecom_skin_quiz', 'ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_subscription', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_nudge', 'shared_contact'],
  },
  {
    id: 'books_stationery',
    name: 'Books & Stationery',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_order_confirmation', 'ecom_order_tracker', 'ecom_loyalty'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'sports_outdoor',
    name: 'Sports & Outdoor Goods',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_bundle', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'baby_kids',
    name: 'Baby & Kids Products',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_bundle', 'ecom_subscription', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_nudge', 'shared_contact'],
  },
  {
    id: 'pet_supplies',
    name: 'Pet Supplies',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_subscription', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_promo', 'shared_contact'],
  },
  {
    id: 'wholesale_distribution',
    name: 'Wholesale & Distribution',
    industryId: 'retail_commerce',
    blocks: ['ecom_product_card', 'ecom_product_detail', 'ecom_compare', 'ecom_order_confirmation', 'ecom_order_tracker'],
    genericBlocks: ['shared_greeting', 'shared_cart', 'shared_contact'],
  },
];

// ── Families ────────────────────────────────────────────────────────

export const ECOM_FAMILIES: Record<string, VerticalFamilyDef> = {
  entry: { label: 'Entry & Discovery', color: '#534AB7' },
  catalog: { label: 'Catalog & Products', color: '#185FA5' },
  marketing: { label: 'Marketing & Promos', color: '#854F0B' },
  commerce: { label: 'Commerce & Orders', color: '#0F6E56' },
  conversion: { label: 'Conversion', color: '#3B6D11' },
  engagement: { label: 'Engagement', color: '#993556' },
};

// ── Vertical Config ─────────────────────────────────────────────────

export const ECOM_CONFIG: VerticalConfig = {
  id: 'ecommerce',
  industryId: 'retail_commerce',
  name: 'E-commerce & Retail',
  iconEmoji: '\u{1F6D2}',
  accentColor: '#2d4a3e',
  blocks: ECOM_BLOCKS,
  subVerticals: ECOM_SUBVERTICALS,
  families: ECOM_FAMILIES,
};
