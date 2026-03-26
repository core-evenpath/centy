"use client";
import React from "react";
import type { RelayTheme, PricingTier } from "./types";
import { DEFAULT_THEME } from "./types";

interface PricingTableProps {
  items: PricingTier[];
  theme?: RelayTheme;
  onSelect?: (tierId: string) => void;
  headerLabel?: string;
}

export default function PricingTable({
  items,
  theme: t = DEFAULT_THEME,
  onSelect,
  headerLabel,
}: PricingTableProps) {
  return (
    <div style={{ fontFamily: t.fontFamily }}>
      {headerLabel && (
        <div
          style={{
            fontFamily: t.headingFont,
            fontSize: 16,
            fontWeight: 700,
            color: t.text,
            marginBottom: 10,
          }}
        >
          {headerLabel}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
        }}
      >
        {items.map((tier) => (
          <div
            key={tier.id}
            style={{
              flex: "1 1 0",
              minWidth: 160,
              borderRadius: 14,
              border: `${tier.isPopular ? 2 : 1}px solid ${tier.isPopular ? t.accent : t.bdr}`,
              boxShadow: tier.isPopular ? t.shM : t.sh,
              backgroundColor: t.surface,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {tier.isPopular && (
              <div
                style={{
                  background: t.accent,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: "center",
                  padding: "4px 0",
                  letterSpacing: 0.5,
                }}
              >
                Most Popular
              </div>
            )}
            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              {tier.emoji && (
                <span style={{ fontSize: 36, marginBottom: 8 }}>{tier.emoji}</span>
              )}
              <div
                style={{
                  fontFamily: t.headingFont,
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.text,
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                {tier.name}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: t.accent,
                  marginBottom: 2,
                }}
              >
                {tier.currency} {tier.price.toLocaleString()}
              </div>
              {tier.unit && (
                <div style={{ fontSize: 11, color: t.t3, marginBottom: 12 }}>
                  {tier.unit}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  borderTop: `1px solid ${t.bdrL}`,
                  paddingTop: 10,
                  marginBottom: 14,
                  flex: 1,
                }}
              >
                {tier.features.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                      fontSize: 12,
                      color: t.t2,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: t.green, fontWeight: 700, flexShrink: 0 }}>
                      ✓
                    </span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onSelect?.(tier.id)}
                style={{
                  width: "100%",
                  background: t.accent,
                  color: "#fff",
                  borderRadius: 10,
                  padding: "10px 20px",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: t.fontFamily,
                }}
              >
                Select {tier.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
