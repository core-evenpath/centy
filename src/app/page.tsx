'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ─── Design Tokens ─── */
const G = "#10b981";
const R = "#fb7185";
const B = "#60a5fa";
const P = "#a78bfa";
const A = "#fbbf24";
const T = "#2dd4bf";
const W = "#e2e8f0";
const D = "#4b5563";
const BG = "#08080a";
const CARD = "rgba(255,255,255,0.02)";
const BDR = "rgba(255,255,255,0.06)";

const font = "var(--font-jetbrains-mono), 'JetBrains Mono', monospace";
const sans = "var(--font-dm-sans), -apple-system, sans-serif";

/* ─── Data ─── */
const FEED = [
  { icon: "🔧", accent: A, biz: "AirPro HVAC", loc: "Phoenix", ch: "SMS", msg: "AC warm air, 108°F, newborn", did: "Emergency dispatch", result: "Same-day", rev: 450 },
  { icon: "✨", accent: R, biz: "Glow Med Spa", loc: "Austin", ch: "WEB", msg: "Botox pricing + availability?", did: "Treatment plan sent", result: "Booked", rev: 1000 },
  { icon: "⚖️", accent: P, biz: "Morrison Law", loc: "LA", ch: "SMS", msg: "Rear-ended, neck pain", did: "Case qualified", result: "Intake", rev: 15000 },
  { icon: "🏠", accent: P, biz: "Keystone Realty", loc: "Miami", ch: "WEB", msg: "2BR condo Brickell <$600K", did: "3 listings matched", result: "Tour", rev: 18000 },
  { icon: "🚗", accent: B, biz: "Metro Motors", loc: "Dallas", ch: "WEB", msg: "SUV <$40K hybrid 3-row", did: "Match + trade-in", result: "Test drive", rev: 38500 },
  { icon: "🩺", accent: T, biz: "ClearView Dental", loc: "Seattle", ch: "SMS", msg: "Sharp molar pain, can't sleep", did: "Emergency slot", result: "Booked", rev: 650 },
  { icon: "🏨", accent: B, biz: "The Loft Hotel", loc: "Nashville", ch: "WEB", msg: "Anniversary rooftop suite?", did: "Suite + spa 20% off", result: "2 nights", rev: 1200 },
  { icon: "🏋️", accent: A, biz: "F45 Fitness", loc: "Chicago", ch: "WEB", msg: "Trial class schedule?", did: "Free trial link", result: "Signed up", rev: 200 },
];

const BCASTS = [
  { type: "flash_offer", icon: "⚡", color: A, msg: "Hey Sarah! This weekend: 25% off all facials. Book by Friday — 8 slots left!", sent: 284, opened: "89%", conv: "12%" },
  { type: "win_back", icon: "💜", color: P, msg: "Hi James, it's been a while! Your 15% loyalty discount is waiting. Book anytime.", sent: 91, opened: "76%", conv: "18%" },
  { type: "reminder", icon: "📅", color: T, msg: "Appointment with Dr. Patel tomorrow at 4 PM. Reply YES to confirm.", sent: 156, opened: "94%", conv: "91%" },
];

