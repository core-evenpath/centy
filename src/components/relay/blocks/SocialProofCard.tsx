"use client";
import React from "react";
import type { RelayTheme, SocialProofData } from "./types";
import { DEFAULT_THEME } from "./types";

interface SocialProofCardProps {
  data: SocialProofData;
  theme?: RelayTheme;
}

export default function SocialProofCard({
  data: d,
  theme: t = DEFAULT_THEME,
}: SocialProofCardProps) {
  if (!d) return null;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.bdr}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: t.fontFamily,
        boxShadow: t.sh,
      }}
    >
      {/* Stats row */}
      {d.stats.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(d.stats.length, 3)}, 1fr)`,
            gap: 1,
            background: t.bdrL,
          }}
        >
          {d.stats.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "12px 8px",
                textAlign: "center",
                background: t.surface,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{s.value}</div>
              <div style={{ fontSize: 9, color: t.t3, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      {d.badges && d.badges.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            padding: "10px 14px",
            borderTop: `1px solid ${t.bdrL}`,
          }}
        >
          {d.badges.map((b) => (
            <span
              key={b}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 8,
                background: t.accentBg,
                color: t.accent,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Certifications */}
      {d.certifications && d.certifications.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            padding: "8px 14px 12px",
            borderTop: d.badges && d.badges.length > 0 ? "none" : `1px solid ${t.bdrL}`,
          }}
        >
          {d.certifications.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 6,
                background: t.greenBg,
                color: t.green,
              }}
            >
              ✓ {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
