"use client";
import React from "react";
import type { RelayTheme, ReorderData } from "./types";
import { DEFAULT_THEME } from "./types";

interface QuickReorderProps {
  data: ReorderData;
  theme?: RelayTheme;
  onReorder?: () => void;
}

export default function QuickReorder({
  data: d,
  theme: t = DEFAULT_THEME,
  onReorder,
}: QuickReorderProps) {
  if (!d) return null;

  return (
    <div
      style={{
        background: t.surface,
        border: `2px solid ${t.accent}`,
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
          fontSize: 12,
          fontWeight: 700,
          color: t.text,
        }}
      >
        ↻ Quick Reorder
        {d.daysSinceOrder != null && (
          <span style={{ fontWeight: 500, color: t.t3, marginLeft: 4, fontSize: 10 }}>
            — {d.daysSinceOrder} days ago
          </span>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "6px 14px" }}>
        {d.items.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              borderBottom: i < d.items.length - 1 ? `1px solid ${t.bdrL}` : "none",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: t.accentBg2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {item.emoji || "📦"}
            </div>
            <div style={{ flex: 1, fontSize: 11, color: t.text }}>{item.name}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>
              {d.currency}{item.price}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: "10px 14px 14px" }}>
        <button
          onClick={onReorder}
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
          Reorder All — {d.currency}{d.total}
        </button>
      </div>
    </div>
  );
}
