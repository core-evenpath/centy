// ── Curated schema: food_beverage_social_proof ──────────────────────
//
// Customer reviews, testimonials, press mentions, awards. Schema
// supports cross-platform reviews (Yelp / Google / OpenTable /
// TripAdvisor / Resy / press) with source-specific metadata,
// reviewer info, engagement signals, partner responses, and the
// content-mention tags that boost RAG relevance.

import type { CuratedSchema } from '../types';

const socialProof: CuratedSchema = {
  name: 'Reviews & Testimonials',
  description:
    'What customers and the press are saying — Yelp, Google, OpenTable, TripAdvisor, awards, and direct testimonials.',
  contentCategory: 'about',
  itemLabel: 'Review',
  itemLabelPlural: 'Reviews',
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
      placeholder: 'e.g. Sarah K., Michael R.',
      description: 'The reviewer’s name as it should appear in chat.',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'The full review text — quotes optional.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Yelp',
        'Google',
        'OpenTable',
        'TripAdvisor',
        'Resy',
        'Facebook',
        'Instagram',
        'Direct',
        'Email',
        'Press',
        'Award',
        'Blog',
        'Magazine',
        'Podcast',
      ],
      showInList: true,
      showInCard: true,
      description: 'Where the review came from.',
    },

    // ── Review meat ──────────────────────────────────────────────
    {
      name: 'rating',
      type: 'number',
      placeholder: '1-5',
      validation: { min: 1, max: 5 },
      showInCard: true,
      description: 'Star rating out of 5. Leave blank for press mentions / awards.',
    },
    {
      name: 'review_title',
      type: 'text',
      placeholder: 'Short headline if the source provides one',
    },
    { name: 'review_date', type: 'date' },
    {
      name: 'visit_date',
      type: 'date',
      description: 'When the reviewer actually visited — sometimes earlier than the review date.',
    },

    // ── Source ───────────────────────────────────────────────────
    {
      name: 'source_url',
      type: 'url',
      placeholder: 'Link to the original review',
    },
    {
      name: 'verified',
      type: 'toggle',
      description: 'Verified purchase or verified visit on the source platform.',
    },

    // ── Reviewer ─────────────────────────────────────────────────
    {
      name: 'reviewer_location',
      type: 'text',
      placeholder: 'e.g. San Francisco, CA',
    },
    {
      name: 'reviewer_avatar_url',
      type: 'url',
      description: 'Optional headshot or platform avatar URL.',
    },
    {
      name: 'elite_member',
      type: 'toggle',
      description: 'Yelp Elite, TripAdvisor Top Contributor, OpenTable VIP, etc.',
    },

    // ── Engagement ───────────────────────────────────────────────
    {
      name: 'helpful_count',
      type: 'number',
      description: 'Upvotes / "found helpful" count from the source platform.',
    },
    {
      name: 'response_text',
      type: 'textarea',
      placeholder: 'Your public reply to the review',
      description: 'Visible to customers in chat — keep it gracious.',
    },
    { name: 'response_date', type: 'date' },

    // ── What was reviewed ────────────────────────────────────────
    {
      name: 'mentioned_dishes',
      type: 'tags',
      isSearchable: true,
      description: 'Dish names called out in the review — boosts search relevance.',
    },
    {
      name: 'mentioned_staff',
      type: 'tags',
      description: 'Staff members named in the review — useful for routing kudos.',
    },
    {
      name: 'occasion',
      type: 'select',
      options: [
        'Date night',
        'Anniversary',
        'Birthday',
        'Business',
        'Family',
        'Casual',
        'Solo',
        'Group',
        'Wedding',
        'Other',
      ],
    },

    // ── Marketing meta ───────────────────────────────────────────
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin this review to the top of the list in chat.',
    },
    {
      name: 'sentiment',
      type: 'select',
      options: ['Very positive', 'Positive', 'Neutral', 'Negative', 'Very negative'],
      description: 'Coarse sentiment — drives whether chat surfaces it as a positive lead.',
    },
    {
      name: 'tags',
      type: 'tags',
      description: 'Free-form — food, service, ambience, value, vibe.',
    },

    // ── Internal ─────────────────────────────────────────────────
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default socialProof;
