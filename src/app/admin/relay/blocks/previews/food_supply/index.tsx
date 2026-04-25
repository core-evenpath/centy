// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#15803d', priLt: '#22c55e', priBg: 'rgba(21,128,61,0.06)', priBg2: 'rgba(21,128,61,0.12)',
  acc: '#0369a1', accBg: 'rgba(3,105,161,0.06)', accBg2: 'rgba(3,105,161,0.14)',
  bg: '#f7f8f5',
};

function MiniProductCard() {
  const items = [
    { name: 'Organic Baby Spinach', origin: 'Salinas Valley, CA', unit: '5 lb case', price: 14.50, moq: 10, sku: 'PRD-4821', certs: ['USDA Organic', 'Non-GMO'], img: 'linear-gradient(135deg, #d1fae5, #34d399, #059669)', badge: 'Seasonal' },
    { name: 'Atlantic Salmon Fillet', origin: 'Norwegian Farms', unit: '10 lb box', price: 89, moq: 5, sku: 'SEA-7102', certs: ['MSC Certified', 'ASC'], img: 'linear-gradient(135deg, #cffafe, #22d3ee, #0891b2)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 54, height: 54, borderRadius: 8, background: p.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.bag} size={18} color="rgba(255,255,255,0.5)" stroke={1.5} />
              {p.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.amber}>{p.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                <I d={ic.map} size={7} color={T.t4} /><span style={{ fontSize: '8px', color: T.t3 }}>{p.origin}</span>
              </div>
              <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                {p.certs.map(c => <Tag key={c} color={T.green} bg={T.greenBg}>{c}</Tag>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</span>
                  <span style={{ fontSize: '8px', color: T.t4 }}>/{p.unit}</span>
                  <div style={{ fontSize: '7px', color: T.t4 }}>MOQ: {p.moq} cases -- SKU: {p.sku}</div>
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Order</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniProductDetail() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '64px', background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)', display: 'flex', alignItems: 'flex-end', padding: '8px 10px' }}>
        <div><Tag color="#fff" bg="rgba(255,255,255,0.2)">USDA Organic</Tag><div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '3px' }}>Organic Baby Spinach</div></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '5px' }}>
          {[{ v: '5 lb', l: 'Case size' }, { v: '10', l: 'MOQ' }, { v: '7 days', l: 'Shelf life' }, { v: '34-38F', l: 'Storage' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {[['Origin', 'Salinas Valley, California'], ['Variety', 'Savoy & Flat Leaf Blend'], ['Grade', 'US No. 1'], ['Pack', '12 x 5oz clamshells per case']].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <span style={{ fontSize: '8px', color: T.t4 }}>{k}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '3px', marginTop: '5px' }}>
          {['USDA Organic', 'Non-GMO', 'HACCP', 'GAP'].map(c => <Tag key={c} color={T.green} bg={T.greenBg}>{c}</Tag>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(14.50)}</span>
          <span style={{ fontSize: '8px', color: T.t4 }}>/case</span>
          <span style={{ fontSize: '8px', color: T.amber, fontWeight: 600, marginLeft: 'auto' }}>10+ cases: {fmt(12.80)}</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Add to Order</button>
      </div>
    </div>
  );
}

function MiniCatalogBrowser() {
  const cats = [
    { name: 'Fresh Produce', count: 84, bg: 'linear-gradient(135deg, #d1fae5, #059669)' },
    { name: 'Meat & Poultry', count: 52, bg: 'linear-gradient(135deg, #fecdd3, #e11d48)' },
    { name: 'Seafood', count: 38, bg: 'linear-gradient(135deg, #cffafe, #0891b2)' },
    { name: 'Dairy & Eggs', count: 45, bg: 'linear-gradient(135deg, #fef3c7, #d97706)' },
    { name: 'Dry Goods', count: 120, bg: 'linear-gradient(135deg, #e0e7ff, #6366f1)' },
    { name: 'Frozen', count: 67, bg: 'linear-gradient(135deg, #e0f2fe, #0284c7)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
      {cats.map(c => (
        <div key={c.name} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ height: 28, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.bag} size={14} color="rgba(255,255,255,0.7)" stroke={1.5} />
          </div>
          <div style={{ padding: '4px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', fontWeight: 600, color: T.t1 }}>{c.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{c.count} SKUs</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniBulkOrderBuilder() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.bag} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bulk Order Builder</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[
          { name: 'Organic Baby Spinach', unit: '5 lb case', qty: 20, total: 256 },
          { name: 'Atlantic Salmon Fillet', unit: '10 lb box', qty: 8, total: 680 },
          { name: 'Free-Range Eggs', unit: '15 doz flat', qty: 12, total: 504 },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{item.name}</div>
              <div style={{ fontSize: '7px', color: T.t4 }}>{item.unit}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><I d={ic.minus} size={8} color={T.t3} stroke={2} /></div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1, width: '20px', textAlign: 'center' }}>{item.qty}</span>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><I d={ic.plus} size={8} color={T.t3} stroke={2} /></div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: T.pri, width: '44px', textAlign: 'right' }}>{fmt(item.total)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Subtotal (3 items)</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(1440)}</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Submit Order</button>
      </div>
    </div>
  );
}

function MiniSupplierProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.building} size={20} color="rgba(255,255,255,0.8)" stroke={1.5} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Valley Fresh Farms</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Certified Organic Grower</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>Salinas Valley, CA -- Est. 2008</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '340+', l: 'Buyers' }, { v: '16yr', l: 'Estd.' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['USDA Organic', 'GAP', 'HACCP', 'Non-GMO', 'SQF Level 2'].map(c => (
            <span key={c} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.greenBg, color: T.green, border: `1px solid ${T.greenBdr}` }}>{c}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Full Catalog</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Request Quote</button>
      </div>
    </div>
  );
}

