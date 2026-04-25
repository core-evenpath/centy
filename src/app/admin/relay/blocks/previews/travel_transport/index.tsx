// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#0c4a6e', priLt: '#0284c7', priBg: 'rgba(12,74,110,0.06)', priBg2: 'rgba(12,74,110,0.12)',
  acc: '#c2410c', accBg: 'rgba(194,65,12,0.06)', accBg2: 'rgba(194,65,12,0.14)',
  bg: '#f7f9fb',
};

function MiniTourPackage() {
  const tours = [
    { name: 'Bali Wellness Escape', dest: 'Indonesia', dur: '7 nights', price: 2490, orig: 3200, cat: 'Luxury', rating: 4.9, img: 'linear-gradient(135deg, #0c4a6e, #0284c7, #38bdf8)', badge: 'Top Rated' },
    { name: 'Swiss Alps Adventure', dest: 'Switzerland', dur: '5 nights', price: 3150, cat: 'Adventure', rating: 4.8, img: 'linear-gradient(135deg, #1e293b, #475569, #e2e8f0)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {tours.map((t, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 58, height: 54, borderRadius: 8, background: t.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.globe} size={18} color="rgba(255,255,255,0.4)" stroke={1.3} />
              {t.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.acc}>{t.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{t.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <I d={ic.map} size={7} color={T.t4} /><span style={{ fontSize: '8px', color: T.t3 }}>{t.dest}</span>
                <Tag color={t.cat === 'Luxury' ? T.acc : T.teal} bg={t.cat === 'Luxury' ? T.accBg : T.tealBg}>{t.cat}</Tag>
                <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{t.dur}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(t.price)}</span>
                  {t.orig && <span style={{ fontSize: '8px', color: T.t4, textDecoration: 'line-through' }}>{fmt(t.orig)}</span>}
                  <Stars r={t.rating} size={7} />
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

function MiniItinerary() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '60px', background: 'linear-gradient(135deg, #0c4a6e, #0284c7, #7dd3fc)', display: 'flex', alignItems: 'flex-end', padding: '8px 10px' }}>
        <div><Tag color="#fff" bg="rgba(255,255,255,0.2)">7 Nights</Tag><div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '3px' }}>Bali Wellness Escape</div></div>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {[
          { day: 'Day 1-2', title: 'Ubud -- Culture & Nature', items: 'Temple visits, rice terraces, cooking class' },
          { day: 'Day 3-4', title: 'Ubud -- Wellness', items: 'Spa retreat, yoga, meditation, waterfall trek' },
          { day: 'Day 5-6', title: 'Seminyak -- Beach', items: 'Beach club, surfing lesson, sunset dinner' },
          { day: 'Day 7', title: 'Nusa Dua -- Departure', items: 'Snorkeling, farewell lunch, airport transfer' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < 3 ? '6px' : '0' }}>
            {i < 3 && <div style={{ position: 'absolute', left: 8, top: 18, width: 1, height: 'calc(100% - 10px)', background: T.priBg2 }} />}
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: T.priBg, border: `2px solid ${T.pri}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.pri }}>{i + 1}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '7px', fontWeight: 700, color: T.pri }}>{d.day}</span><span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{d.title}</span></div>
              <div style={{ fontSize: '8px', color: T.t3, marginTop: '1px' }}>{d.items}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div><span style={{ fontSize: '9px', color: T.t4, textDecoration: 'line-through' }}>{fmt(3200)}</span><span style={{ fontSize: '14px', fontWeight: 700, color: T.pri, marginLeft: '4px' }}>{fmt(2490)}</span><span style={{ fontSize: '7px', color: T.t4 }}>/person</span></div>
        <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Book Trip</button>
      </div>
    </div>
  );
}

function MiniVisaTracker() {
  const steps = ['Documents', 'Submitted', 'Under Review', 'Decision', 'Delivered'];
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.file} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visa Application</span>
        <Tag color={T.amber} bg={T.amberBg}>In Progress</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '4px 7px', background: T.bg, borderRadius: '5px', marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Tourist Visa -- Japan</div>
          <div style={{ fontSize: '7px', color: T.t3 }}>Ref: VIS-2026-04821</div>
        </div>
        {steps.map((st, i) => {
          const done = i <= 1; const active = i === 2;
          return (
            <div key={st} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < steps.length - 1 ? '6px' : '0' }}>
              {i < steps.length - 1 && <div style={{ position: 'absolute', left: 7, top: 16, width: 1, height: 'calc(100% - 10px)', background: done ? T.green : T.bdr }} />}
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? T.green : active ? T.pri : T.bg, border: `2px solid ${done ? T.green : active ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {done ? <I d={ic.check} size={8} color="#fff" stroke={3} /> : active ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /> : null}
              </div>
              <span style={{ fontSize: '9px', fontWeight: active ? 600 : 400, color: done ? T.t3 : active ? T.pri : T.t4 }}>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniTicketBooking() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.layers} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Booking</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>NYC</div><div style={{ fontSize: '7px', color: T.t4 }}>JFK</div></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ flex: 1, height: 1, background: T.bdr }} /><I d={ic.send} size={10} color={T.pri} stroke={1.5} /><div style={{ flex: 1, height: 1, background: T.bdr }} /></div>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>TYO</div><div style={{ fontSize: '7px', color: T.t4 }}>NRT</div></div>
        </div>
        {[
          { airline: 'ANA', dep: '10:30 AM', arr: '3:15 PM +1', dur: '14h 45m', stops: 'Direct', price: 1240, sel: true },
          { airline: 'JAL', dep: '1:00 PM', arr: '4:30 PM +1', dur: '13h 30m', stops: 'Direct', price: 1380 },
          { airline: 'United', dep: '11:15 AM', arr: '6:45 PM +1', dur: '15h 30m', stops: '1 stop', price: 980 },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: f.sel ? T.priBg : 'transparent', borderRadius: f.sel ? '5px' : '0' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: T.pri, width: '28px' }}>{f.airline}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{f.dep}</span>
                <span style={{ fontSize: '6px', color: T.t4 }}>{f.dur}</span>
                <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{f.arr}</span>
              </div>
              <span style={{ fontSize: '7px', color: f.stops === 'Direct' ? T.green : T.amber }}>{f.stops}</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(f.price)}</span>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Select ANA -- {fmt(1240)}</button>
      </div>
    </div>
  );
}

