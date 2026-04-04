"use client";
import React from "react";
import type { RelayTheme, CartData } from "./types";
import { DEFAULT_THEME } from "./types";

interface CartSummaryProps {
  cart: CartData;
  theme?: RelayTheme;
  onCheckout?: () => void;
}

export default function CartSummary({
  cart: c,
  theme: t = DEFAULT_THEME,
  onCheckout,
}: CartSummaryProps) {
  if (!c) return null;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.bdr}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: t.fontFamily,
        boxShadow: t.sh,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.bdrL}`,
          fontSize: 13,
          fontWeight: 700,
          color: t.text,
        }}
      >
        🛍 Your Bag · {c.items.length} item{c.items.length !== 1 ? "s" : ""}
      </div>

      {/* Items */}
      <div style={{ padding: "6px 14px" }}>
        {c.items.map((item, i) => (
          <div
            key={item.name + i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 0",
              borderBottom: i < c.items.length - 1 ? `1px solid ${t.bdrL}` : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {item.emoji || "📦"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text }}>{item.name}</div>
              {item.variant && (
                <div style={{ fontSize: 9, color: t.t4 }}>{item.variant}</div>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>${item.price}</span>
          </div>
        ))}
      </div>

      {/* Promo code */}
      {c.promoCode && (
        <div
          style={{
            margin: "4px 14px",
            padding: "6px 10px",
            background: t.greenBg,
            border: `1px solid ${t.greenBdr}`,
            borderRadius: 8,
            fontSize: 10,
            color: t.green,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          🏷️ {c.promoCode} applied
        </div>
      )}

      {/* Breakdown */}
      <div style={{ padding: "8px 14px", borderTop: `1px solid ${t.bdrL}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10, color: t.t3 }}>
          <span>Subtotal</span>
          <span>${c.subtotal}</span>
        </div>
        {c.discount != null && c.discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10, color: t.green }}>
            <span>{c.discountLabel || "Discount"}</span>
            <span>-${c.discount}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 10, color: t.t3 }}>
          <span>Shipping</span>
          <span style={{ color: c.shipping === 0 ? t.green : t.t3 }}>
            {c.shipping === 0 ? "Free" : `$${c.shipping}`}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "6px 0 2px",
            borderTop: `1px solid ${t.bdrL}`,
            marginTop: 4,
            fontSize: 13,
            fontWeight: 800,
            color: t.text,
          }}
        >
          <span>Total</span>
          <span>${c.total}</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "8px 14px 14px" }}>
        <button
          onClick={onCheckout}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 10,
            border: "none",
            background: t.text,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: "pointer",
            fontFamily: t.fontFamily,
          }}
        >
          CHECKOUT — ${c.total}
        </button>
      </div>
    </div>
  );
}
