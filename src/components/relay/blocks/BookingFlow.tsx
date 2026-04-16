"use client";
import React, { useState } from "react";
import type { RelayTheme, CatalogItem, ConversionPath, BlockCallbacks } from "./types";
import { DEFAULT_THEME } from "./types";

const DEFAULT_PATHS: ConversionPath[] = [
  { id: "direct", label: "Book now", icon: "⚡", type: "primary", action: "direct" },
  { id: "wa", label: "WhatsApp", icon: "💬", type: "primary", action: "whatsapp", color: "#25D366" },
  { id: "call", label: "Callback", icon: "📞", type: "primary", action: "callback", color: "#3478F6" },
  { id: "save", label: "Save this quote", icon: "📩", type: "secondary", action: "save" },
  { id: "share", label: "Share with someone", icon: "👥", type: "secondary", action: "share" },
  { id: "ask", label: "Ask me more", icon: "💬", type: "secondary", action: "ask" },
];

interface BookingFlowProps {
  items: CatalogItem[];
  conversionPaths?: ConversionPath[];
  theme?: RelayTheme;
  callbacks?: BlockCallbacks;
  dateMode?: "range" | "single" | "none";
  guestMode?: "counter" | "none";
  headerLabel?: string;
  selectLabel?: string;
}

export default function BookingFlow({
  items,
  conversionPaths = DEFAULT_PATHS,
  theme: t = DEFAULT_THEME,
  callbacks,
  dateMode = "range",
  guestMode = "counter",
  headerLabel = "Book your stay",
  selectLabel = "Select",
}: BookingFlowProps) {
  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [doneType, setDoneType] = useState<"confirmed" | "saved" | "shared" | null>(null);

  const selectedItem = items.find((it) => it.id === selectedItemId);
  const selectedPath = conversionPaths.find((p) => p.id === selectedPathId);
  const primaryPaths = conversionPaths.filter((p) => p.type === "primary");
  const secondaryPaths = conversionPaths.filter((p) => p.type === "secondary");

  const canProceedFromDates = dateMode === "none" || (dateMode === "single" ? !!singleDate : !!checkIn && !!checkOut);

  const nights =
    dateMode === "range" && checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 1;

  const total = selectedItem ? selectedItem.price * nights : 0;

  const getPathColor = (path: ConversionPath): string => {
    if (path.action === "whatsapp") return t.wa;
    if (path.action === "callback") return t.blue;
    return path.color || t.accent;
  };

  const getContactPlaceholder = (): string => {
    if (!selectedPath) return "Contact";
    if (selectedPath.action === "whatsapp") return "WhatsApp number";
    if (selectedPath.action === "callback") return "Phone number";
    return "Email address";
  };

  const getContactType = (): string => {
    if (!selectedPath) return "email";
    if (selectedPath.action === "whatsapp") return "whatsapp";
    if (selectedPath.action === "callback") return "phone";
    return "email";
  };

  const handleSubmit = () => {
    if (!name.trim() || !contact.trim()) return;
    callbacks?.onCaptureContact?.({
      name: name.trim(),
      contact: contact.trim(),
      contactType: getContactType(),
      conversionType: selectedPath?.action || "direct",
      itemId: selectedItemId || undefined,
    });
    setDoneType("confirmed");
    setStep(4);
  };

  const handleSecondary = (path: ConversionPath) => {
    setSelectedPathId(path.id);
    if (path.action === "save") {
      setDoneType("saved");
      setStep(4);
    } else if (path.action === "share") {
      setDoneType("shared");
      setStep(4);
    } else if (path.action === "ask") {
      callbacks?.onSendMessage?.("I have more questions");
    } else if (path.action === "external" && path.externalUrl) {
      callbacks?.onExternalLink?.(path.externalUrl);
    }
  };

  // Progress bar
  const totalSteps = 4;
  const progressStep = Math.min(step, totalSteps);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: `1px solid ${t.bdr}`,
    fontSize: 13,
    fontFamily: t.fontFamily,
    color: t.text,
    backgroundColor: t.surface,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${t.bdr}`,
        boxShadow: t.sh,
        backgroundColor: t.surface,
        overflow: "hidden",
        fontFamily: t.fontFamily,
      }}
    >
      {/* Progress bar */}
      <div style={{ display: "flex", gap: 3, padding: "10px 14px 0" }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: i < progressStep ? t.accent : t.sand,
              transition: "background-color 0.3s",
            }}
          />
        ))}
      </div>

      <div style={{ padding: 14 }}>
        {/* Step 0: Date + Guest selection */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 10, fontFamily: t.headingFont }}>
              {headerLabel}
            </div>

            {dateMode !== "none" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {dateMode === "range" ? (
                  <>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: t.t3, fontWeight: 550, display: "block", marginBottom: 4 }}>
                        Check-in
                      </label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: t.t3, fontWeight: 550, display: "block", marginBottom: 4 }}>
                        Check-out
                      </label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: t.t3, fontWeight: 550, display: "block", marginBottom: 4 }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            )}

            {guestMode !== "none" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: t.t2, fontWeight: 550 }}>Guests</span>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <button
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px 0 0 8px",
                      border: `1px solid ${t.bdr}`,
                      backgroundColor: t.bg,
                      fontSize: 16,
                      cursor: "pointer",
                      color: t.t2,
                      fontFamily: t.fontFamily,
                    }}
                  >
                    −
                  </button>
                  <div
                    style={{
                      width: 40,
                      height: 32,
                      borderTop: `1px solid ${t.bdr}`,
                      borderBottom: `1px solid ${t.bdr}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 650,
                      color: t.text,
                    }}
                  >
                    {guests}
                  </div>
                  <button
                    onClick={() => setGuests((g) => g + 1)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "0 8px 8px 0",
                      border: `1px solid ${t.bdr}`,
                      backgroundColor: t.bg,
                      fontSize: 16,
                      cursor: "pointer",
                      color: t.t2,
                      fontFamily: t.fontFamily,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => canProceedFromDates && setStep(1)}
              disabled={!canProceedFromDates}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: canProceedFromDates
                  ? `linear-gradient(135deg, ${t.accent}, ${t.accentHi})`
                  : t.sand,
                color: canProceedFromDates ? "#FFFFFF" : t.t4,
                fontSize: 13,
                fontWeight: 600,
                cursor: canProceedFromDates ? "pointer" : "default",
                fontFamily: t.fontFamily,
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1: Item selection */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 650, color: t.text, marginBottom: 8 }}>
              {selectLabel}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: `${isSelected ? 2 : 1}px solid ${isSelected ? t.accent : t.bdr}`,
                      backgroundColor: isSelected ? t.accentBg : t.surface,
                      boxShadow: isSelected ? t.shM : "none",
                      cursor: "pointer",
                      fontFamily: t.fontFamily,
                      width: "100%",
                      textAlign: "left",
                      transition: "all 0.15s",
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
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {item.emoji}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 650, color: t.text }}>
                        {item.name}
                      </div>
                      {item.subtitle && (
                        <div style={{ fontSize: 11, color: t.t3, marginTop: 1 }}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.accent }}>
                        {item.currency} {item.price.toLocaleString()}
                      </div>
                      {item.unit && (
                        <div style={{ fontSize: 10, color: t.t3 }}>{item.unit}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedItem && (
              <div style={{ marginTop: 10 }}>
                {dateMode === "range" && nights > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      fontSize: 12.5,
                      color: t.t2,
                    }}
                  >
                    <span>
                      {selectedItem.currency} {selectedItem.price.toLocaleString()} × {nights} nights
                    </span>
                    <span style={{ fontWeight: 800, color: t.accent }}>
                      {selectedItem.currency} {total.toLocaleString()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => {
                    // Tentatively reserve the chosen item before moving to
                    // conversion-path selection. No-op when the host hasn't
                    // wired session callbacks (e.g. design previews).
                    if (selectedItem && callbacks?.onReserveSlot) {
                      const dateStr =
                        dateMode === "single" ? singleDate : checkIn;
                      const slotId = `${selectedItem.id}_${dateStr || "any"}`;
                      void callbacks.onReserveSlot({
                        slotId,
                        serviceId: selectedItem.id,
                        serviceName: selectedItem.name,
                        date: dateStr || new Date().toISOString().slice(0, 10),
                        time: "00:00",
                        duration: 60,
                        price: selectedItem.price,
                      });
                    }
                    setStep(2);
                  }}
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
                    marginTop: 4,
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Conversion path selection */}
        {step === 2 && (
          <div>
            {/* Primary paths */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {primaryPaths.map((path) => {
                const color = getPathColor(path);
                const isSelected = selectedPathId === path.id;
                return (
                  <button
                    key={path.id}
                    onClick={() => {
                      setSelectedPathId(path.id);
                      setStep(3);
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      padding: "12px 6px",
                      borderRadius: 12,
                      border: `1px solid ${isSelected ? color : t.bdr}`,
                      backgroundColor: isSelected ? `${color}08` : t.surface,
                      cursor: "pointer",
                      fontFamily: t.fontFamily,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{path.icon}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: t.text }}>
                      {path.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                backgroundColor: t.bdrL,
                margin: "6px 0",
              }}
            />

            {/* Not ready label */}
            <div style={{ fontSize: 11, color: t.t4, fontWeight: 550, margin: "8px 0 6px" }}>
              Not ready yet?
            </div>

            {/* Secondary paths */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {secondaryPaths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => handleSecondary(path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: `1px solid ${t.bdr}`,
                    backgroundColor: t.surface,
                    cursor: "pointer",
                    fontFamily: t.fontFamily,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{path.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 550, color: t.text }}>
                    {path.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Contact capture */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 650, color: t.text, marginBottom: 10 }}>
              Your details
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder={getContactPlaceholder()}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${t.bdr}`,
                  backgroundColor: t.bg,
                  color: t.t2,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: t.fontFamily,
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || !contact.trim()}
                style={{
                  flex: 2,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor:
                    name.trim() && contact.trim()
                      ? getPathColor(selectedPath!)
                      : t.sand,
                  color: name.trim() && contact.trim() ? "#FFFFFF" : t.t4,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: name.trim() && contact.trim() ? "pointer" : "default",
                  fontFamily: t.fontFamily,
                }}
              >
                {selectedPath?.label || "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            {doneType === "confirmed" && (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: t.greenBg,
                    border: `2px solid ${t.green}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.green}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ fontFamily: t.headingFont, fontSize: 18, fontWeight: 700, color: t.text }}>
                  Confirmed!
                </div>
                {selectedItem && (
                  <div style={{ fontSize: 12.5, color: t.t2, marginTop: 6 }}>
                    {selectedItem.name}
                    {dateMode === "range" && nights > 1 && ` · ${nights} nights`}
                  </div>
                )}
                {total > 0 && selectedItem && (
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.accent, marginTop: 4 }}>
                    {selectedItem.currency} {total.toLocaleString()}
                  </div>
                )}
                {selectedPath && (
                  <div style={{ fontSize: 11, color: t.t3, marginTop: 8 }}>
                    {selectedPath.action === "whatsapp"
                      ? "We'll reach you on WhatsApp"
                      : selectedPath.action === "callback"
                        ? "We'll call you back shortly"
                        : "Booking confirmed"}
                  </div>
                )}
              </>
            )}

            {doneType === "saved" && (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📩</div>
                <div style={{ fontFamily: t.headingFont, fontSize: 18, fontWeight: 700, color: t.text }}>
                  Quote saved!
                </div>
                {selectedItem && (
                  <div style={{ fontSize: 12.5, color: t.t2, marginTop: 6 }}>
                    {selectedItem.name} — {selectedItem.currency} {total.toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: 11, color: t.t3, marginTop: 8 }}>
                  Book whenever you&apos;re ready
                </div>
              </>
            )}

            {doneType === "shared" && (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                <div style={{ fontFamily: t.headingFont, fontSize: 18, fontWeight: 700, color: t.text }}>
                  Shared!
                </div>
                <div style={{ fontSize: 12.5, color: t.t2, marginTop: 6 }}>
                  They&apos;ll receive the details and a direct booking link
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
