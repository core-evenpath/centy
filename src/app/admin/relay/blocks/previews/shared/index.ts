'use client';

import React from 'react';
import { T, I, Tag } from '../_theme';
import { ic } from '../_icons';
import type { VerticalBlockDef } from '../_types';

// ── Mini Preview Components ─────────────────────────────────────────

function MiniGreeting() {
  const h = React.createElement;
  return h('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 10 } },
    h('div', { style: { textAlign: 'center' as const } },
      h('div', { style: { fontSize: 18, marginBottom: 4 } }, '\u{1F44B}'),
      h('div', { style: { fontSize: 11, fontWeight: 600, color: T.t1, marginBottom: 2 } }, 'Welcome to our store'),
      h('div', { style: { fontSize: 8, color: T.t3, marginBottom: 8 } }, 'How can we help?'),
      h('div', { style: { display: 'flex', gap: 4, justifyContent: 'center' } },
        ...['Browse', 'Help', 'Track'].map(l =>
          h('div', { key: l, style: { fontSize: 7, fontWeight: 500, color: T.pri, background: T.priBg, padding: '3px 8px', borderRadius: 4 } }, l)
        )
      )
    )
  );
}

function MiniSuggestions() {
  const h = React.createElement;
  return h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap' as const } },
    ...['Browse Products', 'Get Help', 'Track Order', 'Contact Us'].map(l =>
      h('div', { key: l, style: { fontSize: 7, fontWeight: 500, color: T.pri, border: `1px solid ${T.priBg2}`, padding: '3px 8px', borderRadius: 12 } }, l)
    )
  );
}

function MiniNudge() {
  const h = React.createElement;
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: 6, background: T.accBg, border: `1px solid ${T.accBg2}`, borderRadius: 8, padding: '6px 10px' } },
    h('span', { style: { fontSize: 12 } }, '\u{1F4A1}'),
    h('div', null,
      h('div', { style: { fontSize: 8, fontWeight: 600, color: T.t1 } }, 'Popular right now'),
      h('div', { style: { fontSize: 7, color: T.t3 } }, 'Customers also viewed this')
    )
  );
}

function MiniPromo() {
  const h = React.createElement;
  return h('div', { style: { background: `linear-gradient(135deg, ${T.acc}, #e8956a)`, borderRadius: 8, padding: 10, color: '#fff' } },
    h('div', { style: { fontSize: 12, fontWeight: 700 } }, '20% Off'),
    h('div', { style: { fontSize: 7, opacity: 0.9, marginBottom: 6 } }, 'Use code SAVE20'),
    h('div', { style: { fontSize: 7, fontWeight: 600, background: 'rgba(255,255,255,0.25)', display: 'inline-block', padding: '2px 8px', borderRadius: 4 } }, 'Apply')
  );
}

function MiniCart() {
  const h = React.createElement;
  return h('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: 8 } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 } },
      h(I, { d: ic.bag, size: 10, color: T.t2 }),
      h('span', { style: { fontSize: 8, fontWeight: 600, color: T.t1 } }, 'Your Bag')
    ),
    ...[{ name: 'Vitamin C Serum', price: '$62' }, { name: 'SPF 50 Shield', price: '$34' }].map(item =>
      h('div', { key: item.name, style: { display: 'flex', justifyContent: 'space-between', fontSize: 7, color: T.t2, padding: '3px 0', borderBottom: `1px solid ${T.bdr}` } },
        h('span', null, item.name),
        h('span', { style: { fontWeight: 600 } }, item.price)
      )
    ),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 8, fontWeight: 600, color: T.t1, marginTop: 4 } },
      h('span', null, 'Total'),
      h('span', null, '$96')
    )
  );
}

function MiniContact() {
  const h = React.createElement;
  const rows = [
    { icon: ic.phone, label: '+1 (800) 555-0199', color: T.blue },
    { icon: ic.mail, label: 'hello@store.com', color: T.green },
    { icon: ic.map, label: '123 Main St, NYC', color: T.acc },
  ];
  return h('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: 8 } },
    ...rows.map(r =>
      h('div', { key: r.label, style: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' } },
        h(I, { d: r.icon, size: 10, color: r.color }),
        h('span', { style: { fontSize: 7, color: T.t2 } }, r.label)
      )
    )
  );
}

// ── Shared Block Definitions ────────────────────────────────────────

export const SHARED_BLOCKS: VerticalBlockDef[] = [
  {
    id: 'shared_greeting',
    family: 'shared',
    label: 'Greeting',
    stage: 'greeting',
    desc: 'Welcome message with brand identity and quick action buttons',
    preview: MiniGreeting,
    intents: ['hello', 'hi', 'start', 'hey'],
    module: null,
    status: 'active',
  },
  {
    id: 'shared_suggestions',
    family: 'shared',
    label: 'Quick Replies',
    stage: 'greeting',
    desc: 'Tappable suggestion chips for guided conversation flow',
    preview: MiniSuggestions,
    intents: [],
    module: null,
    status: 'active',
  },
  {
    id: 'shared_nudge',
    family: 'shared',
    label: 'Smart Nudge',
    stage: 'social_proof',
    desc: 'Non-blocking contextual suggestion, upsell, or info tip',
    preview: MiniNudge,
    intents: [],
    module: null,
    status: 'active',
  },
  {
    id: 'shared_promo',
    family: 'shared',
    label: 'Promo Banner',
    stage: 'showcase',
    desc: 'Promotional offer with discount code, countdown, or sale info',
    preview: MiniPromo,
    intents: ['offer', 'deal', 'discount', 'promo', 'sale'],
    module: null,
    status: 'active',
  },
  {
    id: 'shared_cart',
    family: 'shared',
    label: 'Cart',
    stage: 'conversion',
    desc: 'Shopping cart with line items, discounts, and checkout CTA',
    preview: MiniCart,
    intents: ['cart', 'checkout', 'order', 'buy', 'bag'],
    module: null,
    status: 'active',
  },
  {
    id: 'shared_contact',
    family: 'shared',
    label: 'Contact Card',
    stage: 'handoff',
    desc: 'Business contact info with click-to-call, email, WhatsApp',
    preview: MiniContact,
    intents: ['contact', 'phone', 'email', 'reach', 'call'],
    module: null,
    status: 'active',
  },
];

export const SHARED_BLOCK_IDS = SHARED_BLOCKS.map(b => b.id);
