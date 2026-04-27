// ── Curated schema: food_beverage_marketing ─────────────────────────
//
// Promotional offers, deals, campaigns. Schema is built to fit a
// wide range of offer mechanics — percentage discount codes, fixed
// dollar reductions, BOGO, free-with-purchase, and fixed-price
// packages — alongside the validity / targeting metadata partners
// need to actually run a campaign.
//
// Field names that match the promo block's reads[] in the registry
// (`headline`, `discount_code`, `expires_at`, `cta_label`) are kept
// verbatim so renderers find them via normalizeItem without any
// alias mapping.

import type { CuratedSchema } from '../types';

const marketing: CuratedSchema = {
  name: 'Offers & Promotions',
  description: 'Time-limited offers, promotions, and campaigns customers can redeem.',
  contentCategory: 'offers',
  itemLabel: 'Offer',
  itemLabelPlural: 'Offers',
  defaultCurrency: 'USD',
  fields: [
    // ── Identity (block-card surface) ────────────────────────────
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Happy Hour',
    },
    {
      name: 'headline',
      type: 'text',
      showInCard: true,
      placeholder: 'Catchy short copy — "Half-price cocktails 5–7pm"',
      description: 'One-line hook surfaced in chat. Promo block reads this.',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Full offer details for the customer.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Recurring',
        'Weekend',
        'Brunch',
        'Happy Hour',
        'Holiday',
        'Seasonal',
        'Loyalty',
        'Birthday',
        'Limited Time',
        'Flash Sale',
        'New Customer',
        'Referral',
      ],
      showInList: true,
      showInCard: true,
    },

    // ── Offer mechanics ──────────────────────────────────────────
    {
      name: 'discount_type',
      type: 'select',
      options: [
        'Percentage',
        'Fixed Amount',
        'BOGO',
        'Free Item',
        'Bundle',
        'Fixed Price Package',
        'No discount',
      ],
      description: 'Mechanism — drives whether discount_percent, discount_amount, or price applies.',
    },
    {
      name: 'discount_code',
      type: 'text',
      placeholder: 'e.g. HAPPY50',
      description: 'Code customers enter at checkout. Leave blank for auto-apply. Promo block reads this.',
    },
    {
      name: 'discount_percent',
      type: 'number',
      placeholder: 'e.g. 50',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'discount_amount',
      type: 'currency',
      description: 'Fixed reduction in the partner’s currency.',
    },
    {
      name: 'price',
      type: 'currency',
      description: 'Fixed package price — used by "Fixed Price Package" offers (e.g. "$89 for two").',
    },
    {
      name: 'original_price',
      type: 'currency',
      description: 'Sticker price shown alongside the discounted price for comparison.',
    },
    {
      name: 'minimum_order_amount',
      type: 'currency',
      description: 'Minimum order subtotal required to redeem.',
    },
    {
      name: 'maximum_discount',
      type: 'currency',
      description: 'Cap on percentage offers — "20% off, max $25".',
    },
    {
      name: 'free_item',
      type: 'text',
      placeholder: 'e.g. Free mimosa',
      description: 'For free-with-purchase offers — the item the customer gets.',
    },

    // ── Validity windows ─────────────────────────────────────────
    {
      name: 'valid_from',
      type: 'date',
      description: 'Offer goes live at the start of this date.',
    },
    {
      name: 'expires_at',
      type: 'date',
      description: 'Offer expires at the end of this date. Promo block reads this for countdowns.',
    },
    {
      name: 'valid_days',
      type: 'multi_select',
      options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      name: 'valid_hours',
      type: 'text',
      placeholder: 'e.g. 17:00-19:00',
      description: 'Time window when the offer is active each valid day.',
    },

    // ── Limits ───────────────────────────────────────────────────
    {
      name: 'redemption_limit',
      type: 'number',
      description: 'Total redemptions allowed across all customers. Leave blank for unlimited.',
    },
    {
      name: 'redemption_per_customer',
      type: 'number',
      defaultValue: 1,
      description: 'Per-customer cap.',
    },

    // ── Targeting ────────────────────────────────────────────────
    {
      name: 'audience',
      type: 'multi_select',
      options: [
        'All customers',
        'New customers',
        'Loyalty members',
        'VIP',
        'Walk-ins',
        'Returning',
      ],
    },
    {
      name: 'channels',
      type: 'multi_select',
      options: ['In-store', 'Online', 'Pickup', 'Delivery', 'Catering', 'Bar', 'Patio'],
      description: 'Where this offer is redeemable.',
    },

    // ── CTA ──────────────────────────────────────────────────────
    {
      name: 'cta_label',
      type: 'text',
      placeholder: 'e.g. Reserve a seat',
      description: 'Button copy on the promo block.',
    },
    {
      name: 'cta_url',
      type: 'url',
      placeholder: 'https://…',
      description: 'Optional click-through. Falls back to the in-chat booking flow when blank.',
    },

    // ── Marketing meta ───────────────────────────────────────────
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form tags for filtering — couples, brunch, drinks, family.',
    },
    {
      name: 'featured',
      type: 'toggle',
      description: 'Surface this offer prominently in chat.',
    },
    {
      name: 'urgency',
      type: 'select',
      options: ['Low', 'Medium', 'High', 'Critical'],
      description: 'Drives countdown timer prominence + visual emphasis on the promo block.',
    },
    {
      name: 'terms',
      type: 'textarea',
      description: 'Fine print — exclusions, conditions, blackout dates.',
    },

    // ── Internal ─────────────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default marketing;
