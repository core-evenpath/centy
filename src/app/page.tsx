'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ─── Design Tokens ─── */
const C = {
  bg: "#FAF8F5", surface: "#ffffff", dark: "#0A0A0A",
  t1: "#111", t2: "#3B3B3B", t3: "#6B6B6B", t4: "#A0A0A0",
  bdr: "#E8E3DC", rose: "#E11D48",
  roseSoft: "rgba(225,29,72,0.07)", roseMid: "rgba(225,29,72,0.15)",
  green: "#10B981", greenSoft: "rgba(16,185,129,0.08)",
  blue: "#2563EB", blueSoft: "rgba(37,99,235,0.07)",
  purple: "#7C3AED", purpleSoft: "rgba(124,58,237,0.07)",
  amber: "#F59E0B", amberSoft: "rgba(245,158,11,0.08)",
  teal: "#0d9488", tealSoft: "rgba(13,148,136,0.07)",
  pink: "#be185d", pinkSoft: "rgba(190,24,93,0.07)",
  orange: "#ea580c",
};

const sf: React.CSSProperties = {
  fontFamily: "var(--font-instrument-serif), Georgia, serif",
  fontWeight: 400,
  fontStyle: "italic",
  color: C.rose,
};

/* ─── Data ─── */
const CARDS = [
  { id: 0, color: C.rose, icon: "💬", label: "INCOMING MESSAGE", side: "left" as const, slot: 0,
    head: "Website Chat · Just now",
    body: '"Interested in Botox for forehead and lip fillers. Pricing & availability?"',
    foot: "Sarah M. · Austin, TX" },
  { id: 1, color: C.blue, icon: "👤", label: "CUSTOMER IDENTIFIED", side: "right" as const, slot: 0,
    head: "Sarah Mitchell",
    meta: [{ k: "Lifetime", v: "$2,400" }, { k: "Tier", v: "VIP" }] },
  { id: 2, color: C.purple, icon: "🕐", label: "VISIT HISTORY", side: "right" as const, slot: 1,
    rows: [{ d: "Feb 12", t: "Botox · 20 units" }, { d: "Nov 3", t: "HydraFacial" }, { d: "Aug 19", t: "Chemical peel" }] },
  { id: 3, color: C.green, icon: "📄", label: "KNOWLEDGE BASE", side: "left" as const, slot: 1,
    docs: [{ n: "Treatment Menu.pdf", p: "98%" }, { n: "Pricing 2026.xlsx", p: "95%" }] },
  { id: 4, color: C.amber, icon: "💰", label: "PRICE CALCULATED", side: "left" as const, slot: 2,
    prices: [{ i: "Botox Forehead · 20 units", p: "$350" }, { i: "Lip Filler · 1ml Juvéderm", p: "$650" }],
    total: "$1,000", note: "VIP 10% loyalty applied" },
  { id: 5, color: C.green, icon: "✅", label: "AI RESPONSE READY", side: "right" as const, slot: 2,
    preview: "Personalized plan with booking link + financing option.",
    badge: "97% confidence", sent: "22 seconds" },
];

type Card = typeof CARDS[number];

