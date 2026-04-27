// ── Curated schema: food_beverage_ordering ──────────────────────────
//
// Ordering channels — dine-in, pickup / takeout, delivery (in-house
// or via Uber Eats / DoorDash), curbside, catering. Each item
// describes one channel: cost structure, hours, payment options,
// service-feature toggles.

import type { CuratedSchema } from '../types';

const ordering: CuratedSchema = {
  name: 'Ordering Channels',
  description:
    'How customers can order — dine-in, pickup, delivery (in-house or third-party), curbside, catering.',
  contentCategory: 'operations',
  itemLabel: 'Channel',
  itemLabelPlural: 'Channels',
  defaultCurrency: 'USD',
  fields: [
    // ── Identity ────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Dine-in, Pickup, Delivery — Uber Eats',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Customer-facing detail about this channel.',
    },
    {
      name: 'category',
      type: 'select',
      options: ['Dine-in', 'Pickup', 'Takeout', 'Delivery', 'Curbside', 'Catering', 'Drive-thru'],
      showInList: true,
      showInCard: true,
    },
    {
      name: 'channel_type',
      type: 'select',
      options: ['Direct', 'Third-party platform', 'In-app', 'Phone', 'Walk-in'],
    },

    // ── Third-party partner ─────────────────────────────────────
    {
      name: 'third_party_partner',
      type: 'text',
      placeholder: 'e.g. Uber Eats, DoorDash, Grubhub',
      description: 'Set when the channel is fulfilled by an external partner.',
    },
    { name: 'partner_logo_url', type: 'url' },
    { name: 'partner_url', type: 'url', placeholder: 'Direct deep link to your storefront on the partner.' },

    // ── Cost ────────────────────────────────────────────────────
    {
      name: 'minimum_order',
      type: 'currency',
      description: 'Minimum subtotal required to place an order.',
    },
    { name: 'maximum_order', type: 'currency' },
    {
      name: 'service_fee',
      type: 'currency',
      description: 'Flat service / convenience fee.',
    },
    { name: 'delivery_fee', type: 'currency' },
    {
      name: 'delivery_fee_free_above',
      type: 'currency',
      description: 'Order subtotal above which delivery is free.',
    },

    // ── Timing ──────────────────────────────────────────────────
    {
      name: 'prep_time_minutes',
      type: 'number',
      placeholder: 'e.g. 20',
      description: 'Average kitchen prep time before pickup / dispatch.',
    },
    {
      name: 'delivery_time_minutes',
      type: 'number',
      placeholder: 'e.g. 30',
      description: 'Average dispatch-to-doorstep time.',
    },

    // ── Delivery zones ──────────────────────────────────────────
    {
      name: 'delivery_radius_km',
      type: 'number',
      description: 'Maximum delivery radius from the venue.',
    },
    {
      name: 'delivery_zones',
      type: 'tags',
      description: 'Specific neighborhoods or districts served.',
    },
    {
      name: 'delivery_postcode_pattern',
      type: 'text',
      placeholder: 'e.g. SF: 94102-94158, NY: 10001-10282',
    },

    // ── Hours ───────────────────────────────────────────────────
    {
      name: 'available_hours',
      type: 'text',
      placeholder: 'e.g. 11:00-22:00',
    },
    {
      name: 'available_days',
      type: 'multi_select',
      options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },

    // ── Payment ─────────────────────────────────────────────────
    {
      name: 'accepted_payments',
      type: 'multi_select',
      options: [
        'Cash',
        'Card',
        'Apple Pay',
        'Google Pay',
        'PayPal',
        'Venmo',
        'Crypto',
        'Gift Card',
        'Account / Tab',
      ],
    },
    {
      name: 'tip_options',
      type: 'tags',
      description: 'Suggested tip amounts — "15%, 18%, 20%, custom".',
    },

    // ── Service features ────────────────────────────────────────
    { name: 'contactless_available', type: 'toggle' },
    { name: 'contactless_pickup', type: 'toggle' },
    { name: 'curbside_pickup', type: 'toggle' },
    { name: 'in_app_ordering', type: 'toggle' },
    {
      name: 'online_only',
      type: 'toggle',
      description: 'Channel cannot be ordered via phone / walk-in.',
    },
    { name: 'table_service', type: 'toggle' },
    { name: 'counter_service', type: 'toggle' },
    {
      name: 'reservation_required',
      type: 'toggle',
      description: 'For dine-in channels that need an advance booking.',
    },

    // ── Marketing ───────────────────────────────────────────────
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin to the top of the channels list in chat.',
    },
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form — fastest, cheapest, premium, contactless.',
    },

    // ── Internal ────────────────────────────────────────────────
    {
      name: 'partner_commission_percent',
      type: 'number',
      validation: { min: 0, max: 100 },
      description: 'Commission the third-party partner takes — for margin tracking. Internal only.',
    },
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default ordering;
