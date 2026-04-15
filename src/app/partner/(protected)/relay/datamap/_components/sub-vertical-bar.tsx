"use client";

import { ACCENT, theme } from "../constants";
import type { SubVerticalOption } from "../types";

interface SubVerticalBarProps {
  options: SubVerticalOption[];
  selected: string | null;
  onChange: (key: string) => void;
}

/**
 * Horizontal bar showing the active Business Category.
 * - 2+ options: dropdown to switch.
 * - Exactly 1 option: read-only label so the partner can see which
 *   category Content Studio is using (and notice when it has no config).
 */
export function SubVerticalBar({ options, selected, onChange }: SubVerticalBarProps) {
  if (options.length === 0) return null;
  const onlyOne = options.length === 1;
  const active = options.find((o) => o.key === selected) || options[0];

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
        flexWrap: "wrap",
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
        BUSINESS CATEGORY
      </span>

      {onlyOne ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: theme.t1,
            padding: "4px 8px",
            borderRadius: 6,
            background: "#fff",
            border: `1px solid ${theme.bdrL}`,
          }}
        >
          {active.label}
          {active.verticalId ? (
            <span style={{ fontWeight: 400, color: theme.t4, marginLeft: 4 }}>
              · {active.verticalId}
            </span>
          ) : (
            <span style={{ fontWeight: 600, color: theme.amber, marginLeft: 4 }}>
              · no config
            </span>
          )}
        </span>
      ) : (
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
      )}

      <span style={{ fontSize: 10, color: theme.t4 }}>
        {onlyOne
          ? "Add more Business Categories in your profile to switch storefronts."
          : "Pick which Business Category to load Content Studio for."}
      </span>
    </div>
  );
}
