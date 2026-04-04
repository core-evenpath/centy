"use client";
import React, { useState } from "react";
import type { RelayTheme, FeedbackData } from "./types";
import { DEFAULT_THEME } from "./types";

interface FeedbackRequestProps {
  data: FeedbackData;
  theme?: RelayTheme;
  onRate?: (stars: number) => void;
}

export default function FeedbackRequest({
  data: d,
  theme: t = DEFAULT_THEME,
  onRate,
}: FeedbackRequestProps) {
  if (!d) return null;
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const maxStars = d.maxStars || 5;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.bdr}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: t.fontFamily,
        boxShadow: t.sh,
        textAlign: "center",
        padding: "18px 14px",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>
        How&apos;s the {d.productName} working?
      </div>
      {d.deliveredAgo && (
        <div style={{ fontSize: 10, color: t.t3, marginBottom: 14 }}>
          Delivered {d.deliveredAgo}
        </div>
      )}

      {/* Stars */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {Array.from({ length: maxStars }).map((_, i) => {
          const starNum = i + 1;
          const active = starNum <= (hovered || selected);
          return (
            <span
              key={i}
              onMouseEnter={() => setHovered(starNum)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => {
                setSelected(starNum);
                onRate?.(starNum);
              }}
              style={{
                fontSize: 28,
                cursor: "pointer",
                color: active ? "#FFD666" : t.t5,
                transition: "color 0.1s",
              }}
            >
              ★
            </span>
          );
        })}
      </div>

      <div style={{ fontSize: 9, color: t.t4 }}>
        Tap a star
        {d.rewardPoints ? ` · Earn ${d.rewardPoints} reward points` : ""}
      </div>
    </div>
  );
}
