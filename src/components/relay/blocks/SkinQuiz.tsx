"use client";
import React from "react";
import type { RelayTheme, QuizStep } from "./types";
import { DEFAULT_THEME } from "./types";

interface SkinQuizProps {
  step: QuizStep;
  theme?: RelayTheme;
  onSelect?: (label: string) => void;
  onNext?: () => void;
}

export default function SkinQuiz({
  step,
  theme: t = DEFAULT_THEME,
  onSelect,
  onNext,
}: SkinQuizProps) {
  if (!step) return null;
  const { question, hint, options, currentStep, totalSteps } = step;

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
        <span style={{ fontSize: 11, fontWeight: 600, color: t.accent, letterSpacing: 0.5 }}>
          STEP {currentStep} OF {totalSteps}
        </span>
        <span style={{ fontSize: 10, color: t.t4 }}>
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>

      {/* Question */}
      <div style={{ padding: "14px 14px 6px" }}>
        <div
          style={{
            fontFamily: t.headingFont,
            fontSize: 15,
            fontWeight: 700,
            color: t.text,
            marginBottom: 4,
          }}
        >
          {question}
        </div>
        {hint && (
          <div style={{ fontSize: 11, color: t.t3, marginBottom: 8 }}>{hint}</div>
        )}
      </div>

      {/* Options grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          padding: "6px 14px 14px",
        }}
      >
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect?.(opt.label)}
            style={{
              padding: "10px 8px",
              borderRadius: 10,
              border: `1.5px solid ${opt.selected ? t.accent : t.bdr}`,
              background: opt.selected ? t.accentBg : t.surface,
              color: opt.selected ? t.accent : t.text,
              fontSize: 12,
              fontWeight: opt.selected ? 600 : 500,
              cursor: "pointer",
              fontFamily: t.fontFamily,
              textAlign: "center",
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 5,
          padding: "0 14px 10px",
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i + 1 <= currentStep ? 16 : 6,
              height: 6,
              borderRadius: 3,
              background: i + 1 <= currentStep ? t.accent : t.bdrL,
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>

      {/* Next button */}
      <div style={{ padding: "0 14px 14px" }}>
        <button
          onClick={onNext}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 10,
            border: "none",
            background: t.text,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: "pointer",
            fontFamily: t.fontFamily,
          }}
        >
          NEXT →
        </button>
      </div>
    </div>
  );
}
