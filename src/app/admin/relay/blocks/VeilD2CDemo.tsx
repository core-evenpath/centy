"use client";
import React, { useState, useEffect, useRef } from "react";

const T = {
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
const disc = (m: number, p: number) => Math.round(((m - p) / m) * 100);

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  mrp: number;
  img: string;
  badge?: string;
  cat: string;
  concern: string[];
  rating: number;
  reviews: number;
  sizes: string[];
}

const PRODUCTS: Product[] = [
  { id: "c1", name: "Barrier Repair Cream", desc: "Ceramides · Squalane · 50ml", price: 48, mrp: 0, img: "linear-gradient(135deg, #e8e0d4 0%, #d4caba 50%, #c8bfaf 100%)", badge: "Best Seller", cat: "moisturizers", concern: ["dryness","aging"], rating: 4.8, reviews: 2847, sizes: ["50ml","100ml"] },
  { id: "s1", name: "Vitamin C Brightening Serum", desc: "15% L-Ascorbic · Ferulic · 30ml", price: 62, mrp: 0, img: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)", badge: "Award Winner", cat: "serums", concern: ["dullness","aging","dark spots"], rating: 4.7, reviews: 4210, sizes: ["15ml","30ml"] },
  { id: "s2", name: "Retinol Night Serum", desc: "0.5% Encapsulated Retinol · 30ml", price: 56, mrp: 0, img: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)", cat: "serums", concern: ["aging","acne","texture"], rating: 4.5, reviews: 1893, sizes: ["30ml"] },
  { id: "cl1", name: "Gentle Gel Cleanser", desc: "pH 5.5 · Centella · 150ml", price: 28, mrp: 0, img: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)", cat: "cleansers", concern: ["acne","sensitivity"], rating: 4.6, reviews: 3102, sizes: ["150ml","250ml"] },
  { id: "sp1", name: "Invisible Shield SPF 50", desc: "Chemical · No white cast · 40ml", price: 34, mrp: 0, img: "linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #facc15 100%)", badge: "Cult Fave", cat: "spf", concern: ["all"], rating: 4.9, reviews: 6450, sizes: ["40ml"] },
  { id: "e1", name: "Peptide Eye Cream", desc: "Caffeine · Niacinamide · 15ml", price: 44, mrp: 0, img: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)", cat: "treatments", concern: ["aging","dark circles"], rating: 4.4, reviews: 1567, sizes: ["15ml"] },
  { id: "m1", name: "Niacinamide Pore Serum", desc: "10% Niacinamide · Zinc · 30ml", price: 38, mrp: 0, img: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)", cat: "serums", concern: ["acne","pores","oily"], rating: 4.6, reviews: 2340, sizes: ["30ml"] },
  { id: "t1", name: "AHA/BHA Exfoliant", desc: "Glycolic + Salicylic · 100ml", price: 32, mrp: 0, img: "linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)", badge: "Staff Pick", cat: "treatments", concern: ["texture","acne","dullness"], rating: 4.3, reviews: 1890, sizes: ["100ml"] },
];

const CONCERNS = [
  { id: "acne", label: "Acne & Breakouts", icon: "◯" },
  { id: "aging", label: "Fine Lines", icon: "∿" },
  { id: "dryness", label: "Dryness", icon: "◇" },
  { id: "dullness", label: "Dull Skin", icon: "✧" },
  { id: "pores", label: "Large Pores", icon: "⬡" },
  { id: "sensitivity", label: "Sensitivity", icon: "❋" },
];

const CATS = [
  { id: "all", label: "All", icon: "✦" },
  { id: "cleansers", label: "Cleanse", icon: "◯" },
  { id: "serums", label: "Serums", icon: "◇" },
  { id: "moisturizers", label: "Moisturize", icon: "∿" },
  { id: "spf", label: "SPF", icon: "☀" },
  { id: "treatments", label: "Treat", icon: "✧" },
];

const BLOCK_SECTIONS = [
  { id: "entry", title: "Entry & Discovery", blocks: [
    { type: "greeting", label: "Welcome", status: "EXISTS" },
    { type: "skin_quiz", label: "Skin Quiz", status: "NEW" },
    { type: "concern_picker", label: "Concern Picker", status: "NEW" },
    { type: "category_grid", label: "Category Grid", status: "NEW" },
    { type: "search_results", label: "Search Results", status: "NEW" },
  ]},
  { id: "browse", title: "Product & Evaluation", blocks: [
    { type: "products", label: "Product Catalog", status: "EXISTS" },
    { type: "product_detail", label: "Product Detail", status: "NEW" },
    { type: "ingredients", label: "Ingredient List", status: "NEW" },
    { type: "compare", label: "Compare", status: "EXISTS" },
    { type: "reviews", label: "Reviews + UGC", status: "EXTEND" },
    { type: "shade_finder", label: "Shade Finder", status: "NEW" },
    { type: "routine_builder", label: "Routine Builder", status: "NEW" },
  ]},
  { id: "promo", title: "Pricing & Promos", blocks: [
    { type: "promo", label: "Promo / Sale", status: "EXISTS" },
    { type: "bundle", label: "Bundle / Set", status: "NEW" },
    { type: "gift_card", label: "Gift Card", status: "NEW" },
    { type: "free_gift", label: "GWP Threshold", status: "NEW" },
  ]},
  { id: "cart", title: "Cart & Checkout", blocks: [
    { type: "cart", label: "Cart", status: "NEW" },
    { type: "checkout", label: "Checkout", status: "NEW" },
    { type: "confirmation", label: "Confirmation", status: "NEW" },
  ]},
  { id: "post", title: "Post-Purchase", blocks: [
    { type: "order_tracker", label: "Order Tracker", status: "NEW" },
    { type: "return_exchange", label: "Return / Exchange", status: "NEW" },
    { type: "reorder", label: "Quick Reorder", status: "NEW" },
    { type: "feedback", label: "Review Request", status: "NEW" },
  ]},
  { id: "engage", title: "Engagement & Retention", blocks: [
    { type: "subscription", label: "Subscribe & Save", status: "NEW" },
    { type: "loyalty", label: "Rewards Program", status: "NEW" },
    { type: "referral", label: "Refer a Friend", status: "NEW" },
    { type: "wishlist", label: "Saved Items", status: "NEW" },
    { type: "nudge", label: "Smart Nudge", status: "EXISTS" },
    { type: "social_proof", label: "Social Proof", status: "NEW" },
  ]},
  { id: "support", title: "Support", blocks: [
    { type: "info", label: "FAQ / Policy", status: "EXISTS" },
    { type: "contact", label: "Contact", status: "EXISTS" },
    { type: "handoff", label: "Live Consult", status: "EXISTS" },
    { type: "booking", label: "Book Consultation", status: "NEW" },
  ]},
];

const SCENARIOS = [
  { id: "first_visit", label: "First Visit + Skin Quiz", desc: "Welcome → quiz → personalized routine", tags: ["greeting","skin_quiz","routine_builder","products"] },
  { id: "concern", label: "Shop by Concern", desc: "\"Help with acne\" → filtered picks", tags: ["concern_picker","products","product_detail"] },
  { id: "deep_dive", label: "Product Deep Dive", desc: "Detail → ingredients → reviews → compare", tags: ["product_detail","ingredients","reviews","compare"] },
  { id: "shade", label: "Shade Finder", desc: "Foundation matching questionnaire", tags: ["shade_finder","product_detail","reviews"] },
  { id: "routine", label: "Routine Builder", desc: "AM/PM routine with bundle pricing", tags: ["routine_builder","bundle","cart"] },
  { id: "subscribe", label: "Subscribe & Save", desc: "Auto-replenish consumables", tags: ["subscription","reorder","nudge"] },
  { id: "deals", label: "Deals & Gift Sets", desc: "Holiday set → GWP → gift card", tags: ["promo","bundle","gift_card","free_gift"] },
  { id: "checkout", label: "Cart & Checkout", desc: "Cart → Afterpay → Apple Pay → confirm", tags: ["cart","checkout","confirmation"] },
  { id: "tracking", label: "Order & Returns", desc: "Track → return → prepaid label", tags: ["order_tracker","return_exchange","feedback"] },
  { id: "loyalty", label: "Loyalty & Rewards", desc: "Points → birthday → tier upgrade", tags: ["loyalty","wishlist","social_proof"] },
  { id: "gifting", label: "Gift & Refer", desc: "Gift card → referral → share", tags: ["gift_card","referral","nudge"] },
  { id: "consult", label: "Live Skin Consult", desc: "Book a virtual consultation", tags: ["booking","handoff","info"] },
];

