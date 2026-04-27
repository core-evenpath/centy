// ── Curated schema: shared_conversation ─────────────────────────────
//
// Chat conversation fragments — greetings, smart nudges, quick
// replies, helper text, fallbacks. Cross-vertical because every
// partner's chat has the same building blocks regardless of
// industry.

import type { CuratedSchema } from '../types';

const conversation: CuratedSchema = {
  name: 'Conversation',
  description:
    'Chat fragments — greetings, smart nudges, quick replies, fallback messages.',
  contentCategory: 'about',
  itemLabel: 'Conversation card',
  itemLabelPlural: 'Conversation cards',
  defaultCurrency: 'USD',
  fields: [
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Welcome message, Smart nudge, Quick replies',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Internal note about when this fires.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Greeting',
        'Welcome',
        'Smart Nudge',
        'Quick Replies',
        'Suggestion Chips',
        'Help',
        'Fallback',
        'Error',
        'Goodbye',
        'Re-engagement',
      ],
      showInList: true,
      showInCard: true,
    },

    // The actual content
    {
      name: 'headline',
      type: 'text',
      showInCard: true,
      placeholder: 'Greeting / nudge headline.',
      description: 'Greeting block reads this.',
    },
    {
      name: 'body_text',
      type: 'textarea',
      showInCard: true,
      placeholder: 'Body copy shown in chat.',
    },
    {
      name: 'subhead',
      type: 'text',
      placeholder: 'Optional supporting line.',
    },
    {
      name: 'emoji',
      type: 'text',
      placeholder: 'e.g. 👋, 🍕',
      description: 'Single emoji surfaced inline with the message.',
    },

    // For quick-replies / suggestions
    {
      name: 'replies',
      type: 'tags',
      description:
        'Tappable reply options — for Quick Replies / Suggestion Chips. Each tag becomes a button.',
    },

    // Trigger / timing
    {
      name: 'trigger',
      type: 'select',
      options: [
        'On chat open',
        'After idle',
        'On error',
        'On end of conversation',
        'Manual',
        'Time of day',
        'After purchase',
      ],
    },
    {
      name: 'delay_seconds',
      type: 'number',
      description: 'How long to wait after trigger before showing.',
    },
    {
      name: 'show_only_once',
      type: 'toggle',
      description: 'Hide after the customer dismisses or interacts once.',
    },

    // Targeting
    {
      name: 'audience',
      type: 'multi_select',
      options: ['All customers', 'New customers', 'Returning', 'Loyalty members', 'VIP'],
    },
    {
      name: 'time_of_day',
      type: 'select',
      options: ['Morning', 'Afternoon', 'Evening', 'Late night', 'Any'],
      description: 'Limit the message to a part of day. Useful for "Good morning" greetings.',
    },

    // CTA (optional)
    {
      name: 'cta_label',
      type: 'text',
      placeholder: 'Optional button copy.',
    },
    {
      name: 'cta_url',
      type: 'url',
    },

    // Marketing meta
    {
      name: 'featured',
      type: 'toggle',
    },
    {
      name: 'tags',
      type: 'tags',
    },

    // Internal
    {
      name: 'notes',
      type: 'textarea',
      description: 'Internal notes for staff. Not shown to customers.',
    },
  ],
};

export default conversation;
