"use client";
import React from "react";
import type { RelayTheme, Testimonial } from "./types";
import { DEFAULT_THEME } from "./types";

interface TestimonialCardsProps {
  items: Testimonial[];
  theme?: RelayTheme;
  layout?: "stack" | "carousel";
}

export default function TestimonialCards({
  items,
  theme: t = DEFAULT_THEME,
  layout = "stack",
}: TestimonialCardsProps) {
  const renderStars = (rating: number) => (
    <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ fontSize: 14, color: i <= rating ? "#FFD666" : t.t5 }}
        >
          {i <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: layout === "stack" ? "column" : "row",
        gap: 10,
        overflowX: layout === "carousel" ? "auto" : undefined,
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            borderRadius: 14,
            backgroundColor: t.warm,
            border: `1px solid ${t.bdrL}`,
            padding: 16,
            minWidth: layout === "carousel" ? 260 : undefined,
            flexShrink: layout === "carousel" ? 0 : undefined,
          }}
        >
          <div style={{ fontSize: 28, color: t.t4, lineHeight: 1, marginBottom: 4 }}>
            &ldquo;
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.t2,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            {item.text}
          </div>
          {item.rating !== undefined && renderStars(item.rating)}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid ${t.bdrL}`,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: t.accentBg2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: t.accent,
                flexShrink: 0,
              }}
            >
              {item.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                {item.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {item.date && (
                  <span style={{ fontSize: 11, color: t.t4 }}>{item.date}</span>
                )}
                {item.source && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: t.accent,
                      backgroundColor: t.accentBg,
                      padding: "2px 6px",
                      borderRadius: 6,
                    }}
                  >
                    {item.source}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
