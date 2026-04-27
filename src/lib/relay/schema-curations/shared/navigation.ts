// ── Curated schema: shared_navigation ───────────────────────────────
//
// Cross-vertical navigation surfaces — quick action buttons, contact
// cards, footer links, header items. Each item describes one
// navigation entry: what it says, where it goes, when it shows.

import type { CuratedSchema } from '../types';

const navigation: CuratedSchema = {
  name: 'Navigation',
  description:
    'Quick actions, contact cards, footer links — the buttons and links customers see in chat.',
  contentCategory: 'about',
  itemLabel: 'Navigation entry',
  itemLabelPlural: 'Navigation entries',
  defaultCurrency: 'USD',
  fields: [
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Quick actions, Contact card, Footer links',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Short note about this navigation surface.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Quick Actions',
        'Contact Card',
        'Footer',
        'Header',
        'Sidebar',
        'Hero',
        'Action Bar',
        'Card Footer',
      ],
      showInList: true,
      showInCard: true,
    },

    // Action set
    {
      name: 'actions',
      type: 'tags',
      description:
        'Action labels — "Menu", "Reserve", "Order", "Find us". Each becomes a button. For Quick Actions and Footer.',
    },
    {
      name: 'primary_action_label',
      type: 'text',
      placeholder: 'e.g. Reserve a table',
    },
    {
      name: 'primary_action_url',
      type: 'url',
    },
    {
      name: 'secondary_action_label',
      type: 'text',
    },
    {
      name: 'secondary_action_url',
      type: 'url',
    },

    // Contact card fields
    { name: 'phone', type: 'phone' },
    { name: 'whatsapp', type: 'phone' },
    { name: 'email', type: 'email' },
    { name: 'website', type: 'url' },
    {
      name: 'address',
      type: 'textarea',
      placeholder: 'For Contact Card category.',
    },

    // Visual
    {
      name: 'icon',
      type: 'text',
      placeholder: 'Lucide icon name or emoji.',
      description: 'Icon shown next to the entry.',
    },
    {
      name: 'image_url',
      type: 'image',
    },

    // Behavior
    {
      name: 'target',
      type: 'select',
      options: ['Internal', 'External', 'Deep link', 'Mailto', 'Tel', 'WhatsApp'],
      description: 'How the link opens.',
    },
    {
      name: 'show_when',
      type: 'multi_select',
      options: [
        'Always',
        'On chat open',
        'On idle',
        'On end of conversation',
        'After purchase',
        'On error',
      ],
    },
    {
      name: 'order_priority',
      type: 'number',
      description: 'Lower numbers render first when multiple entries are visible.',
    },
    {
      name: 'open_in_new_tab',
      type: 'toggle',
    },

    // Marketing meta
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin to the top of the navigation list.',
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

export default navigation;
