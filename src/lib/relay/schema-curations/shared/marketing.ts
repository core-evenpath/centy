// ── Curated schema: shared_marketing ────────────────────────────────
//
// Cross-vertical promotional content — brand stories, hero
// promotions, loyalty programs, announcements. Distinct from
// vertical-specific marketing schemas (e.g. food_beverage_marketing)
// because every vertical's partner uses the same surface for
// "headline message of the moment".

import type { CuratedSchema } from '../types';

const marketing: CuratedSchema = {
  name: 'Brand & Promotions',
  description:
    'Cross-vertical brand messaging — hero stories, featured promotions, loyalty programs, announcements.',
  contentCategory: 'offers',
  itemLabel: 'Promotion',
  itemLabelPlural: 'Promotions',
  defaultCurrency: 'USD',
  fields: [
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Brand Story, Featured Promotion, Loyalty Program',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Body copy customers see in chat.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Brand Story',
        'Featured Promotion',
        'Loyalty Program',
        'Hero Banner',
        'Announcement',
        'New Arrival',
        'Limited Time',
        'Referral',
        'Membership',
      ],
      showInList: true,
      showInCard: true,
    },
    {
      name: 'headline',
      type: 'text',
      showInCard: true,
      placeholder: 'One-line hook surfaced in chat.',
      description: 'Promo block reads this as the primary headline.',
    },
    {
      name: 'subhead',
      type: 'text',
      placeholder: 'Optional supporting line under the headline.',
    },

    // Offer mechanics (when applicable)
    {
      name: 'discount_code',
      type: 'text',
      placeholder: 'Code customers enter at checkout.',
    },
    {
      name: 'discount_percent',
      type: 'number',
      validation: { min: 0, max: 100 },
    },
    {
      name: 'discount_amount',
      type: 'currency',
    },
    {
      name: 'minimum_spend',
      type: 'currency',
    },

    // Validity
    {
      name: 'valid_from',
      type: 'date',
    },
    {
      name: 'expires_at',
      type: 'date',
      description: 'Promo block reads this for countdowns.',
    },
    {
      name: 'valid_days',
      type: 'multi_select',
      options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },

    // Targeting
    {
      name: 'audience',
      type: 'multi_select',
      options: ['All customers', 'New customers', 'Loyalty members', 'VIP', 'Returning'],
    },

    // CTA
    {
      name: 'cta_label',
      type: 'text',
      placeholder: 'e.g. Learn more, Claim now',
    },
    {
      name: 'cta_url',
      type: 'url',
      placeholder: 'https://…',
    },

    // Marketing meta
    {
      name: 'urgency',
      type: 'select',
      options: ['Low', 'Medium', 'High', 'Critical'],
    },
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin to the top in chat.',
    },
    {
      name: 'tags',
      type: 'tags',
    },
    {
      name: 'terms',
      type: 'textarea',
      description: 'Fine print — exclusions, conditions.',
    },

    // Internal
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default marketing;
