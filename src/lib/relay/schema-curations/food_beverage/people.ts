// ── Curated schema: food_beverage_people ────────────────────────────
//
// Chefs, sous chefs, pastry, sommeliers, bartenders, managers, FOH,
// owners — anyone customers might meet, ask about, or want to read
// a story about. Schema covers identity, role + expertise,
// credentials, personal touches (favourite dish, hometown), social
// links, and internal HR fields kept off the customer-facing card.

import type { CuratedSchema } from '../types';

const people: CuratedSchema = {
  name: 'Team',
  description: 'Chefs, sommeliers, bartenders, and front-of-house staff customers might meet.',
  contentCategory: 'about',
  itemLabel: 'Team member',
  itemLabelPlural: 'Team members',
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
      placeholder: 'e.g. Marco Rossi',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Short bio — paragraph form.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Chef',
        'Sous Chef',
        'Pastry',
        'Sommelier',
        'Bartender',
        'Mixologist',
        'Manager',
        'General Manager',
        'Owner',
        'Host',
        'Server',
        'Maitre d',
        'Barista',
        'Other',
      ],
      showInList: true,
      showInCard: true,
    },

    // ── Role & expertise ─────────────────────────────────────────
    {
      name: 'role',
      type: 'text',
      placeholder: 'e.g. Executive Chef, Wine Director',
      showInCard: true,
      description: 'Job title — more specific than category.',
    },
    {
      name: 'specialty',
      type: 'text',
      placeholder: 'e.g. Modern Italian, Burgundy wines, classic cocktails',
      isSearchable: true,
    },
    { name: 'years_experience', type: 'number' },
    {
      name: 'pronouns',
      type: 'text',
      placeholder: 'e.g. she/her, they/them',
    },
    {
      name: 'bio_short',
      type: 'text',
      placeholder: 'One-line tagline shown on the card.',
      showInCard: true,
    },

    // ── Credentials ──────────────────────────────────────────────
    {
      name: 'certifications',
      type: 'tags',
      description:
        'Professional certifications — Court of Master Sommeliers, ServSafe, WSET, etc.',
    },
    {
      name: 'awards',
      type: 'tags',
      description: 'Awards and recognition — "Pastry Chef of the Year 2023".',
    },
    {
      name: 'training',
      type: 'text',
      placeholder: 'e.g. Le Cordon Bleu Paris, ICE New York',
    },
    {
      name: 'previous_employers',
      type: 'tags',
      description: 'Notable past restaurants or companies.',
    },
    {
      name: 'languages',
      type: 'tags',
      description: 'Languages spoken — drives multilingual chat routing when customers ask in non-English.',
    },

    // ── Personal touches ─────────────────────────────────────────
    {
      name: 'favorite_dish',
      type: 'text',
      placeholder: 'e.g. Truffle Risotto',
      description: 'Their pick from the menu — friendly conversation hook.',
    },
    { name: 'signature_drink', type: 'text' },
    { name: 'hometown', type: 'text' },
    {
      name: 'joined_year',
      type: 'number',
      description: 'Year they joined the team.',
    },

    // ── Social links ─────────────────────────────────────────────
    { name: 'instagram', type: 'url' },
    { name: 'linkedin', type: 'url' },
    { name: 'personal_website', type: 'url' },

    // ── Marketing ────────────────────────────────────────────────
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin to the top of the team list in chat.',
    },
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form — leadership, kitchen, FOH, mentor.',
    },

    // ── Internal (HR / scheduling, not shown to customers) ───────
    {
      name: 'email',
      type: 'email',
      description: 'Internal contact — not shown to customers.',
    },
    {
      name: 'phone',
      type: 'phone',
      description: 'Internal contact — not shown to customers.',
    },
    {
      name: 'start_date',
      type: 'date',
      description: 'When they joined.',
    },
    {
      name: 'shift_pattern',
      type: 'text',
      placeholder: 'e.g. Tue-Sat dinners',
      description: 'Internal scheduling note.',
    },
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default people;
