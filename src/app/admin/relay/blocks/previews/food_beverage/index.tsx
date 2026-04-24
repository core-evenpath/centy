// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#92400e', priLt: '#b45309', priBg: 'rgba(146,64,14,0.06)', priBg2: 'rgba(146,64,14,0.12)',
  acc: '#991b1b', accBg: 'rgba(153,27,27,0.06)', accBg2: 'rgba(153,27,27,0.12)',
  bg: '#faf8f5',
};

function Spice({ level }: { level: number }) {
  return <div style={{ display: 'flex', gap: '1px' }}>{[1, 2, 3].map(i => <I key={i} d={ic.sun} size={8} color={i <= level ? T.acc : T.bdr} stroke={i <= level ? 2 : 1.5} />)}</div>;
}

function DietTag({ label, color }: { label: string; color?: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '6px', fontWeight: 600, padding: '1px 4px', borderRadius: '3px', color: color || T.green, background: `${color || T.green}10`, border: `1px solid ${color || T.green}20`, letterSpacing: '0.3px' }}><I d={ic.leaf} size={6} color={color || T.green} stroke={2} />{label}</span>;
}

// Rotating image gradients for live menu items (data-backed items
// don't carry visual fields today — fall back to a palette that
// matches the existing design aesthetic).
const DEFAULT_MENU_IMGS = [
  'linear-gradient(135deg, #fef3c7 0%, #d4a574 50%, #92400e 100%)',
  'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #34d399 50%, #047857 100%)',
  'linear-gradient(135deg, #dbeafe 0%, #60a5fa 50%, #1d4ed8 100%)',
];

const DEFAULT_DRINK_IMGS = [
  'linear-gradient(135deg, #92400e, #78350f)',
  'linear-gradient(135deg, #7f1d1d, #991b1b)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #1e3a8a, #1e40af)',
];

// Test-chat-emission follow-up: accept ProductCardPreviewData shape
// (data.items[]). When partner modules are wired, items override the
// hardcoded design sample; other visual fields (cal, spice, tags, img)
// fall back to defaults so real partner items still render cleanly
// without a schema extension. Pattern matches MiniProductCard.
function MiniMenuItemCard({ data } = {}) {
  const liveItems = Array.isArray(data?.items) && data.items.length > 0 ? data.items : null;
  const items = liveItems
    ? liveItems.slice(0, 4).map((it, i) => ({
        name: it.name,
        desc: it.desc ?? '',
        price: typeof it.price === 'number' ? it.price : 0,
        cal: typeof it.cal === 'number' ? it.cal : 0,
        spice: 0,
        tags: Array.isArray(it.tags) ? it.tags : [],
        img: DEFAULT_MENU_IMGS[i % DEFAULT_MENU_IMGS.length],
        badge: typeof it.badge === 'string' ? it.badge : undefined,
        rating: typeof it.rating === 'number' ? it.rating : 0,
        orders: typeof it.reviews === 'number' ? it.reviews : 0,
      }))
    : [
        { name: 'Truffle Mushroom Risotto', desc: 'Arborio rice, wild mushrooms, aged parmesan, truffle oil', price: 24, cal: 580, spice: 0, tags: ['GF'], img: 'linear-gradient(135deg, #fef3c7 0%, #d4a574 50%, #92400e 100%)', badge: "Chef's Pick", rating: 4.9, orders: 1240 },
        { name: 'Grilled Salmon Teriyaki', desc: 'Atlantic salmon, house teriyaki, jasmine rice, bok choy', price: 28, cal: 420, spice: 1, tags: ['DF'], img: 'linear-gradient(135deg, #fed7aa 0%, #fb923c 50%, #ea580c 100%)', rating: 4.7, orders: 890 },
      ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 58, height: 58, borderRadius: 8, background: item.img, flexShrink: 0, position: 'relative' }}>
              {item.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.pri}>{item.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{item.name}</div>
              <div style={{ fontSize: '8px', color: T.t4, marginTop: '1px', lineHeight: 1.3 }}>{item.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                {item.tags.map(t => <DietTag key={t} label={t} color={t === 'GF' ? T.teal : T.green} />)}
                <span style={{ fontSize: '7px', color: T.t4 }}>{item.cal} cal</span>
                {item.spice > 0 && <Spice level={item.spice} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(item.price)}</span>
                  <Stars r={item.rating} size={7} />
                  <span style={{ fontSize: '7px', color: T.t4 }}>{item.orders.toLocaleString()} orders</span>
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMenuDetail() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '68px', background: 'linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)', display: 'flex', alignItems: 'flex-end', padding: '8px 10px' }}>
        <div><Tag color="#fff" bg="rgba(255,255,255,0.2)">Chef's Pick</Tag><div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '3px' }}>Truffle Mushroom Risotto</div></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '9px', color: T.t3, lineHeight: 1.4, marginBottom: '4px' }}>Slow-cooked arborio rice with wild porcini, chanterelle, and shiitake. Finished with aged parmesan and black truffle oil.</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}><DietTag label="Gluten Free" color={T.teal} /><DietTag label="Vegetarian" color={T.green} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '5px' }}>
          {[{ v: '580', l: 'Calories' }, { v: '18g', l: 'Protein' }, { v: '24g', l: 'Fat' }, { v: '62g', l: 'Carbs' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '6px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(24)}</span>
          <Stars r={4.9} size={7} /><span style={{ fontSize: '8px', color: T.t3 }}>4.9 (1,240 orders)</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, fontSize: '10px', fontWeight: 600, cursor: 'pointer', color: '#fff', marginTop: '5px' }}>Add to Order -- {fmt(24)}</button>
      </div>
    </div>
  );
}

