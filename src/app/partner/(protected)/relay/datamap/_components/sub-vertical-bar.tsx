"use client";

import { ACCENT, theme } from "../constants";
import type { SubVerticalOption } from "../types";

interface SubVerticalBarProps {
  options: SubVerticalOption[];
  selected: string | null;
  onChange: (key: string) => void;
}

/**
 * Horizontal bar for selecting the active sub-vertical.
 * Only renders when there are 2+ options.
 */
export function SubVerticalBar({ options, selected, onChange }: SubVerticalBarProps) {
  if (options.length <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 20px",
        borderBottom: `1px solid ${theme.bdrL}`,
        background: theme.accentBg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: ACCENT,
          letterSpacing: 0.5,
        }}
      >
        SUB-VERTICAL
      </span>
      <select
        value={selected || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 12,
          padding: "4px 8px",
          borderRadius: 6,
          border: `1px solid ${theme.bdrM}`,
          background: "#fff",
          color: theme.t1,
          cursor: "pointer",
          minWidth: 200,
        }}
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key} disabled={!opt.verticalId}>
            {opt.label}
            {opt.verticalId ? ` · ${opt.verticalId}` : " · (no config)"}
          </option>
        ))}
      </select>
      <span style={{ fontSize: 10, color: theme.t4 }}>
        Pick which business category to load Content Studio for.
      </span>
    </div>
  );
}
