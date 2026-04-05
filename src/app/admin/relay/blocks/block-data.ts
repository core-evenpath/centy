// ── Types ────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  mrp: number;
  img: string;
  badge?: string;
  cat: string;
  concern: string[];
  rating: number;
  reviews: number;
  sizes: string[];
}

export interface Concern { id: string; label: string; icon: string; }
export interface Category { id: string; label: string; icon: string; }

export type BlockStatus = 'EXISTS' | 'NEW' | 'EXTEND';
export interface ShowcaseBlock { type: string; label: string; status: BlockStatus; }
export interface BlockSection { id: string; title: string; blocks: ShowcaseBlock[]; }
export interface Scenario { id: string; label: string; desc: string; tags: string[]; }

export interface ScenarioMessage {
  k: number;
  t: 'user' | 'bot';
  text?: string;
  block?: string;
  items?: string[];
  filter?: string;
  p?: Product;
  withCode?: boolean;
  variant?: string;
  action?: string;
  icon?: string;
}

// ── Theme ────────────────────────────────────────────────────────────

export const T = {
  pri: '#2d4a3e', priLt: '#3d6354', priBg: 'rgba(45,74,62,0.06)', priBg2: 'rgba(45,74,62,0.12)',
  acc: '#c4704b', accBg: 'rgba(196,112,75,0.06)', accBg2: 'rgba(196,112,75,0.12)',
  bg: '#f7f3ec', surface: '#ffffff', card: '#f2ede5',
  t1: '#1a1a18', t2: '#3d3d38', t3: '#7a7a70', t4: '#a8a89e',
  bdr: '#e8e4dc', bdrM: '#d4d0c8',
  green: '#2d6a4f', greenBg: 'rgba(45,106,79,0.06)', greenBdr: 'rgba(45,106,79,0.12)',
  red: '#b91c1c', redBg: 'rgba(185,28,28,0.05)',
  amber: '#b45309', amberBg: 'rgba(180,83,9,0.06)',
  blue: '#1d4ed8', blueBg: 'rgba(29,78,216,0.06)',
  pink: '#be185d', pinkBg: 'rgba(190,24,93,0.06)',
};

// ── Helpers ──────────────────────────────────────────────────────────

export const fmt = (n: number): string => '$' + n.toFixed(n % 1 === 0 ? 0 : 2);
export const disc = (m: number, p: number): number => Math.round(((m - p) / m) * 100);

// ── Product Data ─────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  { id: 'c1', name: 'Barrier Repair Cream', desc: 'Ceramides · Squalane · 50ml', price: 48, mrp: 0, img: 'linear-gradient(135deg, #e8e0d4 0%, #d4caba 50%, #c8bfaf 100%)', badge: 'Best Seller', cat: 'moisturizers', concern: ['dryness', 'aging'], rating: 4.8, reviews: 2847, sizes: ['50ml', '100ml'] },
  { id: 's1', name: 'Vitamin C Brightening Serum', desc: '15% L-Ascorbic · Ferulic · 30ml', price: 62, mrp: 0, img: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)', badge: 'Award Winner', cat: 'serums', concern: ['dullness', 'aging', 'dark spots'], rating: 4.7, reviews: 4210, sizes: ['15ml', '30ml'] },
  { id: 's2', name: 'Retinol Night Serum', desc: '0.5% Encapsulated Retinol · 30ml', price: 56, mrp: 0, img: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)', cat: 'serums', concern: ['aging', 'acne', 'texture'], rating: 4.5, reviews: 1893, sizes: ['30ml'] },
  { id: 'cl1', name: 'Gentle Gel Cleanser', desc: 'pH 5.5 · Centella · 150ml', price: 28, mrp: 0, img: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)', cat: 'cleansers', concern: ['acne', 'sensitivity'], rating: 4.6, reviews: 3102, sizes: ['150ml', '250ml'] },
  { id: 'sp1', name: 'Invisible Shield SPF 50', desc: 'Chemical · No white cast · 40ml', price: 34, mrp: 0, img: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #facc15 100%)', badge: 'Cult Fave', cat: 'spf', concern: ['all'], rating: 4.9, reviews: 6450, sizes: ['40ml'] },
  { id: 'e1', name: 'Peptide Eye Cream', desc: 'Caffeine · Niacinamide · 15ml', price: 44, mrp: 0, img: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)', cat: 'treatments', concern: ['aging', 'dark circles'], rating: 4.4, reviews: 1567, sizes: ['15ml'] },
  { id: 'm1', name: 'Niacinamide Pore Serum', desc: '10% Niacinamide · Zinc · 30ml', price: 38, mrp: 0, img: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)', cat: 'serums', concern: ['acne', 'pores', 'oily'], rating: 4.6, reviews: 2340, sizes: ['30ml'] },
  { id: 't1', name: 'AHA/BHA Exfoliant', desc: 'Glycolic + Salicylic · 100ml', price: 32, mrp: 0, img: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)', badge: 'Staff Pick', cat: 'treatments', concern: ['texture', 'acne', 'dullness'], rating: 4.3, reviews: 1890, sizes: ['100ml'] },
];

