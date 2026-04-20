'use server';

// ── Relay runtime cart actions ──────────────────────────────────────────
//
// Mutates the `cart` field on the runtime session document. Each action
// loads (or creates) the session, mutates it, recomputes totals via the
// shared helper, and writes it back.

import { loadOrCreateSession, setSessionCart } from '@/lib/relay/session-store';
import {
  RelaySessionCart,
  RelaySessionItem,
  recomputeCartTotals,
} from '@/lib/relay/session-types';

export interface CartActionResult {
  success: boolean;
  cart?: RelaySessionCart;
  error?: string;
}

export interface DiscountActionResult extends CartActionResult {
  valid?: boolean;
}

export async function addToCartAction(
  conversationId: string,
  partnerId: string,
  item: Omit<RelaySessionItem, 'addedAt' | 'quantity'> & { quantity?: number },
): Promise<CartActionResult> {
  try {
    if (!item?.itemId || !item?.name || typeof item.price !== 'number') {
      return { success: false, error: 'item.itemId, name and price are required' };
    }

    const session = await loadOrCreateSession(partnerId, conversationId);
    const quantity = Math.max(1, item.quantity ?? 1);
    const idx = session.cart.items.findIndex(
      (i) => i.itemId === item.itemId && i.variant === item.variant,
    );

    let nextItems: RelaySessionItem[];
    if (idx >= 0) {
      nextItems = session.cart.items.slice();
      nextItems[idx] = { ...nextItems[idx], quantity: nextItems[idx].quantity + quantity };
    } else {
      const fullItem: RelaySessionItem = {
        itemId: item.itemId,
        moduleSlug: item.moduleSlug,
        name: item.name,
        price: item.price,
        quantity,
        variant: item.variant,
        image: item.image,
        addedAt: new Date().toISOString(),
      };
      nextItems = [...session.cart.items, fullItem];
    }

    const cart = recomputeCartTotals({ ...session.cart, items: nextItems });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    console.error('[relay-cart] add failed:', e);
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function updateCartItemAction(
  conversationId: string,
  partnerId: string,
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const q = Math.max(0, Math.floor(quantity));
    const nextItems =
      q === 0
        ? session.cart.items.filter((i) => i.itemId !== itemId)
        : session.cart.items.map((i) => (i.itemId === itemId ? { ...i, quantity: q } : i));

    const cart = recomputeCartTotals({ ...session.cart, items: nextItems });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function removeFromCartAction(
  conversationId: string,
  partnerId: string,
  itemId: string,
): Promise<CartActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const nextItems = session.cart.items.filter((i) => i.itemId !== itemId);
    const cart = recomputeCartTotals({ ...session.cart, items: nextItems });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function clearCartAction(
  conversationId: string,
  partnerId: string,
): Promise<CartActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const cart = recomputeCartTotals({ items: [], subtotal: 0, total: 0 });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, cart: saved };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

// ── Discount codes ──────────────────────────────────────────────────────
//
// No partner-defined discount catalog yet — accept a small built-in set
// so the contract is exercisable end-to-end. Real codes will plug in via
// a partner subcollection later.

const BUILTIN_DISCOUNTS: Record<string, number> = {
  WELCOME10: 0.1,
  SAVE5: 5, // flat amount
};

export async function applyDiscountCodeAction(
  conversationId: string,
  partnerId: string,
  code: string,
): Promise<DiscountActionResult> {
  try {
    const session = await loadOrCreateSession(partnerId, conversationId);
    const upper = (code || '').trim().toUpperCase();
    const rule = BUILTIN_DISCOUNTS[upper];

    if (!rule) {
      return { success: true, valid: false, cart: session.cart };
    }

    const subtotal = session.cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmount = rule < 1 ? Math.round(subtotal * rule * 100) / 100 : rule;

    const cart = recomputeCartTotals({
      ...session.cart,
      discountCode: upper,
      discountAmount,
    });
    const saved = await setSessionCart(partnerId, conversationId, cart);
    return { success: true, valid: true, cart: saved };
  } catch (e) {
    return { success: false, valid: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}
