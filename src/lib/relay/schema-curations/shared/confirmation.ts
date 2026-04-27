// ── Curated schema: shared_confirmation ─────────────────────────────
//
// Booking / order / cancellation / refund confirmations sent to
// customers across channels (SMS, Email, In-app, WhatsApp). Each
// item describes one confirmation TYPE — its template, channel mix,
// timing, and what extras (QR, calendar invite, directions) ride
// with it.

import type { CuratedSchema } from '../types';

const confirmation: CuratedSchema = {
  name: 'Confirmations',
  description:
    'Booking / order / cancellation messages sent to customers across SMS, Email, In-app, WhatsApp.',
  contentCategory: 'operations',
  itemLabel: 'Confirmation',
  itemLabelPlural: 'Confirmations',
  defaultCurrency: 'USD',
  fields: [
    {
      name: 'name',
      type: 'text',
      isRequired: true,
      isSearchable: true,
      showInList: true,
      showInCard: true,
      placeholder: 'e.g. Booking Confirmation, Order Confirmation, Cancellation Notice',
    },
    {
      name: 'description',
      type: 'textarea',
      isSearchable: true,
      showInCard: true,
      placeholder: 'When and why this confirmation is sent.',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        'Booking',
        'Order',
        'Pickup',
        'Delivery',
        'Cancellation',
        'Refund',
        'Reminder',
        'Receipt',
        'Waitlist',
      ],
      showInList: true,
      showInCard: true,
    },

    // Channels
    {
      name: 'channels',
      type: 'multi_select',
      options: ['SMS', 'Email', 'In-app', 'WhatsApp', 'Push notification', 'Voice call'],
      description: 'Where this confirmation is delivered.',
    },

    // Template
    {
      name: 'subject_line',
      type: 'text',
      placeholder: 'For email channels — keep under 60 chars.',
    },
    {
      name: 'body_template',
      type: 'textarea',
      placeholder: 'Template body — supports {{customer_name}}, {{date}}, {{time}} placeholders.',
      description: 'The message template. Variables in double braces are substituted at send time.',
    },
    {
      name: 'sms_template',
      type: 'textarea',
      placeholder: 'Shorter SMS-specific copy if your default is email-length.',
      description: 'Optional SMS-specific override (160-char-friendly).',
    },

    // CTA
    {
      name: 'cta_label',
      type: 'text',
      placeholder: 'e.g. View booking, Track order',
    },
    {
      name: 'cta_url',
      type: 'url',
    },

    // Extras
    { name: 'includes_qr_code', type: 'toggle', description: 'QR code for in-venue scan-in.' },
    { name: 'includes_calendar_invite', type: 'toggle' },
    { name: 'includes_directions', type: 'toggle' },
    { name: 'includes_receipt', type: 'toggle' },
    {
      name: 'includes_cancellation_link',
      type: 'toggle',
      description: 'One-click cancellation link.',
    },

    // Timing
    {
      name: 'send_immediately',
      type: 'toggle',
      defaultValue: true,
    },
    {
      name: 'send_delay_minutes',
      type: 'number',
      description: 'Send N minutes after the trigger event. Useful for follow-ups.',
    },
    {
      name: 'reminder_offset_hours',
      type: 'number',
      placeholder: 'e.g. 24',
      description: 'For reminders: send N hours before the event.',
    },

    // Compliance
    {
      name: 'requires_opt_in',
      type: 'toggle',
      description: 'Channel requires the customer to have opted in.',
    },
    {
      name: 'gdpr_compliant',
      type: 'toggle',
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

export default confirmation;
