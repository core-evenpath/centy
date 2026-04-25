// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#1e3a5f', priLt: '#2a5080', priBg: 'rgba(30,58,95,0.06)', priBg2: 'rgba(30,58,95,0.12)',
  acc: '#b8860b', accBg: 'rgba(184,134,11,0.06)', accBg2: 'rgba(184,134,11,0.14)',
  bg: '#f5f3ef',
};

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: color || T.pri, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{children}</span>;
}

function MiniRoomCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {[
        { name: 'Deluxe Ocean View', bed: 'King -- 42m2', rate: 289, orig: 340, occ: 2, amen: ['Ocean', 'AC', 'WiFi', 'Breakfast'], badge: 'Most Popular', img: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 50%, #60a5fa 100%)' },
        { name: 'Garden Suite', bed: 'Twin -- 38m2', rate: 219, occ: 2, amen: ['Garden', 'AC', 'WiFi'], img: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)' },
      ].map((r, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, background: r.img, flexShrink: 0, position: 'relative' }}>
              {r.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Badge color={T.acc}>{r.badge}</Badge></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>{r.name}</div>
              <div style={{ fontSize: '9px', color: T.t4, marginTop: '1px' }}>{r.bed} -- Max {r.occ} guests</div>
              <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
                {r.amen.map((a, j) => <span key={j} style={{ fontSize: '7px', padding: '1px 4px', borderRadius: '3px', background: T.bg, color: T.t3 }}>{a}</span>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(r.rate)}</span>
                  {r.orig && <span style={{ fontSize: '9px', color: T.t4, textDecoration: 'line-through' }}>{fmt(r.orig)}</span>}
                  <span style={{ fontSize: '8px', color: T.t4 }}>/night</span>
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer' }}>Book</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniRoomDetail() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '70px', background: 'linear-gradient(135deg, #bfdbfe, #60a5fa)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 5, left: 5 }}><Badge color={T.acc}>Best Rate</Badge></div>
        <div style={{ position: 'absolute', bottom: 5, right: 5, display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)' }} />)}
          <span style={{ fontSize: '7px', color: '#fff', fontWeight: 600, background: 'rgba(0,0,0,0.4)', padding: '2px 5px', borderRadius: 3, display: 'flex', alignItems: 'center' }}>+8</span>
        </div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '8px', color: T.acc, fontWeight: 600, letterSpacing: '1px' }}>PREMIUM ROOM</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Deluxe Ocean View Suite</div>
        <div style={{ fontSize: '9px', color: T.t3, marginTop: '1px' }}>King bed -- 42m2 -- Floor 8-12 -- Ocean facing</div>
        <div style={{ display: 'flex', gap: '3px', marginTop: '5px', flexWrap: 'wrap' }}>
          {['Ocean View', 'AC', 'WiFi', 'Breakfast', 'Rain Shower', 'Minibar'].map(a => (
            <span key={a} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.bg, color: T.t2, border: `1px solid ${T.bdr}` }}>{a}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
          <span style={{ fontSize: '9px', color: T.t4, textDecoration: 'line-through' }}>{fmt(340)}</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(289)}</span>
          <span style={{ fontSize: '9px', color: T.t4 }}>/night</span>
          <span style={{ fontSize: '8px', fontWeight: 600, color: T.green, marginLeft: 'auto' }}>Save 15%</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
          <button style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', background: T.pri, fontSize: '10px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Book This Room</button>
          <button style={{ padding: '7px 10px', borderRadius: '7px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '10px', cursor: 'pointer', color: T.t2 }}>
            <I d={ic.heart} size={10} color={T.t3} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '5px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          {['Free cancellation 48h', 'No prepayment', 'Best price guarantee'].map(f => <span key={f} style={{ fontSize: '7px', color: T.t4 }}>&#10003; {f}</span>)}
        </div>
      </div>
    </div>
  );
}

function MiniAvailability() {
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const dates = [[null, null, null, null, null, 1, 2], [3, 4, 5, 6, 7, 8, 9], [10, 11, 12, 13, 14, 15, 16]];
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', background: T.priBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check Availability</span>
        <span style={{ fontSize: '9px', color: T.t3 }}>April 2026</span>
      </div>
      <div style={{ padding: '6px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '2px' }}>
          {days.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '7px', fontWeight: 600, color: T.t4, padding: '2px' }}>{d}</div>)}
        </div>
        {dates.map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
            {week.map((d, di) => {
              const sel = d === 10 || d === 11 || d === 12;
              const start = d === 10; const end = d === 12;
              const avail = d && d !== 7 && d !== 14;
              return (
                <div key={di} style={{ textAlign: 'center', padding: '4px 2px', borderRadius: start ? '4px 0 0 4px' : end ? '0 4px 4px 0' : sel ? '0' : '4px', background: sel ? T.pri : 'transparent', cursor: d ? 'pointer' : 'default' }}>
                  {d && <div style={{ fontSize: '9px', fontWeight: sel ? 700 : 400, color: sel ? '#fff' : !avail ? T.t4 : T.t1 }}>{d}</div>}
                  {d && avail && !sel && <div style={{ fontSize: '6px', color: T.green }}>{fmt(d <= 5 ? 289 : 319)}</div>}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ marginTop: '5px', padding: '5px 6px', background: T.priBg, borderRadius: '5px', display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: '8px', color: T.t4 }}>3 nights -- Apr 10-12</div><div style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>{fmt(867)}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '8px', color: T.green }}>Avg {fmt(289)}/night</div><button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', marginTop: '2px' }}>Select</button></div>
        </div>
      </div>
    </div>
  );
}

function MiniAmenities() {
  const groups = [
    { label: 'Room', items: ['AC', 'WiFi', 'Smart TV', 'Minibar', 'Safe'] },
    { label: 'Property', items: ['Pool', 'Spa', 'Gym', 'Restaurant', 'Parking'] },
    { label: 'Services', items: ['24h Desk', 'Laundry', 'Transfer', 'Housekeeping'] },
  ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.grid} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Property Amenities</span>
      </div>
      {groups.map((g, gi) => (
        <div key={gi} style={{ padding: '5px 10px', borderBottom: gi < groups.length - 1 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ fontSize: '8px', fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{g.label}</div>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {g.items.map(a => <span key={a} style={{ fontSize: '8px', padding: '2px 5px', borderRadius: '3px', background: T.bg, color: T.t2 }}>{a}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMealPlan() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.utensils} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Meal Plans</span>
      </div>
      {[
        { code: 'RO', name: 'Room Only', price: 0, desc: 'No meals included', sel: false },
        { code: 'BB', name: 'Bed & Breakfast', price: 25, desc: 'Buffet breakfast -- 7-10am', sel: true },
        { code: 'HB', name: 'Half Board', price: 55, desc: 'Breakfast + Dinner', sel: false },
        { code: 'AI', name: 'All Inclusive', price: 95, desc: 'All meals + drinks + snacks', sel: false },
      ].map((mp, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none', background: mp.sel ? T.priBg : 'transparent', cursor: 'pointer' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: mp.sel ? `4px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.pri, background: T.priBg2, padding: '1px 4px', borderRadius: '2px' }}>{mp.code}</span>
              <span style={{ fontSize: '10px', fontWeight: mp.sel ? 600 : 400, color: T.t1 }}>{mp.name}</span>
            </div>
            <div style={{ fontSize: '8px', color: T.t4, marginTop: '1px' }}>{mp.desc}</div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: mp.price === 0 ? T.green : T.pri }}>{mp.price === 0 ? 'Included' : `+${fmt(mp.price)}`}</span>
        </div>
      ))}
    </div>
  );
}

function MiniGuestReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: T.pri }}>9.2</div>
          <div style={{ fontSize: '7px', color: T.t4 }}>Excellent</div>
          <div style={{ fontSize: '7px', color: T.t4 }}>847 reviews</div>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Cleanliness', v: 96 }, { l: 'Location', v: 94 }, { l: 'Service', v: 91 }, { l: 'Value', v: 88 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '50px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px' }}><div style={{ width: `${cat.v}%`, height: '100%', background: T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 600, color: T.t2, width: '16px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { n: 'James & Sarah', f: 'London', r: 9.5, t: 'Stunning ocean views, impeccable service. The spa was a highlight.', a: '2d' },
        { n: 'Akiko M.', f: 'Tokyo', r: 8.8, t: 'Beautiful property. Breakfast buffet was exceptional.', a: '1w' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '5px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.n}</span>
              <span style={{ fontSize: '7px', color: T.t4 }}>{rv.f}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '8px', fontWeight: 700, color: T.pri, background: T.priBg, padding: '1px 4px', borderRadius: '3px' }}>{rv.r}</span>
              <span style={{ fontSize: '7px', color: T.t4 }}>{rv.a}</span>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: T.t2, lineHeight: 1.4, marginTop: '2px' }}>{rv.t}</div>
        </div>
      ))}
    </div>
  );
}

