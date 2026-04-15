"use client";

import { useState } from "react";
import { Icon } from "./ic";
import { ACCENT, theme } from "../constants";
import type { MappedFeature } from "../types";

interface DependentFeaturesProps {
  dependent: MappedFeature[];
  /** All features — used to resolve dependency names */
  allFeatures: MappedFeature[];
}

/**
 * BUG 4 FIX: Collapsible section showing features that
 * depend on other features being configured first.
 *
 * Previously these were completely invisible — filtered out of
 * every list with no UI at all.
 */
export function DependentFeatures({ dependent, allFeatures }: DependentFeaturesProps) {
  const [open, setOpen] = useState(false);

  if (dependent.length === 0) return null;

  const resolveDepName = (depId: string) => {
    const match = allFeatures.find((f) => f.id === depId);
    return match?.customer || depId.replace(/_/g, " ");
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          width: "100%",
          borderRadius: 8,
          border: `1px solid ${theme.bdrL}`,
          background: theme.surface,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon name="link" size={12} color={theme.t4} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: theme.t3 }}>
          {dependent.length} feature{dependent.length > 1 ? "s" : ""} unlock after dependencies
        </span>
        <span
          style={{
            fontSize: 10,
            color: theme.t4,
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          ▶
        </span>
      </button>

      {open && (
        <div style={{ marginTop: 6 }}>
          {dependent.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 12px",
                marginBottom: 3,
                borderRadius: 8,
                border: `1px solid ${theme.bdrL}`,
                background: theme.bg,
                opacity: 0.7,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: theme.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: `1px dashed ${theme.bdrM}`,
                }}
              >
                <Icon name={f.icon} size={11} color={theme.t4} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: theme.t2 }}>
                  {f.customer}
                </div>
                <div style={{ fontSize: 9, color: theme.t4 }}>
                  Requires:{" "}
                  <span style={{ fontWeight: 500, color: theme.t3 }}>
                    {resolveDepName(f.depends!)}
                  </span>
                </div>
              </div>
              {f.ready ? (
                <Icon name="check" size={13} color={theme.green} />
              ) : (
                <Icon name="clock" size={13} color={theme.t4} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
