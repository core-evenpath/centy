"use client";
import React from "react";
import type { RelayTheme, ConfirmationData } from "./types";
import { DEFAULT_THEME } from "./types";

interface OrderConfirmationProps {
  data: ConfirmationData;
  theme?: RelayTheme;
}

export default function OrderConfirmation({
  data: d,
  theme: t = DEFAULT_THEME,
}: OrderConfirmationProps) {
  if (!d) return null;

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
      {/* Success header */}
      <div
        style={{
          background: t.greenBg,
          padding: "16px 14px",
          textAlign: "center",
          borderBottom: `1px solid ${t.greenBdr}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: t.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 8px",
            color: "#fff",
            fontSize: 18,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.text, marginBottom: 2 }}>
          Order Confirmed!
        </div>
        <div style={{ fontSize: 10, color: t.t3 }}>Order #{d.orderId}</div>
      </div>

      {/* Items */}
      <div style={{ padding: "8px 14px" }}>
        {d.items.map((item, i) => (
          <div
            key={item.name + i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: i < d.items.length - 1 ? `1px solid ${t.bdrL}` : "none",
              fontSize: 11,
            }}
          >
            <span style={{ color: t.t2 }}>{item.name}</span>
            <span style={{ fontWeight: 600, color: t.text }}>{item.price}</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 0 4px",
            borderTop: `1px solid ${t.bdrL}`,
            marginTop: 4,
            fontSize: 13,
            fontWeight: 800,
            color: t.text,
          }}
        >
          <span>Total</span>
          <span>{d.currency} {d.total}</span>
        </div>
      </div>

      {/* Shipping info */}
      {(d.shipping || d.estimatedDelivery) && (
        <div
          style={{
            margin: "4px 14px 14px",
            padding: "10px 12px",
            background: t.warm,
            borderRadius: 10,
            fontSize: 10,
            color: t.t2,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {d.shipping && (
            <div>
              <span style={{ fontWeight: 600 }}>Shipping:</span> {d.shipping}
            </div>
          )}
          {d.estimatedDelivery && (
            <div>
              <span style={{ fontWeight: 600 }}>Estimated Delivery:</span> {d.estimatedDelivery}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
