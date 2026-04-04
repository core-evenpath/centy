"use client";
import React, { useState } from "react";
import type { RelayTheme, GiftCardData } from "./types";
import { DEFAULT_THEME } from "./types";

interface GiftCardBlockProps {
  data: GiftCardData;
  theme?: RelayTheme;
  onSend?: (amount: number) => void;
}

export default function GiftCardBlock({
  data: d,
  theme: t = DEFAULT_THEME,
  onSend,
}: GiftCardBlockProps) {
  if (!d) return null;
  const [selIdx, setSelIdx] = useState(d.selectedIndex ?? 0);
  const bg1 = d.color || t.accent;
  const bg2 = d.colorEnd || t.accentHi;
  const amount = d.amounts[selIdx] ?? d.amounts[0] ?? 0;

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
          height: 50,
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: t.headingFont,
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: 0.5,
          }}
        >
          {d.brandName || "Gift Card"}
        </span>
      </div>

      <div style={{ padding: 14 }}>
        {/* Amount selector */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: t.t4,
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          SELECT AMOUNT
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {d.amounts.map((amt, i) => (
            <button
              key={amt}
              onClick={() => setSelIdx(i)}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 8,
                border: `1.5px solid ${i === selIdx ? t.accent : t.bdr}`,
                background: i === selIdx ? t.accentBg : "transparent",
                color: i === selIdx ? t.accent : t.t2,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: t.fontFamily,
              }}
            >
              {d.currency}{amt}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => onSend?.(amount)}
          style={{
            width: "100%",
            padding: "10px 0",
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
          Send Gift Card — {d.currency}{amount}
        </button>

        <div
          style={{
            textAlign: "center",
            fontSize: 9,
            color: t.t4,
            marginTop: 8,
          }}
        >
          ✉ Delivered instantly via email
        </div>
      </div>
    </div>
  );
}
