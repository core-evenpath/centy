// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#1e3a8a', priLt: '#3b82f6', priBg: 'rgba(30,58,138,0.06)', priBg2: 'rgba(30,58,138,0.12)',
  acc: '#ea580c', accBg: 'rgba(234,88,12,0.06)', accBg2: 'rgba(234,88,12,0.14)',
  bg: '#f7f8fa',
};

function MiniVehicleCard() {
  const vehicles = [
    { name: '2026 Toyota Camry XSE', type: 'Sedan', fuel: 'Hybrid', price: 34250, miles: 'New', mpg: '52 mpg', img: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)', badge: 'Just Arrived' },
    { name: '2024 BMW X3 xDrive30i', type: 'SUV', fuel: 'Gas', price: 38900, miles: '12,400 mi', mpg: '29 mpg', img: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #94a3b8 100%)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {vehicles.map((v, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 58, height: 50, borderRadius: 8, background: v.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.car} size={20} color="rgba(255,255,255,0.4)" stroke={1.3} />
              {v.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.acc}>{v.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{v.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Tag color={T.pri} bg={T.priBg}>{v.type}</Tag>
                <Tag color={v.fuel === 'Hybrid' ? T.green : T.t2} bg={v.fuel === 'Hybrid' ? T.greenBg : T.bg}>{v.fuel}</Tag>
                <span style={{ fontSize: '7px', color: T.t4 }}>{v.miles}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(v.price)}</span>
                  <span style={{ fontSize: '7px', color: T.t4 }}>{v.mpg}</span>
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>View</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniVehicleDetail() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '64px', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)', display: 'flex', alignItems: 'flex-end', padding: '8px 10px' }}>
        <div><Tag color="#fff" bg="rgba(255,255,255,0.2)">Certified Pre-Owned</Tag><div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '3px' }}>2024 BMW X3 xDrive30i</div></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '5px' }}>
          {[{ v: '12.4K', l: 'Miles' }, { v: '2.0T', l: 'Engine' }, { v: 'AWD', l: 'Drive' }, { v: '29', l: 'MPG' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '5px' }}>
          {['Panoramic Roof', 'Nav System', 'Heated Seats', '360 Camera', 'Adaptive Cruise'].map(f => (
            <span key={f} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{f}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(38900)}</span>
          <span style={{ fontSize: '8px', color: T.t4 }}>Est. {fmt(589)}/mo</span>
          <span style={{ fontSize: '7px', fontWeight: 600, color: T.green, background: T.greenBg, padding: '1px 4px', borderRadius: '3px', marginLeft: 'auto' }}>CARFAX Clean</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          <button style={{ flex: 1, padding: '7px', borderRadius: '6px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '9px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Test Drive</button>
          <button style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', background: T.pri, fontSize: '9px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Get Quote</button>
        </div>
      </div>
    </div>
  );
}

function MiniServiceMenu() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.tool} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Service Menu</span>
      </div>
      {[
        { name: 'Full Synthetic Oil Change', dur: '45 min', price: 89, cat: 'Maintenance', color: T.green },
        { name: 'Brake Pad Replacement', dur: '1.5 hr', price: 249, cat: 'Brakes', color: T.amber },
        { name: 'Tire Rotation & Balance', dur: '30 min', price: 49, cat: 'Tires', color: T.pri },
        { name: 'A/C System Recharge', dur: '1 hr', price: 179, cat: 'Climate', color: T.teal },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.tool} size={12} color={s.color} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{s.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <Tag color={s.color} bg={`${s.color}10`}>{s.cat}</Tag>
              <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{s.dur}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(s.price)}</div>
            <button style={{ fontSize: '6px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', marginTop: '1px' }}>Book</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniServiceScheduler() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule Service</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>2024 BMW X3 -- Oil Change + Tire Rotation</div>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ d: 'Mon', n: '14' }, { d: 'Tue', n: '15', sel: true }, { d: 'Wed', n: '16' }, { d: 'Thu', n: '17' }].map(day => (
            <div key={day.n} style={{ flex: 1, padding: '5px 2px', borderRadius: '6px', textAlign: 'center', border: day.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: day.sel ? T.priBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '7px', color: T.t4 }}>{day.d}</div>
              <div style={{ fontSize: '11px', fontWeight: day.sel ? 700 : 500, color: day.sel ? T.pri : T.t1 }}>{day.n}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Drop-off', sel: true }, { l: 'Wait here' }, { l: 'Pickup' }].map(o => (
            <span key={o.l} style={{ flex: 1, textAlign: 'center', padding: '4px', borderRadius: '4px', fontSize: '8px', border: o.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: o.sel ? T.priBg : T.surface, color: o.sel ? T.pri : T.t2, fontWeight: o.sel ? 600 : 400, cursor: 'pointer' }}>{o.l}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Tue 9 AM (Drop-off)</button>
      </div>
    </div>
  );
}

function MiniPartFinder() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.search} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Parts & Accessories</span>
      </div>
      {[
        { name: 'Bosch Brake Pads -- Front', fit: 'BMW X3 2020-2025', price: 64, oe: true, stock: 'In Stock' },
        { name: 'Mobil 1 Full Synthetic 5W-30', fit: 'Universal -- 5 Qt', price: 38, oe: false, stock: 'In Stock' },
        { name: 'Michelin Pilot Sport 4S', fit: '245/40R18 -- BMW X3', price: 289, oe: false, stock: '2-day ship' },
      ].map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.bag} size={12} color="rgba(255,255,255,0.5)" stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{p.name}</span>
              {p.oe && <Tag color={T.green} bg={T.greenBg}>OE Spec</Tag>}
            </div>
            <div style={{ fontSize: '7px', color: T.t4, marginTop: '1px' }}>{p.fit}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</div>
            <span style={{ fontSize: '6px', color: p.stock === 'In Stock' ? T.green : T.amber }}>{p.stock}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniFinanceCalc() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.dollar} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finance Calculator</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[{ l: 'Vehicle', v: fmt(38900) }, { l: 'Down payment', v: fmt(5000) }, { l: 'Term', v: '60 months' }, { l: 'APR', v: '4.9%' }].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{r.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 600, color: T.t1 }}>{r.v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Est. monthly</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.acc }}>{fmt(589)}/mo</span>
        </div>
        <button style={{ width: '100%', padding: '7px', borderRadius: '6px', border: 'none', background: T.acc, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Apply for Financing</button>
      </div>
    </div>
  );
}