function fmt(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${n}`; }

/* ─── Shared UI ─── */
function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600, background: `${color}18`, color, marginRight: 4, border: `1px solid ${color}15` }}>{children}</span>;
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, fontSize: 13, fontFamily: font, marginBottom: 6 }}>
      <span style={{ color: G, fontWeight: 700, marginRight: 8 }}>❯</span>
      {children}
    </div>
  );
}

function Sep({ glow }: { glow?: boolean }) {
  return <div style={{ height: 1, background: glow ? `linear-gradient(90deg, transparent, ${G}30, transparent)` : "#1a1a1a", margin: "8px 0" }} />;
}

function Line({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11.5, lineHeight: 1.65, fontFamily: font, marginBottom: 1 }}>
      {n && <span style={{ color: "#333", marginRight: 8, fontSize: 10 }}>{String(n).padStart(2, "0")}</span>}
      {children}
    </div>
  );
}

function TrafficDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {["#ef4444", A, G].map(c => <div key={c} style={{ width: 7, height: 7, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
    </div>
  );
}


/* ─── TypeWriter ─── */
function TypeWriter({ text, active, color = W }: { text: string; active: boolean; color?: string }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setDisplayed(""); idx.current = 0; return; }
    let last = 0;
    const step = (ts: number) => {
      if (!last) last = ts;
      if (ts - last > 18) {
        last = ts;
        idx.current++;
        setDisplayed(text.slice(0, idx.current));
        if (idx.current >= text.length) return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, text]);

  return (
    <span style={{ color }}>
      {displayed}
      {active && displayed.length < text.length && <span style={{ display: "inline-block", width: 6, height: 13, background: G, marginLeft: 1, verticalAlign: "middle", animation: "hp-blink 0.7s step-end infinite" }} />}
    </span>
  );
}


/* ─── Orchestration ─── */
function Orchestration() {
  const [step, setStep] = useState(-1);
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
    const tick = () => { setStep(i); i++; if (i <= 8) setTimeout(tick, 500); };
    setTimeout(tick, 250);
  }, [go]);

  const replay = () => { setGo(false); setStep(-1); setTimeout(() => setGo(true), 300); };
  const done = step >= 8;

  const lines = [
    { n: 1, vis: 0, el: <><Tag color={R}>MSG</Tag><span style={{ color: W }}>&ldquo;AC blowing warm air, it&apos;s 108°F, I have a newborn&rdquo;</span></> },
    { n: 2, vis: 1, el: <><Tag color={B}>IDN</Tag><span style={{ color: B }}>David Chen</span><span style={{ color: D }}> · homeowner · Phoenix, AZ</span></> },
    { n: 3, vis: 2, el: <><Tag color={R}>URG</Tag><span style={{ color: R }}>emergency flagged</span><span style={{ color: D }}> · infant present · </span><span style={{ color: A }}>priority queue</span></> },
    { n: 4, vis: 3, el: <><Tag color={A}>RAG</Tag><span style={{ color: A }}>HVAC Service Catalog.pdf</span><span style={{ color: G }}> 96%</span><span style={{ color: D }}> match</span></> },
    { n: 5, vis: 4, el: <><Tag color={A}>RAG</Tag><span style={{ color: A }}>Emergency Pricing.xlsx</span><span style={{ color: G }}> 93%</span><span style={{ color: D }}> match</span></> },
    { n: 6, vis: 5, el: <><Tag color={T}>DSP</Tag><span style={{ color: T }}>Mike R.</span><span style={{ color: D }}> · 2.3 mi away · </span><span style={{ color: G }}>available now</span></> },
    { n: 7, vis: 6, el: <><Tag color={G}>QTE</Tag><span style={{ color: W }}>Emergency AC diagnostic</span><span style={{ color: D }}> · </span><span style={{ color: "#f8fafc", fontWeight: 600 }}>$189</span></> },
    { n: 8, vis: 7, el: <><Tag color={G}>RSP</Tag><span style={{ color: G }}>composed</span><span style={{ color: D }}> · 94% confidence · booking link attached</span></> },
  ];

  const statusText = step < 0 ? "awaiting message..." : step < 1 ? "message received..." : step < 2 ? "identifying customer..." : step < 3 ? "urgency assessment..." : step < 5 ? "searching service catalog..." : step < 6 ? "dispatching nearest tech..." : step < 8 ? "building quote..." : "✓ sent — 24 seconds · tech en route";

  return (
    <section ref={ref} id="demo" style={{ padding: "48px 24px 56px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.015, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "32px 32px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Prompt>
            <span style={{ color: W }}>pingbox</span>
            <span style={{ color: A }}> demo</span>
            <span style={{ color: P }}> --live</span>
            <span style={{ color: D }}> --channel sms</span>
          </Prompt>
          <h2 style={{ fontFamily: sans, fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -1.2, marginTop: 12 }}>
            Watch your AI handle a <span style={{ color: R, fontStyle: "italic" }}>real conversation</span>
          </h2>
          <p style={{ fontSize: 12, color: D, fontFamily: font, marginTop: 6 }}>emergency HVAC service · SMS · auto-dispatch enabled</p>
        </div>

        {/* Desktop 3-column layout */}
        <div className="hidden lg:grid" style={{ gridTemplateColumns: "1fr 270px 1fr", gap: 16, alignItems: "start" }}>
          {/* LEFT — Process Log */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: "hidden", backdropFilter: "blur(4px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderBottom: `1px solid ${BDR}`, background: "rgba(255,255,255,0.01)" }}>
              <TrafficDots />
              <span style={{ fontSize: 9, color: "#333", marginLeft: 6, fontFamily: font }}>process_log</span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              <Prompt><span style={{ color: W }}>pingbox</span><span style={{ color: A }}> process</span><span style={{ color: P }}> --urgent</span></Prompt>
              <Sep />
              {lines.map((l, i) => (
                <div key={i} style={{
                  opacity: step >= l.vis ? 1 : 0,
                  transform: step >= l.vis ? "translateX(0)" : "translateX(-10px)",
                  transition: `all 0.35s cubic-bezier(0.34,1.56,0.64,1)`,
                  willChange: "transform, opacity",
                }}>
                  <Line n={l.n}>{l.el}</Line>
                </div>
              ))}
              <div style={{ opacity: done ? 1 : 0, transition: "opacity 0.4s ease 0.15s" }}>
                <Sep glow />
                <Line>
                  <span style={{ color: G }}>✓</span>
                  <span style={{ marginLeft: 8, color: G }}>Sent</span>
                  <span style={{ color: D }}> · </span>
                  <span style={{ color: "#f8fafc", fontWeight: 600 }}>24s</span>
                  <span style={{ color: D }}> · tech en route · </span>
                  <span style={{ color: "#f8fafc", fontWeight: 600 }}>$189</span>
                </Line>
                <div style={{ display: "flex", gap: 0, marginTop: 6 }}>
                  {[{ w: 30, c: R }, { w: 25, c: B }, { w: 20, c: R }, { w: 50, c: A }, { w: 35, c: T }, { w: 30, c: G }, { w: 20, c: G }].map((b, i) => (
                    <div key={i} style={{ height: 2, width: b.w, background: b.c, borderRadius: 1, marginRight: 1.5, opacity: 0.6 }} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: "#333", marginTop: 4, fontFamily: font }}>msg 0.2s → idn 0.6s → urg 1.1s → rag 3.4s → dsp 2.8s → qte 1.2s → send 0.4s</div>
              </div>
            </div>
          </div>

          {/* CENTER — Phone */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
            <PhoneMockup step={step} done={done} />
          </div>

          {/* RIGHT — Dispatch Status */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 10, overflow: "hidden", backdropFilter: "blur(4px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderBottom: `1px solid ${BDR}`, background: "rgba(255,255,255,0.01)" }}>
              <TrafficDots />
              <span style={{ fontSize: 9, color: "#333", marginLeft: 6, fontFamily: font }}>dispatch_status</span>
            </div>
            <div style={{ padding: "10px 12px" }}>
              {[
                { label: "channel", value: "SMS", color: W, vis: 0 },
                { label: "customer", value: "David Chen · Phoenix, AZ", color: B, vis: 1 },
                { label: "urgency", value: "■ EMERGENCY · infant", color: R, vis: 2 },
                { label: "issue", value: "AC warm air · 108°F outdoor", color: A, vis: 2 },
                { label: "docs", value: "2 matched (96%, 93%)", color: A, vis: 4 },
                { label: "tech", value: "Mike R. · 2.3 mi · avail.", color: T, vis: 5 },
                { label: "eta", value: "45 minutes", color: G, vis: 5 },
                { label: "quote", value: "$189 diagnostic", color: "#f8fafc", vis: 6 },
                { label: "confidence", value: "94%", color: G, vis: 7 },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex", fontSize: 10.5, fontFamily: font, lineHeight: 1.7,
                  opacity: step >= row.vis ? 1 : 0,
                  transform: step >= row.vis ? "translateX(0)" : "translateX(8px)",
                  transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  willChange: "transform, opacity",
                }}>
                  <span style={{ color: "#2a2a2a", minWidth: 80 }}>{row.label}</span>
                  <span style={{ color: "#1a1a1a", margin: "0 5px" }}>│</span>
                  <span style={{ color: row.color, fontWeight: row.label === "urgency" ? 700 : 400 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ opacity: done ? 1 : 0, transition: "opacity 0.4s ease 0.2s" }}>
                <Sep glow />
                <div style={{ fontSize: 10.5, fontFamily: font }}>
                  <span style={{ color: G }}>→</span>
                  <span style={{ color: "#f8fafc", fontWeight: 600, marginLeft: 6 }}>$189</span>
                  <span style={{ color: D }}> booked in </span>
                  <span style={{ color: "#f8fafc", fontWeight: 600 }}>24s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: phone only */}
        <div className="lg:hidden" style={{ display: "flex", justifyContent: "center" }}>
          <PhoneMockup step={step} done={done} />
        </div>

        {/* Status pill */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px",
            background: done ? `${G}08` : CARD, border: `1px solid ${done ? `${G}25` : BDR}`,
            borderRadius: 6, fontFamily: font, transition: "all 0.4s",
          }}>
            {step >= 0 && !done && <div style={{ width: 9, height: 9, borderRadius: "50%", border: `2px solid ${step >= 3 ? R : B}`, borderTopColor: "transparent", animation: "hp-spin 0.5s linear infinite", transition: "border-color 0.3s" }} />}
            <span style={{ fontSize: 10.5, fontWeight: 500, color: done ? G : D }}>{statusText}</span>
          </div>
          {done && <div style={{ marginTop: 7 }}><button onClick={replay} style={{ fontSize: 9, color: "#333", fontWeight: 500, padding: "3px 10px", border: `1px solid ${BDR}`, borderRadius: 4, background: "transparent", cursor: "pointer", fontFamily: font }}>↻ replay</button></div>}
        </div>
      </div>
    </section>
  );
}


/* ─── Phone Mockup ─── */
function PhoneMockup({ step, done }: { step: number; done: boolean }) {
  return (
    <div style={{
      width: 260, height: 450, borderRadius: 24, border: "3px solid #222",
      overflow: "hidden", background: "#0e0e0e", position: "relative",
      boxShadow: done
        ? `0 0 30px ${G}10, 0 0 60px ${G}05, 0 20px 50px rgba(0,0,0,0.5)`
        : "0 20px 50px rgba(0,0,0,0.5)",
      transition: "box-shadow 1s ease",
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 68, height: 14, background: "#222", borderRadius: "0 0 8px 8px", zIndex: 5 }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: done ? G : step >= 0 ? `linear-gradient(90deg, transparent, ${R}, transparent)` : "transparent", transition: "all 0.5s", opacity: 0.5 }} />

      <div style={{ padding: "20px 9px 5px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: "#161616", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: G, fontSize: 9, fontWeight: 800 }}>P</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: sans }}>AirPro HVAC</div>
          <div style={{ fontSize: 7, color: "#444", fontFamily: font }}>AI Service Agent</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 4, background: done ? `${G}15` : step >= 3 ? `${R}12` : "transparent", border: `1px solid ${done ? `${G}25` : step >= 3 ? `${R}20` : "transparent"}`, transition: "all 0.3s" }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: done ? G : step >= 0 ? R : "#333", boxShadow: `0 0 4px ${done ? G : R}` }} />
          <span style={{ fontSize: 7, fontWeight: 600, color: done ? G : step >= 0 ? R : "#444", fontFamily: font }}>{done ? "SENT" : step >= 3 ? "URGENT" : step >= 0 ? "ACTIVE" : "READY"}</span>
        </div>
      </div>

      <div style={{ padding: 8, background: "#0a0a0a", height: "calc(100% - 40px)", overflowY: "auto", fontFamily: font }}>
        {step >= 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 7, animation: "hp-fadeIn 0.25s" }}>
            <div style={{ maxWidth: "84%", background: "#162031", color: B, padding: "7px 9px", borderRadius: "10px 10px 3px 10px", fontSize: 9.5, lineHeight: 1.5, border: `1px solid ${B}20` }}>
              AC blowing warm air. It&apos;s 108°F outside and I have a 3-month-old baby. Need someone ASAP.
            </div>
          </div>
        )}

        {step >= 1 && !done && (
          <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: 7 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#141414", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: G, fontWeight: 800, flexShrink: 0 }}>P</div>
            <div style={{ background: "#121212", border: "1px solid #1e1e1e", borderRadius: 7, padding: "6px 9px", display: "flex", gap: 3 }}>
              {[0, 0.12, 0.24].map(d => <span key={d} style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: step >= 3 ? R : "#444", animation: `hp-pulse 0.7s infinite ${d}s`, transition: "background 0.3s" }} />)}
            </div>
          </div>
        )}

        {done && (
          <div style={{ animation: "hp-fadeIn 0.4s" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginBottom: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#141414", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: G, fontWeight: 800, flexShrink: 0 }}>P</div>
              <div style={{ background: "#121212", border: "1px solid #1e1e1e", padding: "7px 8px", borderRadius: 7, fontSize: 9, lineHeight: 1.65, color: "#bbb" }}>
                <TypeWriter active={done} color="#bbb" text={"Hi David. I see this is urgent with an infant at home — we're prioritizing your call.\n\n🔧 Emergency AC diagnostic: $189\n👨‍🔧 Mike R. is 2.3 miles away\n⏱️ ETA: 45 minutes\n\nHe'll check refrigerant, compressor & airflow."} />
              </div>
            </div>

            <div style={{ marginLeft: 21, background: `${A}10`, border: `1px solid ${A}18`, borderRadius: 5, padding: 6, marginBottom: 5, animation: "hp-fadeIn 0.4s 1.8s both" }}>
              <div style={{ width: "100%", padding: 4.5, borderRadius: 3, background: A, color: "#000", fontSize: 8, fontWeight: 700, textAlign: "center" }}>Confirm — Mike arrives by 3:15 PM</div>
            </div>
            <div style={{ marginLeft: 21, background: `${G}0a`, border: `1px solid ${G}15`, borderRadius: 4, padding: "3px 6px", animation: "hp-fadeIn 0.4s 2.2s both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7.5 }}>
                <span style={{ color: G, fontWeight: 600 }}>Service value</span>
                <span style={{ color: G, fontWeight: 700 }}>$189 – $450</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── LiveFeed ─── */
function LiveFeed() {
  const [count, setCount] = useState(0);
  const [ctr, setCtr] = useState(0);
  const [go, setGo] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !go) setGo(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [go]);

  useEffect(() => {
    if (!go) return;
    let i = 0;
    const show = () => { if (i >= FEED.length) return; i++; setCount(i); setTimeout(show, 600); };
    setTimeout(show, 150);
  }, [go]);

  useEffect(() => {
    if (!count) return;
    const target = FEED.slice(0, count).reduce((s, x) => s + x.rev, 0);
    const start = ctr; const diff = target - start; const t0 = Date.now();
    const anim = () => { const p = Math.min((Date.now() - t0) / 350, 1); setCtr(Math.round(start + diff * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(anim); };
    requestAnimationFrame(anim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <section ref={ref} id="feed" style={{ padding: "56px 24px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.02, backgroundImage: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(16,185,129,0.3) 1deg, transparent 2deg)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div style={{ maxWidth: 780, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <Prompt><span style={{ color: W }}>pingbox</span><span style={{ color: A }}> feed</span><span style={{ color: P }}> --all</span></Prompt>
          <h2 style={{ fontFamily: sans, fontSize: 30, fontWeight: 800, color: "#fff", letterSpacing: -1, marginTop: 10 }}>
            Right now, across 8 industries.
            <br /><span style={{ color: R, fontStyle: "italic" }}>AI is closing deals.</span>
          </h2>
        </div>

        <div style={{ textAlign: "center", margin: "18px 0 22px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "7px 18px", background: CARD, border: `1px solid ${BDR}`, borderRadius: 6, fontFamily: font }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: G, boxShadow: `0 0 6px ${G}`, animation: "hp-pulse 1.5s infinite" }} />
            <span style={{ fontSize: 9.5, color: D }}>revenue_captured</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums", minWidth: 60, textAlign: "right" }}>${ctr.toLocaleString("en-US")}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {FEED.map((item, i) => (
            <div key={item.biz} style={{
              display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 8, alignItems: "center",
              background: CARD, border: `1px solid ${BDR}`, borderLeft: `2px solid ${count > i ? item.accent : "transparent"}`,
              borderRadius: 6, padding: "7px 12px", fontFamily: font,
              opacity: count > i ? 1 : 0.03,
              transform: count > i ? "translateX(0)" : "translateX(-8px)",
              transition: `opacity 0.35s ease ${i * 0.03}s, transform 0.35s ease ${i * 0.03}s, border-color 0.3s`,
              willChange: "opacity, transform",
              height: 50,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span style={{ fontSize: 7.5, color: D, background: `${item.accent}12`, padding: "0.5px 3px", borderRadius: 2, border: `1px solid ${item.accent}10` }}>{item.ch}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{item.biz}</span>
                  <span className="hidden sm:inline" style={{ fontSize: 7.5, color: "#2a2a2a" }}>{item.loc}</span>
                  <span className="hidden sm:inline" style={{ fontSize: 8, color: D }}>→</span>
                  <span className="hidden sm:inline" style={{ fontSize: 8.5, color: item.accent }}>{item.did}</span>
                  <span style={{ fontSize: 7.5, color: G, background: `${G}12`, padding: "0 3px", borderRadius: 2 }}>{item.result}</span>
                </div>
                <div style={{ fontSize: 9, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>&ldquo;{item.msg}&rdquo;</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", minWidth: 40, textAlign: "right" }}>{fmt(item.rev)}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 12, fontFamily: font, fontSize: 10, color: D, opacity: count >= FEED.length ? 1 : 0, transition: "opacity 0.5s ease 0.3s" }}>
          all automated. no human needed.
        </div>
      </div>
    </section>
  );
}


/* ─── Main Page ─── */
export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: W, overflowX: "hidden", fontFamily: font }}>
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

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,8,10,0.94)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 20px", height: 42, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 18, height: 18, background: "#111", border: "1px solid #2a2a2a", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", color: G, fontSize: 8, fontWeight: 800 }}>P</div>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: sans, color: "#fff" }}>Pingbox</span>
          </Link>
          <div className="hidden sm:flex" style={{ alignItems: "center", gap: 14, fontSize: 10, color: D }}>
            <a href="#demo">how_it_works</a><a href="#feed">industries</a><a href="#broadcast">broadcast</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link href="/partner/login" className="hidden sm:inline" style={{ fontSize: 9.5, color: D, padding: "3px 8px", textDecoration: "none" }}>sign_in</Link>
            <Link href="/early-access" style={{ fontSize: 9.5, fontWeight: 600, color: BG, background: G, padding: "4px 10px", borderRadius: 3, border: `1px solid ${G}`, textDecoration: "none" }}>get_started</Link>
          </div>
        </div>
      </nav>

      <main>
      {/* HERO */}
      <section style={{ paddingTop: 60, textAlign: "center", maxWidth: 680, margin: "0 auto", padding: "60px 24px 20px", position: "relative" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${G}06 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px 2px 2px", background: `${G}0a`, border: `1px solid ${G}18`, borderRadius: 3, fontSize: 9.5, fontWeight: 600, color: G, marginBottom: 18 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: G, boxShadow: `0 0 6px ${G}` }} />
            AI-powered messaging for service businesses
          </div>
          <h1 style={{ fontFamily: sans, fontSize: 42, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.8, color: "#fff" }}>
            The fastest reply<br />wins the customer.
          </h1>
          <p style={{ fontFamily: sans, fontSize: 26, fontWeight: 400, fontStyle: "italic", color: R, marginTop: 5 }}>Every single time.</p>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: D, marginTop: 14, maxWidth: 460, margin: "14px auto 0", fontFamily: sans }}>
            Pingbox reads your documents and responds to customers in 30 seconds — real answers, real pricing, real bookings. Any channel.
          </p>
          <Link href="/early-access" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: BG, padding: "10px 20px", borderRadius: 5, fontSize: 13, fontWeight: 700, marginTop: 22, fontFamily: sans, textDecoration: "none" }}>
            Start free — 14 days
            <span style={{ width: 18, height: 18, borderRadius: 3, background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9 }}>→</span>
          </Link>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 12, fontSize: 9.5, color: "#2a2a2a" }}>
            {["website_chat", "sms", "whatsapp", "telegram"].map(ch => <span key={ch}>{ch}</span>)}
          </div>
        </div>
      </section>

      <Orchestration />
      <LiveFeed />


      {/* BROADCAST */}
      <section id="broadcast" style={{ padding: "48px 24px", borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Prompt><span style={{ color: W }}>pingbox</span><span style={{ color: A }}> broadcast</span><span style={{ color: P }}> --preview</span></Prompt>
            <h2 style={{ fontFamily: sans, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: -1, marginTop: 10 }}>
              Don&apos;t just respond. <span style={{ color: R, fontStyle: "italic" }}>Reach out first.</span>
            </h2>
            <p style={{ fontSize: 10, color: D, marginTop: 5, fontFamily: font }}>broadcast campaigns · 89% open rate</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 8 }}>
            {BCASTS.map(b => (
              <div key={b.type} style={{ background: CARD, border: `1px solid ${BDR}`, borderTop: `2px solid ${b.color}`, borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7 }}>
                  <span style={{ fontSize: 13 }}>{b.icon}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: b.color }}>{b.type}</span>
                </div>
                <div style={{ background: "#0e0e0e", borderRadius: 4, padding: 8, border: "1px solid #161616", fontSize: 9.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{b.msg}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 7, borderTop: `1px solid ${BDR}` }}>
                  {[{ l: "sent", v: b.sent }, { l: "opened", v: b.opened }, { l: "converted", v: b.conv }].map(x => (
                    <div key={x.l} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{x.v}</div>
                      <div style={{ fontSize: 7.5, color: D }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RAG / Document Intelligence */}
      <section style={{ padding: "48px 24px", borderTop: `1px solid ${BDR}` }}>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ maxWidth: 800, margin: "0 auto", gap: 24, alignItems: "center" }}>
          <div>
            <Prompt><span style={{ color: W }}>pingbox</span><span style={{ color: A }}> rag</span><span style={{ color: P }}> --explain</span></Prompt>
            <h2 style={{ fontFamily: sans, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.6, lineHeight: 1.15, marginTop: 10 }}>Your docs become your <span style={{ color: R, fontStyle: "italic" }}>smartest employee</span></h2>
            <p style={{ fontSize: 11.5, color: D, lineHeight: 1.6, marginTop: 8, fontFamily: sans }}>Upload catalogs, price lists, policies. AI answers customers with your real data.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 14 }}>
              {[{ t: "PDF, Excel, Word, images", c: A }, { t: "Every answer cites its source", c: G }, { t: "Auto-updates on new uploads", c: T }, { t: "Confidence score per response", c: B }].map(f => (
                <div key={f.t} style={{ display: "flex", gap: 5, alignItems: "center", fontSize: 10 }}>
                  <span style={{ color: f.c }}>■</span><span style={{ color: "rgba(255,255,255,0.45)" }}>{f.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: CARD, borderRadius: 8, border: `1px solid ${BDR}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderBottom: `1px solid ${BDR}`, background: "rgba(255,255,255,0.01)" }}>
              <TrafficDots />
              <span style={{ fontSize: 8, color: "#333", marginLeft: 5, fontFamily: font }}>knowledge_base</span>
            </div>
            <div style={{ padding: 10 }}>
              {[{ n: "HVAC Service Catalog.pdf", p: "96%" }, { n: "Emergency Pricing.xlsx", p: "93%" }].map(d => (
                <div key={d.n} style={{ display: "flex", justifyContent: "space-between", padding: "4px 7px", background: "#0e0e0e", borderRadius: 3, marginBottom: 3, border: "1px solid #161616" }}>
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)" }}>📋 {d.n}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: G }}>{d.p}</span>
                </div>
              ))}
              <div style={{ marginTop: 6, padding: 8, background: `${G}08`, borderRadius: 4, border: `1px solid ${G}12` }}>
                <div style={{ fontSize: 8, color: G, fontWeight: 600, marginBottom: 2 }}>extracted:</div>
                <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>&ldquo;Emergency AC diagnostic — $189. Includes refrigerant check, compressor test, airflow assessment. Same-day priority for families with infants.&rdquo;</div>
                <div style={{ fontSize: 7.5, color: "#222", marginTop: 3 }}>source: Emergency Pricing.xlsx, row 12</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section style={{ padding: "48px 24px", borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <Prompt><span style={{ color: W }}>pingbox</span><span style={{ color: A }}> setup</span></Prompt>
          <h2 style={{ fontFamily: sans, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: -1, marginTop: 10 }}>Live in <span style={{ color: R, fontStyle: "italic" }}>five minutes</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 8, marginTop: 20 }}>
            {[
              { n: "01", t: "Upload documents", d: "Catalogs, price lists, FAQs — anything customers ask about." },
              { n: "02", t: "Connect channels", d: "Website chat, SMS, WhatsApp, or Telegram. One inbox." },
              { n: "03", t: "AI starts closing", d: "Customers message. AI responds with real answers. You approve." },
            ].map(x => (
              <div key={x.n} style={{ background: CARD, borderRadius: 6, padding: 16, border: `1px solid ${BDR}`, textAlign: "left" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: G, letterSpacing: 1 }}>step_{x.n}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 5, marginBottom: 3, fontFamily: sans }}>{x.t}</div>
                <div style={{ fontSize: 10.5, color: D, lineHeight: 1.6, fontFamily: sans }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "48px 24px", textAlign: "center", borderTop: `1px solid ${BDR}`, position: "relative" }}>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: `radial-gradient(ellipse, ${G}05 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
          <h2 style={{ fontFamily: sans, fontSize: 28, fontWeight: 800, letterSpacing: -1, color: "#fff", lineHeight: 1.12 }}>Your competitor just replied</h2>
          <p style={{ fontFamily: sans, fontSize: 26, fontWeight: 400, fontStyle: "italic", color: R, marginTop: 3 }}>in 30 seconds.</p>
          <p style={{ fontSize: 11.5, color: D, marginTop: 10, lineHeight: 1.6, fontFamily: sans }}>Your customers don&apos;t wait. Neither should your business.</p>
          <Link href="/early-access" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: BG, padding: "10px 22px", borderRadius: 5, fontSize: 13, fontWeight: 700, marginTop: 20, fontFamily: sans, textDecoration: "none" }}>
            Start free — 14 days
            <span style={{ width: 18, height: 18, borderRadius: 3, background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9 }}>→</span>
          </Link>
          <p style={{ fontSize: 8.5, color: "#222", marginTop: 8, fontFamily: font }}>hello@pingbox.io</p>
        </div>
      </section>
      </main>

      <footer style={{ padding: "12px 24px", borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 14, height: 14, background: "#111", border: "1px solid #2a2a2a", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: G, fontSize: 6, fontWeight: 800 }}>P</div>
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: sans }}>Pingbox</span>
          </Link>
          <div style={{ display: "flex", gap: 12, fontSize: 8.5, color: "#222" }}><Link href="/privacy">privacy</Link><Link href="/terms">terms</Link><a href="mailto:hello@pingbox.io">contact</a></div>
          <div style={{ fontSize: 8, color: "#1a1a1a" }}>© 2025 Pingbox</div>
        </div>
      </footer>
    </div>
  );
}
