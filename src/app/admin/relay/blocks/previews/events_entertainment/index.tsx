// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#5b21b6', priLt: '#8b5cf6', priBg: 'rgba(91,33,182,0.06)', priBg2: 'rgba(91,33,182,0.12)',
  acc: '#b91c1c', accBg: 'rgba(185,28,28,0.06)', accBg2: 'rgba(185,28,28,0.12)',
  bg: '#f9f8fb',
};

function MiniServiceCard() {
  const svcs = [
    { name: 'Wedding Photography -- Full Day', cat: 'Photography', dur: '10 hr', price: 3500, booked: 184, img: 'linear-gradient(135deg, #5b21b6, #8b5cf6, #c4b5fd)', badge: 'Top Rated' },
    { name: 'Corporate Event Management', cat: 'Planning', dur: 'Custom', price: 5000, booked: 97, img: 'linear-gradient(135deg, #1e293b, #475569, #94a3b8)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {svcs.map((s, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 54, height: 54, borderRadius: 8, background: s.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.camera} size={18} color="rgba(255,255,255,0.5)" stroke={1.3} />
              {s.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.acc}>{s.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Tag color={T.pri} bg={T.priBg}>{s.cat}</Tag>
                <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{s.dur}</span>
                <span style={{ fontSize: '7px', color: T.t4 }}>{s.booked} booked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: T.pri }}>from {fmt(s.price)}</span>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Inquire</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniPortfolio() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.camera} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Portfolio</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>42 projects</span>
      </div>
      {[
        { title: 'Sharma-Patel Wedding', type: 'Wedding', shots: 480, img: 'linear-gradient(135deg, #fce7f3, #ec4899)' },
        { title: 'TechCorp Annual Gala', type: 'Corporate', shots: 320, img: 'linear-gradient(135deg, #e0e7ff, #6366f1)' },
      ].map((p, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
            {[0, 1, 2].map(j => <div key={j} style={{ flex: j === 0 ? 2 : 1, height: 36, borderRadius: 4, background: p.img, opacity: 1 - j * 0.15 }} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{p.title}</div><div style={{ fontSize: '7px', color: T.t4 }}>{p.shots} photos</div></div>
            <Tag color={T.pri} bg={T.priBg}>{p.type}</Tag>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniVendorProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.user} size={22} color="rgba(255,255,255,0.8)" stroke={1.5} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Priya Kapoor Studios</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Wedding & Portrait Photographer</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>Mumbai -- Travels nationwide</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '280+', l: 'Events' }, { v: '12yr', l: 'Exp.' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['Weddings', 'Portraits', 'Candid', 'Drone', 'Same-day Edits'].map(s => (
            <span key={s} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Portfolio</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Get Quote</button>
      </div>
    </div>
  );
}

function MiniEventPackage() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '48px', background: 'linear-gradient(135deg, #5b21b6, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
        <div><div style={{ fontSize: '6px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Wedding Package</div><div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>The Grand Celebration</div></div>
        <Tag color="#fff" bg="rgba(255,255,255,0.2)">Most Booked</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '5px' }}>
          {[{ v: '200+', l: 'Guests' }, { v: '12 hr', l: 'Coverage' }, { v: '8', l: 'Vendors' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {['Venue coordination & design', 'Photography + videography (2 teams)', 'DJ + live band (4 hr)', 'Floral & stage decor', 'Day-of event management'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
            <I d={ic.check} size={7} color={T.green} stroke={2.5} />
            <span style={{ fontSize: '8px', color: T.t2 }}>{item}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '5px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '9px', color: T.t4, textDecoration: 'line-through' }}>{fmt(18000)}</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(14500)}</span>
          <span style={{ fontSize: '8px', fontWeight: 600, color: T.green, background: T.greenBg, padding: '1px 4px', borderRadius: '3px', marginLeft: 'auto' }}>Save 19%</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Customize & Book</button>
      </div>
    </div>
  );
}

function MiniAvailabilityCalendar() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const booked = [5, 6, 10, 11, 12];
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check Availability</span>
        <span style={{ fontSize: '9px', color: T.t3, marginLeft: 'auto' }}>May 2026</span>
      </div>
      <div style={{ padding: '6px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '3px' }}>
          {days.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: '7px', fontWeight: 700, color: T.t4, padding: '2px' }}>{d}</div>)}
        </div>
        {[[null, null, null, 1, 2, 3, 4], [5, 6, 7, 8, 9, 10, 11], [12, 13, 14, 15, 16, 17, 18]].map((week, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
            {week.map((d, di) => {
              const isBooked = d && booked.includes(d);
              const sel = d === 17;
              return (
                <div key={di} style={{ textAlign: 'center', padding: '4px 1px', borderRadius: sel ? '5px' : '3px', background: sel ? T.pri : isBooked ? T.redBg : 'transparent', opacity: isBooked ? 0.4 : 1 }}>
                  {d && <div style={{ fontSize: '9px', fontWeight: sel ? 700 : 400, color: sel ? '#fff' : isBooked ? T.red : T.t1 }}>{d}</div>}
                  {d && !isBooked && !sel && <div style={{ fontSize: '5px', color: T.green }}>Open</div>}
                  {isBooked && <div style={{ fontSize: '5px', color: T.red }}>Booked</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniQuoteBuilder() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.dollar} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Quote</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[{ l: 'Photography (2 shooters)', p: '$3,500', sel: true }, { l: 'Videography (cinematic)', p: '$4,000', sel: true }, { l: 'DJ + Sound System', p: '$1,800', sel: false }, { l: 'Floral & Decor', p: 'Quote TBD', sel: false }].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: s.sel ? T.pri : T.bg, border: `1px solid ${s.sel ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{s.sel && <I d={ic.check} size={8} color="#fff" stroke={3} />}</div>
            <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{s.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 600, color: T.pri }}>{s.p}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Estimated</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(7500)}</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Submit Request</button>
      </div>
    </div>
  );
}

function MiniEventTimeline() {
  const phases = [
    { label: 'Initial consultation', date: 'Apr 1', status: 'done' },
    { label: 'Vendor shortlisting', date: 'Apr 10', status: 'done' },
    { label: 'Design & mood board', date: 'Apr 20', status: 'active', detail: '2 rounds of revisions' },
    { label: 'Vendor confirmations', date: 'May 1', status: 'upcoming' },
    { label: 'Event day', date: 'May 17', status: 'upcoming' },
  ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.activity} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Planning Timeline</span>
        <Tag color={T.green} bg={T.greenBg}>On Track</Tag>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < phases.length - 1 ? '6px' : '0' }}>
            {i < phases.length - 1 && <div style={{ position: 'absolute', left: 7, top: 16, width: 1, height: 'calc(100% - 10px)', background: p.status === 'done' ? T.green : T.bdr }} />}
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: p.status === 'done' ? T.green : p.status === 'active' ? T.pri : T.bg, border: `2px solid ${p.status === 'done' ? T.green : p.status === 'active' ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              {p.status === 'done' ? <I d={ic.check} size={8} color="#fff" stroke={3} /> : p.status === 'active' ? <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} /> : null}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '9px', fontWeight: p.status === 'active' ? 600 : 400, color: T.t1 }}>{p.label}</span><span style={{ fontSize: '7px', color: T.t4 }}>{p.date}</span></div>
              {p.detail && <div style={{ fontSize: '7px', color: T.t3, marginTop: '1px' }}>{p.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniVenueCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '52px', background: 'linear-gradient(135deg, #1e293b, #475569, #94a3b8)', display: 'flex', alignItems: 'flex-end', padding: '5px 8px' }}>
        <Tag color="#fff" bg="rgba(255,255,255,0.2)">Indoor + Outdoor</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>The Grand Atrium</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}><I d={ic.map} size={7} color={T.t4} /><span style={{ fontSize: '8px', color: T.t3 }}>Midtown, Mumbai</span><Stars r={4.8} size={7} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '5px' }}>
          {[{ v: '350', l: 'Capacity' }, { v: '5,800', l: 'sq ft' }, { v: fmt(8000), l: 'From' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          <button style={{ flex: 1, padding: '6px', borderRadius: '6px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Virtual Tour</button>
          <button style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Check Date</button>
        </div>
      </div>
    </div>
  );
}

function MiniShowListing() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.play} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Now Showing</span>
      </div>
      {[
        { title: 'The Phantom Thread -- Live', type: 'Theatre', time: '7:30 PM', date: 'Apr 18', price: 65, seats: 42, img: 'linear-gradient(135deg, #5b21b6, #7c3aed)' },
        { title: 'Jazz Under the Stars', type: 'Concert', time: '8:00 PM', date: 'Apr 19', price: 45, seats: 120, img: 'linear-gradient(135deg, #0c4a6e, #0284c7)' },
        { title: 'Comedy Night -- Open Mic', type: 'Comedy', time: '9:00 PM', date: 'Apr 20', price: 25, seats: 18, img: 'linear-gradient(135deg, #b91c1c, #ef4444)' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 32, height: 40, borderRadius: 4, background: s.img, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{s.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
              <Tag color={T.pri} bg={T.priBg}>{s.type}</Tag>
              <span style={{ fontSize: '7px', color: T.t4 }}>{s.date} -- {s.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{fmt(s.price)}</span>
              <span style={{ fontSize: '7px', color: s.seats < 20 ? T.red : T.green }}>{s.seats} seats</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniMoodBoard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.pen} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Design Mood Board</span>
        <Tag color={T.amber} bg={T.amberBg}>Draft</Tag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', padding: '3px' }}>
        {[
          { bg: 'linear-gradient(135deg, #fce7f3, #f9a8d4)', l: 'Blush' },
          { bg: 'linear-gradient(135deg, #d1fae5, #6ee7b7)', l: 'Greenery' },
          { bg: 'linear-gradient(135deg, #fef3c7, #fbbf24)', l: 'Gold' },
          { bg: 'linear-gradient(135deg, #ede9fe, #a78bfa)', l: 'Lavender' },
          { bg: 'linear-gradient(135deg, #fce7f3, #ec4899)', l: 'Florals' },
          { bg: 'linear-gradient(135deg, #fff7ed, #fb923c)', l: 'Candles' },
        ].map((img, i) => (
          <div key={i} style={{ height: 36, borderRadius: 4, background: img.bg, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '2px' }}>
            <span style={{ fontSize: '5px', fontWeight: 600, color: 'rgba(0,0,0,0.4)', background: 'rgba(255,255,255,0.6)', padding: '1px 3px', borderRadius: '2px' }}>{img.l}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '5px 10px' }}>
        <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Theme: Romantic Garden</div>
        <div style={{ display: 'flex', gap: '3px', marginTop: '3px' }}>
          {['#f9a8d4', '#6ee7b7', '#fbbf24', '#fef3c7'].map(c => <div key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)' }} />)}
        </div>
      </div>
      <div style={{ padding: '5px 10px', borderTop: `1px solid ${T.bdr}`, display: 'flex', gap: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Revise</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Approve</button>
      </div>
    </div>
  );
}

function MiniEquipmentList() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.mic} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>AV & Equipment</span>
      </div>
      {[
        { name: 'PA System (500W)', cat: 'Audio', rate: '$350/day', avail: true },
        { name: 'LED Video Wall (10x6ft)', cat: 'Visual', rate: '$800/day', avail: true },
        { name: 'Stage Lighting (20 fixtures)', cat: 'Lighting', rate: '$450/day', avail: true },
        { name: 'Wireless Mic System (8ch)', cat: 'Audio', rate: '$200/day', avail: false },
      ].map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none', opacity: e.avail ? 1 : 0.4 }}>
          <div style={{ width: 24, height: 24, borderRadius: 5, background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.music} size={11} color={T.pri} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{e.name}</div>
            <Tag color={T.pri} bg={T.priBg}>{e.cat}</Tag>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.pri }}>{e.rate}</div>
            <span style={{ fontSize: '6px', color: e.avail ? T.green : T.red }}>{e.avail ? 'Available' : 'Booked'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniClientReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.9</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Creativity', v: 98 }, { l: 'Professionalism', v: 96 }, { l: 'Communication', v: 95 }, { l: 'Timeliness', v: 92 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '58px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 95 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'RS', name: 'Rohit & Sneha', text: 'Captured our wedding beautifully. The same-day edit had everyone in tears.', ago: '2w', type: 'Wedding' },
        { init: 'AK', name: 'Anil K.', text: 'Organized our 500-person gala flawlessly. Already booking next year.', ago: '1mo', type: 'Corporate' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <Tag color={T.pri} bg={T.priBg}>{rv.type}</Tag>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{rv.ago}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

function MiniSeatingChart() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.layout} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Seating Layout</span>
        <Tag color={T.amber} bg={T.amberBg}>Draft</Tag>
      </div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
          {[{ z: 'VIP Section', t: 3, g: 24, color: T.acc }, { z: 'Main Hall', t: 15, g: 150, color: T.pri }, { z: 'Garden', t: 5, g: 40, color: T.green }].map(s => (
            <div key={s.z} style={{ padding: '6px', background: `${s.color}08`, borderRadius: '6px', border: `1px solid ${s.color}20`, textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.t}</div>
              <div style={{ fontSize: '7px', color: s.color }}>tables</div>
              <div style={{ fontSize: '7px', color: T.t4 }}>{s.g} guests</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '4px', borderTop: `1px solid ${T.bdr}`, fontSize: '8px' }}>
          <span style={{ color: T.t3 }}>Total: 23 tables -- 214 guests</span>
          <span style={{ color: T.pri, fontWeight: 600, cursor: 'pointer' }}>Edit Layout</span>
        </div>
      </div>
    </div>
  );
}

function MiniInviteRSVP() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.send} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>RSVP Tracker</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>68% response rate</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', padding: '6px 10px' }}>
        {[{ v: 200, l: 'Sent', color: T.pri }, { v: 124, l: 'Accepted', color: T.green }, { v: 12, l: 'Declined', color: T.red }, { v: 64, l: 'Pending', color: T.amber }].map(s => (
          <div key={s.l} style={{ padding: '4px', background: `${s.color}08`, borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '6px', color: s.color }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 10px 6px' }}>
        <div style={{ height: 6, background: T.bdr, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: '62%', height: '100%', background: T.green }} />
          <div style={{ width: '6%', height: '100%', background: T.red }} />
        </div>
        <div style={{ fontSize: '7px', color: T.t3, marginTop: '4px' }}>Dietary: 18 vegetarian -- 8 vegan -- 4 gluten-free</div>
      </div>
    </div>
  );
}

const EVT_BLOCKS: VerticalBlockDef[] = [
  { id: 'evt_service_card', family: 'catalog', label: 'Service Card', stage: 'discovery', desc: 'Event service with category, duration, starting price, booking count', preview: MiniServiceCard, intents: ['services', 'photography', 'videography', 'planning', 'DJ', 'decorator'], module: 'moduleItems', status: 'active', engines: ['lead'] },
  { id: 'evt_portfolio', family: 'proof', label: 'Portfolio', stage: 'social_proof', desc: 'Project showcase with photo strips, event title, type tag, shot count', preview: MiniPortfolio, intents: ['portfolio', 'past work', 'samples', 'gallery', 'examples'], module: null, status: 'active', engines: ['lead'] },
  { id: 'vendor_profile', family: 'people', label: 'Vendor Profile', stage: 'discovery', desc: 'Creative professional with specialties, travel radius, event count', preview: MiniVendorProfile, intents: ['who', 'photographer', 'planner', 'DJ', 'artist', 'vendor'], module: 'moduleItems', status: 'active', engines: ['lead'] },
  { id: 'event_package', family: 'packages', label: 'Event Package', stage: 'showcase', desc: 'Bundled service with guest capacity, coverage hours, vendor count, savings', preview: MiniEventPackage, intents: ['packages', 'bundles', 'all inclusive', 'wedding package'], module: 'moduleItems', status: 'active', engines: ['lead'] },
  { id: 'evt_availability', family: 'booking', label: 'Availability Calendar', stage: 'conversion', desc: 'Monthly calendar with open/booked dates for vendor or venue', preview: MiniAvailabilityCalendar, intents: ['available', 'dates', 'when', 'calendar', 'check date', 'book date'], module: null, status: 'active', engines: ['booking'] },
  { id: 'evt_quote_builder', family: 'pricing', label: 'Custom Quote Builder', stage: 'conversion', desc: 'Event type selector, service checkboxes with pricing, running total', preview: MiniQuoteBuilder, intents: ['quote', 'pricing', 'cost', 'how much', 'estimate', 'custom', 'budget'], module: null, status: 'active', engines: ['lead'] },
  { id: 'evt_timeline', family: 'planning', label: 'Planning Timeline', stage: 'social_proof', desc: 'Multi-phase milestone tracker from consultation to event day', preview: MiniEventTimeline, intents: ['timeline', 'progress', 'planning status', 'milestones', 'checklist'], module: null, status: 'active', engines: ['lead', 'service'] },
  { id: 'evt_venue_card', family: 'venues', label: 'Venue Card', stage: 'discovery', desc: 'Event venue with capacity, area, pricing, amenity list, virtual tour CTA', preview: MiniVenueCard, intents: ['venue', 'space', 'hall', 'location', 'capacity', 'banquet', 'garden'], module: 'moduleItems', status: 'active', engines: ['booking'] },
  { id: 'show_listing', family: 'entertainment', label: 'Show Listing', stage: 'discovery', desc: 'Upcoming shows with type tag, date/time, venue, ticket price, seat count', preview: MiniShowListing, intents: ['shows', 'events', 'tickets', 'tonight', 'upcoming', 'performance'], module: 'moduleItems', status: 'active', engines: ['booking'] },
  { id: 'mood_board', family: 'design', label: 'Design Mood Board', stage: 'showcase', desc: 'Visual theme board with color palette, inspiration images, approve/revise', preview: MiniMoodBoard, intents: ['theme', 'design', 'mood board', 'colors', 'style', 'decor'], module: null, status: 'active', engines: ['lead'] },
  { id: 'evt_equipment', family: 'production', label: 'AV & Equipment', stage: 'showcase', desc: 'Audio/visual/lighting catalog with daily rates, availability status', preview: MiniEquipmentList, intents: ['equipment', 'AV', 'sound', 'lighting', 'LED', 'PA system'], module: 'moduleItems', status: 'active', engines: ['lead'] },
  { id: 'evt_client_review', family: 'social_proof', label: 'Client Reviews', stage: 'social_proof', desc: 'Event-specific criteria bars, event-type-tagged reviews', preview: MiniClientReview, intents: ['reviews', 'ratings', 'testimonials', 'feedback'], module: null, status: 'active', engines: ['lead'] },
  { id: 'seating_chart', family: 'planning', label: 'Seating Layout', stage: 'showcase', desc: 'Table/section assignments with guest counts per zone', preview: MiniSeatingChart, intents: ['seating', 'layout', 'tables', 'arrangement', 'floor plan'], module: null, status: 'active', engines: ['booking'] },
  { id: 'invite_rsvp', family: 'management', label: 'RSVP Tracker', stage: 'social_proof', desc: 'Guest list with sent/accepted/declined/pending counts, dietary info', preview: MiniInviteRSVP, intents: ['RSVP', 'guest list', 'invites', 'who is coming', 'headcount', 'dietary'], module: null, status: 'active', engines: ['booking'] },
];

const EVT_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'event_planning', name: 'Event Planning', industryId: 'events_entertainment', blocks: ['evt_service_card', 'vendor_profile', 'event_package', 'evt_quote_builder', 'evt_timeline', 'evt_availability', 'evt_venue_card', 'seating_chart', 'invite_rsvp', 'evt_client_review'] },
  { id: 'wedding_events', name: 'Wedding & Private Events', industryId: 'events_entertainment', blocks: ['evt_service_card', 'vendor_profile', 'event_package', 'evt_availability', 'evt_quote_builder', 'evt_timeline', 'mood_board', 'evt_venue_card', 'seating_chart', 'invite_rsvp', 'evt_portfolio', 'evt_client_review'] },
  { id: 'corporate_events', name: 'Corporate Events', industryId: 'events_entertainment', blocks: ['evt_service_card', 'vendor_profile', 'event_package', 'evt_quote_builder', 'evt_timeline', 'evt_venue_card', 'evt_equipment', 'seating_chart', 'evt_client_review'] },
  { id: 'photo_video', name: 'Photography & Videography', industryId: 'events_entertainment', blocks: ['evt_service_card', 'vendor_profile', 'evt_portfolio', 'evt_availability', 'evt_quote_builder', 'evt_client_review'] },
  { id: 'decor_floral', name: 'Decor & Floral', industryId: 'events_entertainment', blocks: ['evt_service_card', 'vendor_profile', 'evt_portfolio', 'mood_board', 'evt_availability', 'evt_quote_builder', 'evt_client_review'] },
  { id: 'live_entertainment', name: 'Live Entertainment', industryId: 'events_entertainment', blocks: ['evt_service_card', 'vendor_profile', 'evt_portfolio', 'evt_availability', 'show_listing', 'evt_client_review'] },
  { id: 'av_production', name: 'AV & Production', industryId: 'events_entertainment', blocks: ['evt_equipment', 'evt_service_card', 'vendor_profile', 'evt_quote_builder', 'evt_availability', 'evt_client_review'] },
  { id: 'cinema_theatre', name: 'Cinemas & Theaters', industryId: 'events_entertainment', blocks: ['show_listing', 'evt_venue_card', 'evt_client_review'] },
];

const EVT_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Services', color: '#5b21b6' },
  proof: { label: 'Portfolio & Proof', color: '#be185d' },
  people: { label: 'Vendors & Artists', color: '#b91c1c' },
  packages: { label: 'Event Packages', color: '#5b21b6' },
  booking: { label: 'Availability', color: '#b91c1c' },
  pricing: { label: 'Quotes & Pricing', color: '#b45309' },
  planning: { label: 'Planning & Timeline', color: '#1d4ed8' },
  venues: { label: 'Venues & Spaces', color: '#0f766e' },
  entertainment: { label: 'Shows & Listings', color: '#b91c1c' },
  design: { label: 'Design & Decor', color: '#be185d' },
  production: { label: 'AV & Production', color: '#0f766e' },
  social_proof: { label: 'Reviews', color: '#be185d' },
  management: { label: 'Guest Management', color: '#15803d' },
};

export const EVT_CONFIG: VerticalConfig = {
  id: 'events_entertainment',
  industryId: 'events_entertainment',
  name: 'Events, Media & Entertainment',
  iconName: 'PartyPopper',
  accentColor: '#5b21b6',
  blocks: EVT_BLOCKS,
  subVerticals: EVT_SUBVERTICALS,
  families: EVT_FAMILIES,
};