"use client";
import React, { useState } from "react";
import type { RelayTheme, ActivityItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface ServiceListProps {
  items: ActivityItem[];
  theme?: RelayTheme;
  onBook?: (itemId: string) => void;
  bookLabel?: string;
}

export default function ServiceList({
  items,
  theme: t = DEFAULT_THEME,
  onBook,
  bookLabel = "Book",
}: ServiceListProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());

  const categories = [
    "All",
    ...Array.from(new Set(items.map((item) => item.category))),
  ];

  const filtered =
    activeCategory === "All"
      ? items
      : items.filter((item) => item.category === activeCategory);

  const handleBook = (itemId: string) => {
    setBookedIds((prev) => new Set(prev).add(itemId));
    onBook?.(itemId);
  };

  const isFree = (price: string) => {
    const lower = price.toLowerCase();
    return lower === "free" || lower === "complimentary" || lower === "included";
  };

  return (
    <div style={{ fontFamily: t.fontFamily }}>
      {/* Category filter strip */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 6,
        }}
      >
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${isActive ? t.accent : t.bdr}`,
                backgroundColor: isActive ? t.accentBg : "transparent",
                color: isActive ? t.accent : t.t3,
                fontSize: 12,
                fontWeight: 550,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: t.fontFamily,
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Service items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map((item) => {
          const expanded = expandedId === item.id;
          const booked = bookedIds.has(item.id);
          const free = isFree(item.price);

          return (
            <div
              key={item.id}
              style={{
                borderRadius: 14,
                border: `1px solid ${expanded ? `rgba(${hexToRgb(t.accent)},0.4)` : t.bdr}`,
                boxShadow: expanded ? t.shM : t.sh,
                backgroundColor: t.surface,
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              {/* Collapsed row */}
              <div
                onClick={() => setExpandedId(expanded ? null : item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 12px",
                  cursor: "pointer",
                  gap: 10,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: t.warm,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 650,
                      color: t.text,
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: t.t3,
                      marginTop: 1,
                    }}
                  >
                    {item.duration}
                    <span style={{ margin: "0 4px" }}>·</span>
                    <span
                      style={{
                        color: free ? t.green : t.accent,
                        fontWeight: 600,
                      }}
                    >
                      {item.price}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.t3}
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Expanded section */}
              {expanded && (
                <div
                  style={{
                    padding: "0 12px 12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12.5,
                      color: t.t2,
                      lineHeight: 1.6,
                      margin: "0 0 10px",
                    }}
                  >
                    {item.description}
                  </p>

                  {booked ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "9px 14px",
                        borderRadius: 10,
                        backgroundColor: t.greenBg,
                        border: `1px solid ${t.greenBdr}`,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={t.green}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: t.green,
                        }}
                      >
                        Booked
                      </span>
                    </div>
                  ) : free ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 14px",
                        borderRadius: 10,
                        backgroundColor: t.greenBg,
                        border: `1px solid ${t.greenBdr}`,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: t.green,
                      }}
                    >
                      Complimentary
                    </div>
                  ) : item.bookable ? (
                    <button
                      onClick={() => handleBook(item.id)}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        borderRadius: 10,
                        border: "none",
                        background: `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`,
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: t.fontFamily,
                      }}
                    >
                      {bookLabel} — {item.price}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Convert hex color to r,g,b string */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
}
