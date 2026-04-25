// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#92400e', priLt: '#b45309', priBg: 'rgba(146,64,14,0.06)', priBg2: 'rgba(146,64,14,0.12)',
  acc: '#1d4ed8', accBg: 'rgba(29,78,216,0.06)', accBg2: 'rgba(29,78,216,0.14)',
  bg: '#faf8f5',
};

function MiniServiceCard() {
  const svcs = [
    { name: 'Full Home Deep Clean', cat: 'Cleaning', dur: '3-4 hr', price: 180, rating: 4.9, booked: 640, img: 'linear-gradient(135deg, #fef3c7, #f59e0b, #92400e)', badge: 'Popular' },
    { name: 'Electrical Panel Upgrade', cat: 'Electrical', dur: '4-6 hr', price: 850, rating: 4.8, booked: 210, img: 'linear-gradient(135deg, #dbeafe, #3b82f6, #1d4ed8)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {svcs.map((s, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 54, height: 54, borderRadius: 8, background: s.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.tool} size={18} color="rgba(255,255,255,0.5)" stroke={1.3} />
              {s.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.pri}>{s.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{s.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Tag color={T.pri} bg={T.priBg}>{s.cat}</Tag>
                <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{s.dur}</span>
                <span style={{ fontSize: '7px', color: T.t4 }}>{s.booked} booked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>from {fmt(s.price)}</span>
                  <Stars r={s.rating} size={7} />
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

function MiniCategoryBrowser() {
  const cats = [
    { name: 'Plumbing', count: 8, bg: 'linear-gradient(135deg, #dbeafe, #3b82f6)' },
    { name: 'Electrical', count: 10, bg: 'linear-gradient(135deg, #fef3c7, #f59e0b)' },
    { name: 'Cleaning', count: 6, bg: 'linear-gradient(135deg, #d1fae5, #34d399)' },
    { name: 'Painting', count: 5, bg: 'linear-gradient(135deg, #fce7f3, #ec4899)' },
    { name: 'Pest Control', count: 4, bg: 'linear-gradient(135deg, #fee2e2, #ef4444)' },
    { name: 'Landscaping', count: 7, bg: 'linear-gradient(135deg, #dcfce7, #22c55e)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
      {cats.map(c => (
        <div key={c.name} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ height: 28, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I d={ic.tool} size={14} color="rgba(255,255,255,0.7)" stroke={1.5} />
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

function MiniTechnicianCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I d={ic.user} size={20} color="rgba(255,255,255,0.8)" stroke={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Raj Kumar</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Licensed Electrician</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>12 years -- Certified Master Electrician</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '1,800+', l: 'Jobs' }, { v: '12yr', l: 'Exp.' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['Wiring', 'Panel Upgrades', 'Smart Home', 'EV Chargers', 'Lighting'].map(s => (
            <span key={s} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>View Work</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Request Quote</button>
      </div>
    </div>
  );
}

function MiniEstimateBuilder() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.dollar} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimate</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Bathroom Renovation -- Master Bath</div>
        </div>
        {[
          { l: 'Demolition & disposal', v: '$600' },
          { l: 'Plumbing rough-in', v: '$1,200' },
          { l: 'Tile & grouting (floor + walls)', v: '$2,400' },
          { l: 'Fixtures & installation', v: '$1,800' },
          { l: 'Electrical (lighting + exhaust)', v: '$650' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{item.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 600, color: T.t1 }}>{item.v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Estimated total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(6650)}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          <button style={{ flex: 1, padding: '7px', borderRadius: '6px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '9px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Request Changes</button>
          <button style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', background: T.pri, fontSize: '9px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Approve Estimate</button>
        </div>
      </div>
    </div>
  );
}

function MiniJobScheduler() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schedule Service</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ d: 'Mon', n: '14' }, { d: 'Tue', n: '15', sel: true }, { d: 'Wed', n: '16' }, { d: 'Thu', n: '17' }].map(day => (
            <div key={day.n} style={{ flex: 1, padding: '5px 2px', borderRadius: '6px', textAlign: 'center', border: day.sel ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: day.sel ? T.accBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '7px', color: T.t4 }}>{day.d}</div>
              <div style={{ fontSize: '11px', fontWeight: day.sel ? 700 : 500, color: day.sel ? T.acc : T.t1 }}>{day.n}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['8-10 AM', '10-12 PM', '1-3 PM', '3-5 PM'].map((t, i) => (
            <span key={t} style={{ flex: 1, textAlign: 'center', padding: '5px 2px', borderRadius: '5px', fontSize: '8px', border: i === 1 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 1 ? T.accBg : T.surface, color: i === 1 ? T.acc : T.t1, fontWeight: i === 1 ? 600 : 400, cursor: 'pointer' }}>{t}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Tue 10-12 PM</button>
      </div>
    </div>
  );
}

function MiniJobTracker() {
  const steps = ['Requested', 'Assigned', 'En Route', 'In Progress', 'Completed'];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.tool} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Job Status</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.pri, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.pri, fontWeight: 500 }}>Live</span></span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '4px 7px', background: T.priBg, borderRadius: '5px', marginBottom: '6px' }}>
          <div style={{ fontSize: '7px', color: T.t4 }}>Job #HP-4821 -- Plumbing</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.pri }}>Technician arriving in 15 min</div>
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

function MiniBeforeAfter() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.camera} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Project Gallery</span>
      </div>
      {[
        { project: 'Kitchen Renovation', duration: '3 weeks', tag: 'Renovation' },
        { project: 'Backyard Landscaping', duration: '2 weeks', tag: 'Landscaping' },
      ].map((r, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
            <div style={{ flex: 1, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #e5e7eb, #9ca3af)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 3 }}>Before</span>
            </div>
            <div style={{ flex: 1, height: 40, borderRadius: 6, background: 'linear-gradient(135deg, #fef3c7, #b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '7px', fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: 3 }}>After</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag color={T.pri} bg={T.priBg}>{r.tag}</Tag>
            <span style={{ fontSize: '8px', color: T.t2 }}>{r.project}</span>
            <span style={{ fontSize: '7px', color: T.t4, marginLeft: 'auto' }}>{r.duration}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniServiceRequest() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.send} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Service Request</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Repair', sel: true }, { l: 'Installation' }, { l: 'Maintenance' }, { l: 'Inspection' }].map(c => (
            <div key={c.l} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px', borderRadius: '6px', border: c.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: c.sel ? T.priBg : T.surface, cursor: 'pointer' }}>
              <span style={{ fontSize: '8px', fontWeight: c.sel ? 600 : 400, color: c.sel ? T.pri : T.t2 }}>{c.l}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '4px 7px', background: T.bg, borderRadius: '5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <I d={ic.upload} size={10} color={T.t4} />
          <span style={{ fontSize: '8px', color: T.t4 }}>Attach photos of the issue (optional)</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Submit Request</button>
      </div>
    </div>
  );
}

function MiniMaintenancePlan() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Maintenance Plans</span>
      </div>
      {[
        { name: 'Basic Home Care', price: 49, freq: '/month', perks: 'Monthly inspection + 1 service call', sel: false },
        { name: 'Premium Protection', price: 99, freq: '/month', perks: 'Bi-weekly visits + priority response + 15% off parts', sel: true, badge: 'Best Value' },
        { name: 'Full Coverage', price: 179, freq: '/month', perks: 'Weekly visits + 24/7 emergency + all parts included', sel: false },
      ].map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: p.sel ? T.priBg : 'transparent' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: p.sel ? `5px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>{p.name}</span>
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

function MiniEmergencyCard() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.red}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.redBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.alert} size={12} color={T.red} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.red, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Emergency Service</span>
        <Tag color="#fff" bg={T.red}>24/7</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[
          { name: 'Burst Pipe / Water Leak', time: 'Response: 30-60 min', color: T.blue },
          { name: 'Electrical Emergency', time: 'Response: 30-60 min', color: T.amber },
          { name: 'Gas Leak Detection', time: 'Response: ASAP', color: T.red },
          { name: 'Lockout Service', time: 'Response: 20-40 min', color: T.pri },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: `${e.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.alert} size={11} color={e.color} stroke={1.5} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{e.name}</div>
              <div style={{ fontSize: '7px', color: e.color }}>{e.time}</div>
            </div>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.red, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Call Emergency Line</button>
      </div>
    </div>
  );
}

function MiniServiceHistory() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clock} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Service History</span>
      </div>
      {[
        { job: 'Drain Cleaning -- Kitchen', date: 'Mar 28', tech: 'Raj K.', cost: '$120', status: 'Completed', color: T.green },
        { job: 'AC Filter Replacement', date: 'Feb 15', tech: 'Amit S.', cost: '$85', status: 'Completed', color: T.green },
        { job: 'Bathroom Faucet Install', date: 'Jan 22', tech: 'Raj K.', cost: '$210', status: 'Completed', color: T.green },
      ].map((h, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{h.job}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{h.date} -- {h.tech}</div>
          </div>
          <span style={{ fontSize: '9px', fontWeight: 600, color: T.pri }}>{h.cost}</span>
          <Tag color={h.color} bg={`${h.color}10`}>{h.status}</Tag>
        </div>
      ))}
    </div>
  );
}

function MiniWarrantyCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Work Guarantee</span>
      </div>
      {[
        { name: 'Plumbing Work', coverage: '1 year parts & labor', status: 'Active', color: T.green },
        { name: 'Electrical Installation', coverage: '2 year warranty', status: 'Active', color: T.green },
        { name: 'Painting (Interior)', coverage: '6 month touch-up', status: 'Expiring', color: T.amber },
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

function MiniClientReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.8</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Work quality', v: 96 }, { l: 'Punctuality', v: 94 }, { l: 'Cleanliness', v: 92 }, { l: 'Value', v: 90 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 94 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'SM', name: 'Sneha M.', text: 'Raj fixed our leaking pipe in under an hour. Clean work, fair pricing. Already booked for the AC service.', ago: '4d', type: 'Plumbing' },
        { init: 'AK', name: 'Arun K.', text: 'Deep clean was thorough. The team was professional and left the house spotless.', ago: '2w', type: 'Cleaning' },
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

const HP_BLOCKS: VerticalBlockDef[] = [
  { id: 'hp_service_card', family: 'catalog', label: 'Service Card', stage: 'discovery', desc: 'Home service with category, duration, starting price, booking count', preview: MiniServiceCard, intents: ['services', 'plumbing', 'electrical', 'cleaning', 'repair', 'install'], module: 'home_property_catalog', status: 'active', engines: ['lead', 'booking'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'hp_category_browser', family: 'catalog', label: 'Category Browser', stage: 'discovery', desc: 'Visual grid of home service categories with service counts', preview: MiniCategoryBrowser, intents: ['categories', 'browse', 'what do you offer', 'types'], module: 'home_property_catalog', status: 'active', engines: ['lead', 'booking'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'hp_technician', family: 'people', label: 'Technician Profile', stage: 'discovery', desc: 'Skilled worker card with license, specialties, job count, rating', preview: MiniTechnicianCard, intents: ['technician', 'plumber', 'electrician', 'who', 'team'], module: 'home_property_people', status: 'active', engines: ['lead', 'booking'], reads: ['name', 'description', 'image_url', 'subtitle', 'badges'] },
  { id: 'hp_estimate', family: 'pricing', label: 'Estimate Builder', stage: 'showcase', desc: 'Line-item cost breakdown with labor, parts, total, approve/revise actions', preview: MiniEstimateBuilder, intents: ['estimate', 'quote', 'how much', 'cost', 'pricing', 'budget'], module: 'home_property_pricing', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'price', 'currency'] },
  { id: 'hp_scheduler', family: 'booking', label: 'Job Scheduler', stage: 'conversion', desc: 'Date strip, time window selector, confirmation CTA', preview: MiniJobScheduler, intents: ['schedule', 'book', 'appointment', 'when', 'available'], module: 'home_property_booking', status: 'active', engines: ['lead', 'booking'], reads: ['name', 'description', 'image_url', 'date', 'time', 'service_name'] },
  { id: 'hp_job_tracker', family: 'operations', label: 'Job Tracker', stage: 'social_proof', desc: 'Live 5-step pipeline with technician ETA', preview: MiniJobTracker, intents: ['status', 'where is technician', 'ETA', 'progress', 'tracking'], module: 'home_property_operations', status: 'active', engines: ['service'], reads: ['name', 'description', 'image_url', 'status', 'last_updated'] },
  { id: 'hp_before_after', family: 'proof', label: 'Before / After Gallery', stage: 'social_proof', desc: 'Side-by-side project photos with category tag and duration', preview: MiniBeforeAfter, intents: ['results', 'before after', 'portfolio', 'past work', 'gallery'], module: 'home_property_proof', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'rating', 'review_count'] },
  { id: 'hp_service_request', family: 'intake', label: 'Service Request', stage: 'conversion', desc: 'Type selector, photo upload prompt, description, submit CTA', preview: MiniServiceRequest, intents: ['request', 'report', 'fix', 'broken', 'need help', 'issue'], module: 'home_property_intake', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url'] },
  { id: 'hp_maintenance_plan', family: 'subscription', label: 'Maintenance Plan', stage: 'showcase', desc: 'Tier comparison with visit frequency, response time, parts coverage', preview: MiniMaintenancePlan, intents: ['maintenance', 'plan', 'subscription', 'monthly', 'annual', 'preventive'], module: 'home_property_subscription', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url'] },
  { id: 'hp_emergency', family: 'urgent', label: 'Emergency Service', stage: 'conversion', desc: 'Emergency types with response times, 24/7 badge, call CTA', preview: MiniEmergencyCard, intents: ['emergency', 'urgent', 'burst pipe', 'gas leak', 'lockout', '24/7'], module: 'home_property_urgent', status: 'active', engines: ['booking'], reads: ['name', 'description', 'image_url'] },
  { id: 'hp_history', family: 'tracking', label: 'Service History', stage: 'social_proof', desc: 'Past jobs with date, technician, cost, completion status', preview: MiniServiceHistory, intents: ['history', 'past jobs', 'previous', 'records', 'what was done'], module: 'home_property_tracking', status: 'active', engines: ['service'], reads: ['name', 'description', 'image_url', 'status', 'last_updated'] },
  { id: 'hp_warranty', family: 'trust', label: 'Work Guarantee', stage: 'showcase', desc: 'Warranty plans per service type with coverage term and status', preview: MiniWarrantyCard, intents: ['warranty', 'guarantee', 'coverage', 'what is covered'], module: 'home_property_trust', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'badges'] },
  { id: 'hp_review', family: 'social_proof', label: 'Customer Reviews', stage: 'social_proof', desc: 'Home-service criteria bars with service-type-tagged reviews', preview: MiniClientReview, intents: ['reviews', 'ratings', 'testimonials', 'feedback'], module: 'home_property_social_proof', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'rating', 'review_count'] },
  {
    id: 'hp_area_coverage', family: 'info', label: 'Service Area', stage: 'discovery', desc: 'Covered neighborhoods/zip codes with availability status', preview: function AreaCoverage() {
      return (
        <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <I d={ic.map} size={11} color={T.t1} stroke={2} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Service Area</span>
          </div>
          <div style={{ padding: '6px 10px' }}>
            <div style={{ height: 48, borderRadius: 6, background: 'linear-gradient(135deg, #e0f2fe, #bae6fd, #7dd3fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
              <I d={ic.map} size={20} color="rgba(12,74,110,0.3)" stroke={1.5} />
            </div>
            {[
              { area: 'Downtown & Central', status: 'Available', time: 'Same day', color: T.green },
              { area: 'North Suburbs', status: 'Available', time: 'Next day', color: T.green },
              { area: 'South County', status: 'Limited', time: '2-3 days', color: T.amber },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
                <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{a.area}</span>
                <span style={{ fontSize: '7px', color: T.t4 }}>{a.time}</span>
                <Tag color={a.color} bg={`${a.color}10`}>{a.status}</Tag>
              </div>
            ))}
          </div>
        </div>
      );
    }, intents: ['area', 'coverage', 'do you serve', 'zip code', 'neighborhood', 'location'], module: 'home_property_info', status: 'active', reads: ['name', 'description', 'image_url']
  },
];

const HP_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'plumbing_electrical', name: 'Plumbing & Electrical', industryId: 'home_property', blocks: ['hp_service_card', 'hp_technician', 'hp_estimate', 'hp_scheduler', 'hp_job_tracker', 'hp_emergency', 'hp_warranty', 'hp_history', 'hp_review', 'hp_area_coverage'] },
  { id: 'appliance_repair', name: 'Appliance Repair', industryId: 'home_property', blocks: ['hp_service_card', 'hp_technician', 'hp_estimate', 'hp_scheduler', 'hp_job_tracker', 'hp_warranty', 'hp_history', 'hp_review'] },
  { id: 'painting_renovation', name: 'Painting & Renovation', industryId: 'home_property', blocks: ['hp_service_card', 'hp_technician', 'hp_estimate', 'hp_scheduler', 'hp_before_after', 'hp_job_tracker', 'hp_warranty', 'hp_review'] },
  { id: 'cleaning_housekeeping', name: 'Cleaning & Housekeeping', industryId: 'home_property', blocks: ['hp_service_card', 'hp_category_browser', 'hp_scheduler', 'hp_maintenance_plan', 'hp_review', 'hp_area_coverage'] },
  { id: 'pest_control', name: 'Pest Control', industryId: 'home_property', blocks: ['hp_service_card', 'hp_scheduler', 'hp_maintenance_plan', 'hp_service_request', 'hp_warranty', 'hp_review', 'hp_area_coverage'] },
  { id: 'landscaping_gardening', name: 'Landscaping & Gardening', industryId: 'home_property', blocks: ['hp_service_card', 'hp_technician', 'hp_estimate', 'hp_scheduler', 'hp_before_after', 'hp_maintenance_plan', 'hp_review', 'hp_area_coverage'] },
];

const HP_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Service Catalog', color: '#92400e' },
  people: { label: 'Technicians', color: '#b45309' },
  pricing: { label: 'Estimates & Pricing', color: '#b45309' },
  booking: { label: 'Scheduling', color: '#1d4ed8' },
  operations: { label: 'Job Tracking', color: '#1d4ed8' },
  proof: { label: 'Project Gallery', color: '#be185d' },
  intake: { label: 'Service Requests', color: '#92400e' },
  subscription: { label: 'Maintenance Plans', color: '#15803d' },
  urgent: { label: 'Emergency', color: '#b91c1c' },
  tracking: { label: 'History', color: '#0f766e' },
  trust: { label: 'Warranty & Trust', color: '#15803d' },
  social_proof: { label: 'Reviews', color: '#be185d' },
  info: { label: 'Service Area', color: '#7a7a70' },
};

export const HP_CONFIG: VerticalConfig = {
  id: 'home_property',
  industryId: 'home_property',
  name: 'Home & Property Services',
  iconName: 'Wrench',
  accentColor: '#92400e',
  blocks: HP_BLOCKS,
  subVerticals: HP_SUBVERTICALS,
  families: HP_FAMILIES,
};