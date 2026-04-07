'use client';
import { useState, useEffect, useRef } from "react";
import { ALL_SUB_VERTICALS, VERTICALS } from '../blocks/previews/registry';
import {
  Layers, Building2, TrendingUp, Zap, Rocket, HelpCircle,
  LayoutGrid, Inbox, Upload, Link, MessageSquare, Home, ArrowUp,
  ChevronRight, ShieldCheck, Clock, Eye, Sparkles, Radio, Users,
  Globe, FileText, Check, Send,
} from "lucide-react";

const ACCENT = "#c2410c";
const THEME = {
  accent: ACCENT,
  accentHi: "#ea580c",
  accentDk: "#9a3412",
  accentBg: "rgba(194,65,12,0.05)",
  accentBg2: "rgba(194,65,12,0.10)",
  bg: "#faf8f5",
  surface: "#ffffff",
  t1: "#1c1917",
  t2: "#44403c",
  t3: "#78716c",
  t4: "#a8a29e",
  bdrL: "#e7e5e4",
  bdrM: "#d6d3d1",
};

const STAGE_LABELS: Record<string, string> = {
  greeting: "Welcome", discovery: "Exploring", qualification: "Qualifying",
  presentation: "Presenting", action: "Converting", handoff: "Team Connect",
};

const BRAND = { name: "Pingbox", tagline: "AI that responds in 30 seconds" };

function IconBox({ icon: LucideIcon, size = 28, bg, color, rounded }: any) {
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: rounded ? "9999px" : (size > 24 ? "10px" : "7px"),
      background: bg || THEME.accentBg2, display: "flex", alignItems: "center", justifyContent: "center",
      color: color || THEME.accent, flexShrink: 0,
    }}>
      <LucideIcon size={Math.round(size * 0.48)} strokeWidth={2} />
    </div>
  );
}

const bentoItems = [
  { id: "product", label: "What is Pingbox", sub: "Relay + Inbox", icon: Layers, size: "large" },
  { id: "industries", label: "Your Industry", sub: "See your storefront", icon: Building2, size: "medium" },
  { id: "proof", label: "The Numbers", sub: "Why speed wins", icon: TrendingUp, size: "medium" },
  { id: "setup", label: "How It Works", sub: "5-min setup", icon: Zap, size: "small" },
  { id: "pricing", label: "Start Free", sub: "14-day trial", icon: Rocket, size: "small" },
  { id: "faq", label: "Ask Anything", sub: "Tech \u00B7 Security \u00B7 API", icon: HelpCircle, size: "small" },
];

const products = [
  {
    id: "relay", name: "Relay", sub: "AI storefront inside a chat", icon: LayoutGrid,
    desc: "Not a chatbot. An AI storefront that renders interactive UI \u2014 catalogs, booking forms, payments \u2014 right inside the conversation.",
    features: ["Generative UI blocks", "142 business functions", "14 verticals built in", "yourname.pingbox.io hosted page"],
    metric: "Every conversation = revenue", badge: "Core",
  },
  {
    id: "inbox", name: "Partner Inbox", sub: "Unified multi-channel inbox", icon: Inbox,
    desc: "Every message from WhatsApp, SMS, Telegram, and web \u2014 in one place. AI suggests replies from your documents. You approve or edit.",
    features: ["Document-based RAG", "AI reply suggestions", "Channel-agnostic routing", "Revenue per conversation tracking"],
    metric: "30-second response time", badge: null,
  },
];

const industries = ALL_SUB_VERTICALS.map(sv => {
  return {
    id: sv.id,
    name: sv.name,
    examples: sv.description || "",
    question: `What does a typical engagement with a ${sv.name} business look like?`,
    modules: sv.blocks.map(b => b.replace(/_/g, ' ')).slice(0, 4).join(" \u00B7 ")
  }
});

const stats = [
  { value: "78%", label: "buy from the first responder", src: "Harvard Business Review", icon: Users },
  { value: "5 min", label: "delay drops conversion by 80%", src: "InsideSales", icon: Clock },
  { value: "2\u20133", label: "leads lost per week to faster competitors", src: "Drift, 2025", icon: TrendingUp },
  { value: "24/7", label: "AI responds nights, weekends, holidays", src: "Pingbox", icon: Globe },
];

const setupSteps = [
  { icon: Upload, title: "Upload your docs", desc: "Product catalogs, price lists, FAQs \u2014 any documents your business runs on.", time: "2 min" },
  { icon: Link, title: "Connect channels", desc: "Link WhatsApp, Telegram, web, or SMS. All messages flow into one inbox.", time: "2 min" },
  { icon: MessageSquare, title: "AI starts responding", desc: "Customers message. AI responds with real answers from your docs. You approve or edit.", time: "Instant" },
];

const channels = ["Web", "SMS", "WhatsApp", "Telegram"];

