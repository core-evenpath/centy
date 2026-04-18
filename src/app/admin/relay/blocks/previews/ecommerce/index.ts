'use client';

import { BLOCK_PREVIEWS } from '../../BlockPreviews';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const ECOM_BLOCKS: VerticalBlockDef[] = [
  { id: 'skin_quiz', family: 'entry', label: 'Quiz / Survey', stage: 'discovery', desc: 'Multi-step qualification quiz with progress tracking', preview: BLOCK_PREVIEWS.skin_quiz, intents: ['quiz', 'help me find', 'recommend'], module: null, status: 'new', engines: ['commerce'] },
  { id: 'product_card', family: 'catalog', label: 'Product Card', stage: 'discovery', desc: 'Browsable item card with price, image, rating, and add-to-cart', preview: BLOCK_PREVIEWS.product_card, intents: ['show', 'browse', 'products', 'menu', 'catalog'], module: 'moduleItems', status: 'active', engines: ['commerce'] },
  { id: 'product_detail', family: 'catalog', label: 'Product Detail', stage: 'showcase', desc: 'Full item view with images, variants, specs, and actions', preview: BLOCK_PREVIEWS.product_detail, intents: ['details', 'tell me more', 'specs', 'about'], module: 'moduleItems', status: 'active', engines: ['commerce'] },
  { id: 'compare', family: 'catalog', label: 'Compare', stage: 'comparison', desc: 'Side-by-side comparison table for 2-4 items', preview: BLOCK_PREVIEWS.compare, intents: ['compare', 'difference', 'vs', 'which one'], module: 'moduleItems', status: 'active', engines: ['commerce'] },
  { id: 'bundle', family: 'marketing', label: 'Bundle / Set', stage: 'showcase', desc: 'Multi-item bundle with combined pricing and savings indicator', preview: BLOCK_PREVIEWS.bundle, intents: ['bundle', 'set', 'package', 'combo'], module: 'moduleItems', status: 'new', engines: ['commerce'] },
  { id: 'order_confirmation', family: 'commerce', label: 'Order Confirmation', stage: 'followup', desc: 'Post-purchase confirmation with order ID and delivery info', preview: BLOCK_PREVIEWS.order_confirmation, intents: ['confirm', 'receipt', 'thank'], module: null, status: 'active', engines: ['service'] },
  { id: 'order_tracker', family: 'commerce', label: 'Order Tracker', stage: 'followup', desc: 'Live order status with timeline steps and tracking link', preview: BLOCK_PREVIEWS.order_tracker, intents: ['track', 'status', 'where is', 'delivery'], module: null, status: 'active', engines: ['service'] },
  { id: 'booking', family: 'conversion', label: 'Booking / Appointment', stage: 'conversion', desc: 'Time slot picker for consultations or appointments', preview: BLOCK_PREVIEWS.booking, intents: ['book', 'appointment', 'schedule', 'reserve'], module: null, status: 'new' },
  { id: 'subscription', family: 'commerce', label: 'Subscribe & Save', stage: 'conversion', desc: 'Auto-replenish subscription with frequency options and savings', preview: BLOCK_PREVIEWS.subscription, intents: ['subscribe', 'auto', 'recurring', 'replenish'], module: 'moduleItems', status: 'new', engines: ['commerce'] },
  { id: 'loyalty', family: 'engagement', label: 'Loyalty / Rewards', stage: 'social_proof', desc: 'Points balance, tier progress, and redeemable rewards', preview: BLOCK_PREVIEWS.loyalty, intents: ['points', 'rewards', 'loyalty', 'tier'], module: null, status: 'new' },
];

const ECOM_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'ecommerce_d2c', name: 'E-commerce / D2C Brand', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'bundle', 'order_confirmation', 'order_tracker', 'booking', 'subscription', 'loyalty', 'skin_quiz'] },
  { id: 'physical_retail', name: 'Physical Retail Store', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'order_confirmation', 'loyalty'] },
  { id: 'fashion_apparel', name: 'Fashion & Apparel', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'bundle', 'order_confirmation', 'order_tracker', 'subscription', 'loyalty', 'skin_quiz'] },
  { id: 'electronics_gadgets', name: 'Electronics & Gadgets', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'bundle', 'order_confirmation', 'order_tracker'] },
  { id: 'jewelry_luxury', name: 'Jewelry & Luxury Goods', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'booking', 'order_confirmation'] },
  { id: 'furniture_home', name: 'Furniture & Home Goods', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'order_confirmation', 'order_tracker'] },
  { id: 'grocery_convenience', name: 'Grocery & Convenience', industryId: 'retail_commerce', blocks: ['product_card', 'order_confirmation', 'order_tracker', 'subscription'] },
  { id: 'health_wellness_retail', name: 'Health & Wellness Retail', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'subscription', 'skin_quiz', 'order_confirmation', 'order_tracker'] },
  { id: 'books_stationery', name: 'Books & Stationery', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'order_confirmation', 'order_tracker'] },
  { id: 'sports_outdoor', name: 'Sports & Outdoor Goods', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'bundle', 'order_confirmation', 'order_tracker'] },
  { id: 'baby_kids', name: 'Baby & Kids Products', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'bundle', 'subscription', 'order_confirmation', 'order_tracker'] },
  { id: 'pet_supplies', name: 'Pet Supplies', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'subscription', 'order_confirmation', 'order_tracker'] },
  { id: 'wholesale_distribution', name: 'Wholesale & Distribution', industryId: 'retail_commerce', blocks: ['product_card', 'product_detail', 'compare', 'order_confirmation', 'order_tracker'] },
];

const ECOM_FAMILIES: Record<string, VerticalFamilyDef> = {
  entry: { label: 'Entry & Discovery', color: '#2d4a3e' },
  catalog: { label: 'Product & Catalog', color: '#1d4ed8' },
  marketing: { label: 'Pricing & Promos', color: '#c4704b' },
  commerce: { label: 'Cart & Commerce', color: '#b45309' },
  conversion: { label: 'Conversion', color: '#2d6a4f' },
  engagement: { label: 'Engagement', color: '#be185d' },
};

export const ECOM_CONFIG: VerticalConfig = {
  id: 'ecommerce',
  industryId: 'retail_commerce',
  name: 'Retail & E-commerce',
  iconName: 'ShoppingBag',
  accentColor: '#2d4a3e',
  blocks: ECOM_BLOCKS,
  subVerticals: ECOM_SUBVERTICALS,
  families: ECOM_FAMILIES,
};