"use client";
import React from "react";
import type { RelayTheme, ProductDetailData } from "./types";
import { DEFAULT_THEME } from "./types";

interface ProductDetailCardProps {
  product: ProductDetailData;
  theme?: RelayTheme;
  onAddToBag?: (id: string) => void;
}

export default function ProductDetailCard({
  product: p,
  theme: t = DEFAULT_THEME,
  onAddToBag,
}: ProductDetailCardProps) {
  if (!p) return null;
  const bg1 = p.color || t.accent;
  const bg2 = p.colorEnd || t.accentHi;
  const sizes = p.sizes || [];
  const selIdx = p.selectedSize ?? 0;

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
      {/* Gradient header */}
      <div
        style={{
          height: 85,
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {p.emoji && <span style={{ fontSize: 36 }}>{p.emoji}</span>}
        {p.badge && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
              letterSpacing: 0.3,
            }}
          >
            {p.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>
        {p.brand && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: t.accent,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            {p.brand}
          </div>
        )}
        <div
          style={{
            fontFamily: t.headingFont,
            fontSize: 15,
            fontWeight: 700,
            color: t.text,
            marginBottom: 4,
          }}
        >
          {p.name}
        </div>
        <div style={{ fontSize: 11, color: t.t3, lineHeight: 1.4, marginBottom: 10 }}>
          {p.description}
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: t.text }}>
            {p.currency} {p.price}
          </span>
          {p.originalPrice && (
            <span
              style={{
                fontSize: 12,
                color: t.t4,
                textDecoration: "line-through",
              }}
            >
              {p.currency} {p.originalPrice}
            </span>
          )}
        </div>

        {/* Rating */}
        {p.rating != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 10,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ fontSize: 12, color: i < Math.round(p.rating!) ? "#FFD666" : t.t5 }}>
                ★
              </span>
            ))}
            <span style={{ fontSize: 10, color: t.t3, marginLeft: 2 }}>
              {p.rating} ({p.reviewCount ?? 0})
            </span>
          </div>
        )}

        {/* Size selector */}
        {sizes.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: t.t4, letterSpacing: 0.5, marginBottom: 5 }}>
              SIZE
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {sizes.map((sz, i) => (
                <span
                  key={sz}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: `1.5px solid ${i === selIdx ? t.accent : t.bdr}`,
                    background: i === selIdx ? t.accentBg : "transparent",
                    color: i === selIdx ? t.accent : t.t2,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {sz}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {p.features && p.features.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {p.features.map((f) => (
              <div
                key={f}
                style={{
                  fontSize: 10,
                  color: t.t3,
                  padding: "2px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ color: t.green, fontSize: 10 }}>✓</span> {f}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onAddToBag?.(p.id)}
          style={{
            width: "100%",
            padding: "11px 0",
            borderRadius: 10,
            border: "none",
            background: t.text,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: t.fontFamily,
          }}
        >
          {p.ctaLabel || `Add to Bag — ${p.currency} ${p.price}`}
        </button>

        {/* Trust badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 10,
            fontSize: 9,
            color: t.t4,
          }}
        >
          <span>🚚 Free shipping $50+</span>
          <span>🐰 Cruelty-free</span>
          <span>🌿 Clean formula</span>
        </div>
      </div>
    </div>
  );
}
