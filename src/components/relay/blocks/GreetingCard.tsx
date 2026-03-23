"use client";
import React, { useState } from "react";
import type { RelayTheme } from "./types";
import { DEFAULT_THEME } from "./types";

interface GreetingCardProps {
  brandName: string;
  brandEmoji?: string;
  tagline?: string;
  quickActions?: Array<{ icon: string; label: string; prompt: string }>;
  theme?: RelayTheme;
  onAction?: (prompt: string) => void;
}

export default function GreetingCard({
  brandName,
  brandEmoji,
  tagline,
  quickActions,
  theme: t = DEFAULT_THEME,
  onAction,
}: GreetingCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: t.surface,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.shM,
        overflow: "hidden",
        fontFamily: t.fontFamily,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 60,
          background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {brandEmoji ? (
          <span style={{ fontSize: 30 }}>{brandEmoji}</span>
        ) : (
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: t.headingFont,
            }}
          >
            {brandName.charAt(0)}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>
        <div
          style={{
            fontFamily: t.headingFont,
            fontSize: 17,
            fontWeight: 700,
            color: t.text,
          }}
        >
          {brandName}
        </div>
        {tagline && (
          <div
            style={{
              fontSize: 12.5,
              color: t.t2,
              marginTop: 3,
              lineHeight: 1.5,
            }}
          >
            {tagline}
          </div>
        )}

        {/* Quick actions */}
        {quickActions && quickActions.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginTop: 12,
            }}
          >
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction?.(action.prompt)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: t.warm,
                  border: `1px solid ${hoveredIdx === i ? t.accent : t.bdrL}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: t.fontFamily,
                  transition: "border-color 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{action.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 550,
                    color: t.text,
                    textAlign: "left",
                  }}
                >
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