function Img({ w = 56, h = 56, r = 10, bg }: { w?: number; h?: number; r?: number; bg?: string }) {
  return <div style={{ width: w, height: h, borderRadius: r, flexShrink: 0, background: bg || `linear-gradient(135deg, ${T.card} 0%, ${T.bdr} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: Math.min(w, h) * 0.18, color: T.t4 }}>✦</span></div>;
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontSize: "7px", fontWeight: 600, color: "#fff", background: color || T.pri, padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.3px" }}>{children}</span>;
}

function Stars({ r }: { r: number }) {
  return <div style={{ display: "flex", gap: "1px" }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: "8px", color: i <= Math.round(r) ? "#d97706" : T.bdr }}>★</span>)}</div>;
}

function Row({ l, v, bold, color, strike }: { l: string; v: string; bold?: boolean; color?: string; strike?: boolean }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}><span style={{ color: T.t3 }}>{l}</span><span style={{ color: color || T.t1, fontWeight: bold ? 700 : 400, textDecoration: strike ? "line-through" : "none" }}>{v}</span></div>;
}

function Sug({ items }: { items: string[] }) {
  return <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{items.map(s => <button key={s} style={{ fontSize: "10px", fontWeight: 500, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: "5px 10px", borderRadius: "9999px", cursor: "pointer" }}>{s}</button>)}</div>;
}

function Nudge({ text, action, variant, icon }: { text: string; action?: string; variant?: string; icon?: string }) {
  const bg = variant === "green" ? T.greenBg : variant === "amber" ? T.amberBg : variant === "pink" ? T.pinkBg : T.priBg;
  const bdr = variant === "green" ? T.greenBdr : variant === "amber" ? "rgba(180,83,9,0.14)" : variant === "pink" ? "rgba(190,24,93,0.12)" : T.priBg2;
  const ac = variant === "green" ? T.green : variant === "amber" ? T.amber : variant === "pink" ? T.pink : T.pri;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: bg, border: `1px solid ${bdr}` }}>
      {icon && <span style={{ fontSize: "12px", flexShrink: 0 }}>{icon}</span>}
      <span style={{ fontSize: "11px", color: T.t2, flex: 1, lineHeight: 1.4 }}>{text}</span>
      {action && <button style={{ fontSize: "9px", fontWeight: 600, color: ac, background: T.surface, border: `1px solid ${T.bdr}`, padding: "3px 8px", borderRadius: "5px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{action}</button>}
    </div>
  );
}

function Bot({ text, children }: { text?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "7px", marginBottom: "10px", alignItems: "flex-start" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.priBg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: T.pri, flexShrink: 0, fontWeight: 600 }}>V</div>
      <div style={{ maxWidth: "calc(100% - 34px)", width: children ? "100%" : "auto" }}>
        {text && <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, padding: "9px 12px", borderRadius: "11px", fontSize: "12px", lineHeight: 1.55, color: T.t1 }}>{text}</div>}
        {children && <div style={{ marginTop: text ? "6px" : 0 }}>{children}</div>}
      </div>
    </div>
  );
}

function User({ text }: { text: string }) {
  return <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}><div style={{ maxWidth: "80%", background: T.pri, color: "#fff", padding: "9px 14px", borderRadius: "14px 14px 4px 14px", fontSize: "12px", lineHeight: 1.5 }}>{text}</div></div>;
}

function GreetingBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "14px 12px 10px", borderBottom: `1px solid ${T.bdr}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.pri, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 300, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>V</div>
          <div><div style={{ fontSize: "15px", fontWeight: 500, color: T.t1, letterSpacing: "4px", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VEIL</div><div style={{ fontSize: "9px", color: T.t4, letterSpacing: "0.5px" }}>Clean beauty that works · Est. 2020</div></div>
        </div>
        <div style={{ fontSize: "12px", color: T.t2, marginTop: "8px", lineHeight: 1.5 }}>Welcome! Take our 60-second skin quiz for a personalized routine, or browse our collection.</div>
      </div>
      <div style={{ padding: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
        {[{ l: "Take Skin Quiz", s: "60 seconds", i: "◎" }, { l: "Bestsellers", s: "Top 10 picks", i: "★" }, { l: "Shop by Concern", s: "Targeted care", i: "◇" }, { l: "Track Order", s: "Check status", i: "▤" }].map(a => (
          <div key={a.l} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 8px", background: T.bg, borderRadius: "8px", cursor: "pointer", border: `1px solid ${T.bdr}` }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.priBg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: T.pri }}>{a.i}</div>
            <div><div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>{a.l}</div><div style={{ fontSize: "8px", color: T.t4 }}>{a.s}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkinQuizBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "8px 10px", background: T.priBg, borderBottom: `1px solid ${T.priBg2}`, display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "10px", color: T.pri }}>◎</span>
        <span style={{ fontSize: "10px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1px" }}>Skin Quiz — Step 2 of 4</span>
      </div>
      <div style={{ padding: "10px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1, marginBottom: "3px" }}>What&apos;s your #1 skin concern?</div>
        <div style={{ fontSize: "10px", color: T.t3, marginBottom: "8px" }}>Select all that apply</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          {[{ l: "Acne & Breakouts", a: true }, { l: "Fine Lines & Wrinkles" }, { l: "Dark Spots & Uneven Tone", a: true }, { l: "Dryness & Dehydration" }, { l: "Large Pores & Oiliness" }, { l: "Sensitivity & Redness" }].map(c => (
            <div key={c.l} style={{ padding: "8px", borderRadius: "7px", border: c.a ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: c.a ? T.priBg : T.surface, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: c.a ? 600 : 400, color: c.a ? T.pri : T.t2 }}>{c.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.pri }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.pri }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.bdr }} />
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: T.bdr }} />
        </div>
        <button style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", marginTop: "6px", letterSpacing: "0.5px" }}>NEXT →</button>
      </div>
    </div>
  );
}

function ConcernPickerBlock() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px" }}>
      {CONCERNS.map(c => (
        <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", padding: "12px 8px", textAlign: "center", cursor: "pointer" }}>
          <div style={{ fontSize: "18px", color: T.pri, marginBottom: "3px" }}>{c.icon}</div>
          <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "8px", padding: "8px 10px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 8, background: p.img, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "3px" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: T.t1, lineHeight: 1.3 }}>{p.name}</div>
            {p.badge && <Badge>{p.badge}</Badge>}
          </div>
          <div style={{ fontSize: "9px", color: T.t4, marginTop: "1px" }}>{p.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: T.pri }}>{fmt(p.price)}</span>
              {p.rating && <div style={{ display: "flex", alignItems: "center", gap: "2px" }}><Stars r={p.rating} /><span style={{ fontSize: "8px", color: T.t4 }}>({p.reviews})</span></div>}
            </div>
            <button style={{ fontSize: "9px", fontWeight: 600, color: "#fff", background: T.pri, border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer" }}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCatalog({ filter }: { filter?: string }) {
  const filtered = PRODUCTS.filter(p => !filter || p.cat === filter || p.concern?.includes(filter)).slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", gap: "4px", overflowX: "auto", scrollbarWidth: "none" }}>
        {CATS.slice(0, 5).map((c, i) => <button key={c.id} style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "9px", fontWeight: i === 0 || c.id === filter ? 600 : 400, background: i === 0 || c.id === filter ? T.pri : T.surface, color: i === 0 || c.id === filter ? "#fff" : T.t3, border: i === 0 || c.id === filter ? "none" : `1px solid ${T.bdr}`, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{c.icon} {c.label}</button>)}
      </div>
      {filtered.map(p => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}

function ProductDetail({ p }: { p?: Product }) {
  const prod = p || PRODUCTS[1];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ height: "85px", background: prod.img, position: "relative" }}>
        {prod.badge && <div style={{ position: "absolute", top: 6, left: 6 }}><Badge>{prod.badge}</Badge></div>}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: "9px", color: T.pri, fontWeight: 600, letterSpacing: "1px" }}>VEIL</div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: T.t1 }}>{prod.name}</div>
        <div style={{ fontSize: "9px", color: T.t3, marginTop: "1px" }}>{prod.desc}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: T.pri }}>{fmt(prod.price)}</span>
          {prod.rating && <div style={{ display: "flex", alignItems: "center", gap: "2px" }}><Stars r={prod.rating} /><span style={{ fontSize: "9px", color: T.t3 }}>{prod.rating} ({prod.reviews?.toLocaleString()})</span></div>}
        </div>
        {prod.sizes && prod.sizes.length > 1 && (
          <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
            {prod.sizes.map((s, i) => <button key={s} style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "9px", fontWeight: i === 0 ? 600 : 400, background: i === 0 ? T.pri : T.surface, color: i === 0 ? "#fff" : T.t2, border: `1px solid ${i === 0 ? T.pri : T.bdr}`, cursor: "pointer" }}>{s}</button>)}
          </div>
        )}
        <div style={{ display: "flex", gap: "5px", marginTop: "8px" }}>
          <button style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: T.pri, fontSize: "10px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>Add to Bag — {fmt(prod.price)}</button>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "6px", paddingTop: "5px", borderTop: `1px solid ${T.bdr}` }}>
          {["Free shipping $50+", "Cruelty-free", "Clean formula"].map(f => <span key={f} style={{ fontSize: "8px", color: T.t4 }}>✓ {f}</span>)}
        </div>
      </div>
    </div>
  );
}

function IngredientsBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "7px 10px", borderBottom: `1px solid ${T.bdr}`, fontSize: "10px", fontWeight: 600, color: T.t1 }}>Key Ingredients</div>
      {[{ n: "15% L-Ascorbic Acid", r: "Brightens, fades dark spots, boosts collagen", s: "Clinical grade" }, { n: "Ferulic Acid", r: "Stabilizes Vitamin C, doubles antioxidant power", s: "1%" }, { n: "Vitamin E", r: "Moisturizes, protects against UV damage", s: "1%" }].map((ing, i) => (
        <div key={i} style={{ padding: "6px 10px", borderBottom: i < 2 ? `1px solid ${T.bdr}` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>{ing.n}</span>
            <span style={{ fontSize: "8px", color: T.pri, background: T.priBg, padding: "1px 5px", borderRadius: "3px" }}>{ing.s}</span>
          </div>
          <div style={{ fontSize: "9px", color: T.t3, marginTop: "1px" }}>{ing.r}</div>
        </div>
      ))}
      <div style={{ padding: "5px 10px", background: T.priBg }}>
        <span style={{ fontSize: "8px", color: T.pri }}>✓ Vegan · No parabens · No sulfates · Fragrance-free · Dermatologist tested</span>
      </div>
    </div>
  );
}

function ShadeFinderBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "8px 10px", background: T.accBg, borderBottom: `1px solid ${T.accBg2}` }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: "1px" }}>Shade Finder</div>
        <div style={{ fontSize: "9px", color: T.t3, marginTop: "1px" }}>Find your perfect match in 3 steps</div>
      </div>
      <div style={{ padding: "10px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1, marginBottom: "6px" }}>What&apos;s your undertone?</div>
        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          {[{ l: "Cool", c: "linear-gradient(135deg, #fce7f3, #fbcfe8)", a: false }, { l: "Neutral", c: "linear-gradient(135deg, #fef3c7, #fde68a)", a: true }, { l: "Warm", c: "linear-gradient(135deg, #fed7aa, #fdba74)", a: false }].map(u => (
            <div key={u.l} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: u.a ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, cursor: "pointer", textAlign: "center" }}>
              <div style={{ height: 20, borderRadius: 4, background: u.c, marginBottom: "3px" }} />
              <div style={{ fontSize: "9px", fontWeight: u.a ? 600 : 400, color: u.a ? T.acc : T.t2 }}>{u.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1, marginBottom: "4px" }}>Your match:</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px", background: T.bg, borderRadius: "8px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #d4a574, #c4946a)", border: `2px solid ${T.acc}` }} />
          <div style={{ flex: 1 }}><div style={{ fontSize: "11px", fontWeight: 600, color: T.t1 }}>Shade 3N — Sand</div><div style={{ fontSize: "9px", color: T.t3 }}>Neutral undertone · Light-medium</div></div>
          <button style={{ fontSize: "9px", fontWeight: 600, color: "#fff", background: T.acc, border: "none", padding: "4px 10px", borderRadius: "5px", cursor: "pointer" }}>Add</button>
        </div>
      </div>
    </div>
  );
}