function Pill({ active, children, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: active ? 600 : 400,
      background: active ? THEME.accent : THEME.surface, color: active ? "#fff" : THEME.t3,
      border: active ? "none" : `1px solid ${THEME.bdrL}`, cursor: "pointer",
      transition: "all 0.15s ease", whiteSpace: "nowrap", flexShrink: 0,
    }}>{children}</button>
  );
}

function ModuleBar({ items, active, onSelect, onHome }: any) {
  return (
    <div style={{ borderBottom: `1px solid ${THEME.bdrL}`, background: THEME.surface, position: "sticky", top: 0, zIndex: 20 }}>
      <div style={{ display: "flex", gap: "6px", padding: "8px 12px", overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: 'none' }}>
        <button onClick={onHome} style={{
          width: "30px", height: "30px", borderRadius: "8px", border: `1px solid ${THEME.bdrL}`,
          background: !active ? THEME.t1 : THEME.surface, color: !active ? "#fff" : THEME.t3,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}><Home size={14} strokeWidth={2.5} /></button>
        <div style={{ width: "1px", height: "20px", background: THEME.bdrL, flexShrink: 0, alignSelf: "center" }} />
        {items.map((m: any) => (
          <Pill key={m.id} active={active === m.id} onClick={() => onSelect(m)}>
            {m.label.split(" ").pop()}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div style={{
      width: "28px", height: "28px", borderRadius: "9999px", background: THEME.accent,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      color: "#fff",
    }}><Radio size={14} strokeWidth={2.5} /></div>
  );
}

function UserBubble({ text }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
      <div style={{
        maxWidth: "80%", background: THEME.accent, color: "#fff", padding: "10px 16px",
        borderRadius: "16px 16px 4px 16px", fontSize: "13px", lineHeight: 1.5,
      }}>{text}</div>
    </div>
  );
}

function BotBubble({ text, children }: any) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "flex-start" }}>
      <BotAvatar />
      <div style={{ maxWidth: "calc(100% - 40px)", width: children ? "100%" : "auto" }}>
        {text && (
          <div style={{
            background: THEME.surface, border: `1px solid ${THEME.bdrL}`, padding: "10px 14px",
            borderRadius: "12px", fontSize: "13px", lineHeight: 1.5, color: THEME.t1,
          }}>{text}</div>
        )}
        {children && <div style={{ marginTop: text ? "8px" : 0 }}>{children}</div>}
      </div>
    </div>
  );
}

function Divider({ text }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0", margin: "4px 0" }}>
      <div style={{ flex: 1, height: "1px", background: THEME.bdrL }} />
      <span style={{ fontSize: "10px", fontWeight: 600, color: THEME.t4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{text}</span>
      <div style={{ flex: 1, height: "1px", background: THEME.bdrL }} />
    </div>
  );
}

function Suggestions({ items, onSelect }: any) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {items.map((s: any) => (
        <button key={s} onClick={() => onSelect?.(s)} style={{
          fontSize: "12px", fontWeight: 500, color: THEME.accent, background: THEME.accentBg,
          border: `1px solid ${THEME.accentBg2}`, padding: "6px 14px", borderRadius: "9999px", cursor: "pointer",
        }}>{s}</button>
      ))}
    </div>
  );
}

