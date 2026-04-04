"use client";
import React from "react";
import type { RelayTheme, BookingData } from "./types";
import { DEFAULT_THEME } from "./types";

interface ConsultationBookingProps {
  data: BookingData;
  theme?: RelayTheme;
  onBook?: (slot: string) => void;
}

export default function ConsultationBooking({
  data: d,
  theme: t = DEFAULT_THEME,
  onBook,
}: ConsultationBookingProps) {
  if (!d) return null;
  const ac = d.color || t.accent;
  const selectedSlot = d.slots.find((s) => s.selected);

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
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{d.title}</div>
        {d.subtitle && (
          <div style={{ fontSize: 10, color: t.t3, marginTop: 2 }}>{d.subtitle}</div>
        )}
      </div>

      {/* Time slots */}
      <div style={{ padding: "6px 14px 10px" }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: t.t4,
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          AVAILABLE TIMES
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
          }}
        >
          {d.slots.map((slot) => (
            <button
              key={slot.time}
              onClick={() => onBook?.(slot.time)}
              style={{
                padding: "8px 4px",
                borderRadius: 8,
                border: `1.5px solid ${slot.selected ? ac : t.bdr}`,
                background: slot.selected ? t.accentBg : t.surface,
                color: slot.selected ? ac : t.t2,
                fontSize: 11,
                fontWeight: slot.selected ? 700 : 500,
                cursor: "pointer",
                fontFamily: t.fontFamily,
                textAlign: "center",
              }}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>

      {/* Includes */}
      {d.includes && d.includes.length > 0 && (
        <div style={{ padding: "0 14px 10px" }}>
          {d.includes.map((item) => (
            <div
              key={item}
              style={{
                fontSize: 10,
                color: t.t3,
                padding: "2px 0",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ color: t.green, fontSize: 10 }}>✓</span> {item}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "0 14px 14px" }}>
        <button
          onClick={() => onBook?.(selectedSlot?.time || "")}
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
          {d.ctaLabel || `Book${d.price ? ` — ${d.price}` : " — Free"}`}
        </button>
      </div>
    </div>
  );
}
