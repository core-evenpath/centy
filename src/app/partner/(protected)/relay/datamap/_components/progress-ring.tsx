"use client";

import { theme } from "../constants";

interface ProgressRingProps {
  pct: number;
  size?: number;
}

export function ProgressRing({ pct, size = 44 }: ProgressRingProps) {
  const color = pct >= 80 ? theme.green : pct >= 40 ? theme.amber : theme.red;
  const circumference = 2 * Math.PI * 14;

  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg
        viewBox="0 0 36 36"
        style={{ width: size, height: size, transform: "rotate(-90deg)" }}
      >
        <circle
          cx="18" cy="18" r={14}
          fill="none" stroke={theme.bdrL} strokeWidth="3"
        />
        <circle
          cx="18" cy="18" r={14}
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color,
        }}
      >
        {pct}%
      </div>
    </div>
  );
}