function MiniRideEstimate() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.car} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Ride Options</span>
      </div>
      {[
        { type: 'Economy', pax: '4', price: 52, eta: '5 min' },
        { type: 'Premium', pax: '4', price: 78, eta: '3 min', sel: true },
        { type: 'SUV / Van', pax: '6', price: 95, eta: '8 min' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: r.sel ? T.priBg : 'transparent' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: r.sel ? `5px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: r.sel ? 600 : 400, color: T.t1 }}>{r.type}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <I d={ic.users} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{r.pax}</span>
              <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{r.eta}</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>{fmt(r.price)}</span>
        </div>
      ))}
      <div style={{ padding: '6px 10px' }}><button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Book Premium -- {fmt(78)}</button></div>
    </div>
  );
}

function MiniShipmentTracker() {
  const steps = ['Pickup', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered'];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.truck} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Shipment Tracking</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.pri, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.pri, fontWeight: 500 }}>Live</span></span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '4px 7px', background: T.priBg, borderRadius: '5px', marginBottom: '6px' }}>
          <div style={{ fontSize: '7px', color: T.t4 }}>Tracking: SHP-482194-US</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.pri }}>ETA: Apr 17, 2-5 PM</div>
        </div>
        {steps.map((st, i) => {
          const done = i <= 1; const active = i === 2;
          return (
            <div key={st} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < steps.length - 1 ? '6px' : '0' }}>
              {i < steps.length - 1 && <div style={{ position: 'absolute', left: 7, top: 16, width: 1, height: 'calc(100% - 10px)', background: done ? T.green : T.bdr }} />}
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? T.green : active ? T.pri : T.bg, border: `2px solid ${done ? T.green : active ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {done ? <I d={ic.check} size={8} color="#fff" stroke={3} /> : active ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /> : null}
              </div>
              <span style={{ fontSize: '9px', fontWeight: active ? 600 : 400, color: done ? T.t3 : active ? T.pri : T.t4 }}>{st}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniQuoteBuilder() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.dollar} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Get a Quote</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['Package', 'Freight', 'Moving', 'Courier'].map((s, i) => (
            <div key={s} style={{ flex: 1, padding: '5px 3px', borderRadius: '5px', textAlign: 'center', border: i === 0 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 0 ? T.priBg : T.surface, cursor: 'pointer' }}>
              <span style={{ fontSize: '7px', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? T.pri : T.t2 }}>{s}</span>
            </div>
          ))}
        </div>
        {[['From', 'New York, NY'], ['To', 'Los Angeles, CA'], ['Weight', '25 kg (3 boxes)']].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{k}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '3px', marginTop: '5px', marginBottom: '4px' }}>
          {[{ l: 'Standard', d: '5-7 days', p: 89 }, { l: 'Express', d: '2-3 days', p: 149, sel: true }, { l: 'Overnight', d: 'Next day', p: 249 }].map(s => (
            <div key={s.l} style={{ flex: 1, padding: '4px', borderRadius: '5px', textAlign: 'center', border: s.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: s.sel ? T.priBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '8px', fontWeight: s.sel ? 600 : 400, color: s.sel ? T.pri : T.t1 }}>{s.l}</div>
              <div style={{ fontSize: '7px', color: T.t4 }}>{s.d}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri, marginTop: '1px' }}>{fmt(s.p)}</div>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Express {fmt(149)}</button>
      </div>
    </div>
  );
}