function MiniTradeIn() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.repeat} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Trade-In Estimate</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.priBg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>2021 Honda Civic EX -- 34,200 mi</div>
        </div>
        {[{ l: 'Condition', v: 'Good' }, { l: 'Title', v: 'Clean' }, { l: 'KBB Range', v: '$18,200 - $20,400' }].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{r.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{r.v}</span>
          </div>
        ))}
        <div style={{ marginTop: '5px', padding: '6px 8px', background: T.greenBg, borderRadius: '6px', border: `1px solid ${T.greenBdr}`, textAlign: 'center' }}>
          <div style={{ fontSize: '8px', color: T.green }}>Our Offer</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: T.green }}>{fmt(19500)}</div>
          <div style={{ fontSize: '7px', color: T.t4 }}>Valid for 7 days</div>
        </div>
        <button style={{ width: '100%', padding: '7px', borderRadius: '6px', border: 'none', background: T.pri, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Apply to Purchase</button>
      </div>
    </div>
  );
}

function MiniServiceTracker() {
  const steps = ['Checked In', 'Diagnostics', 'In Progress', 'QC', 'Ready'];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.tool} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Service Status</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.pri, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.pri, fontWeight: 500 }}>Live</span></span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '4px 7px', background: T.priBg, borderRadius: '5px', marginBottom: '6px' }}>
          <div style={{ fontSize: '7px', color: T.t4 }}>RO #SRV-4821 -- BMW X3</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.pri }}>Est. ready by 2:30 PM</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {steps.map((st, i) => {
            const done = i <= 1; const active = i === 2;
            return (
              <div key={st} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 7, right: '50%', width: '100%', height: 2, background: done ? T.green : T.bdr }} />}
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? T.green : active ? T.pri : T.surface, border: `2px solid ${done ? T.green : active ? T.pri : T.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  {done ? <I d={ic.check} size={8} color="#fff" stroke={3} /> : active ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /> : null}
                </div>
                <span style={{ fontSize: '5px', color: active ? T.t1 : T.t4, fontWeight: active ? 600 : 400, textAlign: 'center', marginTop: '2px' }}>{st}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniTestDrive() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.key} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Test Drive</span>
        <Tag color={T.green} bg={T.greenBg}>No obligation</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>2024 BMW X3 xDrive30i</div>
          <div style={{ fontSize: '7px', color: T.t3 }}>Alpine White -- M Sport -- Stock #BX-4821</div>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ d: 'Sat', n: '19', sel: true }, { d: 'Sun', n: '20' }, { d: 'Mon', n: '21' }].map(day => (
            <div key={day.n} style={{ flex: 1, padding: '5px 2px', borderRadius: '5px', textAlign: 'center', border: day.sel ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: day.sel ? T.accBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '7px', color: T.t4 }}>{day.d}</div>
              <div style={{ fontSize: '11px', fontWeight: day.sel ? 600 : 400, color: day.sel ? T.acc : T.t1 }}>{day.n}</div>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Book Test Drive -- Sat 1 PM</button>
      </div>
    </div>
  );
}

function MiniRentalBuilder() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.key} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Rental Builder</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['Daily', 'Weekly', 'Monthly', '12-mo Lease'].map((d, i) => (
            <span key={d} style={{ flex: 1, textAlign: 'center', padding: '4px 2px', borderRadius: '4px', fontSize: '7px', border: i === 1 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 1 ? T.priBg : T.surface, color: i === 1 ? T.pri : T.t2, fontWeight: i === 1 ? 600 : 400, cursor: 'pointer' }}>{d}</span>
          ))}
        </div>
        {[{ l: 'Full insurance', p: '+$18/day', sel: true }, { l: 'GPS navigation', p: '+$5/day', sel: false }, { l: 'Extra driver', p: '+$10/day', sel: true }].map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: a.sel ? T.pri : T.bg, border: `1px solid ${a.sel ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{a.sel && <I d={ic.check} size={8} color="#fff" stroke={3} />}</div>
            <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{a.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.pri }}>{a.p}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: T.t1 }}>7 days total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(546)}</span>
        </div>
      </div>
    </div>
  );
}

