// Commerce preview scripts (P2.commerce.M08).
//
// 8 scripts per sub-vertical × 4 sub-verticals = 32 scripts.
// Themes identical across sub-verticals so reviewers can compare:
//   1. browse + filter
//   2. specific product lookup
//   3. compare two products
//   4. add to cart + checkout
//   5. apply promo code / coupon
//   6. track order (service overlay — requires X01)
//   7. cancel order (service overlay — requires X01)
//   8. sub-vertical edge case
//
// Reuses the `PreviewScript` shape from booking-scripts.ts for
// consistent runner handling.

import type { PreviewScript as BookingPreviewScript } from './booking-scripts';

// Commerce subVertical enum — extends the booking set.
export type CommerceSubVertical = 'general-retail' | 'food-delivery' | 'food-supply' | 'subscription';

export interface CommercePreviewScript extends Omit<BookingPreviewScript, 'subVertical' | 'engine'> {
  engine: 'commerce';
  subVertical: CommerceSubVertical;
}

const T = (content: string) => ({ role: 'user' as const, content });

// ── General Retail ────────────────────────────────────────────────────

const RETAIL_SCRIPTS: CommercePreviewScript[] = [
  {
    id: 'retail-01-browse',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Browse + filter',
    description: 'Shopper arrives, browses catalog, narrows by category',
    turns: [T('hi'), T('what do you sell'), T('show me the bestsellers')],
  },
  {
    id: 'retail-02-specific-product',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Specific product lookup',
    description: 'Shopper asks about a specific product by name/spec',
    turns: [T('do you have anything under 1000 rupees'), T('tell me about the starter product'), T('whats the warranty')],
  },
  {
    id: 'retail-03-compare',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Compare products',
    description: 'Shopper compares two options',
    turns: [T('compare the mid-tier and premium'), T('which has a longer warranty'), T('which is better value')],
  },
  {
    id: 'retail-04-cart-checkout',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Add to cart + checkout',
    description: 'Shopper progresses to purchase',
    turns: [T('show me products'), T('add the bundle pack to my cart'), T('checkout please'), T('confirm the order')],
  },
  {
    id: 'retail-05-promo',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Apply promo code',
    description: 'Shopper asks about discounts',
    turns: [T('any promos running'), T('do you have a welcome code'), T('apply it to my cart')],
  },
  {
    id: 'retail-06-track-order',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Service break — track order',
    description: 'Shopper switches mid-browse to tracking an existing order',
    turns: [T('show me new arrivals'), T('actually where is my last order'), T('whats the eta')],
  },
  {
    id: 'retail-07-cancel-order',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Service break — cancel order',
    description: 'Shopper asks to cancel',
    turns: [T('i want to cancel my order'), T('whats the refund policy'), T('go ahead and cancel')],
  },
  {
    id: 'retail-08-edge-subscription',
    engine: 'commerce',
    subVertical: 'general-retail',
    label: 'Edge — subscription upsell',
    description: 'Shopper asks about subscribe-and-save',
    turns: [T('do you offer subscriptions'), T('whats the savings'), T('sign me up monthly')],
  },
];

// ── Food Delivery ────────────────────────────────────────────────────

const FOOD_DELIVERY_SCRIPTS: CommercePreviewScript[] = [
  {
    id: 'food-delivery-01-browse',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Browse + filter',
    description: 'Diner browses menu, filters by dietary',
    turns: [T('hi'), T('whats on the menu'), T('show me the vegetarian options')],
  },
  {
    id: 'food-delivery-02-specific-dish',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Specific dish lookup',
    description: 'Diner asks about a specific dish',
    turns: [T('whats in the paneer tikka masala'), T('is it spicy'), T('how long to prepare')],
  },
  {
    id: 'food-delivery-03-compare',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Compare dishes',
    description: 'Diner compares two dishes',
    turns: [T('compare the garden salad and the grilled fish'), T('which is lighter'), T('which is bestseller')],
  },
  {
    id: 'food-delivery-04-cart-checkout',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Add to cart + checkout',
    description: 'Diner orders for delivery',
    turns: [T('show me lunch options'), T('add the combo meal'), T('checkout please'), T('confirm and pay')],
  },
  {
    id: 'food-delivery-05-promo',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Apply promo code',
    description: 'Diner asks about lunch specials',
    turns: [T('any specials today'), T('whats the lunch discount'), T('apply to my cart')],
  },
  {
    id: 'food-delivery-06-track-order',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Service break — track order',
    description: 'Diner checks kitchen status',
    turns: [T('whats the menu'), T('actually wheres my order'), T('how long until ready')],
  },
  {
    id: 'food-delivery-07-cancel-order',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Service break — cancel order',
    description: 'Diner asks to cancel',
    turns: [T('cancel my order'), T('will i be charged'), T('yes cancel it')],
  },
  {
    id: 'food-delivery-08-edge-customize',
    engine: 'commerce',
    subVertical: 'food-delivery',
    label: 'Edge — customizations',
    description: 'Diner asks about dish customization and allergens',
    turns: [T('can i make the fish without butter'), T('is the lassi dairy free'), T('any nut allergens to worry about')],
  },
];