function MiniCategoryBrowser() {
  const cats = [
    { name: 'Starters', count: 12, bg: 'linear-gradient(135deg, #fef3c7, #fbbf24)' },
    { name: 'Mains', count: 18, bg: 'linear-gradient(135deg, #fed7aa, #ea580c)' },
    { name: 'Desserts', count: 8, bg: 'linear-gradient(135deg, #fce7f3, #ec4899)' },
    { name: 'Drinks', count: 24, bg: 'linear-gradient(135deg, #d1fae5, #34d399)' },
    { name: 'Sides', count: 10, bg: 'linear-gradient(135deg, #e0e7ff, #818cf8)' },
    { name: 'Kids', count: 6, bg: 'linear-gradient(135deg, #cffafe, #22d3ee)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
      {cats.map(c => (
        <div key={c.name} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ height: 28, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.utensils} size={14} color="rgba(255,255,255,0.7)" stroke={1.5} />
          </div>
          <div style={{ padding: '4px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{c.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{c.count} items</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniDietaryFilter() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.leaf} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Dietary Preferences</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {[
            { l: 'Vegetarian', sel: true, color: T.green },
            { l: 'Vegan', sel: false, color: T.green },
            { l: 'Gluten Free', sel: true, color: T.teal },
            { l: 'Dairy Free', sel: false, color: T.blue },
            { l: 'Nut Free', sel: false, color: T.amber },
            { l: 'Halal', sel: false, color: T.pri },
            { l: 'Keto', sel: false, color: T.pink },
          ].map(d => (
            <span key={d.l} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '8px', padding: '4px 7px', borderRadius: '9999px', border: d.sel ? `2px solid ${d.color}` : `1px solid ${T.bdr}`, background: d.sel ? `${d.color}10` : T.surface, color: d.sel ? d.color : T.t2, fontWeight: d.sel ? 600 : 400, cursor: 'pointer' }}>
              {d.sel && <I d={ic.check} size={7} color={d.color} stroke={3} />}{d.l}
            </span>
          ))}
        </div>
        <div style={{ marginTop: '5px', padding: '4px 7px', background: T.greenBg, borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <I d={ic.check} size={8} color={T.green} stroke={2} />
          <span style={{ fontSize: '8px', color: T.green }}>Showing 14 items matching your preferences</span>
        </div>
      </div>
    </div>
  );
}

function MiniOrderCustomizer() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.grid} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customize Order</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Regular', p: 0 }, { l: 'Large', p: 4, sel: true }, { l: 'Family', p: 12 }].map(s => (
            <div key={s.l} style={{ flex: 1, padding: '5px', borderRadius: '5px', textAlign: 'center', border: s.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: s.sel ? T.priBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '9px', fontWeight: s.sel ? 600 : 400, color: s.sel ? T.pri : T.t1 }}>{s.l}</div>
              <div style={{ fontSize: '7px', color: T.t4 }}>{s.p === 0 ? 'Included' : `+${fmt(s.p)}`}</div>
            </div>
          ))}
        </div>
        {[{ l: 'Extra truffle oil', p: 3, sel: true }, { l: 'Side of garlic bread', p: 4, sel: false }, { l: 'Grilled vegetables', p: 5, sel: true }].map(a => (
          <div key={a.l} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: a.sel ? T.pri : T.bg, border: `1px solid ${a.sel ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {a.sel && <I d={ic.check} size={8} color="#fff" stroke={3} />}
            </div>
            <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{a.l}</span>
            <span style={{ fontSize: '9px', fontWeight: 500, color: T.pri }}>+{fmt(a.p)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '5px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '8px', color: T.t4 }}>Base + Large + 2 add-ons</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(36)}</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Add to Order -- {fmt(36)}</button>
      </div>
    </div>
  );
}

function MiniTableReservation() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reserve a Table</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '7px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Party Size</div>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '5px' }}>
          {[1, 2, 3, 4, 5, '6+'].map((n, i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: n === 2 ? 700 : 400, border: n === 2 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: n === 2 ? T.priBg : T.surface, color: n === 2 ? T.pri : T.t2, cursor: 'pointer' }}>{n}</div>)}
        </div>
        <div style={{ fontSize: '7px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Seating</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Indoor' }, { l: 'Outdoor', sel: true }, { l: 'Bar' }, { l: 'Private' }].map(s => (
            <span key={s.l} style={{ flex: 1, textAlign: 'center', padding: '4px', borderRadius: '4px', fontSize: '8px', border: s.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: s.sel ? T.priBg : T.surface, color: s.sel ? T.pri : T.t2, fontWeight: s.sel ? 600 : 400, cursor: 'pointer' }}>{s.l}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- 2 guests, 7 PM outdoor</button>
      </div>
    </div>
  );
}

function MiniDailySpecials() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.star} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Specials</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>Until 10 PM</span>
      </div>
      {[
        { name: 'Pan-Seared Duck Breast', desc: 'Cherry reduction, roasted root vegetables', price: 32, orig: 42, left: 4, img: 'linear-gradient(135deg, #92400e, #b45309)' },
        { name: 'Lobster Linguine', desc: 'Fresh pasta, bisque sauce, micro herbs', price: 36, orig: 48, left: 2, img: 'linear-gradient(135deg, #991b1b, #dc2626)' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', padding: '7px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: s.img, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.utensils} size={14} color="rgba(255,255,255,0.5)" stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{s.name}</div>
            <div style={{ fontSize: '8px', color: T.t3, marginTop: '1px' }}>{s.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: T.acc }}>{fmt(s.price)}</span>
                <span style={{ fontSize: '8px', color: T.t4, textDecoration: 'line-through' }}>{fmt(s.orig)}</span>
              </div>
              <span style={{ fontSize: '7px', fontWeight: 600, color: T.acc, background: T.accBg, padding: '1px 5px', borderRadius: '3px' }}>Only {s.left} left</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniKitchenQueue() {
  const steps = ['Received', 'Preparing', 'Cooking', 'Plating', 'Ready'];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clock} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Order Status</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.pri, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.pri, fontWeight: 500 }}>Live</span></span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {steps.map((st, i) => {
            const done = i <= 2; const active = i === 2;
            return (
              <div key={st} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 7, right: '50%', width: '100%', height: 2, background: done ? T.green : T.bdr }} />}
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? T.green : T.surface, border: `2px solid ${done ? T.green : T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  {done && !active ? <I d={ic.check} size={8} color="#fff" stroke={3} /> : active ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} /> : null}
                </div>
                <span style={{ fontSize: '6px', color: active ? T.t1 : T.t4, fontWeight: active ? 600 : 400, textAlign: 'center', marginTop: '2px' }}>{st}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '7px', padding: '5px 7px', background: T.priBg, borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: '8px', color: T.t4 }}>Order #847</div><div style={{ fontSize: '10px', fontWeight: 600, color: T.pri }}>Est. 8 min remaining</div></div>
          <I d={ic.utensils} size={14} color={T.pri} stroke={1.5} />
        </div>
      </div>
    </div>
  );
}

