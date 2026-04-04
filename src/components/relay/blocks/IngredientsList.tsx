"use client";
import React from "react";
import type { RelayTheme, IngredientItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface IngredientsListProps {
  items: IngredientItem[];
  theme?: RelayTheme;
  certifications?: string[];
}

export default function IngredientsList({
  items,
  theme: t = DEFAULT_THEME,
  certifications,
}: IngredientsListProps) {
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
          fontSize: 12,
          fontWeight: 700,
          color: t.text,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>🧪</span>
        Key Ingredients
      </div>

      {/* Items */}
      <div style={{ padding: "8px 14px" }}>
        {items.map((item, i) => (
          <div
            key={item.name}
            style={{
              padding: "8px 0",
              borderBottom: i < items.length - 1 ? `1px solid ${t.bdrL}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{item.name}</span>
              {item.concentration && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: t.accent,
                    background: t.accentBg,
                    padding: "2px 6px",
                    borderRadius: 6,
                  }}
                >
                  {item.concentration}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: t.t3, lineHeight: 1.4 }}>{item.role}</div>
          </div>
        ))}
      </div>

      {/* Certifications footer */}
      {certifications && certifications.length > 0 && (
        <div
          style={{
            padding: "8px 14px",
            borderTop: `1px solid ${t.bdrL}`,
            fontSize: 9,
            color: t.t4,
            textAlign: "center",
          }}
        >
          {certifications.join(" · ")}
        </div>
      )}
    </div>
  );
}
