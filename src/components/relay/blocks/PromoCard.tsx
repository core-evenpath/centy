"use client";
import React from "react";
import type { RelayTheme, PromoOffer } from "./types";
import { DEFAULT_THEME } from "./types";

interface PromoCardProps {
  items: PromoOffer[];
  theme?: RelayTheme;
  onClaim?: (promoId: string) => void;
}

export default function PromoCard({
  items,
  theme: t = DEFAULT_THEME,
  onClaim,
}: PromoCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item) => {
        const bg1 = item.color || t.accent;
        const bg2 = item.colorEnd || t.accentHi;
        return (
          <div
            key={item.id}
            style={{
              borderRadius: 14,
              background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
              padding: 18,
              color: "#fff",
              overflow: "hidden",
            }}
          >
            {item.emoji && (
              <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>
                {item.emoji}
              </span>
            )}
            {item.discount && (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 4,
                }}
              >
                {item.discount}
              </div>
            )}
            <div
              style={{
                fontFamily: t.headingFont,
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: 13,
                opacity: 0.9,
                lineHeight: 1.4,
                marginBottom: 12,
              }}
            >
              {item.description}
            </div>
            {item.code && (
              <div
                style={{
                  border: "2px dashed rgba(255,255,255,0.5)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  textAlign: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}
              >
                {item.code}
              </div>
            )}
            {item.validUntil && (
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginBottom: 10,
                }}
              >
                Valid until {item.validUntil}
              </div>
            )}
            <button
              onClick={() => onClaim?.(item.id)}
              style={{
                width: "100%",
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "#fff",
                color: bg1,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: t.fontFamily,
              }}
            >
              {item.ctaLabel || "Claim Offer"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
