"use client";
import React, { useState } from "react";
import type { RelayTheme, ContactMethod } from "./types";
import { DEFAULT_THEME } from "./types";

interface ContactCardProps {
  methods: ContactMethod[];
  theme?: RelayTheme;
  onContact?: (method: ContactMethod) => void;
}

export default function ContactCard({
  methods,
  theme: t = DEFAULT_THEME,
  onContact,
}: ContactCardProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const getMethodStyle = (method: ContactMethod, isHovered: boolean): React.CSSProperties => {
    const isWa = method.type === "whatsapp";
    return {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "11px 14px",
      borderRadius: 12,
      backgroundColor: isWa ? `rgba(37,211,102,0.06)` : t.surface,
      border: `1px solid ${isWa ? `rgba(37,211,102,0.20)` : isHovered ? t.accent : t.bdr}`,
      boxShadow: isHovered ? t.shM : t.sh,
      cursor: "pointer",
      fontFamily: t.fontFamily,
      transition: "border-color 0.15s, box-shadow 0.15s",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {methods.map((method, i) => (
        <button
          key={i}
          onClick={() => onContact?.(method)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={getMethodStyle(method, hoveredIdx === i)}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{method.icon}</span>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: t.text,
              }}
            >
              {method.label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: t.t3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {method.value}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
