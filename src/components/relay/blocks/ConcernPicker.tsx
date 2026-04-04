"use client";
import React from "react";
import type { RelayTheme, ConcernOption } from "./types";
import { DEFAULT_THEME } from "./types";

interface ConcernPickerProps {
  items: ConcernOption[];
  theme?: RelayTheme;
  onSelect?: (id: string) => void;
}

export default function ConcernPicker({
  items,
  theme: t = DEFAULT_THEME,
  onSelect,
}: ConcernPickerProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8,
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect?.(item.id)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            padding: "12px 6px",
            borderRadius: 12,
            border: `1px solid ${t.bdr}`,
            background: t.surface,
            cursor: "pointer",
            fontFamily: t.fontFamily,
            boxShadow: t.sh,
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: t.t2,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
