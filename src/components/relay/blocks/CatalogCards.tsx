"use client";
import React, { useState } from "react";
import type { RelayTheme, CatalogItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface CatalogCardsProps {
  items: CatalogItem[];
  onSelect?: (itemId: string) => void;
  onBook?: (itemId: string) => void;
  theme?: RelayTheme;
  layout?: "stack" | "carousel";
  showBookButton?: boolean;
  bookButtonLabel?: string;
}

export default function CatalogCards({
  items,
  onSelect,
  onBook,
  theme: t = DEFAULT_THEME,
  showBookButton = true,
  bookButtonLabel = "Book",
}: CatalogCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    onSelect?.(id);
  };

  const renderStars = (rating: number) => {
    return (
      <span style={{ display: "inline-flex", gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              color: i <= rating ? "#FFD666" : "rgba(255,255,255,0.15)",
              fontSize: 12,
            }}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: t.fontFamily,
      }}
    >
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const hasDiscount =
          item.originalPrice !== undefined && item.originalPrice > item.price;
        const headerColor1 = item.color || t.accent;
        const headerColor2 = item.colorEnd || t.accentHi;

        return (
          <div
            key={item.id}
            style={{
              borderRadius: 14,
              border: `1px solid ${t.bdr}`,
              boxShadow: expanded ? t.shM : t.sh,
              overflow: "hidden",
              backgroundColor: t.surface,
              transition: "box-shadow 0.2s",
            }}
          >
            {/* Gradient header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${headerColor1}, ${headerColor2})`,
                padding: 14,
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                {item.rating !== undefined && (
                  <div style={{ marginBottom: 6 }}>
                    {renderStars(item.rating)}
                    {item.reviewCount !== undefined && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.7)",
                          marginLeft: 4,
                        }}
                      >
                        ({item.reviewCount})
                      </span>
                    )}
                  </div>
                )}
                {hasDiscount && (
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 650,
                      color: "#FFFFFF",
                    }}
                  >
                    {Math.round(
                      ((item.originalPrice! - item.price) / item.originalPrice!) * 100
                    )}
                    % OFF
                  </div>
                )}
              </div>
              {item.emoji && (
                <span style={{ fontSize: 32, opacity: 0.9 }}>{item.emoji}</span>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "12px 14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: t.headingFont,
                      fontSize: 15,
                      fontWeight: 700,
                      color: t.text,
                    }}
                  >
                    {item.name}
                  </div>
                  {item.subtitle && (
                    <div
                      style={{
                        fontSize: 12,
                        color: t.t3,
                        marginTop: 2,
                      }}
                    >
                      {item.subtitle}
                    </div>
                  )}
                  {item.tagline && (
                    <div
                      style={{
                        fontSize: 12,
                        color: t.accent,
                        fontStyle: "italic",
                        marginTop: 3,
                      }}
                    >
                      {item.tagline}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: t.accent,
                    }}
                  >
                    {item.currency} {item.price.toLocaleString()}
                  </div>
                  {hasDiscount && (
                    <div
                      style={{
                        fontSize: 11,
                        color: t.t4,
                        textDecoration: "line-through",
                      }}
                    >
                      {item.currency} {item.originalPrice!.toLocaleString()}
                    </div>
                  )}
                  {item.unit && (
                    <div style={{ fontSize: 10, color: t.t3 }}>{item.unit}</div>
                  )}
                </div>
              </div>

              {/* Badges */}
              {item.badges && item.badges.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 8,
                  }}
                >
                  {item.badges.map((badge, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 8,
                        backgroundColor: t.accentBg,
                        fontSize: 10.5,
                        fontWeight: 550,
                        color: t.accent,
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* View details toggle */}
              <button
                onClick={() => toggleExpand(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 10,
                  padding: 0,
                  border: "none",
                  background: "none",
                  color: t.t3,
                  fontSize: 12,
                  fontWeight: 550,
                  cursor: "pointer",
                  fontFamily: t.fontFamily,
                }}
              >
                {expanded ? "Less" : "View details"}
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
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Expanded section */}
              {expanded && (
                <div style={{ marginTop: 10 }}>
                  {/* Features */}
                  {item.features && item.features.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 5,
                        marginBottom: 10,
                      }}
                    >
                      {item.features.map((f, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 8,
                            backgroundColor: t.warm,
                            border: `1px solid ${t.bdrL}`,
                            fontSize: 11,
                            color: t.t2,
                            fontWeight: 500,
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Specs grid */}
                  {item.specs && item.specs.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 4,
                        marginBottom: 10,
                      }}
                    >
                      {item.specs.map((spec, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: t.bg,
                            borderRadius: 6,
                          }}
                        >
                          <div
                            style={{ fontSize: 10, color: t.t4, fontWeight: 500 }}
                          >
                            {spec.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: t.text,
                              fontWeight: 600,
                            }}
                          >
                            {spec.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Book button */}
                  {showBookButton && (
                    <button
                      onClick={() => onBook?.(item.id)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
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
                      {bookButtonLabel} — {item.name}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
