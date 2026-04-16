"use client";

import { useState } from "react";
import { Icon } from "./inline-icon";
import { DataInputPanel } from "./data-input-panel";
import { ACCENT, theme } from "../constants";
import type { MappedFeature } from "../types";

interface FeatureListProps {
  notReady: MappedFeature[];
  ready: MappedFeature[];
  enabledApis: string[];
  onFileUpload?: (featureId: string, file: File) => void;
  onUseMemory?: (featureId: string) => void;
  onFetchApi?: (featureId: string, apiName: string) => void;
  onManualEntry?: (featureId: string) => void;
  onConnectService?: (featureId: string) => void;
}

export function FeatureList({
  notReady,
  ready,
  enabledApis,
  ...handlers
}: FeatureListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      {/* ── Not ready section ── */}
      {notReady.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.amber,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 7,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name="clock" size={11} color={theme.amber} />
            Needs your input ({notReady.length})
          </div>

          {notReady.map((f) => {
            const isOpen = expandedId === f.id;
            return (
              <div
                key={f.id}
                style={{
                  borderRadius: 8,
                  border: `1px solid ${isOpen ? theme.accentBg2 : theme.bdrL}`,
                  overflow: "hidden",
                  background: theme.surface,
                  marginBottom: 5,
                }}
              >
                <button
                  onClick={() => setExpandedId(isOpen ? null : f.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 12px",
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    background: "transparent",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: theme.amberBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={f.icon} size={13} color={theme.amber} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>
                      {f.customer}
                    </div>
                    {f.missReason && (
                      <div style={{ fontSize: 10, color: theme.amber, marginTop: 1 }}>
                        {f.missReason}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      background: theme.amber,
                      flexShrink: 0,
                    }}
                  />
                </button>

                {isOpen && (
                  <div style={{ padding: "0 12px 12px" }}>
                    <div
                      style={{
                        padding: "7px 10px",
                        background: theme.bg,
                        borderRadius: 6,
                        marginBottom: 10,
                        fontSize: 11,
                        color: theme.t3,
                        lineHeight: 1.5,
                      }}
                    >
                      {f.you}
                    </div>
                    <DataInputPanel
                      feature={f}
                      enabledApis={enabledApis}
                      {...handlers}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Ready / live section ── */}
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.green,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 7,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name="check" size={11} color={theme.green} />
          Live now ({ready.length})
        </div>

        {ready.map((f) => (
          <div
            key={f.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 12px",
              marginBottom: 3,
              borderRadius: 8,
              border: `1px solid ${theme.greenBdr}`,
              background: theme.greenBg,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "rgba(22,163,74,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={f.icon} size={11} color={theme.green} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: theme.t1 }}>
                {f.customer}
              </div>
              <div style={{ fontSize: 9, color: theme.green }}>
                {f.items > 0 ? `${f.items} items` : f.auto ? "Automatic" : "Connected"}
                {f.source ? ` · ${f.source}` : ""}
              </div>
            </div>
            <Icon name="check" size={13} color={theme.green} />
          </div>
        ))}
      </div>
    </div>
  );
}
