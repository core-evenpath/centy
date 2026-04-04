"use client";
import React from "react";
import type { RelayTheme, CheckoutData } from "./types";
import { DEFAULT_THEME } from "./types";

interface CheckoutCardProps {
  data: CheckoutData;
  theme?: RelayTheme;
  onPay?: (method: string) => void;
}

export default function CheckoutCard({
  data: d,
  theme: t = DEFAULT_THEME,
  onPay,
}: CheckoutCardProps) {
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
      {/* Header */}
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Payment</div>
      </div>

      {/* Methods */}
      <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {d.methods.map((m) => (
          <div
            key={m.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${m.selected ? t.accent : t.bdr}`,
              background: m.bgColor || (m.selected ? t.accentBg : t.surface),
              cursor: "pointer",
            }}
          >
            {/* Radio */}
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `2px solid ${m.selected ? t.accent : t.t5}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {m.selected && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: t.accent,
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{m.label}</div>
              <div style={{ fontSize: 9, color: t.t3 }}>{m.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 10px" }}>
        <button
          onClick={() => {
            const sel = d.methods.find((m) => m.selected);
            onPay?.(sel?.label || d.methods[0]?.label || "card");
          }}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 10,
            border: "none",
            background: t.text,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: t.fontFamily,
          }}
        >
          Pay {d.currency} {d.total}
        </button>
      </div>

      {/* Security footer */}
      <div
        style={{
          padding: "8px 14px",
          borderTop: `1px solid ${t.bdrL}`,
          textAlign: "center",
          fontSize: 9,
          color: t.t4,
        }}
      >
        🔒 Secured by Stripe · 256-bit encryption
      </div>
    </div>
  );
}
