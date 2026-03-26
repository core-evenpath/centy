"use client";
import React from "react";
import type { RelayTheme, ScheduleSlot } from "./types";
import { DEFAULT_THEME } from "./types";

interface ScheduleViewProps {
  items: ScheduleSlot[];
  theme?: RelayTheme;
  date?: string;
  onBook?: (slotId: string) => void;
}

export default function ScheduleView({
  items,
  theme: t = DEFAULT_THEME,
  date,
  onBook,
}: ScheduleViewProps) {
  return (
    <div style={{ fontFamily: t.fontFamily }}>
      {date && (
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: t.text,
            marginBottom: 12,
          }}
        >
          {date}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((slot, idx) => {
          const spotsLow = slot.spots !== undefined && slot.spots <= 3 && slot.spots > 0;
          return (
            <div
              key={slot.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "10px 0",
                borderBottom: idx < items.length - 1 ? `1px solid ${t.bdrL}` : undefined,
                opacity: slot.isAvailable ? 1 : 0.5,
              }}
            >
              <div
                style={{
                  width: 60,
                  flexShrink: 0,
                  textAlign: "right",
                  paddingRight: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: slot.isAvailable ? t.text : t.t4,
                  }}
                >
                  {slot.time}
                </div>
                {slot.endTime && (
                  <div style={{ fontSize: 11, color: t.t4 }}>{slot.endTime}</div>
                )}
              </div>
              <div
                style={{
                  width: 2,
                  backgroundColor: slot.isAvailable ? t.accent : t.t5,
                  borderRadius: 1,
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    left: -3,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: slot.isAvailable ? t.accent : t.t5,
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {slot.emoji && <span style={{ fontSize: 16 }}>{slot.emoji}</span>}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: slot.isAvailable ? t.text : t.t4,
                    }}
                  >
                    {slot.title}
                  </div>
                </div>
                {slot.instructor && (
                  <div style={{ fontSize: 11, color: t.t3, marginTop: 2 }}>
                    {slot.instructor}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {slot.price && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>
                      {slot.price}
                    </span>
                  )}
                  {slot.isAvailable && slot.spots !== undefined && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: spotsLow ? t.red : t.t3,
                      }}
                    >
                      {slot.spots} spots left
                    </span>
                  )}
                  {!slot.isAvailable && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.t4,
                      }}
                    >
                      Full
                    </span>
                  )}
                </div>
              </div>
              {slot.isAvailable && (
                <button
                  onClick={() => onBook?.(slot.id)}
                  style={{
                    alignSelf: "center",
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: t.accent,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: t.fontFamily,
                    flexShrink: 0,
                  }}
                >
                  Book
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
