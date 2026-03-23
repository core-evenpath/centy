"use client";
import React, { useState } from "react";
import type { RelayTheme, GalleryItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface GalleryGridProps {
  items: GalleryItem[];
  theme?: RelayTheme;
  onItemClick?: (index: number) => void;
}

export default function GalleryGrid({
  items,
  theme: t = DEFAULT_THEME,
  onItemClick,
}: GalleryGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 5,
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item, i) => {
        const isWide = (item.span ?? 1) > 1;
        return (
          <div
            key={i}
            onClick={() => onItemClick?.(i)}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              gridColumn: isWide ? `span ${item.span}` : undefined,
              aspectRatio: isWide ? undefined : "1 / 1",
              minHeight: 56,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${t.warm}, ${t.surface})`,
              border: `1px solid ${hoveredIdx === i ? t.accent : t.bdr}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <span style={{ fontSize: isWide ? 32 : 22 }}>{item.emoji}</span>
            <span
              style={{
                fontSize: 10,
                color: t.t3,
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