function ProductCards({ onSelect }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {products.map((p) => (
        <div key={p.id} style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "12px", padding: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <IconBox icon={p.icon} size={36} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: THEME.t1 }}>{p.name}</div>
                <div style={{ fontSize: "11px", color: THEME.accent, fontWeight: 500 }}>{p.sub}</div>
                <div style={{ fontSize: "11px", color: THEME.t3, marginTop: "3px", lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            </div>
            {p.badge && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#fff", background: THEME.accent, padding: "3px 8px", borderRadius: "6px", whiteSpace: "nowrap" }}>{p.badge}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "4px", marginTop: "8px", flexWrap: "wrap" }}>
            {p.features.slice(0, 3).map((f) => (
              <span key={f} style={{ fontSize: "10px", color: THEME.t3, background: THEME.bg, padding: "2px 8px", borderRadius: "6px" }}>{f}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${THEME.bdrL}` }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: THEME.accent }}>{p.metric}</span>
            <button onClick={() => onSelect(p)} style={{ fontSize: "11px", fontWeight: 600, color: "#fff", background: THEME.accent, border: "none", padding: "6px 14px", borderRadius: "8px", cursor: "pointer" }}>Learn more</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function IndustryPicker({ onPick }: any) {
  const [limit, setLimit] = useState(8);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {industries.slice(0, limit).map((ind) => (
        <div key={ind.id} onClick={() => onPick(ind)} style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "10px", padding: "12px 14px", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ marginRight: 8 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: THEME.t1 }}>{ind.name}</div>
              <div style={{ fontSize: "11px", color: THEME.t4, marginTop: "2px", lineHeight: "14px" }}>{ind.examples || 'Service visualization available'}</div>
            </div>
            <ChevronRight size={16} color={THEME.t4} style={{ flexShrink: 0 }} />
          </div>
        </div>
      ))}
      {limit < industries.length && (
         <button onClick={() => setLimit(limit + 8)} style={{ padding: "10px", borderRadius: "10px", border: `1px solid ${THEME.bdrL}`, background: THEME.bg, color: THEME.t2, fontSize: "12px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
           View More Sub-Verticals
         </button>
      )}
    </div>
  );
}

function IndustryPreview({ industry }: any) {
  return (
    <div style={{ background: THEME.surface, border: `2px solid ${THEME.accent}`, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${THEME.bdrL}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <IconBox icon={LayoutGrid} size={24} bg={THEME.accent} color="#fff" />
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Relay would look like this</div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: THEME.t1 }}>{industry.name}</div>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ background: THEME.bg, borderRadius: "10px", border: `1px solid ${THEME.bdrL}`, padding: "10px 12px", marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: THEME.t4, textTransform: "uppercase", marginBottom: "4px" }}>Sample customer message</div>
          <div style={{ fontSize: "12px", color: THEME.t1, fontStyle: "italic", lineHeight: 1.4 }}>{`\u201C${industry.question}\u201D`}</div>
        </div>
        <div style={{ background: "rgba(22,163,74,0.05)", borderRadius: "10px", border: "1px solid rgba(22,163,74,0.15)", padding: "10px 12px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <Clock size={12} color="#16a34a" />
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#16a34a" }}>AI responds in under 30 seconds</span>
          </div>
          <div style={{ fontSize: "11px", color: "#15803d", lineHeight: 1.4 }}>Using your uploaded documents to generate accurate, branded responses.</div>
        </div>
        <div style={{ fontSize: "10px", fontWeight: 600, color: THEME.t4, textTransform: "uppercase", marginBottom: "6px" }}>Modules auto-generated from basic flows</div>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {industry.modules.split(" \u00B7 ").map((m: any) => (
            <span key={m} style={{ fontSize: "10px", textTransform: 'capitalize', color: THEME.accent, background: THEME.accentBg, padding: "3px 8px", borderRadius: "6px", fontWeight: 500 }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${THEME.bdrL}` }}>
        <button style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: THEME.accent, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Start free with this vertical</button>
      </div>
    </div>
  );
}

function StatsBlock() {
  return (
    <div style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${THEME.bdrL}` }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: THEME.t1 }}>The first business to reply wins the customer</div>
      </div>
      {stats.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderBottom: i < stats.length - 1 ? `1px solid ${THEME.bdrL}` : "none" }}>
          <IconBox icon={s.icon} size={28} bg={THEME.bg} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: THEME.t2 }}>{s.label}</div>
            <div style={{ fontSize: "10px", color: THEME.t4 }}>{s.src}</div>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: THEME.accent }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function SetupBlock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {setupSteps.map((step, i) => (
        <div key={i} style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <IconBox icon={step.icon} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: THEME.t1 }}>{step.title}</div>
            <div style={{ fontSize: "11px", color: THEME.t4, marginTop: "1px", lineHeight: 1.4 }}>{step.desc}</div>
          </div>
          <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{step.time}</span>
        </div>
      ))}
      <div style={{ background: THEME.bg, borderRadius: "10px", padding: "10px 14px", marginTop: "2px", display: "flex", gap: "6px", alignItems: "center" }}>
        <Globe size={12} color={THEME.t4} />
        <span style={{ fontSize: "10px", fontWeight: 600, color: THEME.t4 }}>Works on:</span>
        {channels.map((c) => (
          <span key={c} style={{ fontSize: "10px", color: THEME.accent, background: THEME.accentBg, padding: "2px 8px", borderRadius: "6px", fontWeight: 500 }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

function RoiCalculator() {
  const [leads, setLeads] = useState(3);
  const [value, setValue] = useState(500);
  const annual = leads * value * 52;
  return (
    <div style={{ background: THEME.surface, border: `2px solid ${THEME.accent}`, borderRadius: "12px", padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <TrendingUp size={14} color={THEME.accent} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>What are slow replies costing you?</span>
      </div>
      <div style={{ marginBottom: "8px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, color: THEME.t3, display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Leads lost per week</span>
          <span style={{ color: THEME.accent, fontWeight: 700 }}>{leads}</span>
        </label>
        <input type="range" min={1} max={10} value={leads} onChange={(e) => setLeads(+e.target.value)} style={{ width: "100%", accentColor: THEME.accent }} />
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, color: THEME.t3, display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Avg deal value ($)</span>
          <span style={{ color: THEME.accent, fontWeight: 700 }}>${value}</span>
        </label>
        <input type="range" min={100} max={5000} step={100} value={value} onChange={(e) => setValue(+e.target.value)} style={{ width: "100%", accentColor: THEME.accent }} />
      </div>
      <div style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "#991b1b", textTransform: "uppercase" }}>Annual revenue at risk</div>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626", marginTop: "2px" }}>${annual.toLocaleString()}</div>
        <div style={{ fontSize: "11px", color: "#7f1d1d", marginTop: "2px" }}>{leads} leads/week × ${value} × 52 weeks</div>
      </div>
      <button style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: THEME.accent, color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", marginTop: "10px" }}>Stop losing ${Math.round(annual / 12).toLocaleString()}/month — start free</button>
    </div>
  );
}

function MetaReveal() {
  return (
    <div style={{ background: THEME.t1, borderRadius: "12px", padding: "16px", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <Eye size={14} color={THEME.accentHi} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: THEME.accentHi, textTransform: "uppercase", letterSpacing: "1px" }}>Wait — notice something?</span>
      </div>
      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.5, marginBottom: "10px" }}>This conversation you're in right now?</div>
      <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#d6d3d1", marginBottom: "12px" }}>This IS Relay. You've been browsing products, seeing interactive blocks, asking questions — all inside a chat. Your customers would have the same experience, customized for your business.</div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
        {["Catalog blocks", "Booking forms", "ROI calculators", "Comparison tables", "Smart nudges"].map((b) => (
          <span key={b} style={{ fontSize: "10px", color: "#fbbf24", background: "rgba(251,191,36,0.12)", padding: "3px 8px", borderRadius: "6px", fontWeight: 500 }}>{b}</span>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#e7e5e4", lineHeight: 1.5 }}>Every block you just saw — auto-generated from your business documents. Upload a price list, get a pricing block. Upload a menu, get a catalog. No code. 5 minutes.</div>
    </div>
  );
}

function TrialForm({ onConfirm }: any) {
  return (
    <div style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "12px", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
        <Rocket size={14} color={THEME.accent} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: THEME.t1 }}>Start free — 14 days, no credit card</span>
      </div>
      {[
        { label: "Business Name", ph: "e.g. AirPro HVAC" },
        { label: "Your Name", ph: "Full name" },
        { label: "Email", ph: "you@business.com" },
      ].map((f) => (
        <div key={f.label} style={{ marginBottom: "8px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, color: THEME.t3, display: "block", marginBottom: "4px" }}>{f.label}</label>
          <input placeholder={f.ph} style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${THEME.bdrL}`, fontSize: "13px", outline: "none", boxSizing: "border-box", background: THEME.surface }} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "11px", fontWeight: 600, color: THEME.t3, display: "block", marginBottom: "4px" }}>Industry</label>
          <select style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${THEME.bdrL}`, fontSize: "13px", background: THEME.surface }}>
            {industries.map((i) => <option key={i.id}>{i.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "11px", fontWeight: 600, color: THEME.t3, display: "block", marginBottom: "4px" }}>Channels</label>
          <select style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${THEME.bdrL}`, fontSize: "13px", background: THEME.surface }}>
            <option>WhatsApp + Web</option><option>All channels</option><option>Web only</option>
          </select>
        </div>
      </div>
      <button onClick={onConfirm} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: THEME.accent, color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>Create my AI storefront</button>
      <div style={{ fontSize: "10px", color: THEME.t4, textAlign: "center", marginTop: "6px" }}>Working in 5 minutes. No sales call needed.</div>
    </div>
  );
}