export const CONCERNS: Concern[] = [
  { id: 'acne', label: 'Acne & Breakouts', icon: '◯' },
  { id: 'aging', label: 'Fine Lines', icon: '∿' },
  { id: 'dryness', label: 'Dryness', icon: '◇' },
  { id: 'dullness', label: 'Dull Skin', icon: '✧' },
  { id: 'pores', label: 'Large Pores', icon: '⬡' },
  { id: 'sensitivity', label: 'Sensitivity', icon: '❋' },
];

export const CATS: Category[] = [
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'cleansers', label: 'Cleanse', icon: '◯' },
  { id: 'serums', label: 'Serums', icon: '◇' },
  { id: 'moisturizers', label: 'Moisturize', icon: '∿' },
  { id: 'spf', label: 'SPF', icon: '☀' },
  { id: 'treatments', label: 'Treat', icon: '✧' },
];

// ── Block Sections ───────────────────────────────────────────────────

export const BLOCK_SECTIONS: BlockSection[] = [
  { id: 'entry', title: 'Entry & Discovery', blocks: [
    { type: 'greeting', label: 'Welcome', status: 'EXISTS' },
    { type: 'skin_quiz', label: 'Skin Quiz', status: 'NEW' },
    { type: 'concern_picker', label: 'Concern Picker', status: 'NEW' },
    { type: 'category_grid', label: 'Category Grid', status: 'NEW' },
    { type: 'search_results', label: 'Search Results', status: 'NEW' },
  ]},
  { id: 'browse', title: 'Product & Evaluation', blocks: [
    { type: 'products', label: 'Product Catalog', status: 'EXISTS' },
    { type: 'product_detail', label: 'Product Detail', status: 'NEW' },
    { type: 'ingredients', label: 'Ingredient List', status: 'NEW' },
    { type: 'compare', label: 'Compare', status: 'EXISTS' },
    { type: 'reviews', label: 'Reviews + UGC', status: 'EXTEND' },
    { type: 'shade_finder', label: 'Shade Finder', status: 'NEW' },
    { type: 'routine_builder', label: 'Routine Builder', status: 'NEW' },
  ]},
  { id: 'promo', title: 'Pricing & Promos', blocks: [
    { type: 'promo', label: 'Promo / Sale', status: 'EXISTS' },
    { type: 'bundle', label: 'Bundle / Set', status: 'NEW' },
    { type: 'gift_card', label: 'Gift Card', status: 'NEW' },
    { type: 'free_gift', label: 'GWP Threshold', status: 'NEW' },
  ]},
  { id: 'cart', title: 'Cart & Checkout', blocks: [
    { type: 'cart', label: 'Cart', status: 'NEW' },
    { type: 'checkout', label: 'Checkout', status: 'NEW' },
    { type: 'confirmation', label: 'Confirmation', status: 'NEW' },
  ]},
  { id: 'post', title: 'Post-Purchase', blocks: [
    { type: 'order_tracker', label: 'Order Tracker', status: 'NEW' },
    { type: 'return_exchange', label: 'Return / Exchange', status: 'NEW' },
    { type: 'reorder', label: 'Quick Reorder', status: 'NEW' },
    { type: 'feedback', label: 'Review Request', status: 'NEW' },
  ]},
  { id: 'engage', title: 'Engagement & Retention', blocks: [
    { type: 'subscription', label: 'Subscribe & Save', status: 'NEW' },
    { type: 'loyalty', label: 'Rewards Program', status: 'NEW' },
    { type: 'referral', label: 'Refer a Friend', status: 'NEW' },
    { type: 'wishlist', label: 'Saved Items', status: 'NEW' },
    { type: 'nudge', label: 'Smart Nudge', status: 'EXISTS' },
    { type: 'social_proof', label: 'Social Proof', status: 'NEW' },
  ]},
  { id: 'support', title: 'Support', blocks: [
    { type: 'info', label: 'FAQ / Policy', status: 'EXISTS' },
    { type: 'contact', label: 'Contact', status: 'EXISTS' },
    { type: 'handoff', label: 'Live Consult', status: 'EXISTS' },
    { type: 'booking', label: 'Book Consultation', status: 'NEW' },
  ]},
];

