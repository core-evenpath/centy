// ── Curated schema: food_beverage_info ──────────────────────────────
//
// Informational content cards customers see in chat — Hours,
// Location, Contact, Parking, Dress code, Policies, Accessibility.
// One item per "info card"; each fills the subset of fields
// relevant to its category. Empty fields are harmless — block
// renderers ignore them.
//
// Phone / email / website / address fields are wired into the
// partner-side identity prefill (Phase 3A): when partner adds a new
// info item, those fields auto-populate from their businessPersona
// so they don't have to retype.

import type { CuratedSchema } from '../types';

const info: CuratedSchema = {
  name: 'About & Info',
  description: 'Information cards customers see in chat — hours, location, parking, dress code, policies.',
  contentCategory: 'about',
  itemLabel: 'Info card',
  itemLabelPlural: 'Info cards',
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
      placeholder: 'e.g. Hours of operation',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'The content customers see — full prose, multi-line is fine.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Hours',
        'Location',
        'Contact',
        'Parking',
        'Transit',
        'Policies',
        'Dress Code',
        'Accessibility',
        'Pet Policy',
        'Kids Policy',
        'Group Policy',
        'Reservations',
        'Allergens',
        'About',
      ],
      showInList: true,
      showInCard: true,
    },

    // ── Hours ───────────────────────────────────────────────────
    {
      name: 'weekday_hours',
      type: 'text',
      placeholder: 'e.g. 11:00-22:00',
    },
    {
      name: 'weekend_hours',
      type: 'text',
      placeholder: 'e.g. 10:00-23:00',
    },
    {
      name: 'holiday_hours',
      type: 'text',
      placeholder: 'e.g. 12:00-20:00',
      description: 'Override for public holidays — leave blank if same as regular hours.',
    },
    {
      name: 'last_seating_offset_minutes',
      type: 'number',
      description:
        'Minutes before close after which no new orders are taken — drives "Last seating at 21:30" answers.',
    },
    {
      name: 'temporarily_closed',
      type: 'toggle',
      description: 'Surface a "we’re closed" notice in chat.',
    },

    // ── Location ────────────────────────────────────────────────
    {
      name: 'address',
      type: 'textarea',
      placeholder: 'Full street address',
      isSearchable: true,
    },
    { name: 'city', type: 'text' },
    { name: 'country', type: 'text' },
    { name: 'postal_code', type: 'text' },
    {
      name: 'map_url',
      type: 'url',
      placeholder: 'Google Maps / Apple Maps deep link',
      description: 'Tappable in chat — opens directions in the customer’s default map app.',
    },

    // ── Contact ─────────────────────────────────────────────────
    { name: 'phone', type: 'phone' },
    {
      name: 'whatsapp',
      type: 'phone',
      description: 'WhatsApp number — often the same as phone, kept separate for chat-channel routing.',
    },
    { name: 'email', type: 'email' },
    { name: 'website', type: 'url' },

    // ── Parking & transit ───────────────────────────────────────
    { name: 'parking_available', type: 'toggle' },
    {
      name: 'parking_validated',
      type: 'toggle',
      description: 'Restaurant validates the customer’s parking ticket.',
    },
    {
      name: 'parking_cost',
      type: 'text',
      placeholder: 'e.g. $5 with validation, free after 6pm',
    },
    {
      name: 'transit_nearest',
      type: 'text',
      placeholder: 'e.g. Montgomery BART (5 min walk)',
    },
    { name: 'bike_friendly', type: 'toggle' },

    // ── Policies ────────────────────────────────────────────────
    {
      name: 'dress_code',
      type: 'select',
      options: ['Casual', 'Smart casual', 'Business casual', 'Cocktail', 'Black tie', 'Themed'],
    },
    { name: 'kids_friendly', type: 'toggle' },
    {
      name: 'kids_friendly_until',
      type: 'time',
      description: 'Latest time kids are welcome — chat surfaces this in family-trip flows.',
    },
    { name: 'pets_allowed', type: 'toggle' },
    {
      name: 'smoking_policy',
      type: 'select',
      options: ['No smoking', 'Outdoor only', 'Designated area', 'Allowed'],
    },
    {
      name: 'large_party_threshold',
      type: 'number',
      description: 'Party size requiring advance booking notice — drives the "for groups of N+" flows.',
    },

    // ── Accessibility ───────────────────────────────────────────
    { name: 'wheelchair_accessible', type: 'toggle' },
    {
      name: 'accessibility_notes',
      type: 'textarea',
      placeholder:
        'Steps, elevator availability, accessible restroom, service-animal policy, etc.',
    },

    // ── Marketing meta ──────────────────────────────────────────
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form tags for filtering — hours, parking, family, accessibility.',
    },

    // ── Internal ────────────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default info;
