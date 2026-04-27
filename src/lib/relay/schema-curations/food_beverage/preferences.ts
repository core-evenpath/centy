// ── Curated schema: food_beverage_preferences ───────────────────────
//
// Dietary, allergy, religious, and lifestyle accommodations the
// restaurant offers. Each item describes one accommodation type
// (Gluten-Free, Vegan, Nut Allergy, Halal, etc.) — what's available,
// what kitchen safety controls are in place, what advance notice is
// needed, and which dishes are safe / off-limits.

import type { CuratedSchema } from '../types';

const preferences: CuratedSchema = {
  name: 'Dietary & Accommodations',
  description:
    'Dietary, allergy, religious, and lifestyle accommodations — what you can serve, what controls are in place, and what notice you need.',
  contentCategory: 'about',
  itemLabel: 'Accommodation',
  itemLabelPlural: 'Accommodations',
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
      placeholder: 'e.g. Gluten-Free, Vegan, Nut Allergy',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Full prose explanation surfaced in chat.',
    },
    {
      name: 'category',
      type: 'select',
      options: ['Dietary', 'Allergy', 'Religious', 'Lifestyle', 'Medical', 'Other'],
      showInList: true,
      showInCard: true,
    },

    // ── Availability ────────────────────────────────────────────
    {
      name: 'available_items_count',
      type: 'number',
      description: 'Menu items naturally suitable as-is.',
    },
    {
      name: 'modifiable_items_count',
      type: 'number',
      description: 'Items that can be adapted on request.',
    },
    {
      name: 'not_available_items_count',
      type: 'number',
      description: 'Items that cannot be served safely under this accommodation.',
    },

    // ── Kitchen safety ──────────────────────────────────────────
    {
      name: 'dedicated_prep',
      type: 'toggle',
      description: 'Separate prep area / station to prevent cross-contamination.',
    },
    {
      name: 'shared_kitchen_warning',
      type: 'toggle',
      description: 'Cross-contamination is possible — surface the warning in chat.',
    },
    { name: 'dedicated_fryer', type: 'toggle' },
    { name: 'dedicated_grill', type: 'toggle' },
    { name: 'separate_utensils', type: 'toggle' },
    { name: 'separate_storage', type: 'toggle' },

    // ── Notification windows ────────────────────────────────────
    {
      name: 'notify_staff_required',
      type: 'toggle',
      defaultValue: true,
      description: 'Customer must inform their server in advance.',
    },
    {
      name: 'advance_notice_required',
      type: 'toggle',
      description: 'Customer must call ahead before arrival.',
    },
    {
      name: 'advance_notice_hours',
      type: 'number',
      placeholder: 'e.g. 24',
    },

    // ── Certifications ──────────────────────────────────────────
    {
      name: 'certified',
      type: 'toggle',
      description: 'Third-party certified.',
    },
    {
      name: 'certifying_body',
      type: 'text',
      placeholder: 'e.g. Gluten Intolerance Group, OU Kosher, IFANCA Halal',
    },
    { name: 'certification_date', type: 'date' },
    { name: 'certification_expires', type: 'date' },

    // ── Severity / accommodation level ──────────────────────────
    {
      name: 'severity_level',
      type: 'select',
      options: ['Mild', 'Moderate', 'Severe', 'Critical'],
      description: 'Default severity assumption — drives staff alert level when ordering.',
    },
    {
      name: 'accommodation_level',
      type: 'select',
      options: ['Full', 'Partial', 'On Request', 'Not Available'],
      description: 'How comprehensively the kitchen accommodates this.',
    },

    // ── Recommended / avoid ─────────────────────────────────────
    {
      name: 'recommended_dishes',
      type: 'tags',
      isSearchable: true,
      description: 'Dish names safe to recommend — boosts RAG when customer asks.',
    },
    {
      name: 'avoid_dishes',
      type: 'tags',
      description: 'Dish names to warn customers off.',
    },

    // ── Marketing ───────────────────────────────────────────────
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin to the top of the accommodations list in chat.',
    },
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form — gluten-free, plant-based, halal, kosher, allergy, dietary.',
    },

    // ── Internal ────────────────────────────────────────────────
    {
      name: 'training_notes',
      type: 'textarea',
      description: 'Staff training notes — common mistakes, safety protocol. Internal only.',
    },
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default preferences;
