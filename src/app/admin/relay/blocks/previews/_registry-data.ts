// Server-safe data-only block registry.
// The main registry.ts pulls in client-only preview components, so server
// actions (seedDefaultBlocksAction, syncRegistryToFirestoreAction) cannot
// import it. This file exposes the same shape without React components.

import { VERTICAL_MANIFEST } from './_manifest';

export interface ServerBlockData {
  id: string;
  family: string;
  label: string;
  stage: string;
  desc: string;
  intents: string[];
  module: string | null;
  status?: 'active' | 'new' | 'planned';
}

export interface ServerSubVerticalData {
  id: string;
  blocks: string[];
}

// Keep in sync with src/app/admin/relay/blocks/previews/shared/index.ts
const SHARED_BLOCKS_DATA: ServerBlockData[] = [
  { id: 'greeting', family: 'shared', label: 'Greeting', stage: 'greeting', desc: 'Welcome message with brand identity and quick action buttons', intents: ['hello', 'hi', 'start', 'hey'], module: null, status: 'active' },
  { id: 'suggestions', family: 'shared', label: 'Quick Replies', stage: 'greeting', desc: 'Tappable suggestion chips for guided conversation flow', intents: [], module: null, status: 'active' },
  { id: 'nudge', family: 'shared', label: 'Smart Nudge', stage: 'social_proof', desc: 'Non-blocking contextual suggestion, upsell, or info tip', intents: [], module: null, status: 'active' },
  { id: 'promo', family: 'shared', label: 'Promo Banner', stage: 'showcase', desc: 'Promotional offer with discount code, countdown, or sale info', intents: ['offer', 'deal', 'discount', 'promo', 'sale'], module: null, status: 'active' },
  { id: 'cart', family: 'shared', label: 'Cart', stage: 'conversion', desc: 'Shopping cart with line items, discounts, and checkout CTA', intents: ['cart', 'checkout', 'order', 'buy'], module: null, status: 'active' },
  { id: 'contact', family: 'shared', label: 'Contact Card', stage: 'handoff', desc: 'Business contact info with click-to-call, email, WhatsApp', intents: ['contact', 'phone', 'email', 'reach', 'call'], module: null, status: 'active' },
];

export const SHARED_BLOCK_IDS_DATA: string[] = SHARED_BLOCKS_DATA.map(b => b.id);

export const ALL_BLOCKS_DATA: ServerBlockData[] = [
  ...SHARED_BLOCKS_DATA,
  ...VERTICAL_MANIFEST.flatMap(v =>
    v.blocks.map(b => ({
      id: b.id,
      family: b.family,
      label: b.label,
      stage: b.stage,
      desc: b.desc,
      intents: b.intents,
      module: b.module,
      status: 'active' as const,
    }))
  ),
];

export const ALL_SUB_VERTICALS_DATA: ServerSubVerticalData[] = VERTICAL_MANIFEST.flatMap(v =>
  v.subVerticals.map(s => ({ id: s.id, blocks: s.blocks }))
);