function MiniWholesalePricing() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.dollar} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Volume Pricing</span>
      </div>
      {[
        { tier: '1-9 cases', price: 14.50, save: null },
        { tier: '10-24 cases', price: 13.60, save: '6%' },
        { tier: '25-49 cases', price: 12.80, save: '12%', sel: true },
        { tier: '50+ cases', price: 11.90, save: '18%' },
        { tier: 'Pallet (100+)', price: 10.50, save: '28%' },
      ].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none', background: t.sel ? T.priBg : 'transparent' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: t.sel ? `5px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <span style={{ fontSize: '9px', color: T.t1, flex: 1, fontWeight: t.sel ? 600 : 400 }}>{t.tier}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{fmt(t.price)}</span>
          {t.save && <span style={{ fontSize: '7px', fontWeight: 600, color: T.green, background: T.greenBg, padding: '1px 4px', borderRadius: '3px' }}>-{t.save}</span>}
        </div>
      ))}
    </div>
  );
}

function MiniDeliveryScheduler() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.truck} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule Delivery</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ d: 'Wed', n: '16' }, { d: 'Thu', n: '17', sel: true }, { d: 'Fri', n: '18' }, { d: 'Mon', n: '21' }].map(day => (
            <div key={day.n} style={{ flex: 1, padding: '5px 2px', borderRadius: '5px', textAlign: 'center', border: day.sel ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: day.sel ? T.accBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '7px', color: T.t4 }}>{day.d}</div>
              <div style={{ fontSize: '11px', fontWeight: day.sel ? 600 : 400, color: day.sel ? T.acc : T.t1 }}>{day.n}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['5-7 AM', '7-9 AM', '9-12 PM', '12-3 PM'].map((t, i) => (
            <span key={t} style={{ flex: 1, textAlign: 'center', padding: '5px 2px', borderRadius: '5px', fontSize: '8px', border: i === 1 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 1 ? T.accBg : T.surface, color: i === 1 ? T.acc : T.t1, fontWeight: i === 1 ? 600 : 400, cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Thu Apr 17, 7-9 AM</button>
      </div>
    </div>
  );
}

function MiniOrderTracker() {
  const steps = ['Packed', 'In Transit', 'At Hub', 'Out for Delivery', 'Delivered'];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.truck} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Delivery Tracking</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.pri, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.pri, fontWeight: 500 }}>Live</span></span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.priBg, borderRadius: '5px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: '8px', color: T.t4 }}>Order #FS-4821 -- 3 items</div><div style={{ fontSize: '10px', fontWeight: 600, color: T.pri }}>ETA: Today 7:45 AM</div></div>
          <I d={ic.truck} size={16} color={T.pri} stroke={1.5} />
        </div>
        {steps.map((st, i) => {
          const done = i <= 2; const active = i === 3;
          return (
            <div key={st} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < steps.length - 1 ? '6px' : '0' }}>
              {i < steps.length - 1 && <div style={{ position: 'absolute', left: 7, top: 16, width: 1, height: 'calc(100% - 10px)', background: done ? T.green : T.bdr }} />}
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? T.green : active ? T.acc : T.bg, border: `2px solid ${done ? T.green : active ? T.acc : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {done ? <I d={ic.check} size={8} color="#fff" stroke={3} /> : active ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /> : null}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '9px', fontWeight: active ? 600 : 400, color: done ? T.t3 : active ? T.acc : T.t4 }}>{st}</span>
                {done && <span style={{ fontSize: '7px', color: T.t4, marginLeft: '4px' }}>{i === 0 ? '6:10 AM' : i === 1 ? '6:35 AM' : '7:15 AM'}</span>}
                {active && <span style={{ fontSize: '7px', color: T.acc, marginLeft: '4px' }}>Driver en route -- 12 min</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniCertCompliance() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Certifications & Compliance</span>
      </div>
      {[
        { name: 'USDA Organic', id: '#ORG-2024-8471', exp: 'Dec 2026', status: 'Active', color: T.green },
        { name: 'HACCP', id: '#HAC-9274', exp: 'Mar 2027', status: 'Active', color: T.green },
        { name: 'MSC Chain of Custody', id: '#MSC-4129', exp: 'Jun 2026', status: 'Renewal', color: T.amber },
        { name: 'Halal Certified', id: '#HLC-7721', exp: 'Sep 2026', status: 'Active', color: T.green },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: `${c.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.shield} size={11} color={c.color} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{c.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{c.id} -- Exp: {c.exp}</div>
          </div>
          <Tag color={c.color} bg={`${c.color}10`}>{c.status}</Tag>
        </div>
      ))}
    </div>
  );
}