function MiniCheckIn() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.key} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Digital Check-in</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '8px', color: T.t4 }}>Reservation</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Deluxe Ocean View -- 3 nights</div>
          <div style={{ fontSize: '8px', color: T.t3 }}>Apr 10-12, 2026 -- 2 guests</div>
        </div>
        {['Full name', 'Passport / ID number', 'Arrival time'].map((f, i) => (
          <input key={i} placeholder={f} readOnly style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: `1px solid ${T.bdr}`, fontSize: '9px', marginBottom: '3px', outline: 'none', boxSizing: 'border-box', color: T.t3, background: T.surface }} />
        ))}
        <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
          {['Early check-in ($30)', 'Late checkout ($40)', 'Airport transfer ($55)'].map((a, i) => (
            <span key={i} style={{ fontSize: '7px', padding: '3px 5px', borderRadius: '4px', border: i === 0 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 0 ? T.priBg : T.surface, color: i === 0 ? T.pri : T.t3, cursor: 'pointer', fontWeight: i === 0 ? 600 : 400 }}>{a}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '7px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>Complete Check-in</button>
      </div>
    </div>
  );
}

function MiniPropertyGallery() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '5px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.camera} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Property Gallery</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', padding: '4px' }}>
        {[
          { bg: 'linear-gradient(135deg, #bfdbfe, #60a5fa)', l: 'Lobby' },
          { bg: 'linear-gradient(135deg, #dbeafe, #93c5fd)', l: 'Pool' },
          { bg: 'linear-gradient(135deg, #e0f2fe, #7dd3fc)', l: 'Restaurant' },
          { bg: 'linear-gradient(135deg, #d1fae5, #6ee7b7)', l: 'Garden' },
          { bg: 'linear-gradient(135deg, #fef3c7, #fbbf24)', l: 'Spa' },
          { bg: 'linear-gradient(135deg, #fce7f3, #f9a8d4)', l: 'Suite' },
        ].map((img, i) => (
          <div key={i} style={{ height: 40, borderRadius: 4, background: img.bg, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '2px', cursor: 'pointer' }}>
            <span style={{ fontSize: '6px', fontWeight: 600, color: 'rgba(0,0,0,0.5)', background: 'rgba(255,255,255,0.6)', padding: '1px 4px', borderRadius: '2px' }}>{img.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLocalExperiences() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.compass} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Local Experiences</span>
      </div>
      {[
        { name: 'Sunset Sailing Tour', dur: '3h', price: 85, cat: 'Adventure', icon: ic.waves, rating: 4.9 },
        { name: 'Old Town Food Walk', dur: '2.5h', price: 45, cat: 'Food & Culture', icon: ic.coffee, rating: 4.8 },
        { name: 'Snorkeling Trip', dur: '4h', price: 65, cat: 'Water Sports', icon: ic.swim, rating: 4.7 },
      ].map((exp, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <I d={exp.icon} size={12} color={T.pri} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{exp.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ fontSize: '7px', color: T.t4 }}>{exp.dur}</span>
              <span style={{ fontSize: '7px', color: T.acc, background: T.accBg, padding: '0 3px', borderRadius: '2px' }}>{exp.cat}</span>
              <Stars r={exp.rating} size={6} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(exp.price)}</div>
            <span style={{ fontSize: '7px', color: T.t4 }}>per person</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniVenueSpace() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '50px', background: 'linear-gradient(135deg, #1e3a5f 0%, #2a5080 50%, #3b82f6 100%)', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
        <div><div style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Event Space</div><div style={{ fontSize: '12px', fontWeight: 400, color: '#fff' }}>Grand Ballroom</div></div>
        <Badge color={T.acc}>Available</Badge>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '6px' }}>
          {[{ v: '350', l: 'Capacity' }, { v: '480m2', l: 'Area' }, { v: '$3,500', l: 'From' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '7px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '8px', color: T.t3, marginBottom: '4px' }}>Layouts: Theatre -- Banquet -- Classroom -- U-Shape -- Cocktail</div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['PA System', 'Projector', 'Lighting', 'Sound', 'Catering'].map(a => (
            <span key={a} style={{ fontSize: '7px', padding: '2px 4px', borderRadius: '3px', background: T.bg, color: T.t2 }}>{a}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: T.pri, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Enquire Now</button>
      </div>
    </div>
  );
}

function MiniCampingUnit() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '50px', background: 'linear-gradient(135deg, #064e3b, #059669)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <div><div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>Safari Tent -- Glamping</div><div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.7)' }}>Lakeside -- Private deck -- Ensuite</div></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {['Queen Bed', 'Ensuite', 'Fire Pit', 'Solar Power', 'Lake View'].map(a => (
            <span key={a} style={{ fontSize: '7px', padding: '2px 4px', borderRadius: '3px', background: T.greenBg, color: T.green }}>{a}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.green }}>{fmt(175)}</span>
          <span style={{ fontSize: '8px', color: T.t4 }}>/night -- Sleeps 2</span>
        </div>
        <button style={{ width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Reserve</button>
      </div>
    </div>
  );
}

function MiniHouseRules() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clip} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>House Rules & Policies</span>
      </div>
      {[
        { l: 'Check-in', v: '3:00 PM', icon: 'In' },
        { l: 'Check-out', v: '11:00 AM', icon: 'Out' },
        { l: 'Cancellation', v: 'Free up to 48h before', icon: 'X' },
        { l: 'Children', v: 'Welcome -- Under 5 free', icon: 'OK' },
        { l: 'Pets', v: 'Allowed -- $25/night fee', icon: 'OK' },
        { l: 'Smoking', v: 'Outdoor areas only', icon: 'No' },
        { l: 'Quiet hours', v: '10 PM - 7 AM', icon: 'Quiet' },
      ].map((r, i) => (
        <div key={i} style={{ padding: '3px 10px', borderBottom: i < 6 ? `1px solid ${T.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: '6px', background: i % 2 === 0 ? T.bg : T.surface }}>
          <span style={{ fontSize: '7px', fontWeight: 600, width: 24, textAlign: 'center', color: T.t4 }}>{r.icon}</span>
          <span style={{ fontSize: '9px', color: T.t3, flex: 1 }}>{r.l}</span>
          <span style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function MiniConcierge() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.bell} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Concierge Request</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {[
            { l: 'Room Service', icon: ic.utensils, a: false },
            { l: 'Extra Towels', icon: ic.droplet, a: false },
            { l: 'Spa Booking', icon: ic.heart, a: true },
            { l: 'Restaurant', icon: ic.coffee, a: false },
            { l: 'Taxi / Transfer', icon: ic.car, a: false },
            { l: 'Wake-up Call', icon: ic.clock, a: false },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 6px', borderRadius: '5px', border: s.a ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: s.a ? T.accBg : T.surface, cursor: 'pointer' }}>
              <I d={s.icon} size={10} color={s.a ? T.acc : T.t3} />
              <span style={{ fontSize: '8px', fontWeight: s.a ? 600 : 400, color: s.a ? T.acc : T.t2 }}>{s.l}</span>
            </div>
          ))}
        </div>
        <textarea placeholder="Special request or details..." readOnly style={{ width: '100%', height: '36px', padding: '5px 8px', borderRadius: '5px', border: `1px solid ${T.bdr}`, fontSize: '9px', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: T.t3 }} />
        <button style={{ width: '100%', padding: '7px', borderRadius: '6px', border: 'none', background: T.acc, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Send Request</button>
      </div>
    </div>
  );
}

function MiniTransfer() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.car} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Airport Transfer</span>
      </div>
      {[
        { type: 'Standard Sedan', cap: '3 pax -- 2 bags', price: 45, time: '35 min' },
        { type: 'Premium SUV', cap: '5 pax -- 4 bags', price: 75, time: '35 min', sel: true },
        { type: 'Luxury Van', cap: '8 pax -- 8 bags', price: 120, time: '35 min' },
      ].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: t.sel ? T.priBg : 'transparent', cursor: 'pointer' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: t.sel ? `4px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: t.sel ? 600 : 400, color: T.t1 }}>{t.type}</div>
            <div style={{ fontSize: '8px', color: T.t4 }}>{t.cap} -- {t.time}</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: T.pri }}>{fmt(t.price)}</span>
        </div>
      ))}
      <div style={{ padding: '6px 10px' }}>
        <button style={{ width: '100%', padding: '6px', borderRadius: '6px', border: 'none', background: T.pri, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}>Book Transfer -- {fmt(75)}</button>
      </div>
    </div>
  );
}

