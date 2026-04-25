// ── Flow definitions (PR fix-13) ────────────────────────────────────
//
// `/admin/relay/engine` was a flat catalog grid masquerading as a
// pipeline. PR fix-13 reframes it as five **transaction flows** so the
// page actually answers "what happens when a user buys / books / leads
// / engages / asks?". The catalog still exists below, but this
// declarative layer drives the new UX:
//
//   1. Narrative   — 2-3 sentence description of the journey
//   2. Happy path  — required + optional block sequence with arrows
//   3. Chat example — sample messages keyed to which block fires
//
// Engine slugs (booking / commerce / lead / engagement / info) are
// preserved for backwards-compat with existing tab routing — only the
// LABELS change at the UX layer ("Booking" → "Booking", but
// "Commerce" → "Buying" and "Engagement" → "Engaging" so the verb
// matches the user's question).

import type { Engine } from '@/lib/relay/engine-types';

export type FlowRole = 'entry' | 'core' | 'exit';

export interface FlowStep {
  /** Block id from the registry (`_registry-data.ts`). Verified at
   *  render time — unknown ids render as a placeholder card. */
  blockId: string;
  /** Where in the journey this block sits. Drives column heading. */
  role: FlowRole;
  /** Required steps render with a solid border + shipping ribbon.
   *  Optional steps render dimmed with a dashed border. */
  required: boolean;
  /** One-line "why this block fires here". Shown under the tile. */
  why: string;
}

export type ChatTurn =
  | { from: 'user'; text: string }
  | {
      from: 'bot';
      /** What the bot says alongside the block. */
      text: string;
      /** The block that renders for this bot turn. Optional — some
       *  bot turns are pure text (no block). */
      blockId?: string;
    };

export interface FlowDefinition {
  /** Maps to the existing Engine slug for backwards compat. */
  engine: Engine;
  /** User-facing verb. Different from engine slug for some flows
   *  (e.g. engine='commerce' → label='Buying'). */
  label: string;
  /** One-word aria/url-friendly slug. */
  slug: 'buying' | 'booking' | 'lead' | 'engaging' | 'info';
  emoji: string;
  /** 2-3 sentences explaining the journey in plain English. Shown at
   *  the top of the tab. The whole point of this PR. */
  narrative: string;
  /** Happy-path block sequence, left to right. Arrows between
   *  required steps; optional steps dim. */
  happyPath: FlowStep[];
  /** Sample chat that walks through the happy path. Each bot turn
   *  may key to a blockId so the UI can highlight the matching tile
   *  in the strip when the admin hovers a turn. */
  chatExample: ChatTurn[];
  /** Background tint for the flow card. Each flow gets its own hue
   *  so the page stops looking like five identical tabs. */
  accent: {
    bg: string;
    border: string;
    text: string;
  };
}

