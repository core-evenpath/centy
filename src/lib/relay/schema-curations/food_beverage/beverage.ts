// ── Curated schema: food_beverage_beverage ──────────────────────────
//
// Drinks — coffee, tea, juice, smoothies, sodas, cocktails, mocktails,
// beer, wine, spirits, specialty drinks. Schema is intentionally
// broad so a partner can capture barista-grade detail (origin,
// brewing method, ABV) for the dishes that warrant it without
// ignoring fields they don't care about.

import type { CuratedSchema } from '../types';

const beverage: CuratedSchema = {
  name: 'Beverages',
  description: 'Drinks customers can order — coffee, tea, juice, cocktails, beer, wine, and specialty drinks.',
  contentCategory: 'products',
  itemLabel: 'Drink',
  itemLabelPlural: 'Drinks',
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
      placeholder: 'e.g. Aperol Spritz',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Short, evocative — what makes it distinctive.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Coffee',
        'Tea',
        'Juice',
        'Smoothie',
        'Soda',
        'Water',
        'Cocktail',
        'Mocktail',
        'Beer',
        'Wine',
        'Spirits',
        'Hot Chocolate',
        'Specialty',
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

    // ── Format & serving ─────────────────────────────────────────
    {
      name: 'size',
      type: 'text',
      placeholder: 'e.g. 30ml, 12oz, 750ml',
      description: 'Pour size, bottle size, or glass size as it appears on the menu.',
    },
    {
      name: 'volume_ml',
      type: 'number',
      placeholder: 'Volume in millilitres',
      description: 'Structured volume — used for ABV / nutrition calcs.',
    },
    {
      name: 'temperature',
      type: 'select',
      options: ['Hot', 'Cold', 'Room temperature', 'Frozen'],
    },
    {
      name: 'serves',
      type: 'number',
      defaultValue: 1,
      description: 'How many people one order serves (pitchers, sharing cocktails).',
    },

    // ── Alcohol, caffeine, carbonation ───────────────────────────
    { name: 'is_alcoholic', type: 'toggle' },
    {
      name: 'abv_percent',
      type: 'number',
      placeholder: 'e.g. 11',
      description: 'Alcohol by volume — required disclosure in many regions.',
    },
    {
      name: 'caffeine_mg',
      type: 'number',
      placeholder: 'mg per serving',
    },
    { name: 'is_carbonated', type: 'toggle' },

    // ── Dietary ──────────────────────────────────────────────────
    { name: 'is_sugar_free', type: 'toggle' },
    {
      name: 'is_vegan',
      type: 'toggle',
      description: 'Some milk-based or honey-sweetened drinks aren’t vegan.',
    },
    { name: 'is_dairy_free', type: 'toggle' },
    {
      name: 'allergens',
      type: 'multi_select',
      options: [
        'dairy',
        'eggs',
        'soy',
        'tree nuts',
        'peanuts',
        'sulphites',
        'gluten',
        'sesame',
      ],
    },
    {
      name: 'calories',
      type: 'number',
      placeholder: 'kcal per serving',
    },

    // ── Sourcing & preparation ───────────────────────────────────
    {
      name: 'ingredients',
      type: 'tags',
      isSearchable: true,
      description: 'Customer-friendly ingredient list. For cocktails, the spec.',
    },
    {
      name: 'origin',
      type: 'text',
      placeholder: 'e.g. Ethiopia, Tuscany, Single Estate',
      description: 'Geographic origin — for coffee, wine, tea, single-origin specialty drinks.',
    },
    {
      name: 'brewing_method',
      type: 'select',
      options: [
        'Espresso',
        'Drip',
        'French Press',
        'Pour Over',
        'Cold Brew',
        'Aeropress',
        'Moka',
        'Tea infusion',
        'Shaken',
        'Stirred',
        'Built',
        'Blended',
        'Tap',
        'Bottle',
        'Can',
      ],
      description: 'How it’s made — relevant for coffee programs and craft cocktail menus.',
    },
    {
      name: 'vintage',
      type: 'text',
      placeholder: 'e.g. 2019',
      description: 'Wine vintage / year (where applicable).',
    },

    // ── Availability ─────────────────────────────────────────────
    {
      name: 'in_stock',
      type: 'toggle',
      defaultValue: true,
      description: 'Off when the keg blows, the bottle’s sold out, or the supplier missed delivery.',
    },
    {
      name: 'available_until',
      type: 'time',
      description: 'Last orderable time of day. Leave blank if always available.',
    },
    {
      name: 'daily_special',
      type: 'toggle',
      description: 'Highlights the drink in chat with a Daily Special badge.',
    },
    {
      name: 'bartender_pick',
      type: 'toggle',
      description: 'Highlights the drink in chat with a Bartender’s Pick badge.',
    },

    // ── Marketing ────────────────────────────────────────────────
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form tags for filtering — refreshing, signature, classic, seasonal.',
    },
    {
      name: 'food_pairing',
      type: 'text',
      placeholder: 'e.g. Pairs well with seafood',
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

export default beverage;