// ── Scenarios ────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  { id: 'first_visit', label: 'First Visit + Skin Quiz', desc: 'Welcome → quiz → personalized routine', tags: ['greeting', 'skin_quiz', 'routine_builder', 'products'] },
  { id: 'concern', label: 'Shop by Concern', desc: '"Help with acne" → filtered picks', tags: ['concern_picker', 'products', 'product_detail'] },
  { id: 'deep_dive', label: 'Product Deep Dive', desc: 'Detail → ingredients → reviews → compare', tags: ['product_detail', 'ingredients', 'reviews', 'compare'] },
  { id: 'shade', label: 'Shade Finder', desc: 'Foundation matching questionnaire', tags: ['shade_finder', 'product_detail', 'reviews'] },
  { id: 'routine', label: 'Routine Builder', desc: 'AM/PM routine with bundle pricing', tags: ['routine_builder', 'bundle', 'cart'] },
  { id: 'subscribe', label: 'Subscribe & Save', desc: 'Auto-replenish consumables', tags: ['subscription', 'reorder', 'nudge'] },
  { id: 'deals', label: 'Deals & Gift Sets', desc: 'Holiday set → GWP → gift card', tags: ['promo', 'bundle', 'gift_card', 'free_gift'] },
  { id: 'checkout', label: 'Cart & Checkout', desc: 'Cart → Afterpay → Apple Pay → confirm', tags: ['cart', 'checkout', 'confirmation'] },
  { id: 'tracking', label: 'Order & Returns', desc: 'Track → return → prepaid label', tags: ['order_tracker', 'return_exchange', 'feedback'] },
  { id: 'loyalty', label: 'Loyalty & Rewards', desc: 'Points → birthday → tier upgrade', tags: ['loyalty', 'wishlist', 'social_proof'] },
  { id: 'gifting', label: 'Gift & Refer', desc: 'Gift card → referral → share', tags: ['gift_card', 'referral', 'nudge'] },
  { id: 'consult', label: 'Live Skin Consult', desc: 'Book a virtual consultation', tags: ['booking', 'handoff', 'info'] },
];

// ── Registry Mapping ─────────────────────────────────────────────────

export const SHOWCASE_TO_REGISTRY: Record<string, string> = {
  greeting: 'ecom_greeting',
  products: 'ecom_product_card',
  product_detail: 'ecom_product_detail',
  compare: 'ecom_compare',
  cart: 'ecom_cart',
  confirmation: 'ecom_order_confirmation',
  order_tracker: 'ecom_order_tracker',
  promo: 'ecom_promo',
  nudge: 'shared_nudge',
  contact: 'shared_contact',
};

// ── Scenario Builder ─────────────────────────────────────────────────