function RoutineBuilderBlock() {
  const am = [{ n: "Gentle Gel Cleanser", p: 28 }, { n: "Vitamin C Serum", p: 62 }, { n: "Barrier Cream", p: 48 }, { n: "SPF 50", p: 34 }];
  const pm = [{ n: "Gentle Gel Cleanser", p: 28 }, { n: "Retinol Night Serum", p: 56 }, { n: "Barrier Cream", p: 48 }];
  const total = 48 + 62 + 56 + 28 + 34;
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "8px 10px", background: T.priBg, borderBottom: `1px solid ${T.priBg2}` }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1px" }}>✦ Your Personalized Routine</div>
        <div style={{ fontSize: "9px", color: T.t3, marginTop: "1px" }}>Based on: Acne + Dark spots · Combination skin</div>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: "9px", fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>☀ AM Routine</div>
        {am.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 0" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: T.pri, width: 16, textAlign: "center" }}>{i + 1}</span>
            <span style={{ fontSize: "10px", color: T.t1, flex: 1 }}>{item.n}</span>
            <span style={{ fontSize: "9px", color: T.t3 }}>{fmt(item.p)}</span>
          </div>
        ))}
        <div style={{ height: 1, background: T.bdr, margin: "6px 0" }} />
        <div style={{ fontSize: "9px", fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>☽ PM Routine</div>
        {pm.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 0" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: T.pri, width: 16, textAlign: "center" }}>{i + 1}</span>
            <span style={{ fontSize: "10px", color: T.t1, flex: 1 }}>{item.n}</span>
            <span style={{ fontSize: "9px", color: T.t3 }}>{fmt(item.p)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${T.bdr}` }}>
          <div><div style={{ fontSize: "8px", color: T.t4 }}>5 unique products</div><span style={{ fontSize: "14px", fontWeight: 700, color: T.pri }}>{fmt(total)}</span></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: "9px", fontWeight: 600, color: T.green }}>Save 15% as routine</div><div style={{ fontSize: "12px", fontWeight: 700, color: T.green }}>{fmt(total * 0.85)}</div></div>
        </div>
        <button style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "none", background: T.pri, color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", marginTop: "6px" }}>Add Full Routine to Bag</button>
      </div>
    </div>
  );
}

function CompareBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, fontSize: "10px", fontWeight: 600, color: T.t1 }}>Compare Serums</div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", fontSize: "9px" }}>
        <div style={{ padding: "4px 6px", borderBottom: `1px solid ${T.bdr}` }} />
        <div style={{ padding: "4px 6px", borderBottom: `1px solid ${T.bdr}`, fontWeight: 600, color: T.pri, textAlign: "center", borderLeft: `1px solid ${T.bdr}` }}>Vitamin C</div>
        <div style={{ padding: "4px 6px", borderBottom: `1px solid ${T.bdr}`, fontWeight: 600, color: T.t2, textAlign: "center", borderLeft: `1px solid ${T.bdr}` }}>Retinol</div>
        {[["Best for", "Brightening", "Anti-aging"], ["Use", "AM only", "PM only"], ["Results", "2–4 weeks", "8–12 weeks"], ["Price", "$62", "$56"], ["Rating", "4.7 ★", "4.5 ★"]].map(([l, v1, v2]) => (
          <React.Fragment key={l}>
            <div style={{ padding: "3px 6px", borderBottom: `1px solid ${T.bdr}`, color: T.t4 }}>{l}</div>
            <div style={{ padding: "3px 6px", borderBottom: `1px solid ${T.bdr}`, textAlign: "center", borderLeft: `1px solid ${T.bdr}`, color: T.t1 }}>{v1}</div>
            <div style={{ padding: "3px 6px", borderBottom: `1px solid ${T.bdr}`, textAlign: "center", borderLeft: `1px solid ${T.bdr}`, color: T.t1 }}>{v2}</div>
          </React.Fragment>
        ))}
      </div>
      <div style={{ padding: "5px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "4px 6px", background: T.priBg, borderRadius: "5px" }}>
          <span style={{ fontSize: "8px", color: T.t2 }}>✦ <strong>Use both!</strong> Vitamin C in AM for protection, Retinol at PM for repair. Never mix in the same step.</span>
        </div>
      </div>
    </div>
  );
}

function ReviewsBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ textAlign: "center" }}><div style={{ fontSize: "20px", fontWeight: 800, color: T.t1 }}>4.7</div><Stars r={4.7} /><div style={{ fontSize: "8px", color: T.t4, marginTop: "1px" }}>4,210 reviews</div></div>
        <div style={{ flex: 1 }}>{[84, 11, 3, 1, 1].map((p, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "1px" }}><span style={{ fontSize: "7px", color: T.t4, width: "8px", textAlign: "right" }}>{5 - i}</span><div style={{ flex: 1, height: "3px", background: T.bdr, borderRadius: "2px" }}><div style={{ width: `${p}%`, height: "100%", background: "#d97706", borderRadius: "2px" }} /></div></div>))}</div>
      </div>
      {[{ n: "Sarah M.", l: "Seattle, WA", r: 5, t: "Holy grail vitamin C. My dark spots faded in 3 weeks. No irritation on my sensitive skin.", v: true, a: "3d" }, { n: "Jessica L.", l: "Austin, TX", r: 4, t: "Great formula but oxidizes faster than I'd like. Keep it in the fridge!", v: true, a: "1w" }].map((rv, i) => (
        <div key={i} style={{ padding: "6px 10px", borderBottom: i === 0 ? `1px solid ${T.bdr}` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}><span style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>{rv.n}</span><span style={{ fontSize: "7px", color: T.t4 }}>· {rv.l}</span>{rv.v && <span style={{ fontSize: "7px", color: T.green }}>✓ Verified</span>}</div>
            <span style={{ fontSize: "8px", color: T.t4 }}>{rv.a}</span>
          </div>
          <Stars r={rv.r} />
          <div style={{ fontSize: "9px", color: T.t2, lineHeight: 1.4, marginTop: "1px" }}>{rv.t}</div>
        </div>
      ))}
    </div>
  );
}

function PromoBlock({ variant }: { variant?: string }) {
  if (variant === "gwp") return (
    <div style={{ background: T.priBg, border: `1px solid ${T.priBg2}`, borderRadius: "11px", padding: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #fce7f3, #fbcfe8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🎁</div>
      <div style={{ flex: 1 }}><div style={{ fontSize: "10px", fontWeight: 600, color: T.pri }}>Free mini Vitamin C with orders $75+</div><div style={{ fontSize: "9px", color: T.t3 }}>You&apos;re $27 away · Auto-added at checkout</div></div>
    </div>
  );
  if (variant === "sale") return (
    <div style={{ background: T.t1, borderRadius: "11px", padding: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ fontSize: "9px", fontWeight: 700, color: T.acc }}>FRIENDS & FAMILY</span><span style={{ fontSize: "8px", color: T.t4, marginLeft: "auto" }}>Ends Sun midnight</span></div>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff", marginTop: "3px" }}>20% OFF SITEWIDE</div>
      <div style={{ fontSize: "9px", color: "#a1a1aa" }}>Code: GLOW20 · No exclusions</div>
      <button style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "none", background: T.acc, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer", marginTop: "6px" }}>Shop Now</button>
    </div>
  );
  return (
    <div style={{ background: T.surface, border: `2px dashed ${T.pri}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>Welcome Offer</div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px", padding: "6px 8px", background: T.priBg, borderRadius: "7px" }}>
        <div style={{ fontSize: "14px", fontWeight: 800, color: T.pri, letterSpacing: "2px" }}>NEWGLOW</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>15% off first order</div><div style={{ fontSize: "8px", color: T.t4 }}>Min $40 · One-time use</div></div>
        <button style={{ padding: "3px 6px", borderRadius: "4px", border: `1px solid ${T.bdr}`, background: T.surface, fontSize: "8px", fontWeight: 600, cursor: "pointer", color: T.pri }}>Copy</button>
      </div>
    </div>
  );
}

function BundleBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ height: "50px", background: "linear-gradient(135deg, #2d4a3e, #3d6354)", display: "flex", alignItems: "center", padding: "0 10px", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: "7px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "1px" }}>Holiday Set</div><div style={{ fontSize: "13px", fontWeight: 300, color: "#fff", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>The Complete Glow Kit</div></div>
        <Badge color={T.acc}>SAVE $42</Badge>
      </div>
      <div style={{ padding: "8px 10px" }}>
        {[{ n: "Vitamin C Serum", p: 62 }, { n: "Barrier Cream", p: 48 }, { n: "SPF 50", p: 34 }, { n: "Gel Cleanser", p: 28 }].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 0", borderBottom: i < 3 ? `1px solid ${T.bdr}` : "none" }}>
            <span style={{ fontSize: "9px", fontWeight: 600, color: T.pri }}>{i + 1}</span>
            <Img w={22} h={22} r={4} />
            <span style={{ fontSize: "10px", color: T.t1, flex: 1 }}>{item.n}</span>
            <span style={{ fontSize: "9px", color: T.t4, textDecoration: "line-through" }}>{fmt(item.p)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "5px", borderTop: `1px solid ${T.bdr}` }}>
          <div><span style={{ fontSize: "9px", color: T.t4, textDecoration: "line-through" }}>{fmt(172)}</span><span style={{ fontSize: "14px", fontWeight: 700, color: T.pri, marginLeft: "4px" }}>{fmt(130)}</span></div>
          <span style={{ fontSize: "9px", fontWeight: 600, color: T.green }}>Save 24%</span>
        </div>
        <button style={{ width: "100%", padding: "8px", borderRadius: "7px", border: "none", background: T.pri, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer", marginTop: "5px" }}>Add Set to Bag</button>
      </div>
    </div>
  );
}

function GiftCardBlockDemo() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ height: "50px", background: "linear-gradient(135deg, #c4704b, #a85d3e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <span style={{ fontSize: "14px", fontWeight: 300, letterSpacing: "3px", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VEIL GIFT CARD</span>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
          {[25, 50, 75, 100].map((a, i) => <span key={a} style={{ flex: 1, textAlign: "center", padding: "6px", borderRadius: "6px", fontSize: "11px", fontWeight: i === 1 ? 700 : 500, cursor: "pointer", border: i === 1 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 1 ? T.accBg : T.surface, color: i === 1 ? T.acc : T.t1 }}>{fmt(a)}</span>)}
        </div>
        <input placeholder="Add a personal message (optional)" style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: `1px solid ${T.bdr}`, fontSize: "10px", outline: "none", boxSizing: "border-box" }} />
        <button style={{ width: "100%", padding: "8px", borderRadius: "7px", border: "none", background: T.acc, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer", marginTop: "5px" }}>Send Gift Card — {fmt(50)}</button>
        <div style={{ fontSize: "8px", color: T.t4, textAlign: "center", marginTop: "3px" }}>Delivered instantly via email</div>
      </div>
    </div>
  );
}

function CartBlock({ withCode }: { withCode?: boolean }) {
  const items = [{ n: "Vitamin C Serum", v: "30ml", p: 62 }, { n: "Barrier Repair Cream", v: "50ml", p: 48 }, { n: "Invisible Shield SPF", v: "40ml", p: 34 }];
  const sub = 144; const d = withCode ? 21.6 : 0; const total = sub - d;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "10px" }}>🛍</span><span style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>Your Bag</span><span style={{ fontSize: "9px", color: T.t4 }}>3 items</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: "6px", padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, alignItems: "center" }}>
          <Img w={32} h={32} r={6} />
          <div style={{ flex: 1 }}><div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>{item.n}</div><div style={{ fontSize: "8px", color: T.t4 }}>{item.v}</div></div>
          <span style={{ fontSize: "11px", fontWeight: 600, color: T.pri }}>{fmt(item.p)}</span>
        </div>
      ))}
      {withCode && <div style={{ padding: "5px 10px", borderBottom: `1px solid ${T.bdr}`, background: T.greenBg, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "9px", fontWeight: 600, color: T.green }}>✓ NEWGLOW applied</span><span style={{ fontSize: "9px", fontWeight: 600, color: T.green }}>−{fmt(d)}</span></div>}
      <div style={{ padding: "7px 10px" }}>
        <Row l="Subtotal" v={fmt(sub)} />{withCode && <Row l="Discount (15%)" v={"−" + fmt(d)} color={T.green} />}<Row l="Shipping" v={sub >= 50 ? "FREE" : "$5.99"} color={T.green} />
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px", borderTop: `1px solid ${T.bdr}`, marginTop: "2px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: T.t1 }}>Total</span><span style={{ fontSize: "14px", fontWeight: 700, color: T.pri }}>{fmt(total)}</span>
        </div>
        <button style={{ width: "100%", padding: "9px", borderRadius: "7px", border: "none", background: T.t1, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer", marginTop: "5px", letterSpacing: "0.5px" }}>CHECKOUT — {fmt(total)}</button>
      </div>
    </div>
  );
}

function CheckoutBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.t1}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: T.t1, marginBottom: "8px" }}>Payment</div>
      {[{ l: " Apple Pay", s: "Express checkout", a: true, bg: "#000" }, { l: "Credit Card", s: "Visa · Mastercard · Amex" }, { l: "Afterpay", s: "4 × $30.60 · 0% interest" }, { l: "PayPal", s: "Pay with PayPal balance" }].map((pm) => (
        <div key={pm.l} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", marginBottom: "2px", borderRadius: "7px", border: pm.a ? `2px solid ${T.t1}` : `1px solid ${T.bdr}`, background: pm.a ? T.priBg : T.surface, cursor: "pointer" }}>
          <div style={{ flex: 1 }}><div style={{ fontSize: "10px", fontWeight: 500, color: T.t1 }}>{pm.l}</div><div style={{ fontSize: "8px", color: T.t4 }}>{pm.s}</div></div>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: pm.a ? `4px solid ${T.t1}` : `2px solid ${T.bdrM}`, background: T.surface }} />
        </div>
      ))}
      <button style={{ width: "100%", padding: "10px", borderRadius: "7px", border: "none", background: "#000", color: "#fff", fontSize: "11px", fontWeight: 600, cursor: "pointer", marginTop: "6px" }}> Pay {fmt(122.40)}</button>
      <div style={{ fontSize: "8px", color: T.t4, textAlign: "center", marginTop: "3px" }}>🔒 Secured by Stripe · 256-bit encryption</div>
    </div>
  );
}

function ConfirmationBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ background: T.greenBg, padding: "14px", textAlign: "center" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(45,106,79,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: "14px", color: T.green }}>✓</div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: T.green }}>Order Confirmed!</div>
        <div style={{ fontSize: "10px", color: T.green, opacity: 0.7 }}>#VL-847291</div>
      </div>
      <div style={{ padding: "8px 10px" }}>
        {[{ n: "Vitamin C Serum", p: "$62" }, { n: "Barrier Cream", p: "$48" }, { n: "SPF 50", p: "$34" }].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "9px" }}><span style={{ color: T.t2 }}>{item.n}</span><span style={{ fontWeight: 600, color: T.t1 }}>{item.p}</span></div>
        ))}
        <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: "3px", paddingTop: "3px", display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 600 }}>
          <span style={{ color: T.t2 }}>Total</span><span style={{ color: T.pri }}>{fmt(122.40)}</span>
        </div>
        <div style={{ marginTop: "5px", padding: "5px 8px", background: T.card, borderRadius: "6px", fontSize: "9px" }}>
          <Row l="Shipping" v="USPS Priority · 2–3 days" /><Row l="Tracking" v="Email + SMS" />
        </div>
      </div>
    </div>
  );
}

function OrderTrackerBlock({ s }: { s?: string }) {
  const steps = ["Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
  const idx = steps.indexOf(s || "Shipped");
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
        <div><div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>#VL-847291</div><div style={{ fontSize: "8px", color: T.t4 }}>Mar 28</div></div>
        <span style={{ fontSize: "9px", fontWeight: 600, color: idx >= 4 ? T.green : T.pri, background: idx >= 4 ? T.greenBg : T.priBg, padding: "2px 7px", borderRadius: "5px" }}>{s || "Shipped"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {steps.map((st, i) => {
          const done = i <= idx;
          return (
            <div key={st} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {i > 0 && <div style={{ position: "absolute", top: 7, right: "50%", width: "100%", height: 2, background: done ? T.green : T.bdr }} />}
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: done ? T.green : T.surface, border: `2px solid ${done ? T.green : T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, fontSize: "7px", color: done ? "#fff" : T.t4 }}>{done ? "✓" : ""}</div>
              <span style={{ fontSize: "6px", color: i === idx ? T.t1 : T.t4, fontWeight: i === idx ? 600 : 400, textAlign: "center", marginTop: "2px", lineHeight: 1.1 }}>{st}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "7px", padding: "5px 7px", background: T.bg, borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontSize: "8px", color: T.t4 }}>USPS Priority</div><div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>Arrives Wed, Apr 2</div></div>
        <button style={{ fontSize: "8px", fontWeight: 600, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: "3px 7px", borderRadius: "4px", cursor: "pointer" }}>Track</button>
      </div>
    </div>
  );
}

function ReturnBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1, marginBottom: "5px" }}>↩ Return / Exchange</div>
      <div style={{ padding: "5px 7px", background: T.bg, borderRadius: "5px", marginBottom: "6px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>Vitamin C Serum · 30ml</div>
        <div style={{ fontSize: "8px", color: T.t4 }}>#VL-847291 · Delivered Apr 2</div>
      </div>
      <div style={{ fontSize: "8px", fontWeight: 600, color: T.t3, marginBottom: "3px" }}>REASON</div>
      <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "6px" }}>
        {["Irritation / Reaction", "Not effective", "Wrong product", "Damaged"].map((r, i) => <span key={r} style={{ fontSize: "8px", padding: "3px 7px", borderRadius: "4px", border: i === 0 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 0 ? T.priBg : T.surface, color: i === 0 ? T.pri : T.t3, fontWeight: i === 0 ? 600 : 400, cursor: "pointer" }}>{r}</span>)}
      </div>
      <div style={{ display: "flex", gap: "3px", marginBottom: "6px" }}>
        {[{ l: "Refund", s: "Original method", a: true }, { l: "Exchange", s: "Different product" }, { l: "Credit", s: "$62 + 10% bonus" }].map(o => (
          <div key={o.l} style={{ flex: 1, padding: "5px", borderRadius: "5px", border: o.a ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: o.a ? T.priBg : T.surface, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: "9px", fontWeight: 600, color: o.a ? T.pri : T.t1 }}>{o.l}</div>
            <div style={{ fontSize: "7px", color: T.t4 }}>{o.s}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "5px 7px", background: T.greenBg, borderRadius: "5px", marginBottom: "5px" }}>
        <span style={{ fontSize: "8px", color: T.green }}>✓ Free returns within 30 days · Prepaid label included</span>
      </div>
      <button style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "none", background: T.pri, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>Generate Prepaid Label</button>
    </div>
  );
}

function SubscriptionBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "6px 10px", background: T.priBg, fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1px" }}>↻ Subscribe & Save</div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", gap: "5px", alignItems: "center", marginBottom: "6px" }}><Img w={28} h={28} r={6} bg={PRODUCTS[1].img} /><div><div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>Vitamin C Serum · 30ml</div><div style={{ fontSize: "9px", color: T.t3 }}>One-time: {fmt(62)}</div></div></div>
        {[{ l: "Every 4 weeks", s: "20% off", p: "$49.60" }, { l: "Every 6 weeks", s: "15% off", p: "$52.70" }, { l: "Every 8 weeks", s: "10% off", p: "$55.80" }].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 7px", marginBottom: "2px", borderRadius: "5px", cursor: "pointer", border: i === 0 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 0 ? T.priBg : T.surface }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", border: i === 0 ? `3px solid ${T.pri}` : `2px solid ${T.bdr}`, background: T.surface }} />
            <span style={{ fontSize: "9px", color: T.t1, flex: 1 }}>{f.l}</span>
            <span style={{ fontSize: "9px", fontWeight: 600, color: T.green }}>{f.s}</span>
            <span style={{ fontSize: "9px", fontWeight: 600, color: T.pri }}>{f.p}</span>
          </div>
        ))}
        <button style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "none", background: T.pri, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer", marginTop: "5px" }}>Subscribe — {fmt(49.60)}/month</button>
        <div style={{ fontSize: "7px", color: T.t4, textAlign: "center", marginTop: "2px" }}>Skip, swap, or cancel anytime · Free shipping always</div>
      </div>
    </div>
  );
}

function LoyaltyBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ fontSize: "12px" }}>✦</span><span style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>Glow Rewards — Gold</span></div>
        <span style={{ fontSize: "9px", fontWeight: 600, color: T.pri, background: T.priBg, padding: "2px 6px", borderRadius: "4px" }}>1,240 pts</span>
      </div>
      <div style={{ marginTop: "5px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: T.t4, marginBottom: "2px" }}><span>Gold (1,000+)</span><span>Platinum — 760 more</span></div>
        <div style={{ height: 4, background: T.bdr, borderRadius: "3px" }}><div style={{ width: "62%", height: "100%", background: `linear-gradient(90deg, ${T.pri}, ${T.priLt})`, borderRadius: "3px" }} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginTop: "6px" }}>
        <div style={{ padding: "5px", background: T.bg, borderRadius: "5px", textAlign: "center" }}><div style={{ fontSize: "12px", fontWeight: 700, color: T.pri }}>$12</div><div style={{ fontSize: "7px", color: T.t4 }}>Redeemable</div></div>
        <div style={{ padding: "5px", background: T.pinkBg, borderRadius: "5px", textAlign: "center", border: "1px solid rgba(190,24,93,0.12)" }}><div style={{ fontSize: "10px", fontWeight: 700, color: T.pink }}>🎂 $10</div><div style={{ fontSize: "7px", color: T.pink }}>Birthday</div></div>
        <div style={{ padding: "5px", background: T.greenBg, borderRadius: "5px", textAlign: "center", border: `1px solid ${T.greenBdr}` }}><div style={{ fontSize: "10px", fontWeight: 700, color: T.green }}>2x</div><div style={{ fontSize: "7px", color: T.green }}>Pts this wk</div></div>
      </div>
    </div>
  );
}

function WishlistBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, fontSize: "10px", fontWeight: 600, color: T.t1 }}>♡ Saved Items <span style={{ color: T.t4, fontWeight: 400 }}>3</span></div>
      {[{ n: "Retinol Night Serum", p: 56, f: "Back in stock!", fc: T.pri }, { n: "Peptide Eye Cream", p: 44 }, { n: "AHA/BHA Exfoliant", p: 32, f: "Price dropped!", fc: T.green, op: 38 }].map((item, i) => (
        <div key={i} style={{ display: "flex", gap: "5px", padding: "5px 10px", borderBottom: i < 2 ? `1px solid ${T.bdr}` : "none", alignItems: "center" }}>
          <Img w={26} h={26} r={4} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>{item.n}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "9px", fontWeight: 600, color: T.pri }}>{fmt(item.p)}</span>
              {item.op && <span style={{ fontSize: "7px", color: T.t4, textDecoration: "line-through" }}>{fmt(item.op)}</span>}
              {item.f && <span style={{ fontSize: "6px", fontWeight: 600, color: item.fc, background: item.fc === T.green ? T.greenBg : T.priBg, padding: "1px 3px", borderRadius: "2px" }}>{item.f}</span>}
            </div>
          </div>
          <button style={{ fontSize: "7px", fontWeight: 600, color: "#fff", background: T.pri, border: "none", padding: "2px 6px", borderRadius: "3px", cursor: "pointer" }}>Add</button>
        </div>
      ))}
    </div>
  );
}

function ReferralBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: T.t1, marginBottom: "5px" }}>🎁 Give $15, Get $15</div>
      <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
        <div style={{ flex: 1, padding: "5px", background: T.priBg, borderRadius: "5px", textAlign: "center" }}><div style={{ fontSize: "7px", color: T.t3 }}>They get</div><div style={{ fontSize: "12px", fontWeight: 700, color: T.pri }}>$15 off</div></div>
        <div style={{ flex: 1, padding: "5px", background: T.greenBg, borderRadius: "5px", textAlign: "center", border: `1px solid ${T.greenBdr}` }}><div style={{ fontSize: "7px", color: T.green }}>You earn</div><div style={{ fontSize: "12px", fontWeight: 700, color: T.green }}>$15</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "3px", padding: "5px 7px", background: T.bg, borderRadius: "5px" }}>
        <span style={{ fontSize: "10px", fontWeight: 600, color: T.t1, letterSpacing: "1px", flex: 1 }}>SARAH-GLOW</span>
        <button style={{ padding: "2px 5px", borderRadius: "3px", border: `1px solid ${T.bdr}`, background: T.surface, fontSize: "8px", fontWeight: 600, cursor: "pointer", color: T.pri }}>Copy</button>
        <button style={{ padding: "2px 5px", borderRadius: "3px", border: "none", background: T.pri, fontSize: "8px", fontWeight: 600, cursor: "pointer", color: "#fff" }}>Text</button>
      </div>
      <div style={{ fontSize: "8px", color: T.t4, marginTop: "4px" }}>5 friends joined · $75 earned so far</div>
    </div>
  );
}

function SocialProofBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", padding: "8px" }}>
      <div style={{ display: "flex", gap: "3px", justifyContent: "center", marginBottom: "5px" }}>
        {[{ v: "200K+", l: "Customers" }, { v: "4.8", l: "Avg Rating" }, { v: "92%", l: "Repurchase" }].map(s => (
          <div key={s.l} style={{ flex: 1, textAlign: "center", padding: "4px", background: T.bg, borderRadius: "5px" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: T.pri }}>{s.v}</div>
            <div style={{ fontSize: "7px", color: T.t4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "2px", justifyContent: "center", flexWrap: "wrap" }}>
        {["Allure Best of Beauty", "Vogue Approved", "Sephora Clean"].map(p => <span key={p} style={{ fontSize: "7px", fontWeight: 500, color: T.t3, background: T.bg, padding: "2px 5px", borderRadius: "3px" }}>{p}</span>)}
      </div>
      <div style={{ display: "flex", gap: "2px", justifyContent: "center", marginTop: "3px" }}>
        {["Cruelty-Free", "Vegan", "Clean at Sephora", "EWG Verified"].map(c => <span key={c} style={{ fontSize: "6px", fontWeight: 600, color: T.green, background: T.greenBg, padding: "1px 4px", borderRadius: "3px" }}>✓ {c}</span>)}
      </div>
    </div>
  );
}

function BookingBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "8px 10px", background: T.accBg, borderBottom: `1px solid ${T.accBg2}` }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: "1px" }}>Book a Skin Consult</div>
        <div style={{ fontSize: "9px", color: T.t3, marginTop: "1px" }}>Free 15-min virtual session with a licensed esthetician</div>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontSize: "9px", fontWeight: 600, color: T.t3, marginBottom: "3px" }}>AVAILABLE TIMES (ET)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "3px", marginBottom: "6px" }}>
          {["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"].map((t, i) => (
            <div key={t} style={{ padding: "6px", borderRadius: "5px", textAlign: "center", fontSize: "9px", border: i === 2 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 2 ? T.accBg : T.surface, color: i === 2 ? T.acc : T.t1, fontWeight: i === 2 ? 600 : 400, cursor: "pointer" }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: "5px 7px", background: T.bg, borderRadius: "5px", marginBottom: "5px" }}>
          <div style={{ fontSize: "9px", color: T.t3 }}>Includes: Skin analysis · Routine recommendation · Product samples</div>
        </div>
        <button style={{ width: "100%", padding: "8px", borderRadius: "7px", border: "none", background: T.acc, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>Book — Free</button>
      </div>
    </div>
  );
}

function HandoffBlock() {
  return (
    <div style={{ background: T.bg, border: `1px solid ${T.bdrM}`, borderRadius: "11px", padding: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 600 }}>KL</div>
        <div><div style={{ fontSize: "11px", fontWeight: 600, color: T.t1 }}>Kate Lin · Licensed Esthetician</div><div style={{ fontSize: "9px", color: T.t3 }}>Joining with your full conversation context</div></div>
      </div>
      <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
        {[0, 0.3, 0.6].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: T.acc, animation: `pulse 1.5s infinite ${d}s` }} />)}
      </div>
    </div>
  );
}

function FeedbackBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", padding: "10px", textAlign: "center" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: T.t1 }}>How&apos;s the Vitamin C Serum working?</div>
      <div style={{ fontSize: "9px", color: T.t3, marginTop: "1px" }}>Delivered 2 weeks ago</div>
      <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "6px" }}>
        {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: "20px", color: T.bdr, cursor: "pointer" }}>★</span>)}
      </div>
      <div style={{ fontSize: "8px", color: T.t4, marginTop: "3px" }}>Tap a star · Earn 50 reward points</div>
    </div>
  );
}

function InfoBlock() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "6px 10px", borderBottom: `1px solid ${T.bdr}`, fontSize: "10px", fontWeight: 600, color: T.t1 }}>Shipping & Returns</div>
      {[["Free shipping", "Orders $50+"], ["Standard", "USPS 3–5 days"], ["Express", "FedEx 2-day · $9.99"], ["Returns", "30 days · Prepaid label"], ["Exchanges", "Free · Any product"]].map(([l, v], i) => (
        <div key={l} style={{ padding: "4px 10px", borderBottom: i < 4 ? `1px solid ${T.bdr}` : "none", display: "flex", justifyContent: "space-between", background: i % 2 === 0 ? T.bg : T.surface, fontSize: "9px" }}>
          <span style={{ color: T.t3 }}>{l}</span><span style={{ fontWeight: 500, color: T.t1 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function ReorderBlock() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: "11px", overflow: "hidden" }}>
      <div style={{ padding: "6px 10px", background: T.priBg, fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase" }}>↻ Quick Reorder — 38 days ago</div>
      {[{ n: "Vitamin C Serum", p: 62 }, { n: "Barrier Cream", p: 48 }].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderBottom: i === 0 ? `1px solid ${T.bdr}` : "none" }}>
          <Img w={26} h={26} r={5} /><div style={{ flex: 1 }}><div style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>{item.n}</div><div style={{ fontSize: "9px", color: T.t4 }}>Same price</div></div>
          <span style={{ fontSize: "10px", fontWeight: 700, color: T.pri }}>{fmt(item.p)}</span>
        </div>
      ))}
      <div style={{ padding: "7px 10px" }}><button style={{ width: "100%", padding: "7px", borderRadius: "7px", border: "none", background: T.pri, color: "#fff", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>Reorder All — {fmt(110)}</button></div>
    </div>
  );
}

interface ChatMsg {
  k: number;
  t: string;
  text?: string;
  block?: string;
  items?: string[];
  filter?: string;
  p?: Product;
  withCode?: boolean;
  action?: string;
  variant?: string;
  icon?: string;
}

function buildScenario(id: string): ChatMsg[] {
  const u = (t: string): ChatMsg => ({ k: Math.random(), t: "user", text: t });
  const b = (text: string): ChatMsg => ({ k: Math.random(), t: "bot", text });
  const bl = (block: string, props?: Partial<ChatMsg>): ChatMsg => ({ k: Math.random(), t: "bot", block, ...props });
  const sg = (items: string[]): ChatMsg => ({ k: Math.random(), t: "bot", block: "sug", items });
  const nd = (text: string, action: string, variant: string, icon: string): ChatMsg => ({ k: Math.random(), t: "bot", block: "nudge", text, action, variant, icon });

  const flows: Record<string, ChatMsg[]> = {
    first_visit: [
      bl("greeting"), sg(["Take Skin Quiz", "Browse Bestsellers", "I need help with acne"]),
      u("I'll take the skin quiz"), bl("skin_quiz"),
      b("Based on your answers — combination skin with acne and dark spots — here's a routine built just for you:"),
      bl("routine"), sg(["Add full routine", "Tell me about Vitamin C", "Subscribe & save"]),
    ],
    concern: [
      u("I've been struggling with acne and dark spots"),
      b("I hear you — that's a really common combination. Here are your skin concerns mapped:"),
      bl("concern_picker"),
      b("These are our highest-rated products specifically for acne + hyperpigmentation:"),
      bl("catalog", { filter: "acne" }), sg(["Niacinamide Serum details", "AHA/BHA Exfoliant details", "Compare these two"]),
      u("Tell me more about the Niacinamide Serum"), bl("product_detail", { p: PRODUCTS[6] }),
      sg(["See ingredients", "Read reviews", "Add to bag"]),
    ],
    deep_dive: [
      u("What's in the Vitamin C Serum? Is it worth $62?"),
      bl("product_detail", { p: PRODUCTS[1] }), bl("ingredients"),
      sg(["Customer reviews", "Compare with retinol", "How to use it"]),
      u("What are customers saying?"), bl("reviews"),
      u("Compare it with the Retinol Serum"), bl("compare"),
      sg(["Add Vitamin C to bag", "Add both", "Build my routine"]),
    ],
    shade: [
      u("I want to try your tinted moisturizer but I don't know my shade"),
      b("Let's find your perfect match — it takes about 30 seconds:"),
      bl("shade_finder"),
      sg(["Add shade to bag", "See reviews for this shade", "Try a different undertone"]),
      u("Add it!"), b("Added Shade 3N — Sand. Pairs beautifully with your SPF."),
      nd("First order? Use NEWGLOW for 15% off.", "Apply", "green", "🎉"),
    ],
    routine: [
      u("I want a complete skincare routine for anti-aging"),
      b("I'll build you a morning and evening routine based on your goal:"),
      bl("routine"),
      sg(["Add full routine", "Swap out a product", "Subscribe for 20% off"]),
      u("Add the full routine"), b("Full routine added! Here's your bag:"),
      bl("cart"), sg(["Apply coupon", "Checkout", "Add eye cream too"]),
    ],
    subscribe: [
      u("I keep reordering the Vitamin C serum — is there a subscription option?"),
      b("Yes! Subscribe & Save gives you up to 20% off with automatic deliveries:"),
      bl("subscription"),
      sg(["Subscribe monthly", "Add more products", "How do I skip a month?"]),
      u("Do I have past orders I can reorder?"),
      bl("reorder"),
      nd("Subscribe to 3+ products and unlock free priority shipping forever.", "Learn more", "green", "📦"),
    ],
    deals: [
      u("Any deals running right now?"),
      b("Great timing — we have a few active promotions:"),
      bl("promo_sale"), bl("promo_coupon"),
      nd("Spend $75+ and get a free mini Vitamin C Serum!", "Shop now", "amber", "🎁"),
      sg(["Show me gift sets", "Gift card for a friend", "Holiday bundles"]),
      u("Show me the holiday set"), bl("bundle"),
      u("I also want a gift card for my sister"), bl("gift_card"),
    ],
    checkout: [
      u("I'm ready to check out"),
      b("Here's your bag — 3 products, free shipping included:"),
      bl("cart", { withCode: true }),
      u("Checkout"),
      bl("checkout"),
      bl("confirmation"),
      nd("Share your routine with friends — you both get $15!", "Share", "green", "🎁"),
      sg(["Track my order", "Subscribe & save", "Refer a friend"]),
    ],
    tracking: [
      u("Where's my order?"),
      b("Here's the latest on your shipment:"),
      bl("order_tracker"),
      sg(["I need to return something", "Contact support", "Reorder"]),
      u("I want to return the Vitamin C — it irritated my skin"),
      b("I'm sorry to hear that. Let me start your return:"),
      bl("return"),
      sg(["Generate label", "Talk to a skin advisor", "Try a gentler alternative"]),
      u("Can I get a skin advisor's opinion?"),
      b("Connecting you with Kate, one of our licensed estheticians:"),
      bl("handoff"),
    ],
    loyalty: [
      b("Welcome back! Here's your Glow Rewards status:"),
      bl("loyalty"),
      nd("Your birthday is this month! $10 reward has been added automatically.", "Redeem", "pink", "🎂"),
      sg(["My saved items", "Redeem points", "How do points work?"]),
      u("Show my saved items"), bl("wishlist"),
      u("How trusted is VEIL compared to other brands?"), bl("social_proof"),
      sg(["Shop bestsellers", "Refer a friend", "Track my order"]),
    ],
    gifting: [
      u("I want to get something for my friend's birthday"),
      b("Beautiful! A few options:"),
      bl("bundle"),
      bl("gift_card"),
      sg(["Send gift card", "Add gift message", "Refer her for $15 off"]),
      u("She might want to pick her own products — let's do the gift card"),
      b("Great choice! After she orders, here's how you both save:"),
      bl("referral"),
      nd("Share your referral link after sending the gift card — she saves $15 on top of the card value.", "Smart!", "green", "💡"),
    ],
    consult: [
      u("I'm overwhelmed by all these serums — can I talk to someone?"),
      b("Absolutely! You can book a free 15-minute virtual skin consultation:"),
      bl("booking"),
      sg(["Book 1:00 PM", "What do they cover?", "Browse on my own first"]),
      u("What's included?"),
      bl("info"),
      b("Your consultant can also recommend a routine, explain ingredient interactions, and send you free samples to try before committing."),
      sg(["Book now", "Send me samples first", "Show me bestsellers"]),
    ],
  };
  return flows[id] || [];
}

function renderBlock(m: ChatMsg) {
  if (m.t === "user") return <User key={m.k} text={m.text || ""} />;
  if (m.t === "bot" && m.text && !m.block) return <Bot key={m.k} text={m.text} />;
  if (m.block === "greeting") return <Bot key={m.k}><GreetingBlock /></Bot>;
  if (m.block === "skin_quiz") return <Bot key={m.k}><SkinQuizBlock /></Bot>;
  if (m.block === "concern_picker") return <Bot key={m.k}><ConcernPickerBlock /></Bot>;
  if (m.block === "catalog") return <Bot key={m.k}><ProductCatalog filter={m.filter} /></Bot>;
  if (m.block === "product_detail") return <Bot key={m.k}><ProductDetail p={m.p} /></Bot>;
  if (m.block === "ingredients") return <Bot key={m.k}><IngredientsBlock /></Bot>;
  if (m.block === "shade_finder") return <Bot key={m.k}><ShadeFinderBlock /></Bot>;
  if (m.block === "routine") return <Bot key={m.k}><RoutineBuilderBlock /></Bot>;
  if (m.block === "compare") return <Bot key={m.k}><CompareBlock /></Bot>;
  if (m.block === "reviews") return <Bot key={m.k}><ReviewsBlock /></Bot>;
  if (m.block === "promo_sale") return <Bot key={m.k}><PromoBlock variant="sale" /></Bot>;
  if (m.block === "promo_coupon") return <Bot key={m.k}><PromoBlock variant="coupon" /></Bot>;
  if (m.block === "promo_gwp") return <Bot key={m.k}><PromoBlock variant="gwp" /></Bot>;
  if (m.block === "bundle") return <Bot key={m.k}><BundleBlock /></Bot>;
  if (m.block === "gift_card") return <Bot key={m.k}><GiftCardBlockDemo /></Bot>;
  if (m.block === "cart") return <Bot key={m.k}><CartBlock withCode={m.withCode} /></Bot>;
  if (m.block === "checkout") return <Bot key={m.k}><CheckoutBlock /></Bot>;
  if (m.block === "confirmation") return <Bot key={m.k}><ConfirmationBlock /></Bot>;
  if (m.block === "order_tracker") return <Bot key={m.k}><OrderTrackerBlock /></Bot>;
  if (m.block === "return") return <Bot key={m.k}><ReturnBlock /></Bot>;
  if (m.block === "reorder") return <Bot key={m.k}><ReorderBlock /></Bot>;
  if (m.block === "subscription") return <Bot key={m.k}><SubscriptionBlock /></Bot>;
  if (m.block === "loyalty") return <Bot key={m.k}><LoyaltyBlock /></Bot>;
  if (m.block === "wishlist") return <Bot key={m.k}><WishlistBlock /></Bot>;
  if (m.block === "referral") return <Bot key={m.k}><ReferralBlock /></Bot>;
  if (m.block === "social_proof") return <Bot key={m.k}><SocialProofBlock /></Bot>;
  if (m.block === "booking") return <Bot key={m.k}><BookingBlock /></Bot>;
  if (m.block === "handoff") return <Bot key={m.k}><HandoffBlock /></Bot>;
  if (m.block === "feedback") return <Bot key={m.k}><FeedbackBlock /></Bot>;
  if (m.block === "info") return <Bot key={m.k}><InfoBlock /></Bot>;
  if (m.block === "sug") return <div key={m.k} style={{ marginBottom: "10px", marginLeft: "31px" }}><Sug items={m.items || []} /></div>;
  if (m.block === "nudge") return <div key={m.k} style={{ marginBottom: "10px", marginLeft: "31px" }}><Nudge text={m.text || ""} action={m.action} variant={m.variant} icon={m.icon} /></div>;
  return <Bot key={m.k} text={m.text || "..."} />;
}

export default function VeilD2CDemo() {
  const [scenario, setScenario] = useState("first_visit");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [tab, setTab] = useState("flows");
  const [expandedSection, setExpandedSection] = useState<string | null>("entry");
  const [highlightedBlocks, setHighlightedBlocks] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const allMsgs = useRef<ChatMsg[]>([]);

  useEffect(() => {
    const built = buildScenario(scenario);
    allMsgs.current = built;
    setMsgs([]); setVisibleCount(0);
    const sc = SCENARIOS.find(s => s.id === scenario);
    setHighlightedBlocks(sc?.tags || []);
    let idx = 0;
    const iv = setInterval(() => { idx++; if (idx > built.length) { clearInterval(iv); return; } setVisibleCount(idx); }, 450);
    return () => clearInterval(iv);
  }, [scenario]);

  useEffect(() => { setMsgs(allMsgs.current.slice(0, visibleCount)); }, [visibleCount]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const totalBlocks = BLOCK_SECTIONS.reduce((s, sec) => s + sec.blocks.length, 0);
  const newB = BLOCK_SECTIONS.reduce((s, sec) => s + sec.blocks.filter(b => b.status === "NEW").length, 0);
  const existB = BLOCK_SECTIONS.reduce((s, sec) => s + sec.blocks.filter(b => b.status === "EXISTS" || b.status === "EXTEND").length, 0);
  const statusColor = (s: string) => s === "NEW" ? T.pri : s === "EXTEND" ? T.amber : T.green;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#e8e3db", fontFamily: "'Karla', -apple-system, sans-serif" }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}*{box-sizing:border-box;}button:active{transform:scale(0.97);}::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${T.bdrM};border-radius:3px;}`}</style>

      <div style={{ width: "280px", borderRight: `1px solid ${T.bdr}`, background: T.surface, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "18px 16px 12px" }}>
          <div style={{ fontSize: "9px", fontWeight: 700, color: T.pri, textTransform: "uppercase", letterSpacing: "1.5px" }}>Relay Block System</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: T.t1, lineHeight: 1.3, marginTop: "4px" }}>Retail & Commerce</div>
          <div style={{ fontSize: "10px", color: T.t3, marginTop: "3px" }}>E-commerce / D2C Brand · Default Blocks</div>
          <div style={{ display: "flex", gap: "5px", marginTop: "8px" }}>
            <div style={{ padding: "4px 8px", background: T.bg, borderRadius: "5px", textAlign: "center" }}><div style={{ fontSize: "15px", fontWeight: 700, color: T.t1 }}>{totalBlocks}</div><div style={{ fontSize: "7px", color: T.t4 }}>Total</div></div>
            <div style={{ padding: "4px 8px", background: T.priBg, borderRadius: "5px", textAlign: "center" }}><div style={{ fontSize: "15px", fontWeight: 700, color: T.pri }}>{newB}</div><div style={{ fontSize: "7px", color: T.pri }}>New</div></div>
            <div style={{ padding: "4px 8px", background: T.greenBg, borderRadius: "5px", textAlign: "center" }}><div style={{ fontSize: "15px", fontWeight: 700, color: T.green }}>{existB}</div><div style={{ fontSize: "7px", color: T.green }}>Exists</div></div>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, borderTop: `1px solid ${T.bdr}` }}>
          {[{ id: "flows", l: "Chat Flows" }, { id: "blocks", l: "Block Index" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px", fontSize: "10px", fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? T.pri : T.t3, background: tab === t.id ? T.priBg : "transparent", border: "none", borderBottom: tab === t.id ? `2px solid ${T.pri}` : "2px solid transparent", cursor: "pointer" }}>{t.l}</button>
          ))}
        </div>

        {tab === "flows" && (
          <div style={{ padding: "8px 12px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: "8px", fontWeight: 600, color: T.t4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "5px" }}>12 Scenarios</div>
            {SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setScenario(s.id)} style={{ width: "100%", textAlign: "left", padding: "7px 9px", borderRadius: "7px", border: scenario === s.id ? `1.5px solid ${T.pri}` : `1px solid ${T.bdr}`, background: scenario === s.id ? T.priBg : T.bg, cursor: "pointer", marginBottom: "3px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: scenario === s.id ? T.pri : T.t1 }}>{s.label}</div>
                <div style={{ fontSize: "9px", color: T.t4, marginTop: "1px" }}>{s.desc}</div>
                <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", marginTop: "3px" }}>
                  {s.tags.slice(0, 3).map(tag => <span key={tag} style={{ fontSize: "6px", fontWeight: 500, color: T.pri, background: T.priBg2, padding: "1px 4px", borderRadius: "3px" }}>{tag}</span>)}
                  {s.tags.length > 3 && <span style={{ fontSize: "6px", color: T.t4 }}>+{s.tags.length - 3}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "blocks" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {BLOCK_SECTIONS.map(sec => (
              <div key={sec.id} style={{ marginBottom: "3px" }}>
                <button onClick={() => setExpandedSection(expandedSection === sec.id ? null : sec.id)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 7px", borderRadius: "5px", border: `1px solid ${T.bdr}`, background: expandedSection === sec.id ? T.bg : T.surface, cursor: "pointer" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: T.t1 }}>{sec.title}</span>
                  <span style={{ fontSize: "9px", color: T.t4 }}>{sec.blocks.length} · {expandedSection === sec.id ? "▾" : "▸"}</span>
                </button>
                {expandedSection === sec.id && (
                  <div style={{ padding: "3px 0 3px 8px" }}>
                    {sec.blocks.map(bl => (
                      <div key={bl.type} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 5px", borderRadius: "4px", marginBottom: "1px", background: highlightedBlocks.includes(bl.type) ? T.priBg : "transparent" }}>
                        <span style={{ fontSize: "6px", fontWeight: 700, color: statusColor(bl.status), background: bl.status === "NEW" ? T.priBg : bl.status === "EXTEND" ? T.amberBg : T.greenBg, padding: "1px 4px", borderRadius: "3px", flexShrink: 0 }}>{bl.status}</span>
                        <div><div style={{ fontSize: "9px", fontWeight: 600, color: T.t1 }}>{bl.label}</div><div style={{ fontSize: "7px", color: T.t4, fontFamily: "monospace" }}>{bl.type}</div></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "375px", height: "720px", borderRadius: "32px", border: "6px solid #1a1a18", overflow: "hidden", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "110px", height: "24px", background: "#1a1a18", borderRadius: "0 0 14px 14px", zIndex: 30 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "26px", overflow: "hidden", background: T.surface, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "32px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface, borderBottom: `1px solid ${T.bdr}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.pri, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 300, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>V</div>
                <div style={{ fontSize: "14px", fontWeight: 400, color: T.t1, letterSpacing: "4px", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>VEIL</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", background: T.priBg, borderRadius: "9999px" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: T.pri, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "9px", color: T.pri, fontWeight: 500 }}>{SCENARIOS.find(s => s.id === scenario)?.label}</span>
              </div>
            </div>

            <div style={{ borderBottom: `1px solid ${T.bdr}`, background: T.surface, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "3px", padding: "6px 10px", overflowX: "auto", scrollbarWidth: "none" }}>
                {CATS.map((c, i) => (
                  <button key={c.id} style={{ padding: "4px 10px", borderRadius: "9999px", fontSize: "9px", fontWeight: i === 0 ? 600 : 400, background: i === 0 ? T.pri : T.surface, color: i === 0 ? "#fff" : T.t3, border: i === 0 ? "none" : `1px solid ${T.bdr}`, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{c.icon} {c.label}</button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px", background: T.bg, display: "flex", flexDirection: "column" }}>
              {msgs.map(renderBlock)}
              <div ref={endRef} />
            </div>

            <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.bdr}`, background: T.surface, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: T.bg, borderRadius: "9px", border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: "11px", color: T.t4, flex: 1 }}>Ask about products, ingredients...</span>
                </div>
                <button style={{ width: 32, height: 32, borderRadius: 7, background: T.pri, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>↑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
