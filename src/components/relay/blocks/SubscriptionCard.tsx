"use client";
import React from "react";
import type { RelayTheme, SubscriptionData } from "./types";
import { DEFAULT_THEME } from "./types";

interface SubscriptionCardProps {
  data: SubscriptionData;
  theme?: RelayTheme;
  onSubscribe?: (frequency: string) => void;
}

export default function SubscriptionCard({
  data: d,
  theme: t = DEFAULT_THEME,
  onSubscribe,
}: SubscriptionCardProps) {
  if (!d) return null;
  const ac = d.color || t.accent;
  const selected = d.frequencies.find((f) => f.selected) || d.frequencies[0];

  return (
    <div
      style={{
        background: t.surface,
        border: `2px solid ${ac}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: t.fontFamily,
        boxShadow: t.sh,
      }}
    >
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${t.bdrL}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>↻ Subscribe &amp; Save</div>
      </div>

      {/* Product */}
      <div
        style={{
          margin: "10px 14px",
          padding: "10px 12px",
          background: t.warm,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${ac}, ${t.accentHi})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {d.emoji || "📦"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{d.productName}</div>
          {d.productDesc && <div style={{ fontSize: 9, color: t.t3 }}>{d.productDesc}</div>}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.t3 }}>
          {d.currency}{d.oneTimePrice}
        </span>
      </div>

      {/* Frequencies */}
      <div style={{ padding: "0 14px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {d.frequencies.map((f) => (
          <div
            key={f.label}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${f.selected ? ac : t.bdr}`,
              background: f.selected ? t.accentBg : t.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: f.selected ? ac : t.text }}>
                {f.label}
              </div>
              <div style={{ fontSize: 9, color: t.green, fontWeight: 600, marginTop: 1 }}>
                {f.discount}
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{f.price}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 10px" }}>
        <button
          onClick={() => onSubscribe?.(selected?.label || "")}
          style={{
            width: "100%",
            padding: "10px 0",
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
          Subscribe — {selected?.price || `${d.currency}${d.oneTimePrice}`}/month
        </button>
      </div>

      <div style={{ padding: "0 14px 12px", textAlign: "center", fontSize: 9, color: t.t4 }}>
        Skip, swap, or cancel anytime
      </div>
    </div>
  );
}
