"use client";
import React from "react";
import type { RelayTheme, ReferralData } from "./types";
import { DEFAULT_THEME } from "./types";

interface ReferralCardProps {
  data: ReferralData;
  theme?: RelayTheme;
  onCopy?: () => void;
  onShare?: () => void;
}

export default function ReferralCard({
  data: d,
  theme: t = DEFAULT_THEME,
  onCopy,
  onShare,
}: ReferralCardProps) {
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
          padding: "12px 14px 10px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>
          🎁 Give {d.givesAmount}, Get {d.getsAmount}
        </div>
      </div>

      {/* Split */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          padding: "0 14px 10px",
        }}
      >
        <div
          style={{
            padding: "10px 8px",
            borderRadius: 10,
            background: t.warm,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 9, color: t.t4, marginBottom: 3 }}>THEY GET</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.accent }}>{d.givesAmount}</div>
        </div>
        <div
          style={{
            padding: "10px 8px",
            borderRadius: 10,
            background: t.greenBg,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 9, color: t.t4, marginBottom: 3 }}>YOU EARN</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: t.green }}>{d.getsAmount}</div>
        </div>
      </div>

      {/* Code */}
      <div
        style={{
          margin: "0 14px",
          padding: "8px 10px",
          borderRadius: 8,
          border: `2px dashed ${t.bdr}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 800, color: t.text, letterSpacing: 1.5 }}>
          {d.code}
        </span>
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={onCopy}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: "none",
              background: t.text,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: t.fontFamily,
            }}
          >
            Copy
          </button>
          <button
            onClick={onShare}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              border: `1px solid ${t.bdr}`,
              background: t.surface,
              color: t.text,
              fontSize: 9,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: t.fontFamily,
            }}
          >
            Share
          </button>
        </div>
      </div>

      {/* Stats footer */}
      {(d.friendsJoined != null || d.totalEarned) && (
        <div
          style={{
            padding: "10px 14px",
            borderTop: `1px solid ${t.bdrL}`,
            marginTop: 10,
            textAlign: "center",
            fontSize: 10,
            color: t.t3,
          }}
        >
          {d.friendsJoined != null && <span>{d.friendsJoined} friends joined</span>}
          {d.friendsJoined != null && d.totalEarned && " · "}
          {d.totalEarned && <span>{d.totalEarned} earned</span>}
        </div>
      )}
    </div>
  );
}
