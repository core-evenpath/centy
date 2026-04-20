'use client';

import React from 'react';
import type {
  GreetingPreviewData,
  ProductCardPreviewData,
  ContactPreviewData,
  OrderTrackerPreviewData,
} from './previews/_preview-props';

export const T = {
  pri: "#2d4a3e", priLt: "#3d6354", priBg: "rgba(45,74,62,0.06)", priBg2: "rgba(45,74,62,0.12)",
  acc: "#c4704b", accBg: "rgba(196,112,75,0.06)", accBg2: "rgba(196,112,75,0.12)",
  bg: "#f7f3ec", surface: "#ffffff", card: "#f2ede5",
  t1: "#1a1a18", t2: "#3d3d38", t3: "#7a7a70", t4: "#a8a89e",
  bdr: "#e8e4dc", bdrM: "#d4d0c8",
  green: "#2d6a4f", greenBg: "rgba(45,106,79,0.06)", greenBdr: "rgba(45,106,79,0.12)",
  red: "#b91c1c", redBg: "rgba(185,28,28,0.05)",
  amber: "#b45309", amberBg: "rgba(180,83,9,0.06)",
  blue: "#1d4ed8", blueBg: "rgba(29,78,216,0.06)",
  pink: "#be185d", pinkBg: "rgba(190,24,93,0.06)",
};

const fmt = (n: number) => "$" + n.toFixed(n % 1 === 0 ? 0 : 2);