const FEED = [
  { icon: "✨", accent: C.pink, biz: "Glow Med Spa", loc: "Austin, TX", ch: "Web Chat", msg: "Botox pricing + lip filler availability?", did: "Treatment plan + booking link sent", result: "Consultation booked", rev: 1000 },
  { icon: "🔧", accent: C.orange, biz: "AirPro HVAC", loc: "Phoenix, AZ", ch: "SMS", msg: "AC blowing warm air, 110°F, newborn at home", did: "Emergency slot found, tech dispatched", result: "Same-day service", rev: 450 },
  { icon: "⚖️", accent: C.purple, biz: "Morrison Law", loc: "Los Angeles", ch: "Web Chat", msg: "Rear-ended at red light, neck pain since yesterday", did: "Case qualified, free evaluation scheduled", result: "Intake booked", rev: 15000 },
  { icon: "🏠", accent: C.purple, biz: "Keystone Realty", loc: "Miami, FL", ch: "SMS", msg: "2BR condo near Brickell, under $600K?", did: "3 listings matched + mortgage pre-qual", result: "Tour scheduled", rev: 18000 },
  { icon: "🚗", accent: C.blue, biz: "Metro Motors", loc: "Dallas, TX", ch: "Web Chat", msg: "Family SUV under $40K, 3-row, hybrid?", did: "Matched Highlander + trade-in quoted", result: "Test drive booked", rev: 38500 },
  { icon: "🩺", accent: C.teal, biz: "ClearView Dental", loc: "Seattle", ch: "SMS", msg: "Sharp pain lower molar, can't sleep", did: "Emergency opening found + prep info sent", result: "Booked 8 AM", rev: 650 },
  { icon: "🏨", accent: C.blue, biz: "The Loft Hotel", loc: "Nashville", ch: "Web Chat", msg: "Anniversary weekend, rooftop suite?", did: "Suite + spa bundle, 20% off", result: "2 nights booked", rev: 1200 },
  { icon: "🏋️", accent: C.orange, biz: "F45 Downtown", loc: "Chicago", ch: "Web Chat", msg: "Want to try a class, schedule?", did: "Free trial link + coach intro", result: "Trial registered", rev: 200 },
];

const BCASTS = [
  { type: "Flash Offer", icon: "⚡", color: "#f59e0b", msg: "Hey Sarah! This weekend: 25% off all facials. Book by Friday — only 8 slots left!", sent: 284, opened: "89%", conv: "12%" },
  { type: "Win-Back", icon: "💜", color: "#8b5cf6", msg: "Hi James, it's been a while! Your 15% loyalty discount is waiting. Book anytime this week.", sent: 91, opened: "76%", conv: "18%" },
  { type: "Reminder", icon: "📅", color: "#0d9488", msg: "Your appointment with Dr. Patel is tomorrow at 4 PM. Reply YES to confirm.", sent: 156, opened: "94%", conv: "91%" },
];

function fmt(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${n}`; }


/* ─── OCard Component ─── */
function OCard({ card, visible, style: sx }: { card: Card; visible: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 14, borderLeft: `3px solid ${card.color}`,
      overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible
        ? "translateX(0) scale(1)"
        : card.side === "left" ? "translateX(-30px) scale(0.9)" : "translateX(30px) scale(0.9)",
      transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
      boxShadow: visible ? "0 6px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)" : "none",
      animation: visible ? `hp-float${card.side === "left" ? "L" : "R"} 5s ease-in-out ${card.id * 0.4}s infinite` : "none",
      ...sx,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${C.bdr}` }}>
        <span style={{ fontSize: 12 }}>{card.icon}</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: card.color, letterSpacing: 0.6, textTransform: "uppercase" }}>{card.label}</span>
        {visible && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: card.color, animation: "hp-ping 1s ease-out" }} />}
      </div>
      <div style={{ padding: "9px 12px" }}>
        {card.head && <div style={{ fontSize: 11, fontWeight: 600, color: C.t1, marginBottom: 3 }}>{card.head}</div>}
        {card.body && <div style={{ fontSize: 10, color: C.t2, lineHeight: 1.5, fontStyle: card.id === 0 ? "italic" : "normal" }}>{card.body}</div>}
        {card.foot && <div style={{ fontSize: 9, color: C.t4, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><span>📱</span>{card.foot}</div>}
        {card.meta && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
            {card.meta.map(m => (
              <div key={m.k} style={{ background: C.bg, borderRadius: 6, padding: "5px 8px" }}>
                <div style={{ fontSize: 8, color: C.t4 }}>{m.k}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.k === "Tier" ? C.amber : C.t1 }}>{m.v}</div>
              </div>
            ))}
          </div>
        )}
        {card.rows && card.rows.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < card.rows.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
            <span style={{ fontSize: 9, color: C.t4, minWidth: 40 }}>{r.d}</span>
            <span style={{ fontSize: 9, color: C.t2 }}>{r.t}</span>
          </div>
        ))}
        {card.docs && card.docs.map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < card.docs.length - 1 ? `1px solid ${C.bdr}` : "none" }}>
            <span style={{ fontSize: 9.5, color: C.t2 }}>📋 {d.n}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: C.green }}>{d.p}</span>
          </div>
        ))}
        {card.prices && (
          <>
            {card.prices.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${C.bdr}` }}>
                <span style={{ fontSize: 9, color: C.t2 }}>{p.i}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: C.amber }}>{p.p}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 12, fontWeight: 800 }}>{card.total}</span>
            </div>
            <div style={{ fontSize: 8, color: C.green, marginTop: 3 }}>✓ {card.note}</div>
          </>
        )}
        {card.preview && (
          <>
            <div style={{ fontSize: 9.5, color: C.t2, lineHeight: 1.5 }}>{card.preview}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.bdr}` }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: C.green, background: C.greenSoft, padding: "2px 6px", borderRadius: 4 }}>{card.badge}</span>
              <span style={{ fontSize: 8, color: C.t4 }}>{card.sent}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


