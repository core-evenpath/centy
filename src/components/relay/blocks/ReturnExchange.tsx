"use client";
import React from "react";
import type { RelayTheme, ReturnData } from "./types";
import { DEFAULT_THEME } from "./types";

interface ReturnExchangeProps {
  data: ReturnData;
  theme?: RelayTheme;
  onSubmit?: (option: string) => void;
}

export default function ReturnExchange({
  data: d,
  theme: t = DEFAULT_THEME,
  onSubmit,
}: ReturnExchangeProps) {
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
          fontSize: 13,
          fontWeight: 700,
          color: t.text,
        }}
      >
        ↩ Return / Exchange
      </div>

      {/* Product info */}
      <div
        style={{
          margin: "10px 14px",
          padding: "10px 12px",
          background: t.warm,
          borderRadius: 10,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{d.productName}</div>
        <div style={{ fontSize: 9, color: t.t4, marginTop: 2 }}>
          Order #{d.orderId}
          {d.deliveredDate && ` · Delivered ${d.deliveredDate}`}
        </div>
      </div>

      {/* Reasons */}
      <div style={{ padding: "4px 14px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: t.t4, letterSpacing: 0.5, marginBottom: 6 }}>
          REASON
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {d.reasons.map((r) => (
            <span
              key={r.label}
              style={{
                padding: "5px 10px",
                borderRadius: 14,
                border: `1px solid ${r.selected ? t.accent : t.bdr}`,
                background: r.selected ? t.accentBg : "transparent",
                color: r.selected ? t.accent : t.t2,
                fontSize: 10,
                fontWeight: r.selected ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Options */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: d.options.length === 3 ? "1fr 1fr 1fr" : `repeat(${d.options.length}, 1fr)`,
          gap: 6,
          padding: "4px 14px 10px",
        }}
      >
        {d.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSubmit?.(opt.label)}
            style={{
              padding: "10px 6px",
              borderRadius: 10,
              border: `1.5px solid ${opt.selected ? t.accent : t.bdr}`,
              background: opt.selected ? t.accentBg : t.surface,
              cursor: "pointer",
              fontFamily: t.fontFamily,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: opt.selected ? t.accent : t.text }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 8, color: t.t4, marginTop: 2 }}>{opt.subtitle}</div>
          </button>
        ))}
      </div>

      {/* Policy note */}
      {d.policyNote && (
        <div
          style={{
            margin: "0 14px 10px",
            padding: "8px 10px",
            background: t.greenBg,
            border: `1px solid ${t.greenBdr}`,
            borderRadius: 8,
            fontSize: 9,
            color: t.green,
          }}
        >
          {d.policyNote}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "0 14px 14px" }}>
        <button
          onClick={() => onSubmit?.("label")}
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
          Generate Prepaid Label
        </button>
      </div>
    </div>
  );
}