function MiniDocumentChecklist() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clip} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Required Documents</span>
        <Tag color={T.amber} bg={T.amberBg}>3 of 5</Tag>
      </div>
      {[
        { name: 'Valid Passport (6+ months)', status: 'uploaded' },
        { name: 'Passport-size Photo (2x)', status: 'uploaded' },
        { name: 'Flight Itinerary', status: 'uploaded' },
        { name: 'Hotel / Accommodation Proof', status: 'pending' },
        { name: 'Bank Statement (3 months)', status: 'pending' },
      ].map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: d.status === 'uploaded' ? T.green : T.bg, border: `1px solid ${d.status === 'uploaded' ? T.green : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {d.status === 'uploaded' && <I d={ic.check} size={9} color="#fff" stroke={3} />}
          </div>
          <span style={{ fontSize: '9px', fontWeight: 500, color: T.t1, flex: 1 }}>{d.name}</span>
          {d.status === 'pending' && <button style={{ fontSize: '7px', fontWeight: 600, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}>Upload</button>}
        </div>
      ))}
    </div>
  );
}

function MiniScheduleGrid() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.cal} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Schedule & Timetable</span>
      </div>
      {[
        { route: 'NYC - Boston', type: 'Bus', dep: '7:00 AM', arr: '11:15 AM', dur: '4h 15m', price: 35, seats: 12, op: 'GreyLine' },
        { route: 'NYC - Boston', type: 'Train', dep: '8:30 AM', arr: '12:00 PM', dur: '3h 30m', price: 89, seats: 28, op: 'Amtrak', sel: true },
        { route: 'NYC - Boston', type: 'Bus', dep: '10:00 AM', arr: '2:30 PM', dur: '4h 30m', price: 29, seats: 4, op: 'FlixBus' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: s.sel ? T.priBg : 'transparent' }}>
          <Tag color={s.type === 'Train' ? T.pri : T.teal} bg={s.type === 'Train' ? T.priBg : T.tealBg}>{s.type}</Tag>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{s.dep}</span>
              <span style={{ fontSize: '6px', color: T.t4 }}>{s.dur}</span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{s.arr}</span>
            </div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{s.op} -- {s.seats} seats left</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(s.price)}</span>
        </div>
      ))}
    </div>
  );
}

function MiniTravelInsurance() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Travel Protection</span>
      </div>
      {[
        { name: 'Basic', price: 45, cover: 'Medical + Trip cancellation', limit: 'Up to $50K' },
        { name: 'Comprehensive', price: 89, cover: 'Medical + Cancellation + Baggage + Delay', limit: 'Up to $150K', sel: true, pop: true },
        { name: 'Premium All-Risk', price: 149, cover: 'All-inclusive + Adventure + Evacuation', limit: 'Up to $500K' },
      ].map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: p.sel ? T.priBg : 'transparent' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: p.sel ? `5px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: p.sel ? 600 : 400, color: T.t1 }}>{p.name}</span>
              {p.pop && <Tag color="#fff" bg={T.pri}>Recommended</Tag>}
            </div>
            <div style={{ fontSize: '7px', color: T.t3, marginTop: '1px' }}>{p.cover}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{p.limit}</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</span>
        </div>
      ))}
    </div>
  );
}

