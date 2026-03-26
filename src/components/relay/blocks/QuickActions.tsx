"use client";
import React, { useState } from "react";
import type { RelayTheme, QuickAction } from "./types";
import { DEFAULT_THEME } from "./types";

interface QuickActionsProps {
  items: QuickAction[];
  theme?: RelayTheme;
  onAction?: (prompt: string) => void;
  layout?: "grid" | "list";
}

export default function QuickActions({
  items,
  theme: t = DEFAULT_THEME,
  onAction,
  layout = "grid",
}: QuickActionsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      style={{
        display: layout === "grid" ? "grid" : "flex",
        gridTemplateColumns: layout === "grid" ? "1fr 1fr" : undefined,
        flexDirection: layout === "list" ? "column" : undefined,
        gap: 8,
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item) => {
        const isHovered = hoveredId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onAction?.(item.prompt)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              border: `1px solid ${t.bdr}`,
              backgroundColor: t.surface,
              boxShadow: isHovered ? t.shM : t.sh,
              cursor: "pointer",
              fontFamily: t.fontFamily,
              textAlign: "left",
              transition: "box-shadow 0.15s",
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                {item.label}
              </div>
              {item.description && (
                <div style={{ fontSize: 11, color: t.t3, marginTop: 2 }}>
                  {item.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