/* ─── Orchestration Section ─── */
function Orchestration() {
  const [step, setStep] = useState(-1);
  const [go, setGo] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !go) setGo(true); }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [go]);

  useEffect(() => {
    if (!go) return;
    let i = 0;
    const next = () => { setStep(i); i++; if (i <= 5) setTimeout(next, 700); };
    setTimeout(next, 400);
  }, [go]);

  const replay = () => { setGo(false); setStep(-1); setTimeout(() => setGo(true), 300); };
  const done = step >= 5;
  const activeColor = step >= 0 ? CARDS[Math.min(step, 5)].color : C.bdr;

  const leftCards = CARDS.filter(c => c.side === "left");
  const rightCards = CARDS.filter(c => c.side === "right");

  return (
    <section ref={ref} style={{ padding: "40px 20px 60px", maxWidth: 1060, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.3, lineHeight: 1.1 }}>
          Watch your AI handle a
        </h2>
        <h2 style={{ ...sf, fontSize: 38, marginTop: 3 }}>real conversation</h2>
        <p style={{ fontSize: 14, color: C.t3, marginTop: 10 }}>From message to booking in 22 seconds — completely automatically.</p>
      </div>

      {/* Desktop 3-column layout */}
      <div className="hidden lg:grid" style={{ gridTemplateColumns: "250px 1fr 250px", gap: 20, maxWidth: 880, margin: "0 auto", alignItems: "center" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {leftCards.map(card => (
            <div key={card.id} style={{ position: "relative" }}>
              <OCard card={card} visible={step >= card.id} />
              {step >= card.id && (
                <div style={{
                  position: "absolute", top: "50%", right: -10, width: 10, height: 2,
                  background: `linear-gradient(90deg, ${card.color}40, transparent)`,
                  animation: "hp-fadeIn 0.3s ease",
                }}>
                  <div style={{
                    position: "absolute", right: 0, top: -2, width: 6, height: 6,
                    borderRadius: "50%", background: card.color,
                    animation: "hp-pulseDot 1.5s ease-out",
                    opacity: 0,
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CENTER PHONE */}
        <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 280, height: 500, borderRadius: 34,
            background: "transparent",
            boxShadow: step >= 0 ? `0 0 ${done ? 40 : 20}px ${activeColor}15` : "none",
            transition: "box-shadow 0.6s ease",
            zIndex: 1,
          }} />
          <PhoneMockup step={step} done={done} activeColor={activeColor} />
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rightCards.map(card => (
            <div key={card.id} style={{ position: "relative" }}>
              {step >= card.id && (
                <div style={{
                  position: "absolute", top: "50%", left: -10, width: 10, height: 2,
                  background: `linear-gradient(270deg, ${card.color}40, transparent)`,
                  animation: "hp-fadeIn 0.3s ease",
                }}>
                  <div style={{
                    position: "absolute", left: 0, top: -2, width: 6, height: 6,
                    borderRadius: "50%", background: card.color,
                    animation: "hp-pulseDot 1.5s ease-out", opacity: 0,
                  }} />
                </div>
              )}
              <OCard card={card} visible={step >= card.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: phone only */}
      <div className="lg:hidden" style={{ display: "flex", justifyContent: "center" }}>
        <PhoneMockup step={step} done={done} activeColor={activeColor} />
      </div>

      {/* Status */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 20px",
          background: done ? C.greenSoft : C.surface, border: `1px solid ${done ? "rgba(16,185,129,0.25)" : C.bdr}`,
          borderRadius: 10, transition: "all 0.4s",
        }}>
          {step >= 0 && !done && <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${activeColor}`, borderTopColor: "transparent", animation: "hp-spin 0.6s linear infinite", transition: "border-color 0.3s" }} />}
          {done && <span style={{ fontSize: 14 }}>✓</span>}
          <span style={{ fontSize: 12, fontWeight: 600, color: done ? C.green : C.t3, transition: "color 0.3s" }}>
            {step < 0 ? "Scroll to start..." : step < 1 ? "Message received..." : step < 2 ? "Identifying customer..." : step < 3 ? "Loading visit history..." : step < 4 ? "Searching knowledge base..." : step < 5 ? "Building treatment plan..." : "Response sent — 22 seconds"}
          </span>
        </div>
        {done && <div style={{ marginTop: 10, animation: "hp-fadeIn 0.5s 0.3s both" }}><button onClick={replay} style={{ fontSize: 11, color: C.t4, fontWeight: 500, padding: "5px 14px", border: `1px solid ${C.bdr}`, borderRadius: 7, background: C.surface, cursor: "pointer" }}>↻ Watch again</button></div>}
      </div>
    </section>
  );
}


/* ─── Phone Mockup (shared between desktop & mobile) ─── */
function PhoneMockup({ step, done, activeColor }: { step: number; done: boolean; activeColor: string }) {
  return (
    <div style={{
      width: 250, height: 460, borderRadius: 28, border: "5px solid #1a1a1a",
      overflow: "hidden", background: C.surface, position: "relative", zIndex: 2,
      boxShadow: "0 24px 64px rgba(0,0,0,0.1)",
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 72, height: 17, background: "#1a1a1a", borderRadius: "0 0 10px 10px", zIndex: 5 }} />
      <div style={{ padding: "24px 9px 6px", display: "flex", alignItems: "center", gap: 6, borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: C.rose, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 800 }}>P</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>PingBox</div>
          <div style={{ fontSize: 7.5, color: C.t4 }}>AI Assistant</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 3, padding: "2px 6px",
          borderRadius: 99, background: done ? C.greenSoft : step >= 0 ? C.roseSoft : C.bg,
          transition: "background 0.4s",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: done ? C.green : step >= 0 ? C.rose : C.t4, animation: "hp-pulse 1.5s infinite" }} />
          <span style={{ fontSize: 7.5, fontWeight: 600, color: done ? C.green : step >= 0 ? C.rose : C.t4 }}>{done ? "Sent" : step >= 0 ? "Working" : "Online"}</span>
        </div>
      </div>
      <div style={{ padding: 9, background: C.bg, height: "calc(100% - 44px)", overflowY: "auto" }}>
        {step >= 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 7, animation: "hp-slideRight 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ maxWidth: "85%", background: C.rose, color: "#fff", padding: "7px 10px", borderRadius: "12px 12px 3px 12px", fontSize: 9.5, lineHeight: 1.5 }}>
              Interested in Botox for forehead + lip fillers. Pricing & availability?
            </div>
          </div>
        )}
        {step >= 0 && !done && (
          <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: 7, animation: "hp-fadeIn 0.3s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.roseSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: C.rose, flexShrink: 0 }}>P</div>
            <div style={{
              background: C.surface, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "8px 12px",
              display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 0.15, 0.3].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: activeColor, transition: "background 0.3s", animation: `hp-pulse 0.8s infinite ${d}s` }} />)}
            </div>
          </div>
        )}
        {done && (
          <div style={{ animation: "hp-slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.roseSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: C.rose, flexShrink: 0 }}>P</div>
              <div style={{ background: C.surface, border: `1px solid ${C.bdr}`, padding: "7px 9px", borderRadius: 10, fontSize: 9.5, lineHeight: 1.6, color: C.t1 }}>
                Hey Sarah! Here&apos;s your plan:<br /><br />
                💉 <b>Botox Forehead</b> — $350<br />
                20 units · results in 3-5 days<br /><br />
                💋 <b>Lip Filler</b> — $650<br />
                1ml Juvéderm · instant<br /><br />
                📅 <b>Next:</b> Thu 4 PM · Dr. Meera
              </div>
            </div>
            <div style={{ marginLeft: 23, background: C.surface, border: `2px solid ${C.rose}`, borderRadius: 7, padding: 7, marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 3 }}>
                <span style={{ color: C.t3 }}>Total</span><span style={{ fontWeight: 700 }}>$1,000</span>
              </div>
              <div style={{ width: "100%", padding: 5, borderRadius: 5, background: C.rose, color: "#fff", fontSize: 8.5, fontWeight: 600, textAlign: "center" }}>Book Thu 4 PM — Dr. Meera</div>
            </div>
            <div style={{ marginLeft: 23, background: C.greenSoft, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, padding: "4px 7px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8 }}>
                <span style={{ color: "#047857", fontWeight: 600 }}>Revenue</span><span style={{ color: "#047857", fontWeight: 700 }}>$1,000</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── LiveFeed Section ─── */
function LiveFeed() {
  const [vis, setVis] = useState<typeof FEED>([]);
  const [ctr, setCtr] = useState(0);
  const [go, setGo] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !go) setGo(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [go]);

  useEffect(() => {
    if (!go) return;
    let i = 0;
    const show = () => { if (i >= FEED.length) return; setVis(p => [...p, FEED[i]]); i++; setTimeout(show, 750); };
    setTimeout(show, 300);
  }, [go]);

  useEffect(() => {
    if (!vis.length) return;
    const target = vis.reduce((s, item) => s + item.rev, 0);
    const start = ctr;
    const diff = target - start;
    const t0 = Date.now();
    const anim = () => {
      const p = Math.min((Date.now() - t0) / 500, 1);
      setCtr(Math.round(start + diff * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vis.length]);

  return (
    <section ref={ref} style={{ padding: "64px 20px", background: C.dark }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.2, color: "#fff", lineHeight: 1.12 }}>Right now, across 8 industries.</h2>
          <h2 style={{ ...sf, fontSize: 36, color: C.rose, marginTop: 3 }}>AI is closing deals.</h2>
        </div>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: "hp-pulse 1.5s infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Revenue captured</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", minWidth: 80, textAlign: "right" }}>${ctr.toLocaleString("en-US")}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 740, margin: "0 auto" }}>
          {vis.map(item => (
            <div key={item.biz} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 1fr auto", gap: 10, alignItems: "center",
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 11, padding: "10px 14px", animation: "hp-slideIn 0.45s cubic-bezier(0.16,1,0.3,1) both",
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `${item.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{item.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{item.biz}</span>
                  <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 3 }}>{item.ch}</span>
                  <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.2)" }}>{item.loc}</span>
                </div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>&ldquo;{item.msg}&rdquo;</div>
              </div>
              <div className="hidden sm:block" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9, color: item.accent, fontWeight: 500, marginBottom: 2 }}>{item.did}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "rgba(16,185,129,0.1)", borderRadius: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.green }} />
                  <span style={{ fontSize: 8, color: C.green, fontWeight: 600 }}>{item.result}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 50 }}><div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{fmt(item.rev)}</div></div>
            </div>
          ))}
          {go && vis.length < FEED.length && <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>{[0, 0.15, 0.3].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)", animation: `hp-pulse 1s infinite ${d}s` }} />)}</div>}
          {vis.length >= FEED.length && <div style={{ textAlign: "center", padding: "16px 0 4px", animation: "hp-fadeIn 0.6s" }}><p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>All automated. No human needed.</p></div>}
        </div>
      </div>
    </section>
  );
}


