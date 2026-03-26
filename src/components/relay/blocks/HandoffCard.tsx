"use client";
import React, { useState } from "react";
import type { RelayTheme, HandoffOption } from "./types";
import { DEFAULT_THEME } from "./types";

interface HandoffCardProps {
  options: HandoffOption[];
  theme?: RelayTheme;
  title?: string;
  subtitle?: string;
  onSelect?: (option: HandoffOption) => void;
}

export default function HandoffCard({
  options,
  theme: t = DEFAULT_THEME,
  title = "Talk to our team",
  subtitle,
  onSelect,
}: HandoffCardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getBorderColor = (type: HandoffOption["type"]) => {
    switch (type) {
      case "whatsapp":
        return t.wa;
      case "phone":
        return t.blue;
      default:
        return t.accent;
    }
  };

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.sh,
        backgroundColor: t.surface,
        padding: 18,
        fontFamily: t.fontFamily,
      }}
    >
      <div
        style={{
          fontFamily: t.headingFont,
          fontSize: 16,
          fontWeight: 700,
          color: t.text,
          marginBottom: subtitle ? 2 : 12,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: t.t3, marginBottom: 12 }}>
          {subtitle}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => {
          const isHovered = hoveredId === opt.id;
          const leftColor = getBorderColor(opt.type);
          return (
            <button
              key={opt.id}
              onClick={() => onSelect?.(opt)}
              onMouseEnter={() => setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "11px 14px",
                borderRadius: 12,
                border: `1px solid ${t.bdr}`,
                borderLeft: `4px solid ${leftColor}`,
                backgroundColor: t.surface,
                boxShadow: isHovered ? t.shM : t.sh,
                cursor: "pointer",
                fontFamily: t.fontFamily,
                textAlign: "left",
                transition: "box-shadow 0.15s",
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                  {opt.label}
                </div>
                {opt.description && (
                  <div style={{ fontSize: 11, color: t.t3, marginTop: 1 }}>
                    {opt.description}
                  </div>
                )}
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.t4}
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