function Img({ w = 40, h = 40, r = 8 }: { w?: number; h?: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, flexShrink: 0, background: `linear-gradient(135deg, ${T.card} 0%, ${T.bdr} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: Math.min(w, h) * 0.28, color: T.t4 }}>✦</span></div>;
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontSize: "7px", fontWeight: 600, color: "#fff", background: color || T.pri, padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.3px" }}>{children}</span>;
}

function Stars({ r }: { r: number }) {
  return <div style={{ display: "flex", gap: "1px" }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: "8px", color: i <= Math.round(r) ? "#d97706" : T.bdr }}>★</span>)}</div>;
}

function MiniGreeting({ data }: { data?: GreetingPreviewData } = {}) {
  const brandName = data?.brandName || "Brand Name";
  const initial = (data?.initial || brandName.charAt(0) || "B").toUpperCase();
  const tagline = data?.tagline ?? "Your tagline here";
  const welcome = data?.welcomeMessage ?? "Welcome! How can we help you today?";
  const actions = data?.quickActions && data.quickActions.length > 0
    ? data.quickActions.slice(0, 4)
    : [
        { label: "Browse Products", icon: "◎" },
        { label: "Get Help", icon: "◇" },
        { label: "Track Order", icon: "▤" },
        { label: "Contact Us", icon: "☎" },
      ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "10px", borderBottom: `1px solid ${T.bdr}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.pri, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 600 }}>{initial}</div>
          <div><div style={{ fontSize: "12px", fontWeight: 600, color: T.t1 }}>{brandName}</div>{tagline && <div style={{ fontSize: "8px", color: T.t4 }}>{tagline}</div>}</div>
        </div>
        {welcome && <div style={{ fontSize: "10px", color: T.t2, marginTop: "6px", lineHeight: 1.4 }}>{welcome}</div>}
      </div>
      <div style={{ padding: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {actions.map(a => (
          <div key={a.label} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 6px", background: T.bg, borderRadius: "6px", border: `1px solid ${T.bdr}` }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.priBg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: T.pri }}>{a.icon || "◆"}</div>
            <span style={{ fontSize: "9px", fontWeight: 500, color: T.t1 }}>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRODUCT_FALLBACK_BGS = [
  "linear-gradient(135deg, #e8e0d4, #c8bfaf)",
  "linear-gradient(135deg, #fef3c7, #fbbf24)",
  "linear-gradient(135deg, #dbeafe, #60a5fa)",
  "linear-gradient(135deg, #fce7f3, #f472b6)",
];

function MiniProductCard({ data }: { data?: ProductCardPreviewData } = {}) {
  const items = data?.items && data.items.length > 0
    ? data.items.slice(0, 4)
    : [
        { name: "Item Name", desc: "Description · Detail", price: 48, badge: "Popular", bg: PRODUCT_FALLBACK_BGS[0], rating: 4.8, reviews: 2847 },
        { name: "Another Item", desc: "Variant info · Size", price: 62, bg: PRODUCT_FALLBACK_BGS[1], rating: 4.7, reviews: 4210 },
      ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {items.map((p, i) => {
        const bg = p.bg || PRODUCT_FALLBACK_BGS[i % PRODUCT_FALLBACK_BGS.length];
        const priceLabel = p.priceLabel ?? (typeof p.price === "number" ? fmt(p.price) : undefined);
        return (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "8px", display: "flex", gap: "8px", padding: "8px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 6, background: bg, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "3px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: T.t1 }}>{p.name}</span>
                {p.badge && <Badge>{p.badge}</Badge>}
              </div>
              {p.desc && <div style={{ fontSize: "8px", color: T.t4, marginTop: "1px" }}>{p.desc}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {priceLabel && <span style={{ fontSize: "12px", fontWeight: 600, color: T.pri }}>{priceLabel}</span>}
                  {typeof p.rating === "number" && <Stars r={p.rating} />}
                  {typeof p.reviews === "number" && <span style={{ fontSize: "7px", color: T.t4 }}>({p.reviews})</span>}
                </div>
                <button style={{ fontSize: "8px", fontWeight: 600, color: "#fff", background: T.pri, border: "none", padding: "3px 8px", borderRadius: "5px", cursor: "pointer" }}>Add</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniProductDetail() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ height: "60px", background: "linear-gradient(135deg, #fef3c7, #fbbf24)", position: "relative" }}>
        <div style={{ position: "absolute", top: 4, left: 4 }}><Badge>Top Rated</Badge></div>
      </div>
      <div style={{ padding: "8px" }}>
        <div style={{ fontSize: "8px", color: T.pri, fontWeight: 600, letterSpacing: "1px" }}>BRAND</div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: T.t1 }}>Product Name</div>
        <div style={{ fontSize: "8px", color: T.t3, marginTop: "1px" }}>Key details · Variant · Size</div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: T.pri }}>{fmt(62)}</span>
          <Stars r={4.7} />
          <span style={{ fontSize: "8px", color: T.t3 }}>4.7 (4,210)</span>
        </div>
        <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
          {["Size A", "Size B"].map((s, i) => <button key={s} style={{ padding: "3px 8px", borderRadius: "5px", fontSize: "8px", fontWeight: i === 0 ? 600 : 400, background: i === 0 ? T.pri : T.surface, color: i === 0 ? "#fff" : T.t2, border: `1px solid ${i === 0 ? T.pri : T.bdr}`, cursor: "pointer" }}>{s}</button>)}
        </div>
        <button style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "none", background: T.pri, fontSize: "9px", fontWeight: 600, cursor: "pointer", color: "#fff", marginTop: "5px" }}>Add to Bag — {fmt(62)}</button>
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          {["Free shipping", "Verified", "Clean"].map(f => <span key={f} style={{ fontSize: "7px", color: T.t4 }}>✓ {f}</span>)}
        </div>
      </div>
    </div>
  );
}

