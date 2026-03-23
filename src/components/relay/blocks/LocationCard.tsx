"use client";
import React from "react";
import type { RelayTheme, LocationData } from "./types";
import { DEFAULT_THEME } from "./types";

interface LocationCardProps {
  location: LocationData;
  theme?: RelayTheme;
}

export default function LocationCard({
  location,
  theme: t = DEFAULT_THEME,
}: LocationCardProps) {
  const grad = location.mapGradient || [t.green, "#2D8B5E"];
  const actions = location.actions || ["Directions", "Call", "Share"];
  const actionEmojis: Record<string, string> = {
    Directions: "🧭",
    Call: "📞",
    Share: "📤",
  };

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.sh,
        overflow: "hidden",
        backgroundColor: t.surface,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Map placeholder header */}
      <div
        style={{
          height: 76,
          background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span style={{ fontSize: 28 }}>{location.emoji || "📍"}</span>
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 10,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: 6,
            padding: "2px 8px",
            fontSize: 10,
            fontWeight: 600,
            color: t.text,
          }}
        >
          {location.area}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>
          {location.address}
        </div>
        <div style={{ fontSize: 12, color: t.t3, marginTop: 2 }}>
          {location.area}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 10,
          }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: 10,
                border: `1px solid ${t.bdr}`,
                backgroundColor: t.bg,
                fontSize: 11.5,
                fontWeight: 600,
                color: t.t2,
                cursor: "pointer",
                fontFamily: t.fontFamily,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>{actionEmojis[action] || "📌"}</span>
              {action}
            </button>
          ))}
        </div>

        {/* Directions */}
        {location.directions && location.directions.length > 0 && (
          <div
            style={{
              marginTop: 10,
              backgroundColor: t.bg,
              borderRadius: 10,
              padding: 10,
            }}
          >
            {location.directions.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  borderBottom:
                    i < location.directions!.length - 1
                      ? `1px solid ${t.bdrL}`
                      : "none",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{d.icon}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 650, color: t.text }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 12, color: t.t3, marginLeft: 6 }}>
                    {d.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
