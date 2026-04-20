// P2.M01: pure cart reducer.
//
// All cart state transitions (add, update, remove, merge) expressed as
// pure functions over RelaySessionCart. Server actions in
// `src/actions/relay-runtime/cart-actions.ts` orchestrate Firestore
// I/O around these reducers; tests can exercise the state machine
// without standing up any mocks.
//
// Phase 3 Booking should mirror this pattern for bookingHolds, and
// Phase 4 Space for spaceHolds. The reducer-as-pure-fn separation is
// a reusable shape; if we abstract, it happens after the second
// instance (P3) not the first.

import {
  CART_TTL_MS,
  computeCartExpiresAt,
  recomputeCartTotals,
  type RelaySessionCart,
  type RelaySessionItem,
} from '../session-types';

export { CART_TTL_MS, computeCartExpiresAt };

export class CartCurrencyMismatchError extends Error {
  readonly code = 'CART_CURRENCY_MISMATCH' as const;
  constructor(existing: string, incoming: string) {
    super(
      `Cart currency mismatch: existing=${existing}, incoming=${incoming}. ` +
        `Multi-currency carts are not supported in Phase 2.`,
    );
    this.name = 'CartCurrencyMismatchError';
  }
}

export interface CartAddInput {
  itemId: string;
  moduleSlug: string;
  name: string;
  price: number;
  quantity?: number;
  variant?: string;
  image?: string;
  currency?: string;
  /** Optional — used to distinguish otherwise-identical lines. */
  metadataKey?: string;
}

export interface CartUpdateInput {
  itemId: string;
  variant?: string;
  quantity: number;
}

const EMPTY_CART: RelaySessionCart = {
  items: [],
  subtotal: 0,
  total: 0,
};

function matchLine(a: RelaySessionItem, b: { itemId: string; variant?: string }): boolean {
  return a.itemId === b.itemId && (a.variant ?? null) === (b.variant ?? null);
}

function assertCurrencyCompatible(cart: RelaySessionCart, incoming?: string): void {
  if (!incoming || !cart.currency) return;
  if (cart.currency !== incoming) {
    throw new CartCurrencyMismatchError(cart.currency, incoming);
  }
}

export function reduceCartAdd(
  cart: RelaySessionCart | undefined | null,
  input: CartAddInput,
  now: Date = new Date(),
): RelaySessionCart {
  const base: RelaySessionCart = cart ?? EMPTY_CART;
  assertCurrencyCompatible(base, input.currency);

  const quantity = Math.max(1, input.quantity ?? 1);
  const existingIdx = base.items.findIndex((i) => matchLine(i, input));

  let nextItems: RelaySessionItem[];
  if (existingIdx >= 0) {
    nextItems = base.items.slice();
    nextItems[existingIdx] = {
      ...nextItems[existingIdx],
      quantity: nextItems[existingIdx].quantity + quantity,
    };
  } else {
    const fullItem: RelaySessionItem = {
      itemId: input.itemId,
      moduleSlug: input.moduleSlug,
      name: input.name,
      price: input.price,
      quantity,
      variant: input.variant,
      image: input.image,
      addedAt: now.toISOString(),
    };
    nextItems = [...base.items, fullItem];
  }

  const recomputed = recomputeCartTotals({ ...base, items: nextItems });
  return {
    ...recomputed,
    currency: base.currency ?? input.currency,
    expiresAt: computeCartExpiresAt(now),
  };
}

export function reduceCartUpdate(
  cart: RelaySessionCart | undefined | null,
  input: CartUpdateInput,
  now: Date = new Date(),
): RelaySessionCart {
  const base: RelaySessionCart = cart ?? EMPTY_CART;
  const q = Math.max(0, Math.floor(input.quantity));

  const nextItems =
    q === 0
      ? base.items.filter((i) => !matchLine(i, input))
      : base.items.map((i) => (matchLine(i, input) ? { ...i, quantity: q } : i));

  const recomputed = recomputeCartTotals({ ...base, items: nextItems });
  return {
    ...recomputed,
    currency: base.currency,
    expiresAt: computeCartExpiresAt(now),
  };
}

export function reduceCartRemove(
  cart: RelaySessionCart | undefined | null,
  input: { itemId: string; variant?: string },
  now: Date = new Date(),
): RelaySessionCart {
  const base: RelaySessionCart = cart ?? EMPTY_CART;
  const nextItems = base.items.filter((i) => !matchLine(i, input));
  const recomputed = recomputeCartTotals({ ...base, items: nextItems });
  return {
    ...recomputed,
    currency: base.currency,
    expiresAt: computeCartExpiresAt(now),
  };
}

export function reduceCartApplyDiscount(
  cart: RelaySessionCart | undefined | null,
  input: { code: string; discountAmount: number },
  now: Date = new Date(),
): RelaySessionCart {
  const base: RelaySessionCart = cart ?? EMPTY_CART;
  const recomputed = recomputeCartTotals({
    ...base,
    discountCode: input.code,
    discountAmount: input.discountAmount,
  });
  return {
    ...recomputed,
    currency: base.currency,
    expiresAt: computeCartExpiresAt(now),
  };
}
