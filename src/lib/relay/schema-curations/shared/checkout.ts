// ── Curated schema: shared_checkout ─────────────────────────────────
//
// Cart-to-payment flows. Each item describes one checkout option —
// "Pay at table", "Online checkout", "Apple Pay", "Account / tab",
// etc. Cross-vertical because every partner needs a way to take
// money and the same payment-method fields apply everywhere.

import type { CuratedSchema } from '../types';

const checkout: CuratedSchema = {
  name: 'Checkout & Payment',
  description:
    'Payment methods, cart flows, tip prompts, receipts — the cart-to-payment surface every partner needs.',
  contentCategory: 'operations',
  itemLabel: 'Checkout option',
  itemLabelPlural: 'Checkout options',
  defaultCurrency: 'USD',
  fields: [
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Pay at table, Online checkout, Apple Pay',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'Customer-facing detail about how this works.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Payment Method',
        'Cart Flow',
        'Tip Prompt',
        'Receipt',
        'Refund Flow',
        'Split Bill',
        'Group Pay',
      ],
      showInList: true,
      showInCard: true,
    },

    // Methods
    {
      name: 'accepted_methods',
      type: 'multi_select',
      options: [
        'Cash',
        'Card',
        'Apple Pay',
        'Google Pay',
        'PayPal',
        'Venmo',
        'Crypto',
        'Gift Card',
        'Account / Tab',
        'Bank Transfer',
        'Buy Now Pay Later',
      ],
    },
    {
      name: 'secure_provider',
      type: 'text',
      placeholder: 'e.g. Stripe, Square, Adyen',
      description: 'Underlying payment processor — disclosed to customers for trust.',
    },

    // Limits
    { name: 'minimum_amount', type: 'currency' },
    { name: 'maximum_amount', type: 'currency' },

    // Fees
    {
      name: 'service_fee',
      type: 'currency',
      description: 'Flat service fee added to the order.',
    },
    {
      name: 'service_fee_percent',
      type: 'number',
      validation: { min: 0, max: 100 },
      description: 'Percentage service fee.',
    },
    {
      name: 'processing_fee',
      type: 'currency',
      description: 'Card-processing fee passed to the customer (where legal).',
    },

    // Tipping
    {
      name: 'tip_options',
      type: 'tags',
      description: 'Suggested tip percentages — "15%, 18%, 20%, custom".',
    },
    {
      name: 'tip_default',
      type: 'number',
      validation: { min: 0, max: 100 },
      description: 'Default suggested tip percentage.',
    },
    { name: 'tip_optional', type: 'toggle', defaultValue: true },

    // Features
    { name: 'requires_signature', type: 'toggle' },
    { name: 'requires_billing_address', type: 'toggle' },
    {
      name: 'saves_card',
      type: 'toggle',
      description: 'Customer can save the card for future orders.',
    },
    { name: 'contactless', type: 'toggle' },
    { name: 'split_supported', type: 'toggle' },
    { name: 'group_pay_supported', type: 'toggle' },
    {
      name: 'pre_auth_required',
      type: 'toggle',
      description: 'Pre-authorize the card at order time, capture later.',
    },

    // Compliance
    {
      name: 'pci_compliant',
      type: 'toggle',
      description: 'PCI-DSS compliant for card storage.',
    },
    {
      name: 'terms_url',
      type: 'url',
      placeholder: 'Link to terms & conditions for this payment method.',
    },
    {
      name: 'privacy_url',
      type: 'url',
    },

    // Marketing
    {
      name: 'featured',
      type: 'toggle',
      description: 'Pin to the top of the payment-method list.',
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

export default checkout;
