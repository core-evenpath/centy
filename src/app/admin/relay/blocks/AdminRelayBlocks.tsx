'use client';

import React, { useState } from 'react';
import { BLOCK_PREVIEWS, T } from './BlockPreviews';
import { seedDefaultBlocksAction, resetAllBlockConfigsAction, toggleBlockStatusAction } from '@/actions/relay-admin-actions';

interface BlockDef {
  id: string;
  family: string;
  label: string;
  stage: string;
  desc: string;
  status: string;
  preview: React.ComponentType;
  fields_req: string[];
  fields_opt: string[];
  intents: string[];
  module: string | null;
}

const BLOCK_DEFS: BlockDef[] = [
  { id: "greeting", family: "entry", label: "Greeting", stage: "greeting", desc: "Welcome message with brand identity and quick action buttons", status: "active", preview: BLOCK_PREVIEWS.greeting, fields_req: ["brandName", "tagline", "welcomeMessage"], fields_opt: ["quickActions", "brandEmoji", "logoUrl"], intents: ["hello", "hi", "start", "hey"], module: null },
  { id: "skin_quiz", family: "entry", label: "Quiz / Survey", stage: "discovery", desc: "Multi-step qualification quiz with progress tracking", status: "new", preview: BLOCK_PREVIEWS.skin_quiz, fields_req: ["questions", "steps"], fields_opt: ["progressBar", "skipEnabled"], intents: ["quiz", "help me find", "recommend"], module: null },
  { id: "product_card", family: "catalog", label: "Product Card", stage: "discovery", desc: "Browsable item card with price, image, rating, and add-to-cart", status: "active", preview: BLOCK_PREVIEWS.product_card, fields_req: ["name", "price", "currency"], fields_opt: ["image", "rating", "badges", "subtitle", "specs", "reviewCount"], intents: ["show", "browse", "products", "menu", "catalog"], module: "moduleItems" },
  { id: "product_detail", family: "catalog", label: "Product Detail", stage: "showcase", desc: "Full item view with images, variants, specs, and actions", status: "active", preview: BLOCK_PREVIEWS.product_detail, fields_req: ["name", "price", "description"], fields_opt: ["images", "variants", "specs", "reviews", "sizes"], intents: ["details", "tell me more", "specs", "about"], module: "moduleItems" },
  { id: "compare", family: "catalog", label: "Compare", stage: "comparison", desc: "Side-by-side comparison table for 2-4 items", status: "active", preview: BLOCK_PREVIEWS.compare, fields_req: ["items", "comparisonFields"], fields_opt: ["highlightWinner", "recommendation"], intents: ["compare", "difference", "vs", "which one"], module: "moduleItems" },
  { id: "promo", family: "marketing", label: "Promo Banner", stage: "showcase", desc: "Promotional offer with discount code, countdown, or sale info", status: "active", preview: BLOCK_PREVIEWS.promo, fields_req: ["title", "description"], fields_opt: ["code", "expiresAt", "discountPercent", "ctaLabel"], intents: ["offer", "deal", "discount", "promo", "sale"], module: null },
  { id: "bundle", family: "marketing", label: "Bundle / Set", stage: "showcase", desc: "Multi-item bundle with combined pricing and savings indicator", status: "new", preview: BLOCK_PREVIEWS.bundle, fields_req: ["items", "bundlePrice"], fields_opt: ["originalPrice", "savingsPercent", "title"], intents: ["bundle", "set", "package", "combo"], module: "moduleItems" },
  { id: "cart", family: "commerce", label: "Cart", stage: "conversion", desc: "Shopping cart with line items, discounts, and checkout CTA", status: "active", preview: BLOCK_PREVIEWS.cart, fields_req: ["items", "total", "currency"], fields_opt: ["discount", "deliveryFee", "tax", "promoCode"], intents: ["cart", "checkout", "order", "buy", "bag"], module: null },
  { id: "order_confirmation", family: "commerce", label: "Order Confirmation", stage: "followup", desc: "Post-purchase confirmation with order ID and delivery info", status: "active", preview: BLOCK_PREVIEWS.order_confirmation, fields_req: ["orderId", "items", "total"], fields_opt: ["estimatedDelivery", "trackingUrl"], intents: ["confirm", "receipt", "thank"], module: null },
  { id: "order_tracker", family: "commerce", label: "Order Tracker", stage: "followup", desc: "Live order status with timeline steps and tracking link", status: "active", preview: BLOCK_PREVIEWS.order_tracker, fields_req: ["orderId", "status", "steps"], fields_opt: ["estimatedArrival", "carrier"], intents: ["track", "status", "where is", "delivery"], module: null },
  { id: "booking", family: "conversion", label: "Booking / Appointment", stage: "conversion", desc: "Time slot picker for consultations or appointments", status: "new", preview: BLOCK_PREVIEWS.booking, fields_req: ["availableSlots", "serviceType"], fields_opt: ["duration", "price", "staffName"], intents: ["book", "appointment", "schedule", "reserve"], module: null },
  { id: "subscription", family: "commerce", label: "Subscribe & Save", stage: "conversion", desc: "Auto-replenish subscription with frequency options and savings", status: "new", preview: BLOCK_PREVIEWS.subscription, fields_req: ["item", "frequencies"], fields_opt: ["currentPrice", "savingsPerFrequency"], intents: ["subscribe", "auto", "recurring", "replenish"], module: "moduleItems" },
  { id: "loyalty", family: "engagement", label: "Loyalty / Rewards", stage: "social_proof", desc: "Points balance, tier progress, and redeemable rewards", status: "new", preview: BLOCK_PREVIEWS.loyalty, fields_req: ["points", "tier"], fields_opt: ["nextTier", "redeemable", "multiplier"], intents: ["points", "rewards", "loyalty", "tier"], module: null },
  { id: "nudge", family: "engagement", label: "Smart Nudge", stage: "social_proof", desc: "Non-blocking contextual suggestion, upsell, or info tip", status: "active", preview: BLOCK_PREVIEWS.nudge, fields_req: ["message"], fields_opt: ["ctaLabel", "ctaAction", "icon", "variant"], intents: [], module: null },
  { id: "suggestions", family: "shared", label: "Quick Replies", stage: "greeting", desc: "Tappable suggestion chips for guided conversation flow", status: "active", preview: BLOCK_PREVIEWS.suggestions, fields_req: ["items"], fields_opt: ["title"], intents: [], module: null },
  { id: "contact", family: "support", label: "Contact Card", stage: "handoff", desc: "Business contact info with click-to-call, email, WhatsApp", status: "active", preview: BLOCK_PREVIEWS.contact, fields_req: ["businessName"], fields_opt: ["phone", "email", "whatsapp", "address", "hours"], intents: ["contact", "phone", "email", "reach", "call"], module: null },
];

