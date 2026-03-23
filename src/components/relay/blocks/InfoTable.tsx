"use client";
import React from "react";
import type { RelayTheme, InfoItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface InfoTableProps {
  items: InfoItem[];
  theme?: RelayTheme;
}

export default function InfoTable({
  items,
  theme: t = DEFAULT_THEME,
}: InfoTableProps) {
  return (
    <div
      style={{
        borderRadius: 14,
        backgroundColor: t.surface,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.sh,
        overflow: "hidden",
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "9px 14px",
            backgroundColor: i % 2 === 0 ? t.bg : "transparent",
            borderBottom: i < items.length - 1 ? `1px solid ${t.bdrL}` : "none",
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              color: t.t3,
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontSize: 12.5,
              color: t.text,
              fontWeight: 600,
              maxWidth: "58%",
              textAlign: "right",
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
