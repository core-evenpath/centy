"use client";
import React from "react";
import type { RelayTheme, ShadeOption, ShadeMatch } from "./types";
import { DEFAULT_THEME } from "./types";

interface ShadeFinderCardProps {
  options: ShadeOption[];
  match?: ShadeMatch;
  theme?: RelayTheme;
  onAdd?: () => void;
  color?: string;
}

export default function ShadeFinderCard({
  options,
  match,
  theme: t = DEFAULT_THEME,
  onAdd,
  color,
}: ShadeFinderCardProps) {
  const ac = color || t.accent;

  return (
    <div
      style={{
        background: t.surface,
        border: `2px solid ${ac}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: t.fontFamily,
        boxShadow: t.sh,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.bdrL}`,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>🎨 Shade Finder</div>
        <div style={{ fontSize: 10, color: t.t3, marginTop: 2 }}>
          Find your perfect match
        </div>
      </div>

      {/* Undertone label */}
      <div style={{ padding: "10px 14px 6px" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: t.t4,
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          WHAT&apos;S YOUR UNDERTONE?
        </div>

        {/* Options row */}
        <div style={{ display: "flex", gap: 8 }}>
          {options.map((opt) => (
            <div
              key={opt.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: opt.gradient,
                  border: `2px solid ${opt.selected ? ac : t.bdr}`,
                  boxShadow: opt.selected ? `0 0 0 2px ${ac}` : "none",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: opt.selected ? 700 : 500,
                  color: opt.selected ? ac : t.t3,
                }}
              >
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Match result */}
      {match && (
        <div
          style={{
            margin: "10px 14px 14px",
            padding: 12,
            background: t.warm,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: match.swatchGradient,
              flexShrink: 0,
              border: `2px solid ${t.bdr}`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{match.name}</div>
            <div style={{ fontSize: 10, color: t.t3 }}>{match.subtitle}</div>
          </div>
          <button
            onClick={onAdd}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: ac,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: t.fontFamily,
            }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
