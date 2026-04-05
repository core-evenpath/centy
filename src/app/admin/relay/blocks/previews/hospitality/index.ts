'use client';

import React from 'react';
import { T, I, Tag } from '../_theme';
import { ic } from '../_icons';
import { VerticalBlockDef } from '../_types';

const MiniGreeting = () => React.createElement('div', {
  style: { background: T.bg, padding: '16px', borderRadius: '12px', border: `1px solid ${T.bdr}`, textAlign: 'center' }
},
  React.createElement('div', { style: { fontSize: '24px', marginBottom: '8px' } }, '👋'),
  React.createElement('div', { style: { fontSize: '14px', fontWeight: 600, color: T.t1, marginBottom: '4px' } }, 'Welcome to our store'),
  React.createElement('div', { style: { fontSize: '12px', color: T.t3, marginBottom: '12px' } }, 'How can we help?'),
  React.createElement('div', { style: { display: 'flex', gap: '6px', justifyContent: 'center' } },
    React.createElement('div', { style: { background: T.surface, padding: '4px 8px', borderRadius: '12px', border: `1px solid ${T.bdr}`, fontSize: '10px', color: T.pri } }, 'Shop Now'),
    React.createElement('div', { style: { background: T.surface, padding: '4px 8px', borderRadius: '12px', border: `1px solid ${T.bdr}`, fontSize: '10px', color: T.pri } }, 'Offers'),
    React.createElement('div', { style: { background: T.surface, padding: '4px 8px', borderRadius: '12px', border: `1px solid ${T.bdr}`, fontSize: '10px', color: T.pri } }, 'Support')
  )
);

const MiniSuggestions = () => React.createElement('div', {
  style: { display: 'flex', gap: '6px', overflow: 'hidden' }
},
  [1, 2, 3, 4].map(i => React.createElement('div', {
    key: i,
    style: { padding: '6px 12px', borderRadius: '16px', border: `1px solid ${T.pri}`, color: T.pri, fontSize: '11px', whiteSpace: 'nowrap' }
  }, `Option ${i}`))
);

const MiniNudge = () => React.createElement('div', {
  style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', background: T.accBg, border: `1px solid ${T.acc}40` }
},
  React.createElement('div', { style: { fontSize: '18px' } }, '💡'),
  React.createElement('div', null,
    React.createElement('div', { style: { fontSize: '12px', fontWeight: 600, color: T.t1 } }, 'Popular right now'),
    React.createElement('div', { style: { fontSize: '10px', color: T.t3 } }, 'Check out our bestsellers')
  )
);

const MiniPromo = () => React.createElement('div', {
  style: { background: `linear-gradient(135deg, ${T.acc}, #e8956a)`, padding: '16px', borderRadius: '12px', color: '#fff' }
},
  React.createElement('div', { style: { fontSize: '16px', fontWeight: 700, marginBottom: '4px' } }, '20% Off'),
  React.createElement('div', { style: { fontSize: '12px', opacity: 0.9, marginBottom: '12px' } }, 'Use code SAVE20 at checkout'),
  React.createElement('div', { style: { display: 'flex', gap: '8px' } },
    React.createElement('div', { style: { background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', flex: 1, textAlign: 'center', fontFamily: 'monospace' } }, 'SAVE20'),
    React.createElement('div', { style: { background: '#fff', color: T.acc, padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 } }, 'Apply')
  )
);

const MiniCart = () => React.createElement('div', {
  style: { background: T.bg, borderRadius: '12px', border: `1px solid ${T.bdr}`, padding: '12px' }
},
  React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: `1px solid ${T.bdr}`, marginBottom: '8px' } },
    React.createElement(I, { d: ic.bag, size: 16, color: T.t1 }),
    React.createElement('span', { style: { fontSize: '13px', fontWeight: 600, color: T.t1 } }, 'Your Cart')
  ),
  [1, 2].map(i => React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: T.t2 } },
    React.createElement('span', null, `Item ${i}`),
    React.createElement('span', { style: { fontWeight: 500 } }, '$24.00')
  )),
  React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${T.bdr}`, fontSize: '12px', fontWeight: 700, color: T.t1 } },
    React.createElement('span', null, 'Total'),
    React.createElement('span', null, '$48.00')
  )
);

const MiniContact = () => React.createElement('div', {
  style: { background: T.bg, borderRadius: '12px', border: `1px solid ${T.bdr}`, padding: '16px' }
},
  [
    { icon: ic.cal, text: '+1 234 567 8900', color: T.green },
    { icon: ic.mail, text: 'hello@store.com', color: T.blue },
    { icon: ic.map, text: '123 Main St, City', color: T.pri }
  ].map((item, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < 2 ? '12px' : '0' } },
    React.createElement('div', { style: { width: 28, height: 28, borderRadius: '50%', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      React.createElement(I, { d: item.icon, size: 14, color: item.color })
    ),
    React.createElement('div', { style: { fontSize: '12px', color: T.t2 } }, item.text)
  ))
);

export const SHARED_BLOCKS: VerticalBlockDef[] = [
  { id: "greeting", family: "shared", label: "Greeting", stage: "greeting", desc: "Welcome message with brand identity and quick action buttons", preview: MiniGreeting, intents: ["hello", "hi", "start", "hey"], module: null },
  { id: "suggestions", family: "shared", label: "Quick Replies", stage: "greeting", desc: "Tappable suggestion chips for guided conversation flow", preview: MiniSuggestions, intents: [], module: null },
  { id: "nudge", family: "shared", label: "Smart Nudge", stage: "social_proof", desc: "Non-blocking contextual suggestion, upsell, or info tip", preview: MiniNudge, intents: [], module: null },
  { id: "promo", family: "shared", label: "Promo Banner", stage: "showcase", desc: "Promotional offer with discount code, countdown, or sale info", preview: MiniPromo, intents: ["offer", "deal", "discount", "promo", "sale"], module: null },
  { id: "cart", family: "shared", label: "Cart", stage: "conversion", desc: "Shopping cart with line items, discounts, and checkout CTA", preview: MiniCart, intents: ["cart", "checkout", "order", "buy", "bag"], module: null },
  { id: "contact", family: "shared", label: "Contact Card", stage: "handoff", desc: "Business contact info with click-to-call, email, WhatsApp", preview: MiniContact, intents: ["contact", "phone", "email", "reach", "call"], module: null }
];

export const SHARED_BLOCK_IDS = SHARED_BLOCKS.map(b => b.id);