function HandoffCard() {
  return (
    <div style={{ background: THEME.bg, border: `1px solid ${THEME.bdrM}`, borderRadius: "12px", padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Users size={14} color={THEME.t1} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: THEME.t1 }}>Connecting you with our team</span>
      </div>
      <div style={{ fontSize: "12px", color: THEME.t3, marginTop: "4px" }}>For multi-location, custom integrations, or white-label — our founder handles these personally.</div>
      <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
        {[0, 0.3, 0.6].map((d) => (
          <span key={d} style={{ width: "7px", height: "7px", borderRadius: "50%", background: THEME.accent, animation: `pulse 1.5s infinite ${d}s` }} />
        ))}
      </div>
    </div>
  );
}

function RagAnswer() {
  return (
    <div style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "12px", padding: "14px" }}>
      <div style={{ fontSize: "13px", color: THEME.t1, lineHeight: 1.6 }}>
        Pingbox uses <strong>document-based RAG</strong> — your AI only answers from your uploaded documents, never hallucinating. Supports <strong>WhatsApp</strong>, <strong>Telegram</strong>, <strong>SMS</strong>, and <strong>web chat</strong>. Data is encrypted at rest (AES-256) and in transit.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "8px", padding: "6px 8px", background: "rgba(22,163,74,0.05)", borderRadius: "6px", border: "1px solid rgba(22,163,74,0.12)" }}>
        <ShieldCheck size={12} color="#16a34a" />
        <span style={{ fontSize: "10px", fontWeight: 500, color: "#15803d" }}>SOC 2 compliant · AES-256 encryption · Data isolation per partner</span>
      </div>
    </div>
  );
}