/* ─── Main Homepage ─── */
export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.t1, overflowX: "hidden" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Pingbox',
            url: 'https://pingbox.io',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'AI-powered messaging for service businesses. Responds to customers in 30 seconds with real answers, pricing, and bookings on any channel.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '50',
            },
          }),
        }}
      />

      {/* Navigation */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,248,245,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 22, height: 22, background: C.t1, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 800 }}>P</div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.3 }}>Pingbox</span>
          </Link>
          <div className="hidden sm:flex" style={{ alignItems: "center", gap: 18, fontSize: 11.5, fontWeight: 500, color: C.t3 }}>
            <a href="#demo">How it works</a>
            <a href="#industries">Industries</a>
            <a href="#broadcast">Broadcast</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/partner/login" className="hidden sm:inline" style={{ fontSize: 11.5, fontWeight: 500, color: C.t3, textDecoration: "none" }}>Sign in</Link>
            <Link href="/early-access" style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", background: C.t1, padding: "6px 14px", borderRadius: 6, textDecoration: "none" }}>Get started free</Link>
          </div>
        </div>
      </nav>

      <main>
      {/* Hero */}
      <section style={{ paddingTop: 72, textAlign: "center", maxWidth: 700, margin: "0 auto", padding: "72px 20px 32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 11px 3px 3px", background: C.roseSoft, border: `1px solid ${C.roseMid}`, borderRadius: 99, fontSize: 10.5, fontWeight: 600, color: C.rose, marginBottom: 22 }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: C.rose, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7 }}>✦</span>
          AI-powered messaging for service businesses
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.8 }}>The fastest reply<br />wins the customer.</h1>
        <h2 style={{ ...sf, fontSize: 42, marginTop: 4 }}>Every single time.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: C.t3, marginTop: 18, maxWidth: 500, margin: "18px auto 0" }}>Pingbox reads your documents and responds to customers in 30 seconds — with real answers, real pricing, and real bookings. On any channel.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <Link href="/early-access" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.t1, color: "#fff", padding: "13px 26px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 14px rgba(0,0,0,0.12)", textDecoration: "none" }}>
            Start free — 14 days
            <span style={{ width: 22, height: 22, borderRadius: 6, background: C.rose, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>→</span>
          </Link>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14 }}>
          {["Website Chat", "SMS", "WhatsApp", "Telegram"].map(ch => (
            <span key={ch} style={{ fontSize: 10, color: C.t4, fontWeight: 500 }}>{ch}</span>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: C.t4, marginTop: 6 }}>No credit card · No sales call · Working in 5 minutes</p>
      </section>

      <div id="demo"><Orchestration /></div>
      <div id="industries"><LiveFeed /></div>


      {/* Broadcast */}
      <section id="broadcast" style={{ padding: "56px 20px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Don&apos;t just respond. <span style={sf}>Reach out first.</span></h2>
            <p style={{ fontSize: 13, color: C.t3, marginTop: 8 }}>Broadcast campaigns with 89% open rates. Not email blasts rotting in spam.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12 }}>
            {BCASTS.map(b => (
              <div key={b.type} style={{ background: C.surface, border: `1px solid ${C.bdr}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 6, background: `${b.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{b.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{b.type}</span>
                </div>
                <div style={{ background: C.bg, borderRadius: 8, padding: 10, border: `1px solid ${C.bdr}`, fontSize: 10.5, color: C.t2, lineHeight: 1.6 }}>{b.msg}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.bdr}` }}>
                  {[{ l: "Sent", v: b.sent }, { l: "Opened", v: b.opened }, { l: "Converted", v: b.conv }].map(x => (
                    <div key={x.l} style={{ textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{typeof x.v === "number" ? x.v : x.v}</div><div style={{ fontSize: 8.5, color: C.t4 }}>{x.l}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Intelligence */}
      <section style={{ padding: "56px 20px", background: C.surface }}>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ maxWidth: 920, margin: "0 auto", gap: 32, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 9.5, fontWeight: 700, color: C.rose, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Document Intelligence</p>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.15 }}>Your docs become your <span style={sf}>smartest employee</span></h2>
            <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.6, marginTop: 12, maxWidth: 380 }}>Upload catalogs, price lists, policies. AI reads every document and answers customers with your real data.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 18 }}>
              {[{ t: "PDF, Excel, Word, images — any format", i: "📄" }, { t: "Every answer cites its source document", i: "🔍" }, { t: "Auto-updates on new uploads", i: "🔄" }, { t: "Confidence score on every response", i: "📊" }].map(f => (
                <div key={f.t} style={{ display: "flex", gap: 7, alignItems: "center" }}><span style={{ fontSize: 13 }}>{f.i}</span><span style={{ fontSize: 11.5, color: C.t2 }}>{f.t}</span></div>
              ))}
            </div>
          </div>
          <div style={{ background: C.bg, borderRadius: 14, border: `1px solid ${C.bdr}`, padding: 18, boxShadow: "0 6px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, color: C.t4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>📄 Knowledge Base — 2 docs matched</div>
            {[{ name: "Service Menu 2026.pdf", match: "98%", pg: "24 pages" }, { name: "Pricing.xlsx", match: "95%", pg: "6 sheets" }].map(d => (
              <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", background: C.surface, borderRadius: 7, marginBottom: 5, border: `1px solid ${C.bdr}` }}>
                <div><div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{d.name}</div><div style={{ fontSize: 8.5, color: C.t4 }}>{d.pg}</div></div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{d.match}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: 10, background: C.greenSoft, borderRadius: 7, border: "1px solid rgba(16,185,129,0.15)" }}>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: "#047857", marginBottom: 3 }}>AI extracted:</div>
              <div style={{ fontSize: 10.5, color: C.t1, lineHeight: 1.6 }}>&ldquo;Botox Forehead — $350 (20 units). Lip Filler 1ml — $650. VIP clients get priority + 10% loyalty.&rdquo;</div>
              <div style={{ fontSize: 8, color: C.t4, marginTop: 3 }}>Source: Service Menu 2026.pdf, p.8</div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: "56px 20px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>Live in <span style={sf}>five minutes</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, marginTop: 28 }}>
            {[
              { n: "01", t: "Upload your documents", d: "Catalogs, price lists, FAQs — anything customers ask about." },
              { n: "02", t: "Connect your channels", d: "Website chat, SMS, WhatsApp, or Telegram. One inbox." },
              { n: "03", t: "AI starts closing", d: "Customers message. AI responds with real answers. You approve." },
            ].map(x => (
              <div key={x.n} style={{ background: C.surface, borderRadius: 12, padding: 20, border: `1px solid ${C.bdr}`, textAlign: "left" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.rose, letterSpacing: 1, marginBottom: 8 }}>STEP {x.n}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 5 }}>{x.t}</div>
                <div style={{ fontSize: 11.5, color: C.t3, lineHeight: 1.6 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: "64px 20px", background: C.dark, textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.2, color: "#fff", lineHeight: 1.12 }}>Your competitor just replied</h2>
          <h2 style={{ ...sf, fontSize: 36, color: C.rose, marginTop: 3 }}>in 30 seconds.</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 14, lineHeight: 1.6 }}>Your customers don&apos;t wait. Neither should your business.</p>
          <Link href="/early-access" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: C.t1, padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, marginTop: 24, textDecoration: "none" }}>
            Start free — 14 days
            <span style={{ width: 24, height: 24, borderRadius: 6, background: C.rose, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>→</span>
          </Link>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>Questions? <a href="mailto:hello@pingbox.io" style={{ color: "rgba(255,255,255,0.4)" }}>hello@pingbox.io</a></p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: 20, borderTop: `1px solid ${C.bdr}`, background: C.bg }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 18, height: 18, background: C.t1, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 7.5, fontWeight: 800 }}>P</div>
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>Pingbox</span>
          </Link>
          <div style={{ display: "flex", gap: 16, fontSize: 10.5, color: C.t4 }}><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@pingbox.io">Contact</a></div>
          <div style={{ fontSize: 9.5, color: C.t4 }}>© 2025 Pingbox</div>
        </div>
      </footer>
    </div>
  );
}
