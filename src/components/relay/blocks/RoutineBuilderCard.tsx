"use client";
import React from "react";
import type { RelayTheme, RoutineData, RoutineStep } from "./types";
import { DEFAULT_THEME } from "./types";

interface RoutineBuilderCardProps {
  routine: RoutineData;
  theme?: RelayTheme;
  onAddRoutine?: () => void;
}

function StepRow({ step, index, t, currency }: { step: RoutineStep; index: number; t: RelayTheme; currency: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "5px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: t.accentBg2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: t.accent,
          }}
        >
          {index + 1}
        </span>
        <span style={{ fontSize: 11, color: t.text }}>{step.name}</span>
      </div>
      <span style={{ fontSize: 10, color: t.t3 }}>{currency}{step.price}</span>
    </div>
  );
}

export default function RoutineBuilderCard({
  routine: r,
  theme: t = DEFAULT_THEME,
  onAddRoutine,
}: RoutineBuilderCardProps) {
  if (!r) return null;
  const currency = "$";
  const discounted = r.discountPercent
    ? Math.round(r.totalPrice * (1 - r.discountPercent / 100))
    : r.totalPrice;

  return (
    <div
      style={{
        background: t.surface,
        border: `2px solid ${t.accent}`,
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: t.fontFamily,
        boxShadow: t.sh,
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
          ✦ Your Personalized Routine
        </div>
        {r.skinProfile && (
          <div style={{ fontSize: 10, color: t.t3, marginTop: 2 }}>
            Based on your {r.skinProfile} skin profile
          </div>
        )}
      </div>

      {/* AM section */}
      <div style={{ padding: "4px 14px 8px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#D97706",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 4,
          }}
        >
          ☀ AM ROUTINE
        </div>
        {r.amSteps.map((step, i) => (
          <StepRow key={step.name} step={step} index={i} t={t} currency={currency} />
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: t.bdrL, margin: "0 14px" }} />

      {/* PM section */}
      <div style={{ padding: "8px 14px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: t.blue,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 4,
          }}
        >
          ☽ PM ROUTINE
        </div>
        {r.pmSteps.map((step, i) => (
          <StepRow key={step.name} step={step} index={i} t={t} currency={currency} />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: `1px solid ${t.bdrL}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          {r.discountPercent ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{currency}{discounted}</span>
              <span style={{ fontSize: 10, color: t.t4, textDecoration: "line-through" }}>
                {currency}{r.totalPrice}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: t.green }}>
                Save {r.discountPercent}%
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{currency}{r.totalPrice}</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 14px" }}>
        <button
          onClick={onAddRoutine}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 10,
            border: "none",
            background: t.text,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: t.fontFamily,
          }}
        >
          Add Full Routine to Bag
        </button>
      </div>
    </div>
  );
}