function MiniTransferBooking() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.car} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Airport Transfer</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[
          { type: 'Sedan', pax: '3', price: 65 },
          { type: 'Executive', pax: '3', price: 95, sel: true },
          { type: 'Luxury Van', pax: '7', price: 140 },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: t.sel ? `5px solid ${T.acc}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '9px', fontWeight: t.sel ? 600 : 400, color: T.t1 }}>{t.type}</span>
              <span style={{ fontSize: '7px', color: T.t4, marginLeft: '4px' }}>Max {t.pax} pax</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: T.acc }}>{fmt(t.price)}</span>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Book Executive -- {fmt(95)}</button>
      </div>
    </div>
  );
}

function MiniTravelerReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.8</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Trip planning', v: 96 }, { l: 'Value', v: 92 }, { l: 'Guide quality', v: 94 }, { l: 'Accommodation', v: 90 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 94 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'ED', name: 'Elena D.', text: 'The Bali itinerary was perfectly paced. Our guide was exceptional.', ago: '1w', trip: 'Bali Escape' },
        { init: 'MK', name: 'Marco K.', text: 'Great trip overall. Flights and hotels were seamless.', ago: '3w', trip: 'Bali Escape' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <Tag color={T.pri} bg={T.priBg}>{rv.trip}</Tag>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{rv.ago}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

function MiniDestinationCard() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
      {[
        { name: 'Bali, Indonesia', season: 'Apr-Oct', from: 1890, bg: 'linear-gradient(135deg, #0c4a6e, #38bdf8)' },
        { name: 'Swiss Alps', season: 'Jun-Sep', from: 2800, bg: 'linear-gradient(135deg, #1e293b, #cbd5e1)' },
        { name: 'Kyoto, Japan', season: 'Mar-May', from: 2200, bg: 'linear-gradient(135deg, #7f1d1d, #fca5a5)' },
        { name: 'Patagonia', season: 'Nov-Mar', from: 3400, bg: 'linear-gradient(135deg, #064e3b, #6ee7b7)' },
      ].map((d, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ height: 36, background: d.bg, display: 'flex', alignItems: 'flex-end', padding: '3px 5px' }}>
            <span style={{ fontSize: '6px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{d.season}</span>
          </div>
          <div style={{ padding: '4px 6px' }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{d.name}</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: T.pri, marginTop: '2px' }}>From {fmt(d.from)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMovingEstimate() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.home} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Moving Estimate</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {[['From', 'Brooklyn, NY'], ['To', 'Austin, TX'], ['Distance', '~1,750 miles'], ['Size', '2-bedroom apartment']].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{k}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{v}</span>
          </div>
        ))}
        {[{ l: 'Full packing service', p: '+$450', sel: true }, { l: 'Furniture disassembly', p: '+$200', sel: true }, { l: 'Storage (30 days)', p: '+$350', sel: false }].map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: a.sel ? T.pri : T.bg, border: `1px solid ${a.sel ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{a.sel && <I d={ic.check} size={8} color="#fff" stroke={3} />}</div>
            <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{a.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.pri }}>{a.p}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Estimated total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(3850)}</span>
        </div>
      </div>
    </div>
  );
}

