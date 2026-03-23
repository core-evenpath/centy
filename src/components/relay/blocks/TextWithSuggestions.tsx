"use client";
import React, { useState } from "react";
import type { RelayTheme } from "./types";
import { DEFAULT_THEME } from "./types";

interface TextWithSuggestionsProps {
  text: string;
  suggestions?: string[];
  theme?: RelayTheme;
  onSuggestionClick?: (suggestion: string) => void;
}

export default function TextWithSuggestions({
  text,
  suggestions,
  theme: t = DEFAULT_THEME,
  onSuggestionClick,
}: TextWithSuggestionsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: t.fontFamily }}>
      <div
        style={{
          padding: "11px 14px",
          borderRadius: "18px 18px 18px 6px",
          backgroundColor: t.surface,
          border: `1px solid ${t.bdr}`,
          boxShadow: t.sh,
          fontSize: 13.5,
          lineHeight: 1.65,
          color: t.text,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
      {suggestions && suggestions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginTop: 8,
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick?.(s)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                backgroundColor: hoveredIdx === i ? t.accentBg2 : t.accentBg,
                border: `1px solid ${t.bdr}`,
                color: t.text,
                fontSize: 12,
                fontWeight: 550,
                fontFamily: t.fontFamily,
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
