"use client";
import React from "react";
import type { RelayTheme, CatalogItem } from "./types";
import { DEFAULT_THEME } from "./types";

interface CompareField {
  label: string;
  key: keyof CatalogItem | string;
  render?: (item: CatalogItem) => React.ReactNode;
}

interface CompareTableProps {
  items: CatalogItem[];
  compareFields?: CompareField[];
  theme?: RelayTheme;
}

export default function CompareTable({
  items,
  compareFields,
  theme: t = DEFAULT_THEME,
}: CompareTableProps) {
  const fields: CompareField[] =
    compareFields ||
    (() => {
      const auto: CompareField[] = [
        { label: "Price", key: "price" },
      ];
      if (items.some((it) => it.rating !== undefined)) {
        auto.push({ label: "Rating", key: "rating" });
      }
      // Collect unique spec labels across all items
      const specLabels = new Set<string>();
      items.forEach((it) =>
        it.specs?.forEach((s) => specLabels.add(s.label))
      );
      Array.from(specLabels)
        .slice(0, 6)
        .forEach((label) => {
          auto.push({
            label,
            key: `spec:${label}`,
            render: (item) => {
              const spec = item.specs?.find((s) => s.label === label);
              return spec ? spec.value : "—";
            },
          });
        });
      return auto;
    })();

  const getCellValue = (item: CatalogItem, field: CompareField): React.ReactNode => {
    if (field.render) return field.render(item);
    const key = field.key as keyof CatalogItem;
    const val = item[key];
    if (key === "price") {
      return `${item.currency} ${item.price.toLocaleString()}`;
    }
    if (key === "rating" && typeof val === "number") {
      return `${val} ★`;
    }
    if (val === undefined || val === null) return "—";
    return String(val);
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.sh,
        overflow: "hidden",
        backgroundColor: t.surface,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${t.bdr}`,
          backgroundColor: t.warm,
        }}
      >
        <div style={{ width: 70, flexShrink: 0 }} />
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              flex: 1,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            {item.emoji && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${item.color || t.accent}, ${item.colorEnd || t.accentHi})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 6px",
                  fontSize: 18,
                }}
              >
                {item.emoji}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                fontWeight: 650,
                color: t.text,
              }}
            >
              {item.name}
            </div>
          </div>
        ))}
      </div>

      {/* Data rows */}
      {fields.map((field, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "flex",
            borderBottom:
              rowIdx < fields.length - 1 ? `1px solid ${t.bdrL}` : "none",
            backgroundColor: rowIdx % 2 === 0 ? t.bg : "transparent",
          }}
        >
          <div
            style={{
              width: 70,
              flexShrink: 0,
              padding: "8px 10px",
              fontSize: 11.5,
              fontWeight: 550,
              color: t.t3,
              display: "flex",
              alignItems: "center",
            }}
          >
            {field.label}
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                flex: 1,
                padding: "8px 8px",
                textAlign: "center",
                fontSize: 12,
                fontWeight: field.key === "price" ? 800 : 500,
                color: field.key === "price" ? t.accent : t.text,
              }}
            >
              {getCellValue(item, field)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