const TL_BLOCKS: VerticalBlockDef[] = [
  { id: 'tour_package', family: 'catalog', label: 'Tour / Trip Package', stage: 'discovery', desc: 'Travel package with destination, duration, category, pricing, ratings', preview: MiniTourPackage, intents: ['tours', 'trips', 'packages', 'destinations', 'vacation'], module: 'travel_transport_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'tl_itinerary', family: 'catalog', label: 'Day-by-Day Itinerary', stage: 'showcase', desc: 'Visual timeline with day ranges, locations, activities, total pricing', preview: MiniItinerary, intents: ['itinerary', 'day by day', 'plan', 'schedule', 'activities'], module: 'travel_transport_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'visa_tracker', family: 'documents', label: 'Visa Application Tracker', stage: 'social_proof', desc: 'Multi-step application pipeline with ref number and ETA', preview: MiniVisaTracker, intents: ['visa', 'application', 'status', 'immigration', 'passport'], module: 'travel_transport_documents', status: 'active', reads: ['name', 'description', 'image_url'] },
  { id: 'ticket_booking', family: 'booking', label: 'Ticket / Flight Booking', stage: 'conversion', desc: 'Route header, flight/bus options with airline, times, stops, price comparison', preview: MiniTicketBooking, intents: ['flights', 'tickets', 'book', 'fare', 'airline', 'bus', 'train'], module: 'travel_transport_booking', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url', 'date', 'time', 'service_name'] },
  { id: 'ride_estimate', family: 'rides', label: 'Ride Estimate', stage: 'showcase', desc: 'Vehicle tier radio with ETA, capacity, per-ride pricing', preview: MiniRideEstimate, intents: ['ride', 'taxi', 'cab', 'transfer', 'pickup'], module: 'travel_transport_rides', status: 'active', reads: ['name', 'description', 'image_url'] },
  { id: 'tl_shipment_tracker', family: 'logistics', label: 'Shipment Tracker', stage: 'social_proof', desc: '5-step delivery pipeline with live timestamps and ETA', preview: MiniShipmentTracker, intents: ['track', 'shipment', 'package', 'delivery status', 'tracking'], module: 'travel_transport_logistics', status: 'active', reads: ['name', 'description', 'image_url'] },
  { id: 'tl_quote_builder', family: 'logistics', label: 'Quote / Rate Calculator', stage: 'conversion', desc: 'Service type selector, route, weight, speed tiers with pricing', preview: MiniQuoteBuilder, intents: ['quote', 'rate', 'cost', 'shipping rate', 'estimate'], module: 'travel_transport_logistics', status: 'active', reads: ['name', 'description', 'image_url'] },
  { id: 'tl_document_checklist', family: 'documents', label: 'Document Checklist', stage: 'conversion', desc: 'Required document list with uploaded/pending states and upload action', preview: MiniDocumentChecklist, intents: ['documents', 'upload', 'requirements', 'paperwork'], module: 'travel_transport_documents', status: 'active', reads: ['name', 'description', 'image_url'] },
  // engines: ['booking', 'info'] — ticketed-transport partners use it as booking (seat availability + pricing + purchase); public_transport partners use it as pure info (read-only timetable). Same UI genuinely serves both.
  { id: 'tl_schedule_grid', family: 'timetable', label: 'Schedule / Timetable', stage: 'showcase', desc: 'Multi-operator schedule with departure/arrival, seat availability, pricing', preview: MiniScheduleGrid, intents: ['schedule', 'timetable', 'departures', 'next bus', 'next train'], module: 'travel_transport_timetable', status: 'active', engines: ['booking', 'info'], reads: ['name', 'description', 'image_url'] },
  { id: 'travel_insurance', family: 'protection', label: 'Travel Insurance', stage: 'showcase', desc: 'Coverage tier radio with details, limits, recommended badge', preview: MiniTravelInsurance, intents: ['insurance', 'coverage', 'protection', 'travel insurance'], module: 'travel_transport_protection', status: 'active', reads: ['name', 'description', 'image_url'] },
  { id: 'transfer_booking', family: 'booking', label: 'Airport Transfer', stage: 'conversion', desc: 'Flight context, vehicle tier selector, meet-and-greet badges', preview: MiniTransferBooking, intents: ['airport transfer', 'pickup', 'chauffeur', 'meet and greet'], module: 'travel_transport_booking', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url', 'date', 'time', 'service_name'] },
  { id: 'traveler_review', family: 'social_proof', label: 'Traveler Reviews', stage: 'social_proof', desc: 'Travel-specific criteria bars, trip-tagged reviews', preview: MiniTravelerReview, intents: ['reviews', 'ratings', 'testimonials', 'feedback'], module: 'travel_transport_social_proof', status: 'active', reads: ['name', 'description', 'image_url', 'rating', 'review_count'] },
  { id: 'destination_card', family: 'catalog', label: 'Destination Card', stage: 'discovery', desc: 'Destination spotlight with best season, starting price, photo grid', preview: MiniDestinationCard, intents: ['destinations', 'where to go', 'suggest', 'recommend', 'popular'], module: 'travel_transport_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'moving_estimate', family: 'logistics', label: 'Moving Estimate', stage: 'showcase', desc: 'Room/item inventory, distance, packing add-ons, total estimate', preview: MiniMovingEstimate, intents: ['moving', 'relocation', 'movers', 'packing', 'long distance'], module: 'travel_transport_logistics', status: 'active', reads: ['name', 'description', 'image_url'] },
];

const TL_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'travel_agency', name: 'Travel Agencies & Tours', industryId: 'travel_transport', blocks: ['tour_package', 'tl_itinerary', 'destination_card', 'ticket_booking', 'travel_insurance', 'tl_document_checklist', 'traveler_review', 'transfer_booking'] },
  { id: 'visa_immigration', name: 'Visa & Immigration', industryId: 'travel_transport', blocks: ['visa_tracker', 'tl_document_checklist', 'traveler_review'] },
  { id: 'ticketing_services', name: 'Ticketing & Booking', industryId: 'travel_transport', blocks: ['ticket_booking', 'tl_schedule_grid', 'travel_insurance', 'traveler_review'] },
  { id: 'taxi_ride', name: 'Taxi & Ride Services', industryId: 'travel_transport', blocks: ['ride_estimate', 'traveler_review'] },
  { id: 'public_transport', name: 'Public & Private Transport', industryId: 'travel_transport', blocks: ['tl_schedule_grid', 'ticket_booking', 'ride_estimate', 'traveler_review'] },
  { id: 'logistics_courier', name: 'Logistics & Courier', industryId: 'travel_transport', blocks: ['tl_quote_builder', 'tl_shipment_tracker', 'traveler_review'] },
  { id: 'moving_relocation', name: 'Moving & Relocation', industryId: 'travel_transport', blocks: ['moving_estimate', 'tl_quote_builder', 'tl_shipment_tracker', 'tl_document_checklist', 'traveler_review'] },
  { id: 'airport_chauffeur', name: 'Airport Transfers', industryId: 'travel_transport', blocks: ['transfer_booking', 'ride_estimate', 'traveler_review'] },
  { id: 'luxury_adventure', name: 'Luxury & Adventure Travel', industryId: 'travel_transport', blocks: ['tour_package', 'tl_itinerary', 'destination_card', 'ticket_booking', 'transfer_booking', 'travel_insurance', 'traveler_review'] },
];

const TL_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Trips & Destinations', color: '#0c4a6e' },
  documents: { label: 'Visa & Documents', color: '#b45309' },
  booking: { label: 'Booking & Tickets', color: '#c2410c' },
  rides: { label: 'Rides & Transfers', color: '#0f766e' },
  logistics: { label: 'Logistics & Shipping', color: '#1d4ed8' },
  timetable: { label: 'Schedules', color: '#0c4a6e' },
  protection: { label: 'Insurance & Protection', color: '#15803d' },
  social_proof: { label: 'Reviews', color: '#be185d' },
};

export const TL_CONFIG: VerticalConfig = {
  id: 'travel_transport',
  industryId: 'travel_transport',
  name: 'Travel, Transport & Logistics',
  iconName: 'Globe',
  accentColor: '#0c4a6e',
  blocks: TL_BLOCKS,
  subVerticals: TL_SUBVERTICALS,
  families: TL_FAMILIES,
};