function MiniWarranty() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Warranty & Coverage</span>
      </div>
      {[
        { name: 'Manufacturer Warranty', coverage: '4yr / 50K mi', status: 'Active', color: T.green },
        { name: 'CPO Extended -- Powertrain', coverage: '+2yr / 100K mi', status: 'Active', color: T.green },
        { name: 'Tire & Wheel Protection', coverage: '3yr / Unlimited', status: 'Expiring', color: T.amber },
      ].map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: `${w.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.shield} size={11} color={w.color} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{w.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{w.coverage}</div>
          </div>
          <Tag color={w.color} bg={`${w.color}10`}>{w.status}</Tag>
        </div>
      ))}
    </div>
  );
}

function MiniFleetDashboard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.truck} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Fleet Overview</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>12 vehicles</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', padding: '6px 10px' }}>
        {[{ v: 8, l: 'Active', color: T.green }, { v: 2, l: 'Service', color: T.amber }, { v: 1, l: 'Reserved', color: T.pri }, { v: 1, l: 'Idle', color: T.t4 }].map(s => (
          <div key={s.l} style={{ padding: '4px', background: `${s.color}10`, borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '6px', color: s.color }}>{s.l}</div>
          </div>
        ))}
      </div>
      {[
        { plate: 'FL-001', model: 'Transit Van', status: 'Active', color: T.green },
        { plate: 'FL-005', model: 'Sprinter', status: 'In Service', color: T.amber },
      ].map((v, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '8px', fontWeight: 700, color: T.pri, fontFamily: 'monospace', width: '32px' }}>{v.plate}</span>
          <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{v.model}</span>
          <Tag color={v.color} bg={`${v.color}10`}>{v.status}</Tag>
        </div>
      ))}
    </div>
  );
}

function MiniAutoReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.7</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Vehicle quality', v: 94 }, { l: 'Sales experience', v: 92 }, { l: 'Service dept.', v: 88 }, { l: 'Transparency', v: 90 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '58px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 90 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'RM', name: 'Robert M.', text: 'Fair trade-in value, no pressure, transparent pricing.', ago: '1w', type: 'Purchase' },
        { init: 'JT', name: 'Julie T.', text: 'Oil change was quick and fairly priced. No hard upsell.', ago: '3w', type: 'Service' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <Tag color={rv.type === 'Purchase' ? T.acc : T.teal} bg={rv.type === 'Purchase' ? T.accBg : T.tealBg}>{rv.type}</Tag>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{rv.ago}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

function MiniEVCharger() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.zap} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>EV Charging</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.green, fontWeight: 500 }}>3 of 4 available</span></span>
      </div>
      {[
        { id: 'A1', type: 'DC Fast (CCS)', kw: '150 kW', rate: '$0.35/kWh', status: 'Available', color: T.green },
        { id: 'A2', type: 'DC Fast (CCS)', kw: '150 kW', rate: '$0.35/kWh', status: 'In Use', color: T.amber },
        { id: 'B1', type: 'Level 2 (J1772)', kw: '19 kW', rate: '$0.18/kWh', status: 'Available', color: T.green },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: `${c.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <I d={ic.zap} size={11} color={c.color} stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.pri, fontFamily: 'monospace' }}>{c.id}</span>
              <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{c.type}</span>
            </div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{c.kw} -- {c.rate}</div>
          </div>
          <Tag color={c.color} bg={`${c.color}10`}>{c.status}</Tag>
        </div>
      ))}
    </div>
  );
}