const ACCENTS = {
  emerald: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
  blue:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  violet:  { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  rose:    { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' },
  slate:   { bg: '#f8fafc', border: '#e2e8f0', text: '#334155' },
} as const;

export const FLOW_DEFINITIONS: FlowDefinition[] = [
  // ── Buying (commerce engine) ────────────────────────────────────
  {
    engine: 'commerce',
    label: 'Buying',
    slug: 'buying',
    emoji: '🛒',
    narrative:
      'A shopper asks about products, narrows down to one, and pays. The bot surfaces the catalog, helps compare options, drops items into a cart, and confirms the order. Everything from "show me hoodies" to "your order shipped" happens here.',
    happyPath: [
      {
        blockId: 'greeting',
        role: 'entry',
        required: false,
        why: 'Welcomes the shopper and sets brand tone before they ask.',
      },
      {
        blockId: 'product_card',
        role: 'core',
        required: true,
        why: 'Surfaces matching products as scrollable tiles.',
      },
      {
        blockId: 'product_detail',
        role: 'core',
        required: false,
        why: 'Deep-dive on one product when shopper taps in.',
      },
      {
        blockId: 'compare',
        role: 'core',
        required: false,
        why: 'Side-by-side when shopper says "what\'s the difference?"',
      },
      {
        blockId: 'cart',
        role: 'core',
        required: true,
        why: 'Holds items + subtotal; drives the checkout CTA.',
      },
      {
        blockId: 'order_confirmation',
        role: 'exit',
        required: true,
        why: 'Receipt with order ID + delivery info — closes the loop.',
      },
      {
        blockId: 'order_tracker',
        role: 'exit',
        required: false,
        why: 'Returning shopper asking "where is my order?" reuses this.',
      },
    ],
    chatExample: [
      { from: 'user', text: 'Hi! Looking for a navy hoodie under $80' },
      {
        from: 'bot',
        text: 'Here are 3 navy hoodies in your range:',
        blockId: 'product_card',
      },
      { from: 'user', text: 'Tell me more about the second one' },
      {
        from: 'bot',
        text: 'Heavyweight cotton, runs true to size:',
        blockId: 'product_detail',
      },
      { from: 'user', text: 'Add it in size M' },
      {
        from: 'bot',
        text: 'Added. Ready to check out?',
        blockId: 'cart',
      },
      { from: 'user', text: 'Yes, paying with the card on file' },
      {
        from: 'bot',
        text: 'Order #4827 placed — shipping Wednesday:',
        blockId: 'order_confirmation',
      },
    ],
    accent: ACCENTS.emerald,
  },

  // ── Booking ─────────────────────────────────────────────────────
  {
    engine: 'booking',
    label: 'Booking',
    slug: 'booking',
    emoji: '📅',
    narrative:
      'A user picks a slot — a service, a session, a venue. The bot shows what\'s available, walks through date/time selection, and sends a confirmation with a reminder. Anything that\'s "schedule X for Y" lives here.',
    happyPath: [
      {
        blockId: 'greeting',
        role: 'entry',
        required: false,
        why: 'Quick welcome — most booking flows are returning users.',
      },
      {
        blockId: 'service_package',
        role: 'core',
        required: true,
        why: 'What is the user booking? List of services with duration + price.',
      },
      {
        blockId: 'auto_service_scheduler',
        role: 'core',
        required: true,
        why: 'Date strip + time grid — the actual slot picker.',
      },
      {
        blockId: 'booking_confirmation',
        role: 'exit',
        required: true,
        why: 'Reference number + add-to-calendar; reminder fires later.',
      },
      {
        blockId: 'contact',
        role: 'exit',
        required: false,
        why: 'Human handoff if anything goes sideways post-confirmation.',
      },
    ],
    chatExample: [
      { from: 'user', text: 'Need to book my car for an oil change' },
      {
        from: 'bot',
        text: 'Here are the service packages we run:',
        blockId: 'service_package',
      },
      { from: 'user', text: 'The standard one — Saturday morning if possible' },
      {
        from: 'bot',
        text: 'Sat 9–11am has 4 slots open:',
        blockId: 'auto_service_scheduler',
      },
      { from: 'user', text: '10am please' },
      {
        from: 'bot',
        text: 'Booked — see you Saturday:',
        blockId: 'booking_confirmation',
      },
    ],
    accent: ACCENTS.blue,
  },

  // ── Lead ────────────────────────────────────────────────────────
  {
    engine: 'lead',
    label: 'Lead',
    slug: 'lead',
    emoji: '🎯',
    narrative:
      'A prospect lands curious. The bot qualifies them, surfaces relevant expertise, and either books a call or collects the documents the sales team needs. Output is a hot handoff: a calendared meeting or a packet of paperwork.',
    happyPath: [
      {
        blockId: 'greeting',
        role: 'entry',
        required: false,
        why: 'Sets a professional tone before qualification questions.',
      },
      {
        blockId: 'expert_profile',
        role: 'core',
        required: true,
        why: 'Builds trust — who would the prospect actually work with?',
      },
      {
        blockId: 'case_study',
        role: 'core',
        required: false,
        why: 'Proof: similar engagements + outcome metrics.',
      },
      {
        blockId: 'consultation_booking',
        role: 'core',
        required: true,
        why: 'Discovery-call scheduler — the conversion event for Lead.',
      },
      {
        blockId: 'document_collector',
        role: 'exit',
        required: false,
        why: 'Once committed, gather the docs sales needs upfront.',
      },
      {
        blockId: 'engagement_timeline',
        role: 'exit',
        required: false,
        why: 'Show what happens after the call so prospect stays warm.',
      },
    ],
    chatExample: [
      { from: 'user', text: 'Looking for a fractional CFO for a Series A startup' },
      {
        from: 'bot',
        text: 'You\'d work with one of these advisors:',
        blockId: 'expert_profile',
      },
      { from: 'user', text: 'Have you done this for fintech?' },
      {
        from: 'bot',
        text: '4 fintech engagements in the last 18 months:',
        blockId: 'case_study',
      },
      { from: 'user', text: 'Let\'s talk' },
      {
        from: 'bot',
        text: 'Pick a 30-min slot:',
        blockId: 'consultation_booking',
      },
      { from: 'user', text: 'Tomorrow 3pm' },
      {
        from: 'bot',
        text: 'Confirmed. To prep, send these:',
        blockId: 'document_collector',
      },
    ],
    accent: ACCENTS.violet,
  },

  // ── Engaging (engagement engine) ────────────────────────────────
  {
    engine: 'engagement',
    label: 'Engaging',
    slug: 'engaging',
    emoji: '💬',
    narrative:
      'No transaction yet — the user is browsing, returning, or being re-activated. The bot keeps things warm with suggestions, nudges, promos, and loyalty rewards. Goal is to keep the conversation alive until a buy/book/lead intent surfaces.',
    happyPath: [
      {
        blockId: 'greeting',
        role: 'entry',
        required: true,
        why: 'Every engagement flow starts with a friendly hello.',
      },
      {
        blockId: 'suggestions',
        role: 'core',
        required: true,
        why: 'Tappable chips guide the user toward an intent.',
      },
      {
        blockId: 'promo',
        role: 'core',
        required: false,
        why: 'Time-limited offer — converts browsers into buyers.',
      },
      {
        blockId: 'nudge',
        role: 'core',
        required: false,
        why: 'Contextual tip ("you left items in cart") to re-engage.',
      },
      {
        blockId: 'loyalty',
        role: 'exit',
        required: false,
        why: 'Returning user check-in — points balance, tier rewards.',
      },
    ],
    chatExample: [
      { from: 'user', text: 'Hey' },
      {
        from: 'bot',
        text: 'Welcome back, Priya 👋',
        blockId: 'greeting',
      },
      {
        from: 'bot',
        text: 'What can I help with today?',
        blockId: 'suggestions',
      },
      { from: 'user', text: '(taps "Browse new arrivals")' },
      {
        from: 'bot',
        text: 'Heads up — your cart is waiting:',
        blockId: 'nudge',
      },
      {
        from: 'bot',
        text: 'You also have 240 points expiring this month:',
        blockId: 'loyalty',
      },
    ],
    accent: ACCENTS.rose,
  },

  // ── Info ────────────────────────────────────────────────────────
  {
    engine: 'info',
    label: 'Info',
    slug: 'info',
    emoji: 'ℹ️',
    narrative:
      'A user has a question. The bot answers it from the knowledge base, suggests related questions, and hands off to a human if it can\'t. No transaction here — just clear answers, ideally before a support ticket gets opened.',
    happyPath: [
      {
        blockId: 'greeting',
        role: 'entry',
        required: false,
        why: 'Optional — frequent-asker flows often skip the greeting.',
      },
      {
        blockId: 'suggestions',
        role: 'core',
        required: true,
        why: 'Common questions as tappable chips — covers 80% of asks.',
      },
      {
        blockId: 'facility',
        role: 'core',
        required: false,
        why: 'Specific info block — campus, hours, location, etc.',
      },
      {
        blockId: 'contact',
        role: 'exit',
        required: true,
        why: 'When the bot can\'t answer, route to a human.',
      },
    ],
    chatExample: [
      { from: 'user', text: 'What time are you open on Sundays?' },
      {
        from: 'bot',
        text: 'Sundays we run 10am–4pm. Anything else?',
        blockId: 'suggestions',
      },
      { from: 'user', text: 'Where are you located?' },
      {
        from: 'bot',
        text: 'Main campus + 2 satellite locations:',
        blockId: 'facility',
      },
      { from: 'user', text: 'I need to talk to someone' },
      {
        from: 'bot',
        text: 'Reach our team directly:',
        blockId: 'contact',
      },
    ],
    accent: ACCENTS.slate,
  },
];

export function getFlowByEngine(engine: Engine): FlowDefinition | undefined {
  return FLOW_DEFINITIONS.find((f) => f.engine === engine);
}
