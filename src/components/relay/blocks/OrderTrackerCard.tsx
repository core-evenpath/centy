"use client";
import React from "react";
import type { RelayTheme, OrderTrackerData } from "./types";
import { DEFAULT_THEME } from "./types";

interface OrderTrackerCardProps {
  tracker: OrderTrackerData;
  theme?: RelayTheme;
  onTrack?: () => void;
}

export default function OrderTrackerCard({
  tracker: d,
  theme: t = DEFAULT_THEME,
  onTrack,
}: OrderTrackerCardProps) {
  if (!d) return null;
  const currentIdx = d.steps.indexOf(d.currentStep);

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
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>
            📦 Order #{d.orderId}
          </div>
          {d.orderDate && (
            <div style={{ fontSize: 9, color: t.t4, marginTop: 1 }}>{d.orderDate}</div>
          )}
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            background: t.accentBg,
            color: t.accent,
          }}
        >
          {d.currentStep}
        </span>
      </div>

      {/* Progress */}
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {d.steps.map((step, i) => {
            const completed = i <= currentIdx;
            const isCurrent = i === currentIdx;
            const isLast = i === d.steps.length - 1;
            return (
              <div
                key={step}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {/* Line + circle row */}
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  {i > 0 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: completed ? t.green : t.bdrL,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: isCurrent ? 20 : 16,
                      height: isCurrent ? 20 : 16,
                      borderRadius: "50%",
                      background: completed ? t.green : t.bdrL,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      flexShrink: 0,
                      border: isCurrent ? `2px solid ${t.green}` : "none",
                    }}
                  >
                    {completed ? "✓" : ""}
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: i < currentIdx ? t.green : t.bdrL,
                      }}
                    />
                  )}
                </div>
                {/* Label */}
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? t.text : t.t4,
                    textAlign: "center",
                    marginTop: 5,
                    lineHeight: 1.2,
                    maxWidth: 50,
                  }}
                >
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carrier info */}
      {(d.carrier || d.estimatedArrival) && (
        <div
          style={{
            margin: "0 14px 14px",
            padding: "8px 12px",
            background: t.warm,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 10, color: t.t2 }}>
            {d.carrier && <span style={{ fontWeight: 600 }}>{d.carrier}</span>}
            {d.carrier && d.estimatedArrival && " · "}
            {d.estimatedArrival && <span>Est. {d.estimatedArrival}</span>}
          </div>
          <button
            onClick={onTrack}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              border: "none",
              background: t.accent,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: t.fontFamily,
            }}
          >
            Track
          </button>
        </div>
      )}
    </div>
  );
}