const AUTO_BLOCKS: VerticalBlockDef[] = [
  { id: 'vehicle_card', family: 'catalog', label: 'Vehicle Card', stage: 'discovery', desc: 'Vehicle listing with make/model/year, mileage, fuel type, MPG, pricing', preview: MiniVehicleCard, intents: ['cars', 'vehicles', 'browse', 'inventory', 'models'], module: 'automotive_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'vehicle_detail', family: 'catalog', label: 'Vehicle Detail', stage: 'showcase', desc: 'Full spec sheet with engine, drivetrain, features, CARFAX, monthly estimate', preview: MiniVehicleDetail, intents: ['details', 'specs', 'features', 'about this car'], module: 'automotive_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'auto_service_menu', family: 'service', label: 'Service Menu', stage: 'discovery', desc: 'Maintenance and repair offerings with labor time, parts, category icons', preview: MiniServiceMenu, intents: ['service', 'repair', 'maintenance', 'oil change', 'brakes', 'tires'], module: 'automotive_service', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'auto_service_scheduler', family: 'booking', label: 'Service Scheduler', stage: 'conversion', desc: 'Vehicle + service context, date strip, time grid, drop-off preference', preview: MiniServiceScheduler, intents: ['book service', 'schedule', 'appointment', 'drop off'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'part_finder', family: 'parts', label: 'Part Finder', stage: 'discovery', desc: 'Auto parts with fitment compatibility, OE spec badge, stock status', preview: MiniPartFinder, intents: ['parts', 'accessories', 'tires', 'brake pads', 'oil', 'battery'], module: 'automotive_parts', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'finance_calc', family: 'pricing', label: 'Finance Calculator', stage: 'showcase', desc: 'Loan/lease/cash calculator with down payment, term, APR, monthly estimate', preview: MiniFinanceCalc, intents: ['finance', 'monthly payment', 'lease', 'loan', 'APR', 'afford'], module: null, status: 'active', noModuleReason: 'ai_generated' },
  { id: 'trade_in', family: 'valuation', label: 'Trade-In Estimator', stage: 'conversion', desc: 'Vehicle valuation with KBB range, dealer offer, validity period', preview: MiniTradeIn, intents: ['trade in', 'my car value', 'sell my car', 'exchange'], module: null, status: 'active', noModuleReason: 'ai_generated' },
  { id: 'auto_service_tracker', family: 'operations', label: 'Service Tracker', stage: 'social_proof', desc: 'Live 5-step pipeline with ETA and technician notes', preview: MiniServiceTracker, intents: ['status', 'where is my car', 'service update', 'ready'], module: null, status: 'active', noModuleReason: 'ai_generated' },
  { id: 'test_drive', family: 'booking', label: 'Test Drive Booking', stage: 'conversion', desc: 'Vehicle context with stock #, date/time selector, no-obligation badge', preview: MiniTestDrive, intents: ['test drive', 'try', 'drive', 'see in person'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'rental_builder', family: 'pricing', label: 'Rental / Lease Builder', stage: 'showcase', desc: 'Duration selector, insurance add-ons with pricing, total', preview: MiniRentalBuilder, intents: ['rent', 'rental', 'lease', 'hire', 'weekly rate'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'warranty', family: 'trust', label: 'Warranty & Coverage', stage: 'showcase', desc: 'Active warranty plans with coverage term, mileage limit, status badges', preview: MiniWarranty, intents: ['warranty', 'coverage', 'protection', 'extended warranty'], module: null, status: 'active', noModuleReason: 'design_only' },
  { id: 'fleet_dashboard', family: 'fleet', label: 'Fleet Dashboard', stage: 'social_proof', desc: 'Multi-vehicle status grid with per-vehicle plate/model/driver/status', preview: MiniFleetDashboard, intents: ['fleet', 'vehicles', 'all vehicles', 'fleet status'], module: null, status: 'active', noModuleReason: 'ai_generated' },
  { id: 'auto_review', family: 'social_proof', label: 'Customer Reviews', stage: 'social_proof', desc: 'Auto-specific criteria bars, purchase/service-tagged reviews', preview: MiniAutoReview, intents: ['reviews', 'ratings', 'testimonials', 'feedback'], module: null, status: 'active', noModuleReason: 'design_only' },
  { id: 'ev_charger', family: 'ev', label: 'EV Charging Status', stage: 'discovery', desc: 'Charger availability with station types, power levels, real-time status', preview: MiniEVCharger, intents: ['charging', 'EV', 'electric', 'charger', 'plug in', 'kWh'], module: null, status: 'active', noModuleReason: 'ai_generated' },
];

const AUTO_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'new_vehicle_sales', name: 'New Vehicle Sales', industryId: 'automotive', blocks: ['vehicle_card', 'vehicle_detail', 'finance_calc', 'test_drive', 'trade_in', 'warranty', 'auto_review'] },
  { id: 'used_vehicle_sales', name: 'Used Vehicle Sales', industryId: 'automotive', blocks: ['vehicle_card', 'vehicle_detail', 'finance_calc', 'test_drive', 'trade_in', 'warranty', 'auto_review'] },
  { id: 'vehicle_service', name: 'Vehicle Service & Repair', industryId: 'automotive', blocks: ['auto_service_menu', 'auto_service_scheduler', 'auto_service_tracker', 'part_finder', 'warranty', 'auto_review'] },
  { id: 'car_wash_detail', name: 'Car Wash & Detailing', industryId: 'automotive', blocks: ['auto_service_menu', 'auto_service_scheduler', 'auto_review'] },
  { id: 'auto_parts', name: 'Auto Parts & Accessories', industryId: 'automotive', blocks: ['part_finder', 'vehicle_card', 'auto_review'] },
  { id: 'tires_batteries', name: 'Tires & Batteries', industryId: 'automotive', blocks: ['part_finder', 'auto_service_menu', 'auto_service_scheduler', 'warranty', 'auto_review'] },
  { id: 'vehicle_rental', name: 'Vehicle Rental & Leasing', industryId: 'automotive', blocks: ['vehicle_card', 'vehicle_detail', 'rental_builder', 'auto_service_scheduler', 'warranty', 'fleet_dashboard', 'auto_review'] },
  { id: 'ev_infrastructure', name: 'EV & Charging', industryId: 'automotive', blocks: ['ev_charger', 'vehicle_card', 'part_finder', 'auto_review'] },
  { id: 'fleet_mobility', name: 'Fleet & Mobility', industryId: 'automotive', blocks: ['fleet_dashboard', 'vehicle_card', 'auto_service_menu', 'auto_service_scheduler', 'auto_service_tracker', 'warranty', 'auto_review'] },
];

const AUTO_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Vehicle Catalog', color: '#1e3a8a' },
  service: { label: 'Service & Repair', color: '#b45309' },
  booking: { label: 'Appointments', color: '#15803d' },
  parts: { label: 'Parts & Accessories', color: '#0f766e' },
  pricing: { label: 'Finance & Pricing', color: '#ea580c' },
  valuation: { label: 'Trade-In & Valuation', color: '#15803d' },
  operations: { label: 'Service Tracking', color: '#1d4ed8' },
  trust: { label: 'Warranty & Trust', color: '#1e3a8a' },
  fleet: { label: 'Fleet Management', color: '#0f766e' },
  social_proof: { label: 'Reviews', color: '#be185d' },
  ev: { label: 'EV & Charging', color: '#15803d' },
};

export const AUTO_CONFIG: VerticalConfig = {
  id: 'automotive',
  industryId: 'automotive',
  name: 'Automotive & Mobility',
  iconName: 'Car',
  accentColor: '#1e3a8a',
  blocks: AUTO_BLOCKS,
  subVerticals: AUTO_SUBVERTICALS,
  families: AUTO_FAMILIES,
};