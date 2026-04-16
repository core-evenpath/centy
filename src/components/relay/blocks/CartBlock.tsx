"use client";
import React from "react";
import type { BlockCallbacks, RelayTheme } from "./types";
import { DEFAULT_THEME } from "./types";

// ── CartBlock ──────────────────────────────────────────────────────────
//
// Renders the live `callbacks.cart` snapshot. Quantity and remove
// controls call back into the relay session via the session-aware
// callbacks. Stays fully driven by props — local state would conflict
// with the optimistic updates done by useRelaySession.

interface CartBlockProps {
  theme?: RelayTheme;
  callbacks?: BlockCallbacks;
  title?: string;
  emptyLabel?: string;
  checkoutLabel?: string;
  onCheckout?: () => void;
}

export default function CartBlock({
  theme: t = DEFAULT_THEME,
  callbacks,
  title = "Your cart",
  emptyLabel = "Your cart is empty.",
  checkoutLabel = "Checkout",
  onCheckout,
}: CartBlockProps) {
  const cart = callbacks?.cart;
  const items = cart?.items ?? [];

  const S = {
    wrap: {
      borderRadius: 16,
      background: t.surface,
      border: `1px solid ${t.bdr}`,
      boxShadow: t.sh,
      padding: 16,
      fontFamily: t.fontFamily,
      color: t.text,
    } as React.CSSProperties,
    title: { fontFamily: t.headingFont, fontSize: 16, fontWeight: 600, marginBottom: 12 },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 0',
      borderBottom: `1px solid ${t.bdrL}`,
    } as React.CSSProperties,
    name: { flex: 1, fontSize: 13, color: t.text } as React.CSSProperties,
    price: { fontSize: 13, color: t.t2, minWidth: 60, textAlign: 'right' } as React.CSSProperties,
    qty: {
      width: 56,
      padding: '4px 8px',
      borderRadius: 8,
      border: `1px solid ${t.bdr}`,
      fontSize: 13,
      textAlign: 'center',
    } as React.CSSProperties,
    remove: {
      background: 'transparent',
      border: 'none',
      color: t.red,
      cursor: 'pointer',
      fontSize: 12,
      padding: '4px 6px',
    } as React.CSSProperties,
    totals: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      fontWeight: 600,
      paddingTop: 12,
    } as React.CSSProperties,
    subtle: { fontSize: 12, color: t.t3, display: 'flex', justifyContent: 'space-between' } as React.CSSProperties,
    checkout: {
      marginTop: 12,
      width: '100%',
      padding: '10px 14px',
      borderRadius: 10,
      border: 'none',
      background: t.accent,
      color: '#fff',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
    } as React.CSSProperties,
    empty: { fontSize: 13, color: t.t3, textAlign: 'center' as const, padding: '12px 0' },
  };

  if (items.length === 0) {
    return (
      <div style={S.wrap}>
        <div style={S.title}>{title}</div>
        <div style={S.empty}>{emptyLabel}</div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.title}>{title}</div>
      {items.map((item) => (
        <div key={`${item.itemId}_${item.variant ?? ''}`} style={S.row}>
          <div style={S.name}>
            <div>{item.name}</div>
            {item.variant && <div style={{ fontSize: 11, color: t.t3 }}>{item.variant}</div>}
          </div>
          <input
            type="number"
            min={0}
            value={item.quantity}
            onChange={(e) => {
              const next = Math.max(0, Number(e.target.value) || 0);
              void callbacks?.onUpdateCartItem?.(item.itemId, next);
            }}
            style={S.qty}
          />
          <div style={S.price}>{(item.price * item.quantity).toFixed(2)}</div>
          <button
            type="button"
            onClick={() => void callbacks?.onRemoveFromCart?.(item.itemId)}
            style={S.remove}
            aria-label={`Remove ${item.name}`}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ ...S.subtle, marginTop: 10 }}>
        <span>Subtotal</span>
        <span>{(cart?.subtotal ?? 0).toFixed(2)}</span>
      </div>
      {cart?.discountCode && (
        <div style={S.subtle}>
          <span>Discount ({cart.discountCode})</span>
          <span>-{(cart.discountAmount ?? 0).toFixed(2)}</span>
        </div>
      )}
      <div style={S.totals}>
        <span>Total</span>
        <span>{(cart?.total ?? 0).toFixed(2)}</span>
      </div>

      {onCheckout && (
        <button type="button" style={S.checkout} onClick={onCheckout}>
          {checkoutLabel}
        </button>
      )}
    </div>
  );
}