// ── Food Supply / B2B ────────────────────────────────────────────────

const FOOD_SUPPLY_SCRIPTS: CommercePreviewScript[] = [
  {
    id: 'food-supply-01-browse',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Browse + filter',
    description: 'Buyer browses wholesale catalog',
    turns: [T('hi'), T('what do you supply'), T('show me organic produce')],
  },
  {
    id: 'food-supply-02-specific-product',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Specific product lookup',
    description: 'Buyer asks about a specific SKU with cert requirements',
    turns: [T('tell me about your bulk rice'), T('whats the certification'), T('shelf life')],
  },
  {
    id: 'food-supply-03-compare',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Compare tiers',
    description: 'Buyer compares bulk pricing tiers',
    turns: [T('compare the growth and volume tier'), T('whats the discount at 100 units'), T('minimum order quantity')],
  },
  {
    id: 'food-supply-04-bulk-order',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Bulk order + delivery',
    description: 'Buyer places bulk order + schedules delivery',
    turns: [T('i need 100 units'), T('when can you deliver'), T('next tuesday works'), T('confirm and proceed')],
  },
  {
    id: 'food-supply-05-promo',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Volume discount / sample',
    description: 'Buyer asks for samples + volume discount',
    turns: [T('can i get a sample first'), T('whats the volume discount above 250 units'), T('add samples to my account')],
  },
  {
    id: 'food-supply-06-track-order',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Service break — track shipment',
    description: 'Buyer asks about delivery status',
    turns: [T('i need more stock'), T('actually wheres my last shipment'), T('eta please')],
  },
  {
    id: 'food-supply-07-cancel-order',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Service break — cancel order',
    description: 'Buyer cancels standing order',
    turns: [T('i want to pause my standing order'), T('just for next month'), T('confirm the pause')],
  },
  {
    id: 'food-supply-08-edge-recurring',
    engine: 'commerce',
    subVertical: 'food-supply',
    label: 'Edge — recurring / standing order setup',
    description: 'Buyer sets up recurring supply',
    turns: [T('set up a weekly order'), T('same quantities as last week'), T('every tuesday')],
  },
];

// ── Subscription ─────────────────────────────────────────────────────

const SUBSCRIPTION_SCRIPTS: CommercePreviewScript[] = [
  {
    id: 'subscription-01-browse',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Browse + filter',
    description: 'Visitor browses subscription plans',
    turns: [T('hi'), T('what plans do you offer'), T('show me the monthly tier')],
  },
  {
    id: 'subscription-02-specific-plan',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Specific plan lookup',
    description: 'Visitor asks about annual plan specifics',
    turns: [T('tell me about the annual plan'), T('whats included'), T('can i pause later')],
  },
  {
    id: 'subscription-03-compare',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Compare plans',
    description: 'Visitor compares monthly vs annual',
    turns: [T('compare monthly and annual'), T('whats the savings'), T('which should i pick as a first-timer')],
  },
  {
    id: 'subscription-04-subscribe',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Subscribe + checkout',
    description: 'Visitor subscribes and pays',
    turns: [T('sign me up quarterly'), T('starting this week'), T('checkout'), T('confirm and pay')],
  },
  {
    id: 'subscription-05-promo',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Apply promo',
    description: 'Visitor asks about first-month discount',
    turns: [T('any first-month promo'), T('do you have referral credits'), T('apply to my plan')],
  },
  {
    id: 'subscription-06-track-order',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Service break — next delivery',
    description: 'Subscriber asks about next delivery',
    turns: [T('i want to upgrade my plan'), T('actually when is my next delivery'), T('whats in it')],
  },
  {
    id: 'subscription-07-cancel-order',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Service break — cancel / pause',
    description: 'Subscriber pauses or cancels',
    turns: [T('pause my subscription'), T('for the next 2 months'), T('confirm the pause')],
  },
  {
    id: 'subscription-08-edge-swap',
    engine: 'commerce',
    subVertical: 'subscription',
    label: 'Edge — swap plan tier',
    description: 'Subscriber swaps tier mid-subscription',
    turns: [T('i want to move from monthly to annual'), T('how does the migration work'), T('is there a refund for the unused month')],
  },
];

// ── Exports ──────────────────────────────────────────────────────────

export const COMMERCE_PREVIEW_SCRIPTS: readonly CommercePreviewScript[] = [
  ...RETAIL_SCRIPTS,
  ...FOOD_DELIVERY_SCRIPTS,
  ...FOOD_SUPPLY_SCRIPTS,
  ...SUBSCRIPTION_SCRIPTS,
];

export function getCommerceScriptsBySubVertical(
  subVertical: CommerceSubVertical,
): CommercePreviewScript[] {
  return COMMERCE_PREVIEW_SCRIPTS.filter((s) => s.subVertical === subVertical);
}

export function getCommerceScriptById(id: string): CommercePreviewScript | undefined {
  return COMMERCE_PREVIEW_SCRIPTS.find((s) => s.id === id);
}
