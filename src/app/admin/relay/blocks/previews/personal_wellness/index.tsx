// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#9333ea', priLt: '#a855f7', priBg: 'rgba(147,51,234,0.06)', priBg2: 'rgba(147,51,234,0.12)',
  acc: '#ec4899', accBg: 'rgba(236,72,153,0.06)', accBg2: 'rgba(236,72,153,0.12)',
  bg: '#fdf4ff',
};

function MiniServiceCard() {
  const items = [
    { name: 'Deep Tissue Massage', duration: '60 min', price: 120, cat: 'Massage', rating: 4.9, booked: 340, badge: 'Popular', img: 'linear-gradient(135deg, #f5d0fe, #d946ef, #9333ea)' },
    { name: 'Hydrating Facial', duration: '45 min', price: 85, cat: 'Skincare', rating: 4.8, booked: 210, img: 'linear-gradient(135deg, #fce7f3, #f472b6, #ec4899)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 54, height: 54, borderRadius: 8, background: s.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.heart} size={18} color="rgba(255,255,255,0.5)" stroke={1.5} />
              {s.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.pri}>{s.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Tag color={T.pri} bg={T.priBg}>{s.cat}</Tag>
                <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{s.duration}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(s.price)}</span>
                  <Stars r={s.rating} size={7} />
                  <span style={{ fontSize: '7px', color: T.t4 }}>{s.booked} booked</span>
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Book</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniServiceDetail() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '64px', background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #d8b4fe 100%)', display: 'flex', alignItems: 'flex-end', padding: '8px 10px' }}>
        <div><Tag color="#fff" bg="rgba(255,255,255,0.2)">Signature</Tag><div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '3px' }}>Deep Tissue Massage</div></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '9px', color: T.t3, lineHeight: 1.4, marginBottom: '4px' }}>Targeted pressure to release chronic muscle tension. Ideal for athletes and desk workers.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '5px' }}>
          {[{ v: '60 min', l: 'Duration' }, { v: 'Medium-Deep', l: 'Pressure' }, { v: 'Full Body', l: 'Area' }].map(s => (
            <div key={s.l} style={{ padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '7px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Benefits</div>
        {['Relieves chronic pain and stiffness', 'Improves range of motion', 'Reduces stress and anxiety', 'Promotes faster muscle recovery'].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
            <I d={ic.check} size={7} color={T.green} stroke={2.5} />
            <span style={{ fontSize: '8px', color: T.t2 }}>{b}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(120)}</span>
          <span style={{ fontSize: '8px', color: T.t4 }}>/ session</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Book Now</button>
      </div>
    </div>
  );
}

function MiniCategoryBrowser() {
  const cats = [
    { name: 'Massage', count: 8, bg: 'linear-gradient(135deg, #f5d0fe, #d946ef)' },
    { name: 'Facial', count: 6, bg: 'linear-gradient(135deg, #fce7f3, #ec4899)' },
    { name: 'Hair', count: 12, bg: 'linear-gradient(135deg, #e0e7ff, #818cf8)' },
    { name: 'Nails', count: 10, bg: 'linear-gradient(135deg, #fef3c7, #f59e0b)' },
    { name: 'Body', count: 5, bg: 'linear-gradient(135deg, #d1fae5, #34d399)' },
    { name: 'Wellness', count: 7, bg: 'linear-gradient(135deg, #cffafe, #22d3ee)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
      {cats.map(c => (
        <div key={c.name} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ height: 28, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.heart} size={14} color="rgba(255,255,255,0.7)" stroke={1.5} />
          </div>
          <div style={{ padding: '4px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{c.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{c.count} services</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStylistProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #f5d0fe, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I d={ic.user} size={20} color="rgba(255,255,255,0.8)" stroke={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Maya Johnson</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Senior Therapist</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>8 years -- Licensed Massage Therapist</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '1,200+', l: 'Sessions' }, { v: '8yr', l: 'Exp.' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['Deep Tissue', 'Swedish', 'Hot Stone', 'Prenatal', 'Sports'].map(s => (
            <span key={s} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>View Portfolio</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Book with Maya</button>
      </div>
    </div>
  );
}

function MiniAppointmentBooking() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Book Appointment</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Therapist</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Any Available' }, { l: 'Maya J.', sel: true }, { l: 'Sarah K.' }].map(t => (
            <span key={t.l} style={{ flex: 1, textAlign: 'center', padding: '4px', borderRadius: '4px', fontSize: '8px', border: t.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: t.sel ? T.priBg : T.surface, color: t.sel ? T.pri : T.t2, fontWeight: t.sel ? 600 : 400, cursor: 'pointer' }}>{t.l}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {['Tue 10 AM', 'Tue 2 PM', 'Wed 11 AM', 'Wed 4 PM', 'Thu 9 AM', 'Fri 1 PM'].map((t, i) => (
            <div key={t} style={{ padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '8px', border: i === 1 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 1 ? T.priBg : T.surface, color: i === 1 ? T.pri : T.t1, fontWeight: i === 1 ? 600 : 400, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Tue 2:00 PM with Maya</button>
      </div>
    </div>
  );
}

function MiniMembershipTier() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.award} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Membership Plans</span>
      </div>
      {[
        { name: 'Essential', price: 79, freq: '/month', perks: '2 services + 10% off products', color: T.t3, sel: false },
        { name: 'Premium', price: 149, freq: '/month', perks: '4 services + 20% off + priority booking', color: T.pri, sel: true, badge: 'Best Value' },
        { name: 'VIP', price: 249, freq: '/month', perks: 'Unlimited services + 30% off + guest passes', color: T.acc, sel: false },
      ].map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: p.sel ? T.priBg : 'transparent' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: p.sel ? `5px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: p.color }}>{p.name}</span>
              {p.badge && <Tag color="#fff" bg={T.pri}>{p.badge}</Tag>}
            </div>
            <div style={{ fontSize: '7px', color: T.t4, marginTop: '1px' }}>{p.perks}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{p.freq}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniBeforeAfter() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.eye} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Results Gallery</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {[
          { treatment: 'Hydrafacial Series (6 sessions)', client: 'Client A.', tag: 'Skincare' },
          { treatment: 'Balayage Transformation', client: 'Client M.', tag: 'Hair' },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: i === 0 ? '6px' : '0' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
              <div style={{ flex: 1, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #e5e7eb, #9ca3af)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 3 }}>Before</span>
              </div>
              <div style={{ flex: 1, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #f5d0fe, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: 3 }}>After</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag color={T.pri} bg={T.priBg}>{r.tag}</Tag>
              <span style={{ fontSize: '8px', color: T.t2 }}>{r.treatment}</span>
              <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{r.client}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPackageBuilder() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.layers} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spa Package</span>
        <Tag color="#fff" bg={T.acc}>Save {fmt(45)}</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, marginBottom: '4px' }}>Relaxation Ritual</div>
        {[
          { name: 'Swedish Massage', dur: '60 min', sel: true },
          { name: 'Express Facial', dur: '30 min', sel: true },
          { name: 'Scalp Treatment', dur: '20 min', sel: true },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: T.acc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.check} size={8} color="#fff" stroke={3} />
            </div>
            <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{s.name}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{s.dur}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '5px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <div><span style={{ fontSize: '9px', color: T.t4, textDecoration: 'line-through' }}>{fmt(240)}</span><span style={{ fontSize: '14px', fontWeight: 700, color: T.acc, marginLeft: '4px' }}>{fmt(195)}</span></div>
          <span style={{ fontSize: '7px', color: T.t4 }}>110 min total</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Book Package -- {fmt(195)}</button>
      </div>
    </div>
  );
}

function MiniClassSchedule() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.cal} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Class Schedule</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>This week</span>
      </div>
      {[
        { name: 'Vinyasa Flow', time: 'Mon 7:00 AM', instructor: 'Sara', spots: '4 spots left', level: 'Intermediate', color: T.pri },
        { name: 'Hot Yoga', time: 'Tue 6:30 PM', instructor: 'David', spots: '8 spots left', level: 'All Levels', color: T.acc },
        { name: 'Meditation Circle', time: 'Wed 8:00 AM', instructor: 'Maya', spots: '12 spots left', level: 'Beginner', color: T.teal },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: c.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{c.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ fontSize: '7px', color: T.t4 }}>{c.time}</span>
              <span style={{ fontSize: '7px', color: T.t4 }}>{c.instructor}</span>
              <Tag color={c.color} bg={`${c.color}10`}>{c.level}</Tag>
            </div>
          </div>
          <span style={{ fontSize: '7px', color: T.amber, fontWeight: 500 }}>{c.spots}</span>
        </div>
      ))}
    </div>
  );
}

function MiniGiftCard() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '48px', background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 40%, #e879f9 80%, #fdf4ff 100%)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <div><div style={{ fontSize: '6px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Gift Card</div><div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Give the Gift of Wellness</div></div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[50, 100, 150, 200].map(v => (
            <div key={v} style={{ flex: 1, padding: '6px', borderRadius: '5px', textAlign: 'center', border: v === 100 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: v === 100 ? T.priBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '11px', fontWeight: v === 100 ? 700 : 400, color: v === 100 ? T.pri : T.t1 }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Purchase Gift Card -- {fmt(100)}</button>
      </div>
    </div>
  );
}

function MiniProductShop() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.bag} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Retail Products</span>
      </div>
      {[
        { name: 'Hydrating Serum', brand: 'SkinRX', price: 48, size: '30ml', img: 'linear-gradient(135deg, #fce7f3, #ec4899)' },
        { name: 'Argan Hair Oil', brand: 'PureRoot', price: 32, size: '100ml', img: 'linear-gradient(135deg, #fef3c7, #f59e0b)' },
        { name: 'Recovery Balm', brand: 'MuscleCare', price: 28, size: '60g', img: 'linear-gradient(135deg, #d1fae5, #34d399)' },
      ].map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: p.img, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.bag} size={12} color="rgba(255,255,255,0.5)" stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{p.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{p.brand} -- {p.size}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</span>
            <button style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLoyaltyProgress() {
  const pts = 2400; const next = 3000;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.star} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Rewards</span>
        <Tag color={T.pri} bg={T.priBg}>Gold Member</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: T.t4, marginBottom: '2px' }}><span>{pts.toLocaleString()} pts</span><span>{next.toLocaleString()} pts (Platinum)</span></div>
        <div style={{ height: 6, background: T.bdr, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(pts / next) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${T.pri}, ${T.acc})`, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: '8px', color: T.t3, marginTop: '3px' }}>{next - pts} points to Platinum -- earn 2x points this month</div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          {[{ v: '12', l: 'Visits' }, { v: '2,400', l: 'Points' }, { v: '3', l: 'Rewards' }].map(s => (
            <div key={s.l} style={{ flex: 1, padding: '5px', background: T.bg, borderRadius: '5px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '6px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
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
          {[{ l: 'Service quality', v: 98 }, { l: 'Cleanliness', v: 96 }, { l: 'Staff', v: 97 }, { l: 'Value', v: 92 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 95 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'LR', name: 'Lisa R.', text: 'Best massage I have ever had. Maya has magic hands. The hot stone add-on was worth every penny.', ago: '2d', service: 'Massage' },
        { init: 'KP', name: 'Kate P.', text: 'Love the facial results. My skin has never looked this good. Already booked my next session.', ago: '1w', service: 'Facial' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <Tag color={T.pri} bg={T.priBg}>{rv.service}</Tag>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{rv.ago}</span>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

function MiniIntakeForm() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.clip} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client Intake</span>
        <Tag color={T.amber} bg={T.amberBg}>Required</Tag>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {[
          { name: 'Health history form', status: 'done' },
          { name: 'Allergies & sensitivities', status: 'done' },
          { name: 'Pressure preference', status: 'pending' },
          { name: 'Consent & waiver', status: 'pending' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: d.status === 'done' ? T.green : T.bg, border: `1px solid ${d.status === 'done' ? T.green : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {d.status === 'done' && <I d={ic.check} size={9} color="#fff" stroke={3} />}
            </div>
            <span style={{ fontSize: '9px', fontWeight: 500, color: T.t1, flex: 1 }}>{d.name}</span>
            {d.status === 'pending' && <button style={{ fontSize: '7px', fontWeight: 600, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}>Fill</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

const PW_BLOCKS: VerticalBlockDef[] = [
  { id: 'pw_service_card', family: 'catalog', label: 'Service Card', stage: 'discovery', desc: 'Treatment/service with duration, category, pricing, booking count', preview: MiniServiceCard, intents: ['services', 'treatments', 'what do you offer', 'menu'], module: 'personal_wellness_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'pw_service_detail', family: 'catalog', label: 'Service Detail', stage: 'showcase', desc: 'Full service view with benefits, duration, pressure level, area', preview: MiniServiceDetail, intents: ['details', 'tell me more', 'what is included'], module: 'personal_wellness_catalog', status: 'active', reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'pw_category_browser', family: 'catalog', label: 'Category Browser', stage: 'discovery', desc: 'Visual grid of service categories with item counts', preview: MiniCategoryBrowser, intents: ['categories', 'browse', 'massage', 'facial', 'hair', 'nails'], module: 'personal_wellness_catalog', status: 'active' },
  { id: 'stylist_profile', family: 'people', label: 'Stylist / Therapist Profile', stage: 'discovery', desc: 'Staff card with specialties, session count, portfolio link', preview: MiniStylistProfile, intents: ['therapist', 'stylist', 'who', 'team', 'specialist'], module: 'personal_wellness_people', status: 'active', reads: ['name', 'description', 'image_url', 'subtitle', 'badges'] },
  { id: 'pw_appointment', family: 'booking', label: 'Appointment Booking', stage: 'conversion', desc: 'Staff preference selector, time slot grid, confirmation CTA', preview: MiniAppointmentBooking, intents: ['book', 'appointment', 'schedule', 'available', 'when'], module: 'personal_wellness_booking', status: 'active', engines: ['booking'] },
  // engines: ['engagement', 'commerce'] — membership signup is a commitment (engagement) but many partners process it as a recurring subscription product (commerce). Both tags genuinely serve the block.
  { id: 'membership_tier', family: 'pricing', label: 'Membership Plans', stage: 'showcase', desc: 'Tier comparison with perks, pricing, best-value badge', preview: MiniMembershipTier, intents: ['membership', 'plans', 'subscribe', 'monthly', 'unlimited'], module: 'personal_wellness_pricing', status: 'active', engines: ['engagement', 'commerce'] },
  { id: 'before_after', family: 'proof', label: 'Before / After Gallery', stage: 'social_proof', desc: 'Side-by-side transformation photos with treatment and client tag', preview: MiniBeforeAfter, intents: ['results', 'before after', 'transformations', 'gallery', 'portfolio'], module: 'personal_wellness_proof', status: 'active' },
  { id: 'spa_package', family: 'marketing', label: 'Spa / Service Package', stage: 'showcase', desc: 'Bundled services with total duration, savings, combined price', preview: MiniPackageBuilder, intents: ['package', 'combo', 'bundle', 'deal', 'spa day'], module: 'personal_wellness_marketing', status: 'active', reads: ['name', 'description', 'image_url'] },
  { id: 'class_schedule', family: 'scheduling', label: 'Class Schedule', stage: 'discovery', desc: 'Weekly class timetable with instructor, level, spots remaining', preview: MiniClassSchedule, intents: ['classes', 'schedule', 'yoga', 'fitness', 'meditation', 'timetable'], module: 'personal_wellness_scheduling', status: 'active', engines: ['booking'] },
  { id: 'gift_card', family: 'marketing', label: 'Gift Card', stage: 'conversion', desc: 'Denomination selector with purchase CTA', preview: MiniGiftCard, intents: ['gift', 'gift card', 'voucher', 'present', 'give'], module: 'personal_wellness_marketing', status: 'active' },
  { id: 'pw_product_shop', family: 'retail', label: 'Retail Products', stage: 'discovery', desc: 'Skincare/hair product cards with brand, size, pricing', preview: MiniProductShop, intents: ['products', 'shop', 'buy', 'skincare', 'retail', 'serum'], module: 'personal_wellness_retail', status: 'active', reads: ['name', 'description', 'image_url'] },
  // engines: ['engagement'] — loyalty/retention display for engagement partners (memberships, visit streaks)
  { id: 'loyalty_progress', family: 'retention', label: 'Loyalty / Rewards', stage: 'social_proof', desc: 'Points progress bar, tier status, visit count, rewards earned', preview: MiniLoyaltyProgress, intents: ['rewards', 'points', 'loyalty', 'membership status', 'tier'], module: 'personal_wellness_retention', status: 'active', engines: ['engagement'] },
  { id: 'pw_client_review', family: 'proof', label: 'Client Reviews', stage: 'social_proof', desc: 'Service-tagged reviews with criteria bars', preview: MiniClientReview, intents: ['reviews', 'ratings', 'feedback', 'testimonials'], module: 'personal_wellness_proof', status: 'active' },
  { id: 'intake_form', family: 'operations', label: 'Client Intake Form', stage: 'conversion', desc: 'Pre-visit health history, allergies, consent checklist', preview: MiniIntakeForm, intents: ['intake', 'form', 'health history', 'allergies', 'consent', 'waiver'], module: 'personal_wellness_operations', status: 'active', engines: ['booking'] },
];

const PW_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'hair_beauty', name: 'Hair & Beauty Salon', industryId: 'personal_wellness', blocks: ['pw_service_card', 'pw_service_detail', 'pw_category_browser', 'stylist_profile', 'pw_appointment', 'before_after', 'pw_product_shop', 'gift_card', 'pw_client_review', 'loyalty_progress'] },
  { id: 'spa_massage', name: 'Spa & Massage', industryId: 'personal_wellness', blocks: ['pw_service_card', 'pw_service_detail', 'pw_category_browser', 'stylist_profile', 'pw_appointment', 'spa_package', 'membership_tier', 'gift_card', 'pw_client_review', 'intake_form', 'loyalty_progress'] },
  { id: 'fitness_gym', name: 'Fitness & Gym', industryId: 'personal_wellness', blocks: ['pw_service_card', 'pw_category_browser', 'stylist_profile', 'class_schedule', 'membership_tier', 'pw_client_review', 'loyalty_progress', 'before_after'] },
  { id: 'yoga_meditation', name: 'Yoga & Meditation', industryId: 'personal_wellness', blocks: ['pw_service_card', 'class_schedule', 'stylist_profile', 'pw_appointment', 'membership_tier', 'pw_client_review', 'spa_package'] },
  { id: 'skin_aesthetic', name: 'Skin & Aesthetic Clinic', industryId: 'personal_wellness', blocks: ['pw_service_card', 'pw_service_detail', 'stylist_profile', 'pw_appointment', 'before_after', 'membership_tier', 'pw_client_review', 'intake_form', 'pw_product_shop'] },
  { id: 'nail_lash', name: 'Nail & Lash Studio', industryId: 'personal_wellness', blocks: ['pw_service_card', 'pw_category_browser', 'stylist_profile', 'pw_appointment', 'before_after', 'gift_card', 'pw_client_review', 'loyalty_progress'] },
  { id: 'tattoo_piercing', name: 'Tattoo & Piercing', industryId: 'personal_wellness', blocks: ['pw_service_card', 'stylist_profile', 'pw_appointment', 'before_after', 'pw_client_review', 'intake_form'] },
  { id: 'weight_nutrition', name: 'Weight & Nutrition', industryId: 'personal_wellness', blocks: ['pw_service_card', 'stylist_profile', 'pw_appointment', 'membership_tier', 'before_after', 'pw_client_review', 'intake_form'] },
];

const PW_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Service Catalog', color: '#9333ea' },
  people: { label: 'Staff & Therapists', color: '#ec4899' },
  booking: { label: 'Appointments', color: '#15803d' },
  pricing: { label: 'Membership & Pricing', color: '#b45309' },
  proof: { label: 'Results & Reviews', color: '#be185d' },
  marketing: { label: 'Packages & Gifts', color: '#ec4899' },
  scheduling: { label: 'Class Schedule', color: '#1d4ed8' },
  retail: { label: 'Retail Products', color: '#0f766e' },
  retention: { label: 'Loyalty & Rewards', color: '#9333ea' },
  operations: { label: 'Client Intake', color: '#b45309' },
};

export const PW_CONFIG: VerticalConfig = {
  id: 'personal_wellness',
  industryId: 'personal_wellness',
  name: 'Personal Care & Wellness',
  iconName: 'Heart',
  accentColor: '#9333ea',
  blocks: PW_BLOCKS,
  subVerticals: PW_SUBVERTICALS,
  families: PW_FAMILIES,
};