function MiniCompare() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "5px 8px", borderBottom: `1px solid ${T.bdr}`, fontSize: "9px", fontWeight: 600, color: T.t1 }}>Compare Items</div>
      <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 1fr", fontSize: "8px" }}>
        <div style={{ padding: "3px 5px", borderBottom: `1px solid ${T.bdr}` }} />
        <div style={{ padding: "3px 5px", borderBottom: `1px solid ${T.bdr}`, fontWeight: 600, color: T.pri, textAlign: "center", borderLeft: `1px solid ${T.bdr}` }}>Item A</div>
        <div style={{ padding: "3px 5px", borderBottom: `1px solid ${T.bdr}`, fontWeight: 600, textAlign: "center", borderLeft: `1px solid ${T.bdr}` }}>Item B</div>
        {([["Type", "Option 1", "Option 2"], ["Price", "$62", "$56"], ["Rating", "4.7 ★", "4.5 ★"]] as const).map(([l, v1, v2]) => (
          <React.Fragment key={l}>
            <div style={{ padding: "2px 5px", borderBottom: `1px solid ${T.bdr}`, color: T.t4 }}>{l}</div>
            <div style={{ padding: "2px 5px", borderBottom: `1px solid ${T.bdr}`, textAlign: "center", borderLeft: `1px solid ${T.bdr}`, color: T.t1 }}>{v1}</div>
            <div style={{ padding: "2px 5px", borderBottom: `1px solid ${T.bdr}`, textAlign: "center", borderLeft: `1px solid ${T.bdr}`, color: T.t1 }}>{v2}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function MiniCart() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "5px 8px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "9px" }}>🛍</span><span style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>Your Bag</span><span style={{ fontSize: "8px", color: T.t4 }}>3 items</span>
      </div>
      {[{ n: "Item One", v: "Variant A", p: 62 }, { n: "Item Two", v: "Variant B", p: 48 }].map((item, i) => (
        <div key={i} style={{ display: "flex", gap: "5px", padding: "5px 8px", borderBottom: `1px solid ${T.bdr}`, alignItems: "center" }}>
          <Img w={26} h={26} r={4} />
          <div style={{ flex: 1 }}><div style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>{item.n}</div><div style={{ fontSize: "7px", color: T.t4 }}>{item.v}</div></div>
          <span style={{ fontSize: "10px", fontWeight: 600, color: T.pri }}>{fmt(item.p)}</span>
        </div>
      ))}
      <div style={{ padding: "6px 8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: T.t1 }}>Total</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: T.pri }}>{fmt(110)}</span>
        </div>
        <button style={{ width: "100%", padding: "7px", borderRadius: "6px", border: "none", background: T.t1, color: "#fff", fontSize: "9px", fontWeight: 600, cursor: "pointer" }}>CHECKOUT</button>
      </div>
    </div>
  );
}

function MiniOrderConfirmation() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ background: T.greenBg, padding: "10px", textAlign: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(45,106,79,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 3px", fontSize: "12px", color: T.green }}>✓</div>
        <div style={{ fontSize: "12px", fontWeight: 600, color: T.green }}>Order Confirmed!</div>
        <div style={{ fontSize: "9px", color: T.green, opacity: 0.7 }}>#ORD-847291</div>
      </div>
      <div style={{ padding: "6px 8px" }}>
        {["Item One — $62", "Item Two — $48"].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: "8px", color: T.t2 }}><span>{item.split("—")[0]}</span><span style={{ fontWeight: 600 }}>{item.split("—")[1]}</span></div>
        ))}
        <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: "3px", paddingTop: "3px", display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 600 }}>
          <span style={{ color: T.t2 }}>Total</span><span style={{ color: T.pri }}>{fmt(110)}</span>
        </div>
      </div>
    </div>
  );
}

// P2.M03: accepts OrderTrackerPreviewData. When `orders` has entries,
// renders the most-recent order's progress. When absent or empty,
// falls back to the design sample (keeps the admin flow visualizer
// stable when the partner has no orders yet).
const ORDER_STEP_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
  refunded: -1,
};

