// ── Curated schema: food_beverage_booking ───────────────────────────
//
// Restaurant / cafe / bar table reservations. Schema covers identity,
// capacity, pricing (deposits + minimum spend), availability windows,
// accessibility flags, and the ambience signals partners use to
// differentiate "Window table for 2" from "Outdoor patio" from
// "Private dining for 8".

import type { CuratedSchema } from '../types';

const booking: CuratedSchema = {
  name: 'Reservations',
  description: 'Table reservations and seating options customers can book.',
  contentCategory: 'bookings',
  itemLabel: 'Reservation',
  itemLabelPlural: 'Reservations',
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
      placeholder: 'e.g. Window table for 2',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'What makes this table special — view, ambience, etc.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Indoor',
        'Outdoor',
        'Bar',
        'Private Dining',
        'Counter',
        'Lounge',
        'Rooftop',
        'Garden',
      ],
      showInList: true,
      showInCard: true,
    },

    // ── Type & capacity ──────────────────────────────────────────
    {
      name: 'table_type',
      type: 'select',
      options: [
        '2-top',
        '4-top',
        '6-top',
        '8-top',
        'round',
        'booth',
        'high-top',
        'communal',
        'bar seating',
        'private room',
      ],
    },
    {
      name: 'party_size',
      type: 'number',
      placeholder: 'Recommended size',
      showInCard: true,
      description: 'The size this option is best suited for.',
    },
    {
      name: 'min_party_size',
      type: 'number',
      placeholder: 'Minimum people',
    },
    {
      name: 'max_party_size',
      type: 'number',
      placeholder: 'Maximum people',
    },
    {
      name: 'duration_minutes',
      type: 'number',
      placeholder: 'e.g. 90',
      description: 'Default time slot length in minutes.',
    },

    // ── Pricing ──────────────────────────────────────────────────
    {
      name: 'price',
      type: 'currency',
      description: 'Per-seat charge or fixed booking fee. Leave 0 for free reservations.',
    },
    { name: 'deposit_required', type: 'toggle' },
    {
      name: 'deposit_amount',
      type: 'currency',
      description: 'Deposit charged at booking — refunded against the final bill or forfeited on no-show.',
    },
    {
      name: 'minimum_spend',
      type: 'currency',
      description: 'Minimum spend during the booking — common for private rooms.',
    },

    // ── Availability ─────────────────────────────────────────────
    {
      name: 'available_times',
      type: 'tags',
      description: 'Slot start times — "18:00", "19:30". Customers see these as bookable buttons.',
    },
    {
      name: 'available_days',
      type: 'multi_select',
      options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      name: 'advance_notice_hours',
      type: 'number',
      placeholder: 'e.g. 24',
      description: 'Minimum notice the kitchen / FOH needs. Bookings must be at least this many hours ahead.',
    },
    {
      name: 'booking_window_days',
      type: 'number',
      defaultValue: 30,
      description: 'How far in advance customers can book.',
    },

    // ── Features & accessibility ─────────────────────────────────
    { name: 'has_view', type: 'toggle' },
    {
      name: 'view_description',
      type: 'text',
      placeholder: 'e.g. Sea view, garden view, kitchen counter',
    },
    {
      name: 'accessibility',
      type: 'multi_select',
      options: [
        'Wheelchair accessible',
        'Ground floor',
        'Elevator',
        'Accessible restroom',
        'Service animal friendly',
      ],
    },
    { name: 'pet_friendly', type: 'toggle' },
    { name: 'kid_friendly', type: 'toggle' },
    {
      name: 'private',
      type: 'toggle',
      description: 'Fully private — separate room or curtained area.',
    },
    {
      name: 'outdoor_heating',
      type: 'toggle',
      description: 'Heaters or blankets available for outdoor tables.',
    },
    {
      name: 'includes',
      type: 'tags',
      description:
        'What’s included — bread service, complimentary drink, dedicated server, etc.',
    },

    // ── Marketing ────────────────────────────────────────────────
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form tags — romantic, business, family, popular, special-occasion.',
    },
    {
      name: 'featured',
      type: 'toggle',
      description: 'Highlights this option at the top of the bookable list in chat.',
    },

    // ── Internal / FOH-only ──────────────────────────────────────
    {
      name: 'max_walk_ins',
      type: 'number',
      description: 'Internal: how many walk-ins this section can accommodate without booking.',
    },
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default booking;
