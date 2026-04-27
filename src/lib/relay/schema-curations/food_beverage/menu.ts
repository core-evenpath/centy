// ── Curated schema: food_beverage_menu ──────────────────────────────
//
// Restaurant / cafe menu items — the dishes customers can order. The
// schema is intentionally extensive (well beyond the handful of
// fields blocks read) so partners can capture the rich data they
// already have in their POS or recipe sheets without reaching for
// custom fields.
//
// Block consumers (registry's `reads[]`) currently pull a small core
// — name / description / price / image_url / category / badges /
// rating. Everything else lives on the item and is preserved across
// blocks that don't read it (safe over-coverage; see normalizeItem).

import type { CuratedSchema } from '../types';

const menu: CuratedSchema = {
  name: 'Menu',
  description: 'Items customers can order from your menu.',
  contentCategory: 'products',
  itemLabel: 'Dish',
  itemLabelPlural: 'Dishes',
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
      placeholder: 'e.g. Margherita Pizza',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Short, mouth-watering description shown on the card.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Starters',
        'Mains',
        'Pizza',
        'Pasta',
        'Salads',
        'Soups',
        'Sides',
        'Desserts',
        'Kids',
        'Specials',
      ],
      showInList: true,
      showInCard: true,
    },
    {
      name: 'price',
      type: 'currency',
      showInList: true,
      showInCard: true,
    },

    // ── Dietary & allergens ──────────────────────────────────────
    {
      name: 'ingredients',
      type: 'tags',
      isSearchable: true,
      description: 'Customer-friendly ingredient list — surfaced in chat for picky eaters.',
    },
    {
      name: 'allergens',
      type: 'multi_select',
      options: [
        'gluten',
        'dairy',
        'eggs',
        'fish',
        'shellfish',
        'peanuts',
        'tree nuts',
        'soy',
        'sesame',
        'sulphites',
      ],
      description: 'Standard EU/US allergens — surfaced in chat for safety.',
    },
    { name: 'is_vegetarian', type: 'toggle' },
    { name: 'is_vegan', type: 'toggle' },
    { name: 'is_gluten_free', type: 'toggle' },
    { name: 'is_dairy_free', type: 'toggle' },
    { name: 'is_halal', type: 'toggle' },
    { name: 'is_kosher', type: 'toggle' },

    // ── Preparation ──────────────────────────────────────────────
    {
      name: 'cooking_time',
      type: 'text',
      placeholder: 'e.g. 12 min',
      description: 'How long from order to plate.',
    },
    { name: 'calories', type: 'number', placeholder: 'kcal' },
    {
      name: 'serves',
      type: 'number',
      defaultValue: 1,
      description: 'How many people one order serves.',
    },
    {
      name: 'spice_level',
      type: 'select',
      options: ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
    },
    {
      name: 'portion_size',
      type: 'text',
      placeholder: 'e.g. 250g, 12 inch',
    },

    // ── Availability ─────────────────────────────────────────────
    {
      name: 'in_stock',
      type: 'toggle',
      defaultValue: true,
      description: 'Off when 86’d for the day.',
    },
    {
      name: 'available_days',
      type: 'multi_select',
      options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    {
      name: 'available_until',
      type: 'time',
      description: 'Last orderable time of day. Leave blank if always available.',
    },
    {
      name: 'daily_special',
      type: 'toggle',
      description: 'Highlights the dish in chat with a Daily Special badge.',
    },
    {
      name: 'chef_pick',
      type: 'toggle',
      description: 'Highlights the dish in chat with a Chef’s Pick badge.',
    },

    // ── Marketing ────────────────────────────────────────────────
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form tags for filtering — popular, classic, seasonal, signature, etc.',
    },
    {
      name: 'recommended_pairing',
      type: 'text',
      placeholder: 'e.g. Chianti, Aperol Spritz',
    },

    // ── Internal / inventory (not shown to customers) ────────────
    {
      name: 'sku',
      type: 'text',
      placeholder: 'Internal product code',
    },
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default menu;
