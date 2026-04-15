"use client";

import { Icon } from "./icon";
import { ACCENT, theme, getPreviewForVertical } from "../constants";
import type { MappedFeature } from "../types";

interface PhonePreviewProps {
  features: MappedFeature[];
  verticalName: string;
  verticalId: string;
}

/**
 * Mini phone mockup showing a live preview of the AI storefront.
 *
 * BUG 1 FIX: The preview content is now driven by the vertical ID
 * instead of hardcoded ecom products. Each vertical gets contextually
 * appropriate sample items, labels, and actions.
 */
export function PhonePreview({ features, verticalName, verticalId }: PhonePreviewProps) {
  const liveCount = features.filter((f) => f.ready && !f.depends).length;

  // Check if key features are ready
  const hasProducts = features.some(
    (f) => (f.id.includes("product") || f.id.includes("catalog")) && f.ready
  );
  const hasShipping = features.some((f) => f.id.includes("shipping") && f.ready);
  const hasPromo = features.some((f) => f.id.includes("promo") && f.ready);

  // BUG 1 FIX — Get vertical-appropriate preview content
  const preview = getPreviewForVertical(verticalId);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 250,
        borderRadius: 20,
        border: `3px solid ${theme.t1}`,
        overflow: "hidden",
        position: "relative",
        height: hasProducts ? 340 : 260,
        margin: "0 auto",
        transition: "height 0.3s ease",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 56,
          height: 13,
          background: theme.t1,
          borderRadius: "0 0 8px 8px",
          zIndex: 5,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRadius: 17,
          overflow: "hidden",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: "15px 8px 4px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            borderBottom: `1px solid ${theme.bdrL}`,
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="radio" size={8} color="#fff" />
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.t1 }}>
            {verticalName}
          </span>
          {liveCount > 0 && (
            <div
              style={{
                marginLeft: "auto",
                fontSize: 7,
                color: theme.green,
                background: theme.greenBg,
                padding: "1px 5px",
                borderRadius: 99,
                fontWeight: 600,
              }}
            >
              {liveCount} live
            </div>
          )}
        </div>

        {/* Chat body */}
        <div style={{ flex: 1, overflow: "auto", background: theme.bg, padding: 5 }}>
          {hasProducts ? (
            <>
              {/* AI message bubble */}
              <div style={{ display: "flex", gap: 4, alignItems: "flex-start", marginBottom: 3 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    background: ACCENT,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  <Icon name="radio" size={5} color="#fff" />
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: `1px solid ${theme.bdrL}`,
                    borderRadius: 5,
                    padding: "3px 6px",
                    fontSize: 8,
                    color: theme.t1,
                  }}
                >
                  {preview.greeting}
                </div>
              </div>

              {/* Product cards — now vertical-aware */}
              {preview.items.map((item) => (
                <div
                  key={item.name}
                  style={{
                    background: "#fff",
                    border: `1px solid ${theme.bdrL}`,
                    borderRadius: 5,
                    padding: "5px 7px",
                    marginBottom: 2,
                    display: "flex",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      background: theme.accentBg2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 7,
                      fontWeight: 600,
                      color: ACCENT,
                      flexShrink: 0,
                    }}
                  >
                    {item.code}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, fontWeight: 500, color: theme.t1 }}>
                      {item.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 600, color: ACCENT }}>
                        {item.price === "Free" ? "Free" : `₹${item.price}`}
                      </span>
                      {item.oldPrice && (
                        <span
                          style={{
                            fontSize: 7,
                            color: theme.t4,
                            textDecoration: "line-through",
                          }}
                        >
                          ₹{item.oldPrice}
                        </span>
                      )}
                      {hasPromo && item.oldPrice && (
                        <span
                          style={{
                            fontSize: 6,
                            fontWeight: 600,
                            color: "#fff",
                            background: ACCENT,
                            padding: "0 3px",
                            borderRadius: 2,
                          }}
                        >
                          Offer
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Shipping / contextual info */}
              {hasShipping && preview.shippingLabel && (
                <div
                  style={{
                    background: "#fff",
                    border: `1px solid ${theme.bdrL}`,
                    borderRadius: 5,
                    padding: "5px 7px",
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 7,
                      fontWeight: 600,
                      color: theme.green,
                      textTransform: "uppercase",
                      marginBottom: 1,
                    }}
                  >
                    {preview.shippingLabel}
                  </div>
                  <div style={{ fontSize: 8, color: theme.t2 }}>
                    {preview.shippingDetail}
                  </div>
                </div>
              )}

              {/* Action chips */}
              <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                {preview.actions.map((action) => (
                  <span
                    key={action}
                    style={{
                      fontSize: 7,
                      padding: "2px 7px",
                      borderRadius: 99,
                      background: theme.accentBg,
                      color: ACCENT,
                      fontWeight: 500,
                      border: `1px solid ${theme.accentBg2}`,
                    }}
                  >
                    {action}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 5,
                opacity: 0.3,
              }}
            >
              <Icon name="msg" size={22} color={theme.t4} />
              <div
                style={{
                  fontSize: 9,
                  color: theme.t4,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                Add your products to
                <br />
                see a live preview
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          style={{
            padding: "4px 5px",
            borderTop: `1px solid ${theme.bdrL}`,
            background: "#fff",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 3 }}>
            <div
              style={{
                flex: 1,
                padding: "3px 6px",
                background: theme.bg,
                borderRadius: 4,
                border: `1px solid ${theme.bdrL}`,
                fontSize: 7,
                color: theme.t4,
              }}
            >
              Ask something...
            </div>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: ACCENT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="arrowUp" size={7} color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
