"use client";
import React from "react";
import type { RelayTheme, BundleData } from "./types";
import { DEFAULT_THEME } from "./types";

interface BundleCardProps {
  bundle: BundleData;
  theme?: RelayTheme;
  onAdd?: () => void;
}

export default function BundleCard({
  bundle: b,
  theme: t = DEFAULT_THEME,
  onAdd,
}: BundleCardProps) {
  if (!b) return null;
  const bg1 = b.color || t.accent;
  const bg2 = b.colorEnd || t.accentHi;
  const savings = b.originalTotal - b.bundlePrice;

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
      {/* Gradient header */}
      <div
        style={{
          height: 60,
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
        }}
      >
        <div style={{ fontFamily: t.headingFont, fontSize: 14, fontWeight: 700, color: "#fff" }}>
          {b.title}
        </div>
        {b.badge && (
          <span
            style={{
              background: "rgba(0,0,0,0.2)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            {b.badge}
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "10px 14px" }}>
        {b.subtitle && (
          <div style={{ fontSize: 10, color: t.t3, marginBottom: 8 }}>{b.subtitle}</div>
        )}
        {b.items.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: i < b.items.length - 1 ? `1px solid ${t.bdrL}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: t.accentBg2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: t.accent,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 11, color: t.text }}>{item.name}</span>
            </div>
            <span style={{ fontSize: 10, color: t.t4, textDecoration: "line-through" }}>
              ${item.price}
            </span>
          </div>
        ))}
      </div>

      {/* Savings */}
      <div
        style={{
          margin: "0 14px",
          padding: "8px 10px",
          background: t.greenBg,
          border: `1px solid ${t.greenBdr}`,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, color: t.green }}>
          Bundle price
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>${b.bundlePrice}</span>
          <span style={{ fontSize: 9, color: t.green, fontWeight: 600 }}>Save ${savings}</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "12px 14px" }}>
        <button
          onClick={onAdd}
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
          Add Set to Bag
        </button>
      </div>
    </div>
  );
}