function MiniComboMeal() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '44px', background: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
        <div><div style={{ fontSize: '6px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Meal Deal</div><div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>Lunch Combo</div></div>
        <Tag color="#fff" bg="rgba(255,255,255,0.2)">Save {fmt(8)}</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[{ cat: 'Main', items: ['Grilled Chicken Wrap', 'Veggie Bowl', 'Fish Tacos'], sel: 0 }, { cat: 'Side', items: ['Fries', 'Side Salad', 'Soup'], sel: 1 }, { cat: 'Drink', items: ['Soft Drink', 'Iced Tea', 'Water'], sel: 0 }].map((g, gi) => (
          <div key={gi} style={{ marginBottom: '4px' }}>
            <div style={{ fontSize: '8px', fontWeight: 600, color: T.pri, marginBottom: '2px' }}>{g.cat}</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {g.items.map((item, i) => (
                <span key={item} style={{ flex: 1, textAlign: 'center', padding: '3px 2px', borderRadius: '4px', fontSize: '7px', border: i === g.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === g.sel ? T.priBg : T.surface, color: i === g.sel ? T.pri : T.t2, fontWeight: i === g.sel ? 600 : 400, cursor: 'pointer' }}>{item}</span>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px', paddingTop: '4px', borderTop: `1px solid ${T.bdr}` }}>
          <div><span style={{ fontSize: '9px', color: T.t4, textDecoration: 'line-through' }}>{fmt(22)}</span><span style={{ fontSize: '14px', fontWeight: 700, color: T.pri, marginLeft: '4px' }}>{fmt(14)}</span></div>
          <span style={{ fontSize: '8px', fontWeight: 600, color: T.green }}>Save 36%</span>
        </div>
        <button style={{ width: '100%', padding: '7px', borderRadius: '6px', border: 'none', background: T.pri, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Add Combo -- {fmt(14)}</button>
      </div>
    </div>
  );
}

// Test-chat-emission follow-up: accept ProductCardPreviewData shape.
// Same items-array source as menu_item; `cat` and `abv` fall back to
// defaults (not in today's moduleItems schema). Pattern matches
// MiniMenuItemCard.
function MiniDrinkMenu({ data } = {}) {
  const liveItems = Array.isArray(data?.items) && data.items.length > 0 ? data.items : null;
  const drinks = liveItems
    ? liveItems.slice(0, 4).map((it, i) => ({
        name: it.name,
        desc: it.desc ?? '',
        price: typeof it.price === 'number' ? it.price : 0,
        cat: typeof it.badge === 'string' ? it.badge : 'Drink',
        abv: '',
        img: DEFAULT_DRINK_IMGS[i % DEFAULT_DRINK_IMGS.length],
      }))
    : [
        { name: 'House Old Fashioned', desc: 'Bourbon, Angostura, Demerara, orange peel', price: 16, cat: 'Cocktails', abv: '32%', img: 'linear-gradient(135deg, #92400e, #78350f)' },
        { name: 'Napa Valley Pinot Noir', desc: 'Black cherry, earth, silky tannins', price: 14, cat: 'Wine', abv: '13.5%', img: 'linear-gradient(135deg, #7f1d1d, #991b1b)' },
        { name: 'Local Craft IPA', desc: 'Citrus hops, pine, medium body', price: 9, cat: 'Beer', abv: '6.8%', img: 'linear-gradient(135deg, #d97706, #b45309)' },
      ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.coffee} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Drinks</span>
      </div>
      {drinks.map((d, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: d.img, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.droplet} size={12} color="rgba(255,255,255,0.4)" stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{d.name}</span>
              <Tag color={T.pri} bg={T.priBg}>{d.cat}</Tag>
            </div>
            <div style={{ fontSize: '8px', color: T.t3, marginTop: '1px' }}>{d.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(d.price)}</span>
                {d.abv && <span style={{ fontSize: '7px', color: T.t4, background: T.bg, padding: '1px 4px', borderRadius: '2px' }}>ABV {d.abv}</span>}
              </div>
              <button style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniChefProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I d={ic.user} size={20} color="rgba(255,255,255,0.8)" stroke={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Chef Marco Rossi</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Executive Chef</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>Le Cordon Bleu, Paris -- 18 years</div>
          <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
            {['Italian', 'French', 'Mediterranean', 'Farm-to-Table'].map(s => (
              <span key={s} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg }}>
        <div style={{ fontSize: '8px', color: T.t3, fontStyle: 'italic', lineHeight: 1.4 }}>"Every dish tells a story. We source locally and let the ingredients speak for themselves."</div>
      </div>
    </div>
  );
}

function MiniCateringPackage() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '44px', background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
        <div><div style={{ fontSize: '6px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Catering</div><div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>Corporate Lunch Package</div></div>
        <Tag color="#fff" bg="rgba(255,255,255,0.2)">From {fmt(35)}/head</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '5px' }}>
          {[{ v: '20+', l: 'Min guests' }, { v: '48h', l: 'Lead time' }, { v: '15mi', l: 'Delivery' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '6px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {['3 starter options (choose 2)', '4 main courses (choose 2)', '2 dessert options', 'Beverages included', 'Setup + serving + cleanup'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
            <I d={ic.check} size={7} color={T.green} stroke={2.5} />
            <span style={{ fontSize: '8px', color: T.t2 }}>{item}</span>
          </div>
        ))}
        <button style={{ width: '100%', padding: '7px', borderRadius: '6px', border: 'none', background: T.pri, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Request Quote</button>
      </div>
    </div>
  );
}

function MiniNutritionInfo() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.activity} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Nutrition Facts</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: 48, height: 48, position: 'relative' }}>
            <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke={T.bdr} strokeWidth="4" /><circle cx="24" cy="24" r="20" fill="none" stroke={T.pri} strokeWidth="4" strokeDasharray="73 125.6" transform="rotate(-90 24 24)" strokeLinecap="round" /></svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: T.pri }}>580</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>cal</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[{ l: 'Protein', v: '18g', pct: 36, color: T.green }, { l: 'Fat', v: '24g', pct: 37, color: T.amber }, { l: 'Carbs', v: '62g', pct: 21, color: T.pri }, { l: 'Fiber', v: '4g', pct: 16, color: T.teal }].map(n => (
              <div key={n.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                <span style={{ fontSize: '7px', color: T.t4, width: '32px' }}>{n.l}</span>
                <div style={{ flex: 1, height: '4px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${n.pct}%`, height: '100%', background: n.color, borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '20px', textAlign: 'right' }}>{n.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniDinerReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.7</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Food quality', v: 94 }, { l: 'Presentation', v: 92 }, { l: 'Service', v: 88 }, { l: 'Ambience', v: 90 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 90 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'AC', name: 'Alex C.', text: 'The truffle risotto is life-changing. Perfect al dente, incredibly rich.', ago: '3d', meal: 'Dinner' },
        { init: 'PN', name: 'Priya N.', text: 'Beautiful space, great cocktails. Will return for brunch.', ago: '1w', meal: 'Dinner' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <Tag color={T.pri} bg={T.priBg}>{rv.meal}</Tag>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{rv.ago}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

const FB_BLOCKS: VerticalBlockDef[] = [
  { id: 'menu_item', family: 'menu', label: 'Menu Item Card', stage: 'discovery', desc: 'Food/drink item with dietary tags, spice level, calorie count, pricing', preview: MiniMenuItemCard, intents: ['menu', 'food', 'dishes', 'hungry', 'eat'], module: 'items', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'menu_detail', family: 'menu', label: 'Menu Item Detail', stage: 'showcase', desc: 'Full dish view with ingredients, allergens, nutrition, wine pairings', preview: MiniMenuDetail, intents: ['details', 'ingredients', 'allergens', 'about this dish'], module: 'items', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'category_browser', family: 'menu', label: 'Category Browser', stage: 'discovery', desc: 'Visual grid of menu sections with item counts', preview: MiniCategoryBrowser, intents: ['categories', 'sections', 'browse', 'starters', 'mains', 'desserts'], module: null, status: 'active', engines: ['commerce'], noModuleReason: 'ai_generated' },
  { id: 'dietary_filter', family: 'preferences', label: 'Dietary Filter', stage: 'discovery', desc: 'Multi-select dietary tag filter with matched-item count', preview: MiniDietaryFilter, intents: ['vegetarian', 'vegan', 'gluten free', 'halal', 'dietary', 'allergies'], module: null, status: 'active', engines: ['commerce'], noModuleReason: 'ai_generated' },
  { id: 'order_customizer', family: 'ordering', label: 'Order Customizer', stage: 'showcase', desc: 'Portion size selector, add-on checkboxes, special instructions, running total', preview: MiniOrderCustomizer, intents: ['customize', 'modify', 'add-ons', 'extra', 'size', 'special request'], module: null, status: 'active', engines: ['commerce'], noModuleReason: 'checkout' },
  { id: 'table_reservation', family: 'booking', label: 'Table Reservation', stage: 'conversion', desc: 'Party size grid, date strip, time slots, seating preference', preview: MiniTableReservation, intents: ['reserve', 'table', 'booking', 'reservation', 'dinner', 'tonight'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'daily_specials', family: 'marketing', label: 'Daily Specials', stage: 'showcase', desc: 'Time-limited special dishes with original price, limited-quantity badge', preview: MiniDailySpecials, intents: ['specials', 'today', 'recommended', 'chef special', 'limited'], module: 'items', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'kitchen_queue', family: 'operations', label: 'Kitchen Queue', stage: 'social_proof', desc: 'Live order pipeline 5-step tracker with estimated time remaining', preview: MiniKitchenQueue, intents: ['order status', 'how long', 'ready', 'waiting', 'prep time'], module: null, status: 'active', engines: ['service'], noModuleReason: 'ai_generated' },
  { id: 'combo_meal', family: 'marketing', label: 'Combo / Meal Deal', stage: 'showcase', desc: 'Build-your-own combo from categories with savings percentage', preview: MiniComboMeal, intents: ['combo', 'meal deal', 'set menu', 'lunch special', 'value meal'], module: 'items', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'drink_menu', family: 'beverage', label: 'Drink / Beverage Menu', stage: 'discovery', desc: 'Cocktails, wine, beer list with ABV, tasting notes, per-glass pricing', preview: MiniDrinkMenu, intents: ['drinks', 'cocktails', 'wine', 'beer', 'beverages', 'bar'], module: 'items', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'chef_profile', family: 'people', label: 'Chef / Team Profile', stage: 'social_proof', desc: 'Executive chef card with culinary credentials, cuisine specialties', preview: MiniChefProfile, intents: ['chef', 'who cooks', 'kitchen', 'about the chef'], module: null, status: 'active', engines: ['commerce'], noModuleReason: 'ai_generated' },
  { id: 'catering', family: 'events', label: 'Catering Package', stage: 'showcase', desc: 'Event catering with per-head pricing, minimum order, inclusions', preview: MiniCateringPackage, intents: ['catering', 'event', 'corporate', 'party', 'group order'], module: 'items', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'nutrition', family: 'info', label: 'Nutrition Info', stage: 'showcase', desc: 'Calorie ring chart, macro breakdown bars, allergen indicators', preview: MiniNutritionInfo, intents: ['nutrition', 'calories', 'macros', 'protein', 'nutrition facts'], module: null, status: 'active', engines: ['commerce'], noModuleReason: 'ai_generated' },
  { id: 'diner_review', family: 'social_proof', label: 'Diner Reviews', stage: 'social_proof', desc: 'F&B-specific criteria bars and meal-tagged reviews', preview: MiniDinerReview, intents: ['reviews', 'ratings', 'feedback', 'testimonials'], module: null, status: 'active', engines: ['commerce'], noModuleReason: 'design_only' },
];

const FB_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'full_service_restaurant', name: 'Full-Service Restaurant', industryId: 'food_beverage', blocks: ['menu_item', 'menu_detail', 'category_browser', 'dietary_filter', 'order_customizer', 'table_reservation', 'daily_specials', 'drink_menu', 'chef_profile', 'nutrition', 'diner_review', 'kitchen_queue'] },
  { id: 'casual_dining', name: 'Casual Dining', industryId: 'food_beverage', blocks: ['menu_item', 'menu_detail', 'category_browser', 'dietary_filter', 'order_customizer', 'table_reservation', 'daily_specials', 'combo_meal', 'drink_menu', 'diner_review'] },
  { id: 'qsr', name: 'Quick Service (QSR)', industryId: 'food_beverage', blocks: ['menu_item', 'category_browser', 'dietary_filter', 'order_customizer', 'combo_meal', 'kitchen_queue', 'nutrition', 'diner_review'] },
  { id: 'beverage_cafe', name: 'Cafe, Tea & Juice', industryId: 'food_beverage', blocks: ['menu_item', 'category_browser', 'dietary_filter', 'drink_menu', 'order_customizer', 'daily_specials', 'nutrition', 'diner_review'] },
  { id: 'bakery_desserts', name: 'Bakery & Desserts', industryId: 'food_beverage', blocks: ['menu_item', 'menu_detail', 'category_browser', 'dietary_filter', 'daily_specials', 'nutrition', 'order_customizer', 'catering', 'diner_review'] },
  { id: 'cloud_kitchen', name: 'Cloud Kitchen', industryId: 'food_beverage', blocks: ['menu_item', 'category_browser', 'dietary_filter', 'order_customizer', 'combo_meal', 'kitchen_queue', 'nutrition', 'diner_review'] },
  { id: 'catering_events', name: 'Catering & Events', industryId: 'food_beverage', blocks: ['catering', 'menu_item', 'category_browser', 'dietary_filter', 'chef_profile', 'diner_review'] },
  { id: 'bars_pubs', name: 'Bars, Pubs & Breweries', industryId: 'food_beverage', blocks: ['drink_menu', 'menu_item', 'category_browser', 'daily_specials', 'table_reservation', 'diner_review', 'chef_profile'] },
  { id: 'street_food', name: 'Street Food & Mobile', industryId: 'food_beverage', blocks: ['menu_item', 'category_browser', 'dietary_filter', 'combo_meal', 'kitchen_queue', 'diner_review'] },
];

const FB_FAMILIES: Record<string, VerticalFamilyDef> = {
  menu: { label: 'Menu & Catalog', color: '#92400e' },
  preferences: { label: 'Dietary & Preferences', color: '#15803d' },
  ordering: { label: 'Order Customization', color: '#b45309' },
  booking: { label: 'Reservations', color: '#991b1b' },
  marketing: { label: 'Specials & Deals', color: '#991b1b' },
  operations: { label: 'Kitchen Ops', color: '#1d4ed8' },
  beverage: { label: 'Beverages', color: '#0f766e' },
  people: { label: 'Team', color: '#be185d' },
  events: { label: 'Catering & Events', color: '#92400e' },
  info: { label: 'Nutrition & Info', color: '#0f766e' },
  social_proof: { label: 'Reviews', color: '#be185d' },
};

export const FB_CONFIG: VerticalConfig = {
  id: 'food_beverage',
  industryId: 'food_beverage',
  name: 'Food & Beverage',
  iconName: 'UtensilsCrossed',
  accentColor: '#92400e',
  blocks: FB_BLOCKS,
  subVerticals: FB_SUBVERTICALS,
  families: FB_FAMILIES,
};