// ── Curated schema: food_beverage_events ────────────────────────────
//
// Special events — wine pairing nights, chef's tables, holiday
// brunches, tasting menus, classes, live music, pop-ups, private
// events. Distinct from regular menu items because they're
// time-bound and seat-limited.

import type { CuratedSchema } from '../types';

const events: CuratedSchema = {
  name: 'Events',
  description:
    'Special one-off or recurring events — wine pairings, chef’s tables, holiday menus, tastings, live music.',
  contentCategory: 'offers',
  itemLabel: 'Event',
  itemLabelPlural: 'Events',
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
      placeholder: 'e.g. Wine Pairing Night — Tuscany',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'What customers will experience — the more vivid, the better.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Wine Tasting',
        'Chef’s Table',
        'Tasting Menu',
        'Holiday',
        'Pop-up',
        'Class',
        'Workshop',
        'Live Music',
        'Open Mic',
        'Trivia Night',
        'Karaoke',
        'Private Event',
        'Brunch',
        'Special Menu',
        'Themed Night',
        'Charity',
      ],
      showInList: true,
      showInCard: true,
    },

    // ── Pricing ──────────────────────────────────────────────────
    {
      name: 'price',
      type: 'currency',
      showInList: true,
      showInCard: true,
      description: 'Per-person price. Use 0 for free events.',
    },
    {
      name: 'includes',
      type: 'tags',
      description:
        'What’s included in the ticket — courses, wine pairings, welcome cocktail, take-home gift.',
    },
    { name: 'deposit_required', type: 'toggle' },
    { name: 'deposit_amount', type: 'currency' },
    {
      name: 'minimum_purchase',
      type: 'currency',
      description: 'Minimum spend during the event (where applicable, e.g. private rooms).',
    },

    // ── Schedule ─────────────────────────────────────────────────
    {
      name: 'event_date',
      type: 'date',
      showInCard: true,
      description: 'For one-off events: the date. For recurring: the next instance.',
    },
    { name: 'event_time', type: 'time', showInCard: true },
    { name: 'end_time', type: 'time' },
    {
      name: 'duration_minutes',
      type: 'number',
      placeholder: 'e.g. 150',
    },
    {
      name: 'recurrence',
      type: 'select',
      options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Annual', 'Custom'],
    },
    {
      name: 'recurrence_pattern',
      type: 'text',
      placeholder: 'e.g. Every Saturday, First Friday of the month',
      description: 'Free-form recurrence detail when "Custom" is selected.',
    },

    // ── Capacity ─────────────────────────────────────────────────
    {
      name: 'capacity',
      type: 'number',
      description: 'Total seats / spots available.',
    },
    {
      name: 'seats_available',
      type: 'number',
      description: 'Current remaining seats — drives the urgency badge in chat.',
    },
    {
      name: 'min_attendees',
      type: 'number',
      description: 'Minimum signups required for the event to run. Below this, the event is cancelled.',
    },

    // ── Booking ──────────────────────────────────────────────────
    {
      name: 'booking_required',
      type: 'toggle',
      defaultValue: true,
    },
    {
      name: 'booking_deadline',
      type: 'date',
      description: 'RSVP by this date. Leave blank for "until full".',
    },
    {
      name: 'advance_notice_hours',
      type: 'number',
      placeholder: 'e.g. 48',
      description: 'Minimum lead time the kitchen needs to prep for an event booking.',
    },

    // ── Guest experience ─────────────────────────────────────────
    {
      name: 'age_restriction',
      type: 'select',
      options: ['All ages', 'Family-friendly', '13+', '18+', '21+'],
    },
    {
      name: 'dress_code',
      type: 'select',
      options: ['Casual', 'Smart casual', 'Cocktail', 'Black tie', 'Themed'],
    },
    { name: 'kids_menu', type: 'toggle' },
    { name: 'pet_friendly', type: 'toggle' },
    {
      name: 'accessibility',
      type: 'multi_select',
      options: [
        'Wheelchair accessible',
        'Ground floor',
        'Elevator',
        'Accessible restroom',
        'Service animal friendly',
        'Sign language interpreter on request',
      ],
    },

    // ── Host / featuring ─────────────────────────────────────────
    {
      name: 'host',
      type: 'text',
      placeholder: 'e.g. Chef Marco, Sommelier Alice',
    },
    {
      name: 'guest_chef',
      type: 'text',
      placeholder: 'e.g. Chef Yotam Ottolenghi',
      description: 'Visiting chef or guest collaborator.',
    },
    {
      name: 'featured_partner',
      type: 'text',
      placeholder: 'e.g. Featuring Antinori winery, In partnership with Slow Food',
    },

    // ── Marketing ────────────────────────────────────────────────
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin this event to the top of the events list in chat.',
    },
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form — wine, tuscany, ticketed, weekly, holiday, family.',
    },
    {
      name: 'highlights',
      type: 'tags',
      description: 'What to expect — "5 courses", "Live jazz trio", "Take-home recipe card".',
    },

    // ── Internal ─────────────────────────────────────────────────
    {
      name: 'room',
      type: 'text',
      placeholder: 'e.g. Main dining room, Private room, Patio',
      description: 'Internal: which space hosts the event.',
    },
    {
      name: 'staff_required',
      type: 'number',
      description: 'Internal: how many staff members the event needs.',
    },
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default events;
