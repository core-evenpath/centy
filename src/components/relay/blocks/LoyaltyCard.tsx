"use client";
import React from "react";
import type { RelayTheme, LoyaltyData } from "./types";
import { DEFAULT_THEME } from "./types";

interface LoyaltyCardProps {
  data: LoyaltyData;
  theme?: RelayTheme;
  onRedeem?: () => void;
}

export default function LoyaltyCard({
  data: d,
  theme: t = DEFAULT_THEME,
  onRedeem,
}: LoyaltyCardProps) {
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
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.bdrL}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13, color: t.accent }}>✦</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{d.tierName}</span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: t.accentBg,
            color: t.accent,
          }}
        >
          {d.points.toLocaleString()} pts
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: t.bdrL,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(d.progressPercent, 100)}%`,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${t.accent}, ${t.accentHi})`,
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: t.t4 }}>
          <span>{d.tierName}</span>
          {d.nextTier && (
            <span>
              {d.pointsToNext?.toLocaleString()} pts to {d.nextTier}
            </span>
          )}
        </div>
      </div>

      {/* Perks */}
      {d.perks && d.perks.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(d.perks.length, 3)}, 1fr)`,
            gap: 6,
            padding: "0 14px 12px",
          }}
        >
          {d.perks.map((perk) => (
            <div
              key={perk.label}
              style={{
                padding: "8px 6px",
                borderRadius: 8,
                background: perk.color || t.warm,
                textAlign: "center",
              }}
            >
              {perk.emoji && <div style={{ fontSize: 14, marginBottom: 3 }}>{perk.emoji}</div>}
              <div style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{perk.value}</div>
              <div style={{ fontSize: 8, color: t.t3, marginTop: 1 }}>{perk.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Redeem */}
      {d.redeemableValue && (
        <div style={{ padding: "0 14px 14px" }}>
          <button
            onClick={onRedeem}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: t.accent,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: t.fontFamily,
            }}
          >
            Redeem {d.redeemableValue}
          </button>
        </div>
      )}
    </div>
  );
}