const FAMILIES = [...new Set(BLOCK_DEFS.map(b => b.family))];
const FAMILY_LABELS: Record<string, string> = { entry: "Entry & Discovery", catalog: "Product & Catalog", marketing: "Pricing & Promos", commerce: "Cart & Commerce", conversion: "Conversion", engagement: "Engagement", shared: "Shared / Utility", support: "Support" };
const FAMILY_COLORS: Record<string, string> = { entry: T.pri, catalog: T.blue, marketing: T.acc, commerce: T.amber, conversion: T.green, engagement: T.pink, shared: T.t3, support: T.pri };

interface Props {
  initialBlocks?: Array<{ id: string; status: string }>;
}

export default function AdminRelayBlocks({ initialBlocks }: Props) {
  const [enabledBlocks, setEnabledBlocks] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    BLOCK_DEFS.forEach(b => {
      const init = initialBlocks?.find(ib => ib.id === b.id);
      m[b.id] = init ? init.status === 'active' : b.status === 'active';
    });
    return m;
  });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterFamily, setFilterFamily] = useState('all');
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);

  const toggleBlock = async (id: string) => {
    const newVal = !enabledBlocks[id];
    setEnabledBlocks(prev => ({ ...prev, [id]: newVal }));
    await toggleBlockStatusAction(id, newVal);
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedDefaultBlocksAction();
    setSeeding(false);
    window.location.reload();
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all block configs? This cannot be undone.')) return;
    setResetting(true);
    await resetAllBlockConfigsAction();
    setResetting(false);
    window.location.reload();
  };

  const activeCount = Object.values(enabledBlocks).filter(Boolean).length;
  const filtered = filterFamily === 'all' ? BLOCK_DEFS : BLOCK_DEFS.filter(b => b.family === filterFamily);
  const sel = selectedBlock ? BLOCK_DEFS.find(b => b.id === selectedBlock) : null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Karla', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;}button:hover{opacity:0.92;}button:active{transform:scale(0.97);}`}</style>

      <div style={{ background: T.surface, borderBottom: `1px solid ${T.bdr}`, padding: "20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1.5px" }}>Admin / Relay</div>
            <div style={{ fontSize: "22px", fontWeight: 600, color: T.t1, marginTop: "2px" }}>Block Registry</div>
            <div style={{ fontSize: "13px", color: T.t3, marginTop: "2px" }}>Visual preview of every relay block. Enable, disable, and connect to modules.</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleReset} disabled={resetting} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${T.red}`, background: T.redBg, color: T.red, fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: resetting ? 0.6 : 1 }}>{resetting ? 'Resetting...' : 'Reset All'}</button>
            <button onClick={handleSeed} disabled={seeding} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: seeding ? 0.6 : 1 }}>{seeding ? 'Seeding...' : 'Seed Defaults'}</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px", padding: "3px", background: T.bg, borderRadius: "8px" }}>
            {([{ id: "grid" as const, l: "◫ Grid" }, { id: "list" as const, l: "☰ List" }]).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: viewMode === v.id ? 600 : 400, background: viewMode === v.id ? T.surface : "transparent", color: viewMode === v.id ? T.t1 : T.t3, cursor: "pointer", boxShadow: viewMode === v.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none" }}>{v.l}</button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: T.bdr }} />
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            <button onClick={() => setFilterFamily("all")} style={{ padding: "4px 10px", borderRadius: "9999px", border: filterFamily === "all" ? "none" : `1px solid ${T.bdr}`, background: filterFamily === "all" ? T.pri : T.surface, color: filterFamily === "all" ? "#fff" : T.t3, fontSize: "10px", fontWeight: 500, cursor: "pointer" }}>All ({BLOCK_DEFS.length})</button>
            {FAMILIES.map(f => {
              const count = BLOCK_DEFS.filter(b => b.family === f).length;
              return <button key={f} onClick={() => setFilterFamily(f)} style={{ padding: "4px 10px", borderRadius: "9999px", border: filterFamily === f ? "none" : `1px solid ${T.bdr}`, background: filterFamily === f ? FAMILY_COLORS[f] : T.surface, color: filterFamily === f ? "#fff" : T.t3, fontSize: "10px", fontWeight: 500, cursor: "pointer" }}>{FAMILY_LABELS[f]?.split(" ")[0] || f} ({count})</button>;
            })}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: T.t3 }}><span style={{ fontWeight: 700, color: T.green }}>{activeCount}</span> active</span>
            <span style={{ fontSize: "11px", color: T.t3 }}><span style={{ fontWeight: 700, color: T.t4 }}>{BLOCK_DEFS.length - activeCount}</span> disabled</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px", display: "flex", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {filtered.map(b => {
                const Preview = b.preview;
                const isOn = enabledBlocks[b.id];
                const isSel = selectedBlock === b.id;
                return (
                  <div key={b.id} style={{ background: T.surface, border: isSel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, borderRadius: "12px", overflow: "hidden", opacity: isOn ? 1 : 0.5, transition: "all 0.2s", cursor: "pointer" }} onClick={() => setSelectedBlock(b.id)}>
                    <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: isOn ? T.bg : T.card }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: T.t1 }}>{b.label}</span>
                        <span style={{ fontSize: "7px", fontWeight: 600, color: FAMILY_COLORS[b.family], background: `${FAMILY_COLORS[b.family]}10`, padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase" }}>{b.family}</span>
                        {b.status === "new" && <span style={{ fontSize: "7px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "1px 5px", borderRadius: "3px" }}>NEW</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleBlock(b.id); }} style={{ width: 32, height: 18, borderRadius: 9, cursor: "pointer", position: "relative", border: "none", padding: 0, background: isOn ? T.green : T.bdrM, transition: "background 0.2s" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isOn ? 16 : 2, transition: "left 0.2s" }} />
                      </button>
                    </div>
                    <div style={{ padding: "8px", pointerEvents: "none", transform: "scale(0.95)", transformOrigin: "top center" }}>
                      <Preview />
                    </div>
                    <div style={{ padding: "5px 10px", borderTop: `1px solid ${T.bdr}`, background: T.bg }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "8px", color: T.t4 }}>Stage: <span style={{ fontWeight: 600, color: T.t2 }}>{b.stage}</span></span>
                        <span style={{ fontSize: "8px", color: T.t4 }}>{b.module ? `Module: ${b.module}` : "No module"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {FAMILIES.filter(f => filterFamily === "all" || f === filterFamily).map(fam => {
                const famBlocks = BLOCK_DEFS.filter(b => b.family === fam);
                if (famBlocks.length === 0) return null;
                return (
                  <div key={fam} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: FAMILY_COLORS[fam], textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{FAMILY_LABELS[fam]}</div>
                    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px" }}>
                      {famBlocks.map((b, i) => {
                        const isOn = enabledBlocks[b.id];
                        const isSel = selectedBlock === b.id;
                        return (
                          <div key={b.id} onClick={() => setSelectedBlock(b.id)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderBottom: i < famBlocks.length - 1 ? `1px solid ${T.bdr}` : "none", cursor: "pointer", background: isSel ? T.priBg : "transparent", opacity: isOn ? 1 : 0.55, transition: "all 0.15s" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${FAMILY_COLORS[b.family]}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: FAMILY_COLORS[b.family], fontWeight: 700, flexShrink: 0 }}>{b.label[0]}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{b.label}</span>
                                {b.status === "new" && <span style={{ fontSize: "7px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "1px 5px", borderRadius: "3px" }}>NEW</span>}
                              </div>
                              <div style={{ fontSize: "11px", color: T.t3, marginTop: "1px" }}>{b.desc}</div>
                              <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
                                <span style={{ fontSize: "8px", color: T.t4, background: T.bg, padding: "1px 5px", borderRadius: "3px" }}>Stage: {b.stage}</span>
                                <span style={{ fontSize: "8px", color: T.t4, background: T.bg, padding: "1px 5px", borderRadius: "3px" }}>{b.intents.length} triggers</span>
                                {b.module && <span style={{ fontSize: "8px", color: T.blue, background: T.blueBg, padding: "1px 5px", borderRadius: "3px" }}>⤳ {b.module}</span>}
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleBlock(b.id); }} style={{ width: 36, height: 20, borderRadius: 10, cursor: "pointer", position: "relative", border: "none", padding: 0, background: isOn ? T.green : T.bdrM, transition: "background 0.2s", flexShrink: 0 }}>
                              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: isOn ? 18 : 2, transition: "left 0.2s" }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sel && (
          <div style={{ width: "320px", flexShrink: 0, position: "sticky", top: "24px", alignSelf: "flex-start" }}>
            <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ padding: "12px", borderBottom: `1px solid ${T.bdr}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: T.t1 }}>{sel.label}</div>
                  <button onClick={() => setSelectedBlock(null)} style={{ background: "none", border: "none", fontSize: "14px", color: T.t4, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ fontSize: "11px", color: T.t3, marginTop: "2px" }}>{sel.desc}</div>
                <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                  <span style={{ fontSize: "8px", fontWeight: 600, color: FAMILY_COLORS[sel.family], background: `${FAMILY_COLORS[sel.family]}10`, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{sel.family}</span>
                  <span style={{ fontSize: "8px", fontWeight: 500, color: T.t3, background: T.bg, padding: "2px 6px", borderRadius: "4px" }}>Stage: {sel.stage}</span>
                  <span style={{ fontSize: "8px", fontWeight: 500, color: enabledBlocks[sel.id] ? T.green : T.red, background: enabledBlocks[sel.id] ? T.greenBg : T.redBg, padding: "2px 6px", borderRadius: "4px" }}>{enabledBlocks[sel.id] ? "Active" : "Disabled"}</span>
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Live preview</div>
                <div style={{ transform: "scale(0.92)", transformOrigin: "top left" }}>
                  <sel.preview />
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Data contract</div>
                <div style={{ marginBottom: "6px" }}>
                  <div style={{ fontSize: "8px", fontWeight: 600, color: T.blue, marginBottom: "3px" }}>Required fields</div>
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {sel.fields_req.map(f => <span key={f} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: T.blueBg, color: T.blue, fontWeight: 500, fontFamily: "monospace" }}>{f}</span>)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "8px", fontWeight: 600, color: T.t4, marginBottom: "3px" }}>Optional fields</div>
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {sel.fields_opt.map(f => <span key={f} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: T.bg, color: T.t3, fontFamily: "monospace" }}>{f}</span>)}
                  </div>
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Intent triggers</div>
                {sel.intents.length > 0 ? (
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {sel.intents.map(i => <span key={i} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "9999px", background: T.priBg, color: T.pri, fontWeight: 500 }}>{i}</span>)}
                  </div>
                ) : (
                  <span style={{ fontSize: "10px", color: T.t4 }}>System-triggered only (no user intent)</span>
                )}
              </div>

              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Module binding</div>
                {sel.module ? (
                  <div style={{ padding: "6px 8px", background: T.blueBg, borderRadius: "6px", border: `1px solid rgba(29,78,216,0.12)` }}>
                    <div style={{ fontSize: "10px", fontWeight: 600, color: T.blue }}>⤳ {sel.module}</div>
                    <div style={{ fontSize: "8px", color: T.t3, marginTop: "1px" }}>Data pulled from partner&apos;s enabled modules at runtime</div>
                  </div>
                ) : (
                  <div style={{ padding: "6px 8px", background: T.bg, borderRadius: "6px" }}>
                    <div style={{ fontSize: "10px", color: T.t3 }}>No module binding — uses config or session data</div>
                  </div>
                )}
              </div>

              <div style={{ padding: "10px 12px", display: "flex", gap: "6px" }}>
                <button style={{ flex: 1, padding: "7px", borderRadius: "7px", border: `1px solid ${T.bdr}`, background: T.surface, fontSize: "11px", fontWeight: 600, cursor: "pointer", color: T.t1 }}>Edit</button>
                <button onClick={() => toggleBlock(sel.id)} style={{ flex: 1, padding: "7px", borderRadius: "7px", border: "none", background: enabledBlocks[sel.id] ? T.red : T.green, fontSize: "11px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>{enabledBlocks[sel.id] ? "Disable" : "Enable"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