export function buildScenario(id: string): ScenarioMessage[] {
  const u = (t: string): ScenarioMessage => ({ k: Math.random(), t: 'user', text: t });
  const b = (text: string): ScenarioMessage => ({ k: Math.random(), t: 'bot', text });
  const bl = (block: string, props?: Partial<ScenarioMessage>): ScenarioMessage => ({ k: Math.random(), t: 'bot', block, ...props });
  const sg = (items: string[]): ScenarioMessage => ({ k: Math.random(), t: 'bot', block: 'sug', items });
  const nd = (text: string, action: string, variant: string, icon: string): ScenarioMessage => ({ k: Math.random(), t: 'bot', block: 'nudge', text, action, variant, icon });

  const flows: Record<string, ScenarioMessage[]> = {
    first_visit: [
      bl('greeting'), sg(['Take Skin Quiz', 'Browse Bestsellers', 'I need help with acne']),
      u("I'll take the skin quiz"), bl('skin_quiz'),
      b('Based on your answers — combination skin with acne and dark spots — here\'s a routine built just for you:'),
      bl('routine'), sg(['Add full routine', 'Tell me about Vitamin C', 'Subscribe & save']),
    ],
    concern: [
      u("I've been struggling with acne and dark spots"),
      b("I hear you — that's a really common combination. Here are your skin concerns mapped:"),
      bl('concern_picker'),
      b('These are our highest-rated products specifically for acne + hyperpigmentation:'),
      bl('catalog', { filter: 'acne' }), sg(['Niacinamide Serum details', 'AHA/BHA Exfoliant details', 'Compare these two']),
      u('Tell me more about the Niacinamide Serum'), bl('product_detail', { p: PRODUCTS[6] }),
      sg(['See ingredients', 'Read reviews', 'Add to bag']),
    ],
    deep_dive: [
      u("What's in the Vitamin C Serum? Is it worth $62?"),
      bl('product_detail', { p: PRODUCTS[1] }), bl('ingredients'),
      sg(['Customer reviews', 'Compare with retinol', 'How to use it']),
      u('What are customers saying?'), bl('reviews'),
      u('Compare it with the Retinol Serum'), bl('compare'),
      sg(['Add Vitamin C to bag', 'Add both', 'Build my routine']),
    ],
    shade: [
      u("I want to try your tinted moisturizer but I don't know my shade"),
      b("Let's find your perfect match — it takes about 30 seconds:"),
      bl('shade_finder'),
      sg(['Add shade to bag', 'See reviews for this shade', 'Try a different undertone']),
      u('Add it!'), b('Added Shade 3N — Sand. Pairs beautifully with your SPF.'),
      nd('First order? Use NEWGLOW for 15% off.', 'Apply', 'green', '🎉'),
    ],
    routine: [
      u('I want a complete skincare routine for anti-aging'),
      b("I'll build you a morning and evening routine based on your goal:"),
      bl('routine'),
      sg(['Add full routine', 'Swap out a product', 'Subscribe for 20% off']),
      u('Add the full routine'), b('Full routine added! Here\'s your bag:'),
      bl('cart'), sg(['Apply coupon', 'Checkout', 'Add eye cream too']),
    ],
    subscribe: [
      u('I keep reordering the Vitamin C serum — is there a subscription option?'),
      b('Yes! Subscribe & Save gives you up to 20% off with automatic deliveries:'),
      bl('subscription'),
      sg(['Subscribe monthly', 'Add more products', 'How do I skip a month?']),
      u('Do I have past orders I can reorder?'),
      bl('reorder'),
      nd('Subscribe to 3+ products and unlock free priority shipping forever.', 'Learn more', 'green', '📦'),
    ],
    deals: [
      u('Any deals running right now?'),
      b('Great timing — we have a few active promotions:'),
      bl('promo_sale'), bl('promo_coupon'),
      nd('Spend $75+ and get a free mini Vitamin C Serum!', 'Shop now', 'amber', '🎁'),
      sg(['Show me gift sets', 'Gift card for a friend', 'Holiday bundles']),
      u('Show me the holiday set'), bl('bundle'),
      u('I also want a gift card for my sister'), bl('gift_card'),
    ],
    checkout: [
      u("I'm ready to check out"),
      b("Here's your bag — 3 products, free shipping included:"),
      bl('cart', { withCode: true }),
      u('Checkout'),
      bl('checkout'),
      bl('confirmation'),
      nd('Share your routine with friends — you both get $15!', 'Share', 'green', '🎁'),
      sg(['Track my order', 'Subscribe & save', 'Refer a friend']),
    ],
    tracking: [
      u("Where's my order?"),
      b("Here's the latest on your shipment:"),
      bl('order_tracker'),
      sg(['I need to return something', 'Contact support', 'Reorder']),
      u('I want to return the Vitamin C — it irritated my skin'),
      b("I'm sorry to hear that. Let me start your return:"),
      bl('return'),
      sg(['Generate label', 'Talk to a skin advisor', 'Try a gentler alternative']),
      u("Can I get a skin advisor's opinion?"),
      b('Connecting you with Kate, one of our licensed estheticians:'),
      bl('handoff'),
    ],
    loyalty: [
      b('Welcome back! Here\'s your Glow Rewards status:'),
      bl('loyalty'),
      nd('Your birthday is this month! $10 reward has been added automatically.', 'Redeem', 'pink', '🎂'),
      sg(['My saved items', 'Redeem points', 'How do points work?']),
      u('Show my saved items'), bl('wishlist'),
      u('How trusted is VEIL compared to other brands?'), bl('social_proof'),
      sg(['Shop bestsellers', 'Refer a friend', 'Track my order']),
    ],
    gifting: [
      u("I want to get something for my friend's birthday"),
      b('Beautiful! A few options:'),
      bl('bundle'),
      bl('gift_card'),
      sg(['Send gift card', 'Add gift message', 'Refer her for $15 off']),
      u("She might want to pick her own products — let's do the gift card"),
      b('Great choice! After she orders, here\'s how you both save:'),
      bl('referral'),
      nd('Share your referral link after sending the gift card — she saves $15 on top of the card value.', 'Smart!', 'green', '💡'),
    ],
    consult: [
      u("I'm overwhelmed by all these serums — can I talk to someone?"),
      b('Absolutely! You can book a free 15-minute virtual skin consultation:'),
      bl('booking'),
      sg(['Book 1:00 PM', 'What do they cover?', 'Browse on my own first']),
      u("What's included?"),
      bl('info'),
      b('Your consultant can also recommend a routine, explain ingredient interactions, and send you free samples to try before committing.'),
      sg(['Book now', 'Send me samples first', 'Show me bestsellers']),
    ],
  };

  return flows[id] || [];
}