function Nudge({ text, actionLabel, onAction, variant }: any) {
  const isGreen = variant === "green";
  const isDark = variant === "dark";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
      background: isDark ? "rgba(28,25,23,0.04)" : isGreen ? "rgba(22,163,74,0.05)" : THEME.accentBg,
      borderRadius: "10px",
      border: `1px solid ${isDark ? "rgba(28,25,23,0.10)" : isGreen ? "rgba(22,163,74,0.12)" : THEME.accentBg2}`,
    }}>
      <span style={{ fontSize: "13px", color: THEME.t2, flex: 1, lineHeight: 1.4 }}>{text}</span>
      {actionLabel && (
        <button onClick={onAction} style={{
          fontSize: "11px", fontWeight: 600,
          color: isDark ? THEME.t1 : isGreen ? "#16a34a" : THEME.accent,
          background: THEME.surface, border: `1px solid ${THEME.bdrL}`, padding: "5px 14px", borderRadius: "8px",
          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
        }}>{actionLabel}</button>
      )}
    </div>
  );
}

function BentoGrid({ onItemClick, onAsk }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: THEME.surface }}>
      <div style={{ padding: "20px 16px 14px", borderBottom: `1px solid ${THEME.bdrL}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: THEME.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <Radio size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: THEME.t1 }}>{BRAND.name}</div>
            <div style={{ fontSize: "12px", color: THEME.t3 }}>{BRAND.tagline}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", flex: 1, overflow: "auto", alignContent: "start", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {bentoItems.map((item) => (
          <div key={item.id} onClick={() => onItemClick(item)} style={{
            gridColumn: item.size === "large" ? "1 / -1" : "auto",
            background: THEME.bg, border: `1px solid ${THEME.bdrL}`, borderRadius: "12px",
            padding: item.size === "large" ? "16px" : "14px", cursor: "pointer",
            display: "flex", flexDirection: item.size === "large" ? "row" : "column",
            alignItems: item.size === "large" ? "center" : "flex-start",
            gap: item.size === "large" ? "14px" : "8px",
          }}>
            <IconBox icon={item.icon} size={item.size === "large" ? 36 : 28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: THEME.t1 }}>{item.label}</div>
              <div style={{ fontSize: "11px", color: THEME.t4 }}>{item.sub}</div>
            </div>
            <ChevronRight size={14} color={THEME.t4} />
          </div>
        ))}
      </div>
      <div style={{ padding: "10px 12px 16px", borderTop: `1px solid ${THEME.bdrL}` }}>
        <div onClick={onAsk} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", background: THEME.bg, borderRadius: "10px", border: `1px solid ${THEME.bdrL}`, cursor: "pointer" }}>
          <Sparkles size={14} color={THEME.t4} />
          <span style={{ fontSize: "13px", color: THEME.t4 }}>What does your business do?</span>
        </div>
      </div>
    </div>
  );
}

const SCENARIOS = [
  { id: "browse", label: "Browse Products", desc: "Relay + Inbox — what they do" },
  { id: "industry", label: "See Your Industry", desc: "Pick vertical → preview your Relay" },
  { id: "roi", label: "ROI Calculator", desc: "What slow replies cost you" },
  { id: "meta", label: "The Meta Moment", desc: "\"You're using it right now\"" },
  { id: "rag", label: "Technical / Security", desc: "RAG-powered answers" },
  { id: "handoff", label: "Enterprise / Agency", desc: "Multi-location → founder connect" },
  { id: "hop", label: "Full Journey", desc: "Products → Industry → Start Free" },
];

export default function RelayFlowMockup() {
  const [view, setView] = useState("bento");
  const [msgs, setMsgs] = useState<any[]>([]);
  const [stage, setStage] = useState("greeting");
  const [scenario, setScenario] = useState<string | null>(null);
  const [mod, setMod] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  const reset = () => { setView("bento"); setMsgs([]); setStage("greeting"); setScenario(null); setMod(null); setTyping(false); };
  const type = (cb: () => void, d = 700) => { setTyping(true); setTimeout(() => { setTyping(false); cb(); }, d); };
  const enter = (m: string | null) => { setView("chat"); setMod(m); };
  const uid = () => Date.now() + Math.random();
  const addMsgs = (newMsgs: any[]) => setMsgs((p) => [...p, ...newMsgs]);

  const handleProductSelect = (product: any) => {
    setStage("presentation");
    addMsgs([{ k: uid(), t: "user", text: `Tell me more about ${product.name}` }]);
    type(() => {
      if (product.id === "relay") {
        addMsgs([
          { k: uid(), t: "bot", text: "Relay is an AI storefront that lives inside a chat. Your customers see interactive blocks — service catalogs, booking forms, payments — not walls of text. Pick your industry and I'll show you what yours would look like:" },
          { k: uid(), t: "bot", block: "industries" },
        ]);
      } else {
        addMsgs([
          { k: uid(), t: "bot", text: "Partner Inbox pulls every message — WhatsApp, SMS, Telegram, web — into one place. AI reads your uploaded documents and suggests replies. You approve, edit, or let it auto-respond." },
          { k: uid(), t: "bot", block: "sug", items: ["How does the AI generate replies?", "What channels are supported?", "Start my free trial"] },
        ]);
      }
    }, 600);
  };

  const handleIndustryPick = (industry: any) => {
    setStage("presentation");
    addMsgs([{ k: uid(), t: "user", text: `I'm in ${industry.name}` }]);
    type(() => {
      addMsgs([
        { k: uid(), t: "bot", text: `Here's what Relay looks like for ${industry.name.toLowerCase()} businesses:` },
        { k: uid(), t: "bot", block: "preview", industry },
      ]);
      setTimeout(() => type(() => addMsgs([
        { k: uid(), t: "bot", block: "sug", items: ["What's this costing me in lost leads?", "How do I set this up?", "Start my free trial"] },
      ]), 500), 1800);
    }, 600);
  };

  const handleConfirm = () => {
    addMsgs([
      { k: uid(), t: "bot", text: "You're in. Check your email for login credentials. Your AI storefront will be live at yourname.pingbox.io within 5 minutes." },
      { k: uid(), t: "bot", block: "post_signup" },
    ]);
  };

  const moduleSwitch = (item: any) => {
    setMod(item.id); setStage("presentation");
    const flows: any = {
      product: { text: "Pingbox has two products. Together, they turn every conversation into revenue:", block: "products", next: ["Show me my industry", "Why does speed matter?", "How does setup work?"] },
      industries: { text: "Pick your industry — I'll show you what your AI storefront would look like:", block: "industries" },
      proof: { text: "The data is clear — speed wins customers:", block: "stats", next: ["Show me my industry", "Calculate my lost revenue", "Start free trial"] },
      setup: { text: "Three steps. Five minutes. Running 24/7:", block: "setup", next: ["Start my free trial", "Show me my industry", "Is the data secure?"] },
      pricing: { text: "Start free for 14 days. No credit card. No sales call:", block: "trial" },
      faq: { text: "What would you like to know?", sug: ["How does the AI work?", "Which channels are supported?", "Is my data secure?", "Can I white-label it?"] },
    };
    const fl = flows[item.id]; if (!fl) return;
    type(() => {
      const m = [{ k: uid(), t: "divider", text: item.label }];
      m.push({ k: uid(), t: "bot", text: fl.text });
      if (fl.block) m.push({ k: uid(), t: "bot", block: fl.block });
      if (fl.sug) m.push({ k: uid(), t: "bot", block: "sug", items: fl.sug });
      if (fl.next) m.push({ k: uid(), t: "bot", block: "sug", items: fl.next });
      addMsgs(m);
    });
  };

  const run: any = {
    browse: () => { setScenario("browse"); enter("product"); setStage("presentation"); setMsgs([
      { k: 1, t: "bot", text: "Pingbox turns every customer message into revenue. Two products, one platform:" },
      { k: 2, t: "bot", block: "products" },
      { k: 3, t: "bot", block: "sug", items: ["Show me my industry", "Why does response speed matter?", "How does setup work?"] },
    ]); },
    industry: () => { setScenario("industry"); enter("industries"); setStage("discovery"); setMsgs([
      { k: 1, t: "bot", text: "Every business is different. Pick your industry and I'll show you exactly what your AI storefront would look like:" },
      { k: 2, t: "bot", block: "industries" },
    ]); },
    roi: () => { setScenario("roi"); enter("proof"); setStage("qualification"); setMsgs([
      { k: 1, t: "user", text: "We miss about 3-4 leads a week because we can't reply fast enough. Mostly evening and weekend inquiries." },
    ]); setTimeout(() => type(() => {
      setStage("presentation");
      addMsgs([
        { k: uid(), t: "bot", text: "That's exactly the problem Pingbox solves. Let me show you what those missed replies are costing you:" },
        { k: uid(), t: "bot", block: "roi" },
      ]);
      setTimeout(() => type(() => addMsgs([
        { k: uid(), t: "bot", block: "stats" },
        { k: uid(), t: "bot", block: "sug", items: ["Show me my industry", "How does the setup work?", "Start my free trial"] },
      ]), 500), 2000);
    }, 900), 500); },
    meta: () => { setScenario("meta"); enter("product"); setStage("presentation"); setMsgs([
      { k: 1, t: "bot", text: "Let me show you what Pingbox does — the products, the AI, the interactive blocks:" },
      { k: 2, t: "bot", block: "products" },
    ]); setTimeout(() => {
      addMsgs([{ k: uid(), t: "user", text: "This is interesting — but what does it actually look like for my customers?" }]);
      type(() => {
        addMsgs([
          { k: uid(), t: "bot", block: "meta" },
          { k: uid(), t: "bot", block: "sug", items: ["Start my free trial", "Show me my industry", "How does setup work?"] },
        ]);
      }, 1200);
    }, 3000); },
    rag: () => { setScenario("rag"); enter("faq"); setStage("discovery"); setMsgs([
      { k: 1, t: "user", text: "How does the AI work? Does it hallucinate? What channels does it support?" },
    ]); setTimeout(() => type(() => addMsgs([
      { k: uid(), t: "bot", text: "Great questions. Here's how it works under the hood:" },
      { k: uid(), t: "bot", block: "rag" },
      { k: uid(), t: "bot", block: "sug", items: ["Show me my industry", "Start my free trial", "How fast is the setup?"] },
    ]), 900), 500); },
    handoff: () => { setScenario("handoff"); enter(null); setStage("qualification"); setMsgs([
      { k: 1, t: "user", text: "We're a multi-location franchise — 12 branches across 3 states. Need separate AI storefronts per location, white-label, and API access. Also interested in reselling to our franchisees." },
    ]); setTimeout(() => type(() => {
      setStage("handoff");
      addMsgs([
        { k: uid(), t: "bot", text: "Multi-location with white-label and reseller model — that's a custom engagement. Let me connect you with our founder who handles enterprise architecture." },
        { k: uid(), t: "bot", block: "handoff" },
      ]);
    }, 800), 500); },
    hop: () => { setScenario("hop"); enter("product"); setStage("presentation"); setMsgs([
      { k: 1, t: "bot", text: "Here's what Pingbox does:" },
      { k: 2, t: "bot", block: "products" },
    ]); setTimeout(() => {
      addMsgs([{ k: uid(), t: "user", text: "I run a dental clinic. Show me what this would look like for us, and how to get started." }]);
      type(() => { setMod("industries");
        const dental = industries.find(i => i.name.toLowerCase().includes('dental')) || industries[0];
        addMsgs([
          { k: uid(), t: "divider", text: "Your Industry" },
          { k: uid(), t: "bot", text: "Here's what Relay looks like for dental and professional services:" },
          { k: uid(), t: "bot", block: "preview", industry: dental },
          { k: uid(), t: "bot", block: "sug", items: ["Start my free trial", "How fast is the setup?", "What will this cost me in lost leads?"] },
        ]);
      }, 900);
    }, 2500); },
  };

  const renderMsg = (m: any) => {
    if (m.t === "divider") return <Divider key={m.k} text={m.text} />;
    if (m.t === "user") return <UserBubble key={m.k} text={m.text} />;
    if (m.t === "bot" && m.text && !m.block) return <BotBubble key={m.k} text={m.text} />;
    if (m.block === "products") return <BotBubble key={m.k}><ProductCards onSelect={handleProductSelect} /></BotBubble>;
    if (m.block === "industries") return <BotBubble key={m.k}><IndustryPicker onPick={handleIndustryPick} /></BotBubble>;
    if (m.block === "preview") return <BotBubble key={m.k}><IndustryPreview industry={m.industry} /></BotBubble>;
    if (m.block === "stats") return <BotBubble key={m.k}><StatsBlock /></BotBubble>;
    if (m.block === "setup") return <BotBubble key={m.k}><SetupBlock /></BotBubble>;
    if (m.block === "roi") return <BotBubble key={m.k}><RoiCalculator /></BotBubble>;
    if (m.block === "meta") return <BotBubble key={m.k}><MetaReveal /></BotBubble>;
    if (m.block === "trial") return <BotBubble key={m.k}><TrialForm onConfirm={handleConfirm} /></BotBubble>;
    if (m.block === "rag") return <BotBubble key={m.k}><RagAnswer /></BotBubble>;
    if (m.block === "handoff") return <BotBubble key={m.k}><HandoffCard /></BotBubble>;
    if (m.block === "sug") return <BotBubble key={m.k}><Suggestions items={m.items} /></BotBubble>;
    if (m.block === "post_signup") return <BotBubble key={m.k}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Nudge text="Upload your first document — a price list or FAQ works great. AI starts learning immediately." actionLabel="Upload" />
        <Nudge text="Connect WhatsApp in 2 minutes via Meta Embedded Signup — no developer needed." actionLabel="Connect" variant="green" />
        <Nudge text="Share your Relay link (yourname.pingbox.io) on your website, social, or Google Business profile." actionLabel="Copy link" variant="dark" />
      </div>
    </BotBubble>;
    return <BotBubble key={m.k} text={m.text} />;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: THEME.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
        input:focus { border-color: ${THEME.accent} !important; }
        input[type="range"] { height: 4px; }
        button:active { transform: scale(0.98); }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ width: "300px", borderRight: `1px solid ${THEME.bdrL}`, background: THEME.surface, display: "flex", flexDirection: "column", padding: "20px", gap: "14px", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: THEME.accent, textTransform: "uppercase", letterSpacing: "1px" }}>Relay Dogfooding Mockup</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: THEME.t1, lineHeight: 1.2, marginTop: "4px" }}>Visualizing Basic Flows</div>
          <p style={{ fontSize: "12px", color: THEME.t3, marginTop: "8px", lineHeight: 1.5 }}>
            From the core flows visualized here, a Gemini 3.1 Pro Preview model will automatically generate complex scenarios based on Blocks and possible vertical intents.
          </p>
        </div>
        <div style={{ height: "1px", background: THEME.bdrL }} />
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: THEME.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Primary Core Scenarios</div>
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => { reset(); setTimeout(() => run[s.id](), 80); }} style={{
              width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: "8px",
              border: scenario === s.id ? `1px solid ${THEME.accentBg2}` : `1px solid ${THEME.bdrL}`,
              background: scenario === s.id ? THEME.accentBg : THEME.bg, cursor: "pointer", marginBottom: "6px",
            }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: scenario === s.id ? THEME.accent : THEME.t1 }}>{s.label}</div>
              <div style={{ fontSize: "10px", color: THEME.t4, marginTop: "1px" }}>{s.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ height: "1px", background: THEME.bdrL }} />
        <div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: THEME.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Sub-Vertical Testing</div>
          <p style={{ fontSize: "11px", color: THEME.t3, marginBottom: 8 }}>
            Click an industry above ("See Your Industry") to automatically test Centy's registered sub-verticals inside the widget.
          </p>
        </div>
        <button onClick={reset} style={{ marginTop: "auto", width: "100%", padding: "9px", borderRadius: "8px", border: `1px solid ${THEME.bdrL}`, background: THEME.surface, fontSize: "12px", fontWeight: 600, cursor: "pointer", color: THEME.t3 }}>↻ Reset</button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "375px", height: "720px", borderRadius: "32px", border: "6px solid #1c1917", overflow: "hidden", position: "relative", boxShadow: "0 20px 50px rgba(28,25,23,0.15)" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "110px", height: "24px", background: "#1c1917", borderRadius: "0 0 14px 14px", zIndex: 30 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "26px", overflow: "hidden", background: THEME.surface }}>
            {view === "bento" ? (
              <BentoGrid onItemClick={(item: any) => {
                if (item.id === "product") run.browse();
                else if (item.id === "industries") run.industry();
                else if (item.id === "proof") run.roi();
                else if (item.id === "faq") run.rag();
                else { enter(item.id); moduleSwitch(item); }
              }} onAsk={() => run.industry()} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: THEME.surface, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: THEME.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <Radio size={14} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: THEME.t1 }}>{BRAND.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: THEME.accentBg, borderRadius: "9999px", fontSize: "10px", color: THEME.accent, fontWeight: 600 }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: THEME.accent, animation: "pulse 2s infinite" }} />
                    {STAGE_LABELS[stage]}
                  </div>
                </div>
                <ModuleBar items={bentoItems} active={mod} onSelect={moduleSwitch} onHome={reset} />
                <div style={{ flex: 1, overflowY: "auto", padding: "14px", background: THEME.bg, display: "flex", flexDirection: "column", scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {msgs.map(renderMsg)}
                  {typing && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "12px" }}>
                      <BotAvatar />
                      <div style={{ background: THEME.surface, border: `1px solid ${THEME.bdrL}`, borderRadius: "12px", padding: "12px 16px", display: "flex", gap: "4px" }}>
                        {[0, 0.15, 0.3].map((d) => (
                          <span key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: THEME.t4, animation: `pulse 1s infinite ${d}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
                <div style={{ padding: "10px 14px", borderTop: `1px solid ${THEME.bdrL}`, background: THEME.surface, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: THEME.bg, borderRadius: "10px", border: `1px solid ${THEME.bdrL}` }}>
                      <span style={{ fontSize: "13px", color: THEME.t4, flex: 1 }}>Ask about Pingbox...</span>
                    </div>
                    <button style={{ width: "36px", height: "36px", borderRadius: "8px", background: THEME.accent, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
