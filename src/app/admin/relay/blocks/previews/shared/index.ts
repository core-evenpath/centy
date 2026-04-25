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

// ── M03: booking_confirmation ──────────────────────────────────────
//
// Consumes BookingConfirmationPreviewData (defined in _preview-props.ts).
// When `bookings` is non-empty, renders the most-recent confirmed
// booking. When absent or empty, renders the design sample so the
// admin flow visualizer stays stable. Pattern matches MiniOrderTracker.

import type {
  BlockPreviewProps,
  BookingConfirmationPreviewData,
  SpaceConfirmationPreviewData,
} from '../_preview-props';

function MiniBookingConfirmation({ data }: { data?: BlockPreviewProps['data'] } = {}) {
  const top = (data as BookingConfirmationPreviewData | undefined)?.bookings?.[0];
  const reference = top?.bookingId ? `#${top.bookingId.slice(-8).toUpperCase()}` : '#BK-2026-0421';
  const statusLabel = top?.status === 'confirmed' ? 'Confirmed' : top?.status ?? 'Confirmed';
  const detailLine = top?.hold
    ? `${top.hold.resourceId ?? 'Resource'} · ${top.hold.startAt?.slice(11, 16) ?? 'time'}`
    : top?.slots?.[0]
      ? `${top.slots[0].serviceName ?? 'Service'} · ${top.slots[0].date ?? 'date'} ${top.slots[0].time ?? ''}`
      : 'Service · Tue 10:00 AM';
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', padding: '10px' } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' } },
      React.createElement(I, { d: ic.send, size: 12, color: T.green, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Booking confirmed'),
      React.createElement('span', { style: { fontSize: '8px', fontWeight: 600, color: T.green, background: `${T.green}1a`, padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' } }, statusLabel)
    ),
    React.createElement('div', { style: { fontSize: '9px', fontWeight: 600, color: T.t1 } }, reference),
    React.createElement('div', { style: { fontSize: '9px', color: T.t3, marginTop: '2px' } }, detailLine)
  );
}

// ── M03: space_confirmation ────────────────────────────────────────
//
// Consumes SpaceConfirmationPreviewData (defined in _preview-props.ts).
// Date-range render (check-in / check-out) vs booking's slot-time.
// Same design-sample fallback pattern.

function MiniSpaceConfirmation({ data }: { data?: BlockPreviewProps['data'] } = {}) {
  const top = (data as SpaceConfirmationPreviewData | undefined)?.reservations?.[0];
  const reference = top?.reservationId ? `#${top.reservationId.slice(-8).toUpperCase()}` : '#RV-2026-0501';
  const statusLabel = top?.status === 'confirmed' ? 'Confirmed' : top?.status ?? 'Confirmed';
  const room = top?.hold?.resourceId ?? 'Room 101';
  const checkIn = top?.hold?.checkIn ?? '2026-05-01';
  const checkOut = top?.hold?.checkOut ?? '2026-05-04';
  return React.createElement('div', { style: { background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', padding: '10px' } },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' } },
      React.createElement(I, { d: ic.send, size: 12, color: T.green, stroke: 2 }),
      React.createElement('span', { style: { fontSize: '10px', fontWeight: 600, color: T.t1 } }, 'Reservation confirmed'),
      React.createElement('span', { style: { fontSize: '8px', fontWeight: 600, color: T.green, background: `${T.green}1a`, padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' } }, statusLabel)
    ),
    React.createElement('div', { style: { fontSize: '9px', fontWeight: 600, color: T.t1 } }, `${reference} · ${room}`),
    React.createElement('div', { style: { fontSize: '9px', color: T.t3, marginTop: '2px' } }, `${checkIn} → ${checkOut}`)
  );
}

export const SHARED_BLOCKS: VerticalBlockDef[] = [
  { id: 'greeting', family: 'shared', label: 'Greeting', stage: 'greeting', desc: 'Welcome message with brand identity and quick action buttons', preview: MiniGreeting, intents: ['hello', 'hi', 'start', 'hey'], module: 'shared_conversation', status: 'active' },
  { id: 'suggestions', family: 'shared', label: 'Quick Replies', stage: 'greeting', desc: 'Tappable suggestion chips for guided conversation flow', preview: MiniSuggestions, intents: [], module: 'shared_conversation', status: 'active' },
  { id: 'nudge', family: 'shared', label: 'Smart Nudge', stage: 'social_proof', desc: 'Non-blocking contextual suggestion, upsell, or info tip', preview: MiniNudge, intents: [], module: 'shared_conversation', status: 'active' },
  { id: 'promo', family: 'shared', label: 'Promo Banner', stage: 'showcase', desc: 'Promotional offer with discount code, countdown, or sale info', preview: MiniPromo, intents: ['offer', 'deal', 'discount', 'promo', 'sale'], module: 'shared_marketing', status: 'active' },
  { id: 'cart', family: 'shared', label: 'Cart', stage: 'conversion', desc: 'Shopping cart with line items, discounts, and checkout CTA', preview: MiniCart, intents: ['cart', 'checkout', 'order', 'buy'], module: 'shared_checkout', status: 'active' },
  { id: 'contact', family: 'shared', label: 'Contact Card', stage: 'handoff', desc: 'Business contact info with click-to-call, email, WhatsApp', preview: MiniContact, intents: ['contact', 'phone', 'email', 'reach', 'call'], module: 'shared_navigation', status: 'active' },
  // M03 confirmations — service-engine read blocks; cross-vertical
  { id: 'booking_confirmation', family: 'shared', label: 'Booking Confirmation', stage: 'followup', desc: 'Confirmed booking reference with service details and date/time', preview: MiniBookingConfirmation, intents: ['booking', 'confirmation', 'reference', 'reminder'], module: 'shared_confirmation', status: 'active', engines: ['service'] },
  { id: 'space_confirmation', family: 'shared', label: 'Space Confirmation', stage: 'followup', desc: 'Confirmed space reservation with check-in/check-out dates', preview: MiniSpaceConfirmation, intents: ['reservation', 'confirmation', 'stay', 'check-in'], module: 'shared_confirmation', status: 'active', engines: ['service'] },
];

export const SHARED_BLOCK_IDS = SHARED_BLOCKS.map(b => b.id);