function MiniStockStatus() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.chart} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Stock Availability</span>
      </div>
      {[
        { name: 'Organic Baby Spinach', stock: 180, max: 200, unit: 'cases', status: 'In Stock', color: T.green },
        { name: 'Atlantic Salmon Fillet', stock: 24, max: 100, unit: 'boxes', status: 'Low Stock', color: T.amber },
        { name: 'Free-Range Eggs', stock: 95, max: 150, unit: 'flats', status: 'In Stock', color: T.green },
        { name: 'Aged Cheddar Wheel', stock: 0, max: 40, unit: 'wheels', status: 'Out of Stock', color: T.red, eta: 'Restocking Apr 18' },
      ].map((item, i) => (
        <div key={i} style={{ padding: '5px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none', opacity: item.stock === 0 ? 0.5 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{item.name}</span>
            <Tag color={item.color} bg={`${item.color}10`}>{item.status}</Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <div style={{ flex: 1, height: '4px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${(item.stock / item.max) * 100}%`, height: '100%', background: item.color, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '7px', fontWeight: 600, color: T.t2, width: '50px', textAlign: 'right' }}>{item.stock} {item.unit}</span>
          </div>
          {item.eta && <div style={{ fontSize: '7px', color: item.color, marginTop: '1px' }}>{item.eta}</div>}
        </div>
      ))}
    </div>
  );
}

function MiniSampleRequest() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.send} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Request Samples</span>
        <Tag color={T.green} bg={T.greenBg}>Free for qualified buyers</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[
          { name: 'Organic Baby Spinach', sample: '1 case (5 lb)', sel: true },
          { name: 'Heritage Tomatoes', sample: '1 case (10 lb)', sel: true },
          { name: 'Micro Greens Mix', sample: '6 clamshells', sel: false },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: s.sel ? T.pri : T.bg, border: `1px solid ${s.sel ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{s.sel && <I d={ic.check} size={8} color="#fff" stroke={3} />}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{s.name}</div><div style={{ fontSize: '7px', color: T.t4 }}>Sample: {s.sample}</div></div>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Submit Sample Request</button>
      </div>
    </div>
  );
}

function MiniQualityReport() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clip} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Quality Report</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>Batch #BT-2026-0412</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.greenBg, borderRadius: '5px', border: `1px solid ${T.greenBdr}`, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <I d={ic.check} size={12} color={T.green} stroke={3} />
          <div><div style={{ fontSize: '10px', fontWeight: 600, color: T.green }}>Passed -- Grade A</div><div style={{ fontSize: '7px', color: T.t3 }}>Organic Baby Spinach -- Inspected Apr 12</div></div>
        </div>
        {[
          { test: 'Visual Inspection', result: 'Pass', status: 'pass' },
          { test: 'Temperature Log', result: '35.2F', status: 'pass' },
          { test: 'Microbial Panel', result: 'Clear', status: 'pass' },
          { test: 'Pesticide Residue', result: 'ND', status: 'pass' },
          { test: 'Weight Accuracy', result: '5.04 lb', status: 'pass' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 0', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
            <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{t.test}</span>
            <span style={{ fontSize: '8px', fontWeight: 600, color: T.t1 }}>{t.result}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Download COA</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>View Full Report</button>
      </div>
    </div>
  );
}

function MiniRecurringOrder() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clock} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Standing Orders</span>
        <Tag color={T.green} bg={T.greenBg}>2 active</Tag>
      </div>
      {[
        { name: 'Weekly Produce Box', freq: 'Every Monday', items: 8, value: 420, next: 'Apr 21', status: 'Active', color: T.green },
        { name: 'Bi-weekly Protein Pack', freq: 'Every other Wed', items: 5, value: 680, next: 'Apr 23', status: 'Active', color: T.green },
        { name: 'Monthly Dry Goods', freq: '1st of month', items: 14, value: 1240, next: 'May 1', status: 'Paused', color: T.amber },
      ].map((order, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{order.name}</span>
            <Tag color={order.color} bg={`${order.color}10`}>{order.status}</Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontSize: '7px', color: T.t4 }}>{order.freq}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{order.items} items</span>
            <span style={{ fontSize: '7px', fontWeight: 600, color: T.pri }}>{fmt(order.value)}/order</span>
          </div>
          <div style={{ fontSize: '7px', color: T.t3, marginTop: '1px' }}>Next delivery: {order.next}</div>
        </div>
      ))}
    </div>
  );
}

function MiniBuyerReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.8</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Product quality', v: 96 }, { l: 'Freshness', v: 94 }, { l: 'Delivery', v: 92 }, { l: 'Accuracy', v: 95 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 95 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'TC', name: 'Tony C.', role: 'Exec Chef, Blue Harbor', text: 'Consistently the freshest spinach we source. 48-hour field-to-kitchen is a game changer.', ago: '5d' },
        { init: 'SL', name: 'Sandra L.', role: 'Procurement, Metro Fresh', text: 'Reliable weekly deliveries, great quality. The organic certifications check all our boxes.', ago: '2w' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{rv.role}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

const FS_BLOCKS: VerticalBlockDef[] = [
  { id: 'fs_product_card', family: 'catalog', label: 'Product Card', stage: 'discovery', desc: 'Wholesale product with origin, unit size, MOQ, SKU, certification badges', preview: MiniProductCard, intents: ['products', 'items', 'catalog', 'browse', 'inventory'], module: 'food_supply_catalog', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'fs_product_detail', family: 'catalog', label: 'Product Detail', stage: 'showcase', desc: 'Full spec sheet with case size, shelf life, storage temp, grade, tier pricing', preview: MiniProductDetail, intents: ['details', 'specs', 'tell me more', 'shelf life', 'storage'], module: 'food_supply_catalog', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'catalog_browser', family: 'catalog', label: 'Catalog Browser', stage: 'discovery', desc: 'Category grid with SKU counts per category', preview: MiniCatalogBrowser, intents: ['categories', 'browse', 'catalog', 'sections', 'product types'], module: 'food_supply_catalog', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'bulk_order', family: 'ordering', label: 'Bulk Order Builder', stage: 'conversion', desc: 'Multi-item quantity builder with tier pricing and subtotal', preview: MiniBulkOrderBuilder, intents: ['order', 'buy', 'purchase', 'bulk', 'quantities', 'reorder'], module: 'food_supply_ordering', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'supplier_profile', family: 'trust', label: 'Supplier Profile', stage: 'discovery', desc: 'Farm/distributor card with certifications, product categories, buyer count', preview: MiniSupplierProfile, intents: ['supplier', 'farm', 'grower', 'who supplies', 'distributor'], module: 'food_supply_trust', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'wholesale_pricing', family: 'pricing', label: 'Wholesale Pricing', stage: 'showcase', desc: 'Tiered pricing table with volume brackets and percentage savings', preview: MiniWholesalePricing, intents: ['pricing', 'wholesale', 'volume discount', 'bulk price', 'cost'], module: 'food_supply_pricing', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url', 'price', 'currency'] },
  { id: 'delivery_scheduler', family: 'logistics', label: 'Delivery Scheduler', stage: 'conversion', desc: 'Date/time window picker with cold chain toggle', preview: MiniDeliveryScheduler, intents: ['delivery', 'schedule', 'when', 'ship', 'logistics', 'cold chain'], module: 'food_supply_logistics', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'fs_order_tracker', family: 'logistics', label: 'Order Tracker', stage: 'social_proof', desc: 'Multi-step delivery pipeline with timestamps and ETA', preview: MiniOrderTracker, intents: ['track', 'where is my order', 'delivery status', 'ETA', 'shipment'], module: 'food_supply_logistics', status: 'active', engines: ['service'], reads: ['name', 'description', 'image_url'] },
  { id: 'cert_compliance', family: 'trust', label: 'Certifications', stage: 'social_proof', desc: 'Food safety cert list with issuing body, ID, expiry, status', preview: MiniCertCompliance, intents: ['certifications', 'organic', 'HACCP', 'halal', 'food safety'], module: 'food_supply_trust', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url', 'badges'] },
  { id: 'stock_status', family: 'inventory', label: 'Stock Availability', stage: 'discovery', desc: 'Real-time stock levels with fill bars and restock ETA', preview: MiniStockStatus, intents: ['stock', 'available', 'in stock', 'inventory', 'out of stock'], module: 'food_supply_inventory', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'sample_request', family: 'sales', label: 'Sample Request', stage: 'conversion', desc: 'Product sample selector with free-for-qualified-buyers badge', preview: MiniSampleRequest, intents: ['sample', 'try', 'taste', 'test', 'free sample', 'trial'], module: 'food_supply_sales', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'quality_report', family: 'quality', label: 'Quality Report', stage: 'social_proof', desc: 'Batch inspection results with pass/fail indicators, COA download', preview: MiniQualityReport, intents: ['quality', 'lab report', 'inspection', 'COA', 'test results'], module: 'food_supply_quality', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'recurring_order', family: 'ordering', label: 'Standing Orders', stage: 'social_proof', desc: 'Subscription-style order manager with frequency and next delivery', preview: MiniRecurringOrder, intents: ['recurring', 'standing order', 'subscription', 'auto order', 'weekly'], module: 'food_supply_ordering', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url'] },
  { id: 'buyer_review', family: 'social_proof', label: 'Buyer Reviews', stage: 'social_proof', desc: 'B2B reviews with supply-chain criteria bars', preview: MiniBuyerReview, intents: ['reviews', 'ratings', 'feedback', 'testimonials', 'references'], module: 'food_supply_social_proof', status: 'active', engines: ['commerce'], reads: ['name', 'description', 'image_url', 'rating', 'review_count'] },
];

const FS_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'grocery_wholesale', name: 'Grocery Wholesale', industryId: 'food_supply', blocks: ['fs_product_card', 'catalog_browser', 'bulk_order', 'delivery_scheduler', 'fs_order_tracker', 'stock_status', 'recurring_order', 'buyer_review'] },
  { id: 'organic_farm', name: 'Organic & Farm Direct', industryId: 'food_supply', blocks: ['fs_product_card', 'fs_product_detail', 'catalog_browser', 'supplier_profile', 'wholesale_pricing', 'delivery_scheduler', 'fs_order_tracker', 'stock_status', 'sample_request', 'quality_report', 'cert_compliance', 'buyer_review'] },
  { id: 'meat_seafood', name: 'Meat & Seafood Supply', industryId: 'food_supply', blocks: ['fs_product_card', 'fs_product_detail', 'supplier_profile', 'wholesale_pricing', 'delivery_scheduler', 'fs_order_tracker', 'quality_report', 'cert_compliance', 'stock_status', 'buyer_review'] },
  { id: 'specialty_imported', name: 'Specialty & Imported Foods', industryId: 'food_supply', blocks: ['fs_product_card', 'fs_product_detail', 'catalog_browser', 'wholesale_pricing', 'bulk_order', 'delivery_scheduler', 'sample_request', 'buyer_review'] },
];

const FS_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Product Catalog', color: '#15803d' },
  ordering: { label: 'Ordering', color: '#0369a1' },
  trust: { label: 'Trust & Certifications', color: '#15803d' },
  pricing: { label: 'Pricing', color: '#b45309' },
  logistics: { label: 'Delivery & Logistics', color: '#0369a1' },
  inventory: { label: 'Stock & Inventory', color: '#1d4ed8' },
  sales: { label: 'Sales & Samples', color: '#0f766e' },
  quality: { label: 'Quality Assurance', color: '#be185d' },
  social_proof: { label: 'Reviews', color: '#be185d' },
};

export const FS_CONFIG: VerticalConfig = {
  id: 'food_supply',
  industryId: 'food_supply',
  name: 'Food Supply & Distribution',
  iconName: 'ShoppingCart',
  accentColor: '#15803d',
  blocks: FS_BLOCKS,
  subVerticals: FS_SUBVERTICALS,
  families: FS_FAMILIES,
};