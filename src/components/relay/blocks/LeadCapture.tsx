"use client";
import React, { useState } from "react";
import type { RelayTheme, LeadField } from "./types";
import { DEFAULT_THEME } from "./types";

interface LeadCaptureProps {
  fields: LeadField[];
  theme?: RelayTheme;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  onSubmit?: (data: Record<string, string>) => void;
  emoji?: string;
}

export default function LeadCapture({
  fields,
  theme: t = DEFAULT_THEME,
  title,
  subtitle,
  submitLabel = "Submit",
  onSubmit,
  emoji,
}: LeadCaptureProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    const missing = fields.filter(
      (f) => f.required && !values[f.id]?.trim()
    );
    if (missing.length > 0) return;
    onSubmit?.(values);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${t.greenBdr}`,
          backgroundColor: t.greenBg,
          padding: 20,
          textAlign: "center",
          fontFamily: t.fontFamily,
        }}
      >
        <span style={{ fontSize: 32 }}>✓</span>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: t.green,
            marginTop: 6,
          }}
        >
          Thank you!
        </div>
        <div style={{ fontSize: 12, color: t.t3, marginTop: 4 }}>
          We&apos;ll be in touch soon.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.sh,
        backgroundColor: t.surface,
        padding: 18,
        fontFamily: t.fontFamily,
      }}
    >
      {emoji && (
        <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>
          {emoji}
        </span>
      )}
      {title && (
        <div
          style={{
            fontFamily: t.headingFont,
            fontSize: 16,
            fontWeight: 700,
            color: t.text,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
      )}
      {subtitle && (
        <div style={{ fontSize: 12, color: t.t3, marginBottom: 14 }}>
          {subtitle}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map((field) => (
          <div key={field.id}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: t.t2,
                marginBottom: 4,
              }}
            >
              {field.label}
              {field.required && (
                <span style={{ color: t.red, marginLeft: 2 }}>*</span>
              )}
            </label>
            {field.type === "select" ? (
              <select
                value={values[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onFocus={() => setFocusedId(field.id)}
                onBlur={() => setFocusedId(null)}
                style={{
                  width: "100%",
                  border: `1px solid ${focusedId === field.id ? t.accent : t.bdr}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: t.fontFamily,
                  color: t.text,
                  backgroundColor: t.surface,
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
              >
                <option value="">{field.placeholder || "Select..."}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "phone" ? "tel" : field.type}
                placeholder={field.placeholder}
                value={values[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onFocus={() => setFocusedId(field.id)}
                onBlur={() => setFocusedId(null)}
                style={{
                  width: "100%",
                  border: `1px solid ${focusedId === field.id ? t.accent : t.bdr}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontFamily: t.fontFamily,
                  color: t.text,
                  backgroundColor: t.surface,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        style={{
          width: "100%",
          marginTop: 14,
          padding: "11px 20px",
          borderRadius: 10,
          border: "none",
          background: t.accent,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: t.fontFamily,
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}