function MiniOrderTracker({ data }: { data?: OrderTrackerPreviewData } = {}) {
  const steps = ["Placed", "Processing", "Shipped", "Delivered"];
  const order = data?.orders?.[0];
  const shortId = order?.shortId ?? "#ORD-847291";
  const statusLabel = order?.statusLabel ?? "Shipped";
  const currentIdx = order ? ORDER_STEP_INDEX[order.status] ?? 2 : 2;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", padding: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <div><div style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>{shortId}</div></div>
        <span style={{ fontSize: "8px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "2px 6px", borderRadius: "4px" }}>{statusLabel}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {steps.map((st, i) => {
          const done = i <= currentIdx;
          return (
            <div key={st} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {i > 0 && <div style={{ position: "absolute", top: 6, right: "50%", width: "100%", height: 2, background: done ? T.green : T.bdr }} />}
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: done ? T.green : T.surface, border: `2px solid ${done ? T.green : T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, fontSize: "6px", color: done ? "#fff" : T.t4 }}>{done ? "✓" : ""}</div>
              <span style={{ fontSize: "6px", color: i === currentIdx ? T.t1 : T.t4, fontWeight: i === currentIdx ? 600 : 400, textAlign: "center", marginTop: "2px" }}>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniPromo() {
  return (
    <div style={{ background: T.t1, borderRadius: "10px", padding: "8px" }}>
      <div style={{ fontSize: "8px", fontWeight: 700, color: T.acc }}>LIMITED TIME</div>
      <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>20% OFF SITEWIDE</div>
      <div style={{ fontSize: "8px", color: "#a1a1aa" }}>Code: SAVE20 · Ends Sunday</div>
      <button style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "none", background: T.acc, color: "#fff", fontSize: "9px", fontWeight: 600, cursor: "pointer", marginTop: "5px" }}>Shop Now</button>
    </div>
  );
}

function MiniNudge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 8px", borderRadius: "8px", background: T.greenBg, border: `1px solid ${T.greenBdr}` }}>
      <span style={{ fontSize: "11px", flexShrink: 0 }}>💡</span>
      <span style={{ fontSize: "10px", color: T.t2, flex: 1, lineHeight: 1.3 }}>Contextual suggestion or upsell nudge</span>
      <button style={{ fontSize: "8px", fontWeight: 600, color: T.green, background: T.surface, border: `1px solid ${T.bdr}`, padding: "2px 6px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Action</button>
    </div>
  );
}

function MiniSuggestions() {
  return (
    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {["Browse products", "Track order", "Need help", "Deals"].map(s => (
        <button key={s} style={{ fontSize: "9px", fontWeight: 500, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: "5px 10px", borderRadius: "9999px", cursor: "pointer" }}>{s}</button>
      ))}
    </div>
  );
}

function MiniContact({ data }: { data?: ContactPreviewData } = {}) {
  const items = data?.items && data.items.length > 0
    ? data.items
    : [
        { label: "Phone", value: "+1 (555) 123-4567", icon: "☎" },
        { label: "Email", value: "hello@brand.com", icon: "✉" },
        { label: "WhatsApp", value: "Chat now", icon: "◎" },
      ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", padding: "8px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1, marginBottom: "5px" }}>Contact Us</div>
      {items.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 0", borderBottom: i < items.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
          <span style={{ fontSize: "10px", width: 16, textAlign: "center" }}>{c.icon || "•"}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: "8px", color: T.t4 }}>{c.label}</div><div style={{ fontSize: "9px", fontWeight: 500, color: T.pri }}>{c.value}</div></div>
        </div>
      ))}
    </div>
  );
}

function MiniSkinQuiz() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "5px 8px", background: T.priBg, display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quiz — Step 2 of 4</span>
      </div>
      <div style={{ padding: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: T.t1, marginBottom: "5px" }}>What&apos;s your primary concern?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px" }}>
          {[{ l: "Option A", a: true }, { l: "Option B", a: false }, { l: "Option C", a: true }, { l: "Option D", a: false }].map(c => (
            <div key={c.l} style={{ padding: "6px", borderRadius: "5px", border: c.a ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: c.a ? T.priBg : T.surface, textAlign: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: c.a ? 600 : 400, color: c.a ? T.pri : T.t2 }}>{c.l}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "3px", marginTop: "5px" }}>
          {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 2 ? T.pri : T.bdr }} />)}
        </div>
        <button style={{ width: "100%", padding: "7px", borderRadius: "6px", border: "none", background: T.pri, color: "#fff", fontSize: "9px", fontWeight: 600, cursor: "pointer", marginTop: "5px" }}>NEXT →</button>
      </div>
    </div>
  );
}

function MiniBundle() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ height: "36px", background: "linear-gradient(135deg, #2d4a3e, #3d6354)", display: "flex", alignItems: "center", padding: "0 8px", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", fontWeight: 300, color: "#fff", letterSpacing: "1px" }}>Bundle Set</span>
        <Badge color={T.acc}>SAVE $42</Badge>
      </div>
      <div style={{ padding: "6px 8px" }}>
        {["Item A — $62", "Item B — $48", "Item C — $34"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 0", borderBottom: i < 2 ? `1px solid ${T.bdr}` : "none" }}>
            <span style={{ fontSize: "8px", fontWeight: 600, color: T.pri }}>{i + 1}</span>
            <Img w={18} h={18} r={3} />
            <span style={{ fontSize: "9px", color: T.t1, flex: 1 }}>{item.split("—")[0]}</span>
            <span style={{ fontSize: "8px", color: T.t4, textDecoration: "line-through" }}>{item.split("—")[1]}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", paddingTop: "4px", borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: T.pri }}>{fmt(102)}</span>
          <span style={{ fontSize: "8px", fontWeight: 600, color: T.green }}>Save 24%</span>
        </div>
        <button style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "none", background: T.pri, color: "#fff", fontSize: "9px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>Add Set</button>
      </div>
    </div>
  );
}

function MiniBooking() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "6px 8px", background: T.accBg }}>
        <div style={{ fontSize: "9px", fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: "0.5px" }}>Book a Consultation</div>
        <div style={{ fontSize: "8px", color: T.t3 }}>Free 15-min virtual session</div>
      </div>
      <div style={{ padding: "6px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px" }}>
          {["10:00 AM", "11:30 AM", "1:00 PM"].map((t, i) => (
            <div key={t} style={{ padding: "5px", borderRadius: "4px", textAlign: "center", fontSize: "8px", border: i === 1 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 1 ? T.accBg : T.surface, color: i === 1 ? T.acc : T.t1, fontWeight: i === 1 ? 600 : 400, cursor: "pointer" }}>{t}</div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "none", background: T.acc, color: "#fff", fontSize: "9px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>Book — Free</button>
      </div>
    </div>
  );
}

function MiniSubscription() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "5px 8px", background: T.priBg, fontSize: "8px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "0.5px" }}>↻ Subscribe & Save</div>
      <div style={{ padding: "6px 8px" }}>
        {[{ l: "Every 4 weeks", s: "20% off", a: true }, { l: "Every 8 weeks", s: "10% off", a: false }].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 6px", marginBottom: "2px", borderRadius: "4px", border: f.a ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: f.a ? T.priBg : T.surface, cursor: "pointer" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", border: f.a ? `3px solid ${T.pri}` : `2px solid ${T.bdr}`, background: T.surface }} />
            <span style={{ fontSize: "8px", color: T.t1, flex: 1 }}>{f.l}</span>
            <span style={{ fontSize: "8px", fontWeight: 600, color: T.green }}>{f.s}</span>
          </div>
        ))}
        <button style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "none", background: T.pri, color: "#fff", fontSize: "9px", fontWeight: 600, cursor: "pointer", marginTop: "3px" }}>Subscribe</button>
      </div>
    </div>
  );
}

function MiniLoyalty() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", padding: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>✦ Rewards — Gold</span>
        <span style={{ fontSize: "8px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "2px 5px", borderRadius: "3px" }}>1,240 pts</span>
      </div>
      <div style={{ height: 4, background: T.bdr, borderRadius: "3px", marginTop: "5px" }}><div style={{ width: "62%", height: "100%", background: T.pri, borderRadius: "3px" }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px", marginTop: "5px" }}>
        {[{ v: "$12", l: "Redeemable" }, { v: "🎂 $10", l: "Birthday" }, { v: "2x", l: "Pts this wk" }].map(s => (
          <div key={s.l} style={{ padding: "4px", background: T.bg, borderRadius: "4px", textAlign: "center" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: T.pri }}>{s.v}</div>
            <div style={{ fontSize: "6px", color: T.t4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const BLOCK_PREVIEWS: Record<string, React.ComponentType> = {
  greeting: MiniGreeting,
  skin_quiz: MiniSkinQuiz,
  product_card: MiniProductCard,
  product_detail: MiniProductDetail,
  compare: MiniCompare,
  promo: MiniPromo,
  bundle: MiniBundle,
  cart: MiniCart,
  order_confirmation: MiniOrderConfirmation,
  order_tracker: MiniOrderTracker,
  booking: MiniBooking,
  subscription: MiniSubscription,
  loyalty: MiniLoyalty,
  nudge: MiniNudge,
  suggestions: MiniSuggestions,
  contact: MiniContact,
};
