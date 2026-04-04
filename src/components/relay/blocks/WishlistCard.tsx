"use client";
import React from "react";
import type { RelayTheme, WishlistItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface WishlistCardProps {
  items: WishlistItem[];
  theme?: RelayTheme;
  onAdd?: (index: number) => void;
}

export default function WishlistCard({
  items,
  theme: t = DEFAULT_THEME,
  onAdd,
}: WishlistCardProps) {
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
        ♡ Saved Items · {items.length}
      </div>

      {/* Items */}
      <div style={{ padding: "4px 14px" }}>
        {items.map((item, i) => (
          <div
            key={item.name + i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 0",
              borderBottom: i < items.length - 1 ? `1px solid ${t.bdrL}` : "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: t.accentBg2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {item.emoji || "✨"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.text }}>{item.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.text }}>${item.price}</span>
                {item.originalPrice && (
                  <span style={{ fontSize: 9, color: t.t4, textDecoration: "line-through" }}>
                    ${item.originalPrice}
                  </span>
                )}
              </div>
            </div>
            {item.flag && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 5,
                  background: item.flagColor || t.accentBg,
                  color: item.flagColor ? "#fff" : t.accent,
                  marginRight: 4,
                }}
              >
                {item.flag}
              </span>
            )}
            <button
              onClick={() => onAdd?.(i)}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: "none",
                background: t.text,
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: t.fontFamily,
              }}
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
