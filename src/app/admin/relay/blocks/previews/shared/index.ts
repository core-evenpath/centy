'use client';

import React from 'react';
import { T, I, Tag } from '../_theme';
import { ic } from '../_icons';
import type { VerticalBlockDef } from '../_types';

function MiniGreeting() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', padding: '10px', textAlign: 'center' as const } },
    React.createElement('div', { style: { marginBottom: '3px' } }, React.createElement(I, { d: ic.send, size: 16, color: T.pri, stroke: 1.5 })),
    React.createElement('div', { style: { fontSize: '11px', fontWeight: 600, color: T.t1 } }, 'Welcome to our store'),
    React.createElement('div', { style: { fontSize: '9px', color: T.t3, marginTop: '2px' } }, 'How can we help you today?'),
    React.createElement('div', { style: { display: 'flex', gap: '3px', marginTop: '6px', justifyContent: 'center' } },
      ['Browse', 'Book', 'Contact'].map(l =>
        React.createElement('span', { key: l, style: { fontSize: '8px', padding: '3px 8px', borderRadius: '6px', background: T.priBg, color: T.pri, fontWeight: 500 } }, l)
      )
    )
  );
}

function MiniSuggestions() {
  return React.createElement('div', { style: { display: 'flex', gap: '3px', flexWrap: 'wrap' as const } },
    ['Show me options', "What's popular?", 'Pricing', 'Contact'].map(s =>
      React.createElement('span', { key: s, style: { fontSize: '8px', padding: '4px 8px', borderRadius: '9999px', background: T.surface, border: `1px solid ${T.pri}`, color: T.pri, fontWeight: 500, cursor: 'pointer' } }, s)
    )
  );
}

function MiniNudge() {
  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: T.accBg, border: `1px solid ${T.acc}20`, borderRadius: '8px' } },
    React.createElement('div', null, React.createElement(I, { d: ic.sun, size: 14, color: T.acc, stroke: 1.5 })),
    React.createElement('div', { style: { flex: 1 } },
      React.createElement('div', { style: { fontSize: '9px', fontWeight: 600, color: T.t1 } }, 'Popular right now'),
      React.createElement('div', { style: { fontSize: '8px', color: T.t3 } }, '12 people viewed this in the last hour')
    )
  );
}

function MiniPromo() {
  return React.createElement('div', { style: { background: `linear-gradient(135deg, ${T.acc}, #e8956a)`, borderRadius: '10px', padding: '10px', color: '#fff' } },
    React.createElement('div', { style: { fontSize: '7px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, opacity: 0.8 } }, 'Limited offer'),
    React.createElement('div', { style: { fontSize: '14px', fontWeight: 700, marginTop: '2px' } }, '20% Off First Order'),
    React.createElement('div', { style: { fontSize: '9px', opacity: 0.85, marginTop: '2px' } }, 'Use code WELCOME20'),
    React.createElement('button', { style: { marginTop: '5px', padding: '4px 10px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '8px', fontWeight: 600, cursor: 'pointer' } }, 'Apply')
  );
}

function MiniCart() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', padding: '8px 10px' } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' } },
      React.createElement(I, { d: ic.bag, size: 11, color: T.t1, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Your Cart'),
      React.createElement('span', { style: { fontSize: '8px', color: T.t4, marginLeft: 'auto' } }, '2 items')
    ),
    [{ n: 'Premium Plan', p: '$49' }, { n: 'Add-on Package', p: '$19' }].map((item, i) =>
      React.createElement('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '9px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' } },
        React.createElement('span', { style: { color: T.t2 } }, item.n),
        React.createElement('span', { style: { fontWeight: 600, color: T.t1 } }, item.p)
      )
    ),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '5px', borderTop: `2px solid ${T.t1}` } },
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 700, color: T.t1 } }, 'Total'),
      React.createElement('span', { style: { fontSize: '12px', fontWeight: 700, color: T.pri } }, '$68')
    )
  );
}

function MiniContact() {
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', padding: '8px 10px' } },
    React.createElement('div', { style: { fontSize: '10px', fontWeight: 600, color: T.t1, marginBottom: '5px' } }, 'Get in Touch'),
    [
      { icon: ic.phone, l: 'Call us', v: '+1 (555) 123-4567', color: T.green },
      { icon: ic.mail, l: 'Email', v: 'hello@business.com', color: T.blue },
      { icon: ic.map, l: 'Visit', v: '123 Main St, City', color: T.acc },
    ].map((c, i) =>
      React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 0' } },
        React.createElement(I, { d: c.icon, size: 10, color: c.color, stroke: 1.5 }),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: '7px', color: T.t4, textTransform: 'uppercase' as const, letterSpacing: '0.3px' } }, c.l),
          React.createElement('div', { style: { fontSize: '9px', fontWeight: 500, color: T.t1 } }, c.v)
        )
      )
    )
  );
}

export const SHARED_BLOCKS: VerticalBlockDef[] = [
  { id: 'greeting', family: 'shared', label: 'Greeting', stage: 'greeting', desc: 'Welcome message with brand identity and quick action buttons', preview: MiniGreeting, intents: ['hello', 'hi', 'start', 'hey'], module: null, status: 'active' },
  { id: 'suggestions', family: 'shared', label: 'Quick Replies', stage: 'greeting', desc: 'Tappable suggestion chips for guided conversation flow', preview: MiniSuggestions, intents: [], module: null, status: 'active' },
  { id: 'nudge', family: 'shared', label: 'Smart Nudge', stage: 'social_proof', desc: 'Non-blocking contextual suggestion, upsell, or info tip', preview: MiniNudge, intents: [], module: null, status: 'active' },
  { id: 'promo', family: 'shared', label: 'Promo Banner', stage: 'showcase', desc: 'Promotional offer with discount code, countdown, or sale info', preview: MiniPromo, intents: ['offer', 'deal', 'discount', 'promo', 'sale'], module: null, status: 'active' },
  { id: 'cart', family: 'shared', label: 'Cart', stage: 'conversion', desc: 'Shopping cart with line items, discounts, and checkout CTA', preview: MiniCart, intents: ['cart', 'checkout', 'order', 'buy'], module: null, status: 'active' },
  { id: 'contact', family: 'shared', label: 'Contact Card', stage: 'handoff', desc: 'Business contact info with click-to-call, email, WhatsApp', preview: MiniContact, intents: ['contact', 'phone', 'email', 'reach', 'call'], module: null, status: 'active' },
];

export const SHARED_BLOCK_IDS = SHARED_BLOCKS.map(b => b.id);