const HOSP_BLOCKS: VerticalBlockDef[] = [
  { id: 'room_card', family: 'rooms', label: 'Room / Unit Card', stage: 'discovery', desc: 'Browsable room card with bed type, rate, occupancy, amenities', preview: MiniRoomCard, intents: ['rooms', 'browse', 'availability', 'stay'], module: 'hospitality_rooms', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'room_detail', family: 'rooms', label: 'Room Detail', stage: 'showcase', desc: 'Full room view with gallery, amenities grid, policies, booking CTA', preview: MiniRoomDetail, intents: ['details', 'tell me more', 'room info'], module: 'hospitality_rooms', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'availability', family: 'booking', label: 'Availability Calendar', stage: 'showcase', desc: 'Date picker with nightly rates and stay total', preview: MiniAvailability, intents: ['dates', 'available', 'when', 'calendar'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'amenities', family: 'property', label: 'Amenities Grid', stage: 'discovery', desc: 'Grouped property amenities -- room, property, services', preview: MiniAmenities, intents: ['amenities', 'facilities', 'pool', 'gym', 'spa'], module: 'hospitality_property', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'meal_plan', family: 'dining', label: 'Meal Plan Selector', stage: 'showcase', desc: 'RO / BB / HB / AI meal plan radio selector with pricing', preview: MiniMealPlan, intents: ['meals', 'breakfast', 'dinner', 'all inclusive'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'guest_review', family: 'social_proof', label: 'Guest Reviews', stage: 'social_proof', desc: 'Scored guest reviews with category breakdowns', preview: MiniGuestReview, intents: ['reviews', 'rating', 'feedback'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'check_in', family: 'operations', label: 'Digital Check-in', stage: 'conversion', desc: 'Pre-arrival check-in form with ID, arrival time, add-ons', preview: MiniCheckIn, intents: ['check in', 'arrive', 'pre-check'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'property_gallery', family: 'property', label: 'Property Gallery', stage: 'discovery', desc: 'Photo grid of property areas', preview: MiniPropertyGallery, intents: ['photos', 'pictures', 'gallery'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'local_experiences', family: 'concierge', label: 'Local Experiences', stage: 'discovery', desc: 'Nearby tours, activities, and excursions with booking', preview: MiniLocalExperiences, intents: ['things to do', 'activities', 'tours'], module: 'hospitality_concierge', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'venue_space', family: 'events', label: 'Venue / Event Space', stage: 'showcase', desc: 'Event venue with capacity, layouts, AV equipment', preview: MiniVenueSpace, intents: ['event', 'wedding', 'conference', 'venue'], module: 'hospitality_events', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'camping_unit', family: 'rooms', label: 'Camping / Glamping', stage: 'discovery', desc: 'Tent, cabin, or glamping unit with outdoor amenities', preview: MiniCampingUnit, intents: ['tent', 'cabin', 'glamping'], module: 'hospitality_rooms', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'house_rules', family: 'property', label: 'House Rules & Policies', stage: 'objection', desc: 'Check-in/out times, cancellation, pets, children, quiet hours', preview: MiniHouseRules, intents: ['rules', 'policy', 'cancellation', 'pets'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'concierge', family: 'concierge', label: 'Concierge Request', stage: 'conversion', desc: 'In-stay service request -- room service, spa, taxi', preview: MiniConcierge, intents: ['room service', 'concierge', 'request'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
  { id: 'transfer', family: 'transport', label: 'Airport Transfer', stage: 'conversion', desc: 'Vehicle type selector for airport pickup with pricing', preview: MiniTransfer, intents: ['transfer', 'airport', 'pickup', 'shuttle'], module: null, status: 'active', engines: ['booking'], noModuleReason: 'checkout' },
];

const HOSP_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'hotels_resorts', name: 'Hotels & Resorts', industryId: 'hospitality', blocks: ['room_card', 'room_detail', 'availability', 'amenities', 'meal_plan', 'guest_review', 'check_in', 'property_gallery', 'local_experiences', 'venue_space', 'concierge', 'transfer', 'house_rules'] },
  { id: 'budget_accommodation', name: 'Budget Accommodation', industryId: 'hospitality', blocks: ['room_card', 'availability', 'amenities', 'guest_review', 'house_rules', 'check_in', 'transfer'] },
  { id: 'boutique_bnb', name: 'Boutique Hotels & B&Bs', industryId: 'hospitality', blocks: ['room_card', 'room_detail', 'availability', 'amenities', 'meal_plan', 'guest_review', 'property_gallery', 'local_experiences', 'house_rules', 'concierge'] },
  { id: 'serviced_apartments', name: 'Serviced Apartments', industryId: 'hospitality', blocks: ['room_card', 'room_detail', 'availability', 'amenities', 'house_rules', 'check_in', 'guest_review', 'local_experiences'] },
  { id: 'shared_accommodation', name: 'Shared & Hostels', industryId: 'hospitality', blocks: ['room_card', 'availability', 'amenities', 'guest_review', 'local_experiences', 'house_rules'] },
  { id: 'vacation_rentals', name: 'Vacation Rentals & Villas', industryId: 'hospitality', blocks: ['room_card', 'room_detail', 'availability', 'amenities', 'property_gallery', 'house_rules', 'guest_review', 'local_experiences', 'check_in'] },
  { id: 'guest_houses', name: 'Guest Houses', industryId: 'hospitality', blocks: ['room_card', 'availability', 'amenities', 'meal_plan', 'guest_review', 'house_rules', 'local_experiences'] },
  { id: 'camping_glamping', name: 'Camping & Glamping', industryId: 'hospitality', blocks: ['camping_unit', 'availability', 'amenities', 'property_gallery', 'local_experiences', 'house_rules', 'guest_review'] },
  { id: 'corporate_housing', name: 'Corporate Housing', industryId: 'hospitality', blocks: ['room_card', 'room_detail', 'availability', 'amenities', 'check_in', 'transfer', 'house_rules'] },
  { id: 'event_venues', name: 'Event & Wedding Venues', industryId: 'hospitality', blocks: ['venue_space', 'property_gallery', 'amenities', 'guest_review', 'meal_plan', 'concierge', 'house_rules'] },
];

const HOSP_FAMILIES: Record<string, VerticalFamilyDef> = {
  rooms: { label: 'Rooms & Units', color: '#1e3a5f' },
  booking: { label: 'Booking & Rates', color: '#b8860b' },
  property: { label: 'Property Info', color: '#0f766e' },
  dining: { label: 'Dining & Meals', color: '#b45309' },
  social_proof: { label: 'Social Proof', color: '#be185d' },
  operations: { label: 'Guest Operations', color: '#1d4ed8' },
  concierge: { label: 'Concierge Services', color: '#b8860b' },
  events: { label: 'Events & Venues', color: '#1e3a5f' },
  transport: { label: 'Transport', color: '#7a7a70' },
};

export const HOSP_CONFIG: VerticalConfig = {
  id: 'hospitality',
  industryId: 'hospitality',
  name: 'Hospitality & Accommodation',
  iconName: 'Building',
  accentColor: '#1e3a5f',
  blocks: HOSP_BLOCKS,
  subVerticals: HOSP_SUBVERTICALS,
  families: HOSP_FAMILIES,
};