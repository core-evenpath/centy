// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#164e63', priLt: '#0e7490', priBg: 'rgba(22,78,99,0.06)', priBg2: 'rgba(22,78,99,0.12)',
  acc: '#7e22ce', accBg: 'rgba(126,34,206,0.06)', accBg2: 'rgba(126,34,206,0.14)',
  bg: '#f8f9fa',
};

function MiniServiceDirectory() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.building} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Services & Departments</span>
      </div>
      {[
        { name: 'Birth & Death Certificates', dept: 'Civil Registry', time: '2-5 days', fee: fmt(25), color: T.pri },
        { name: 'Business License Application', dept: 'Commerce', time: '10-15 days', fee: fmt(150), color: T.teal },
        { name: 'Property Tax Payment', dept: 'Revenue', time: 'Instant', fee: 'Varies', color: T.green },
        { name: 'Water/Sewer Connection', dept: 'Utilities', time: '5-10 days', fee: fmt(200), color: T.blue },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.file} size={12} color={s.color} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{s.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <Tag color={s.color} bg={`${s.color}10`}>{s.dept}</Tag>
              <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{s.time}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: T.pri }}>{s.fee}</div>
            <button style={{ fontSize: '6px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '2px 6px', borderRadius: '3px', cursor: 'pointer', marginTop: '1px' }}>Apply</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniApplicationTracker() {
  const steps = ['Submitted', 'Under Review', 'Processing', 'Approved', 'Issued'];
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.clip} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Application Status</span>
        <Tag color={T.amber} bg={T.amberBg}>In Progress</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '4px 7px', background: T.bg, borderRadius: '5px', marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Business License -- Food Service</div>
          <div style={{ fontSize: '7px', color: T.t3 }}>Ref: GOV-2026-48291</div>
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

function MiniDocumentPortal() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.file} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Forms & Documents</span>
      </div>
      {[
        { name: 'Birth Certificate Application', type: 'PDF', cat: 'Civil Registry' },
        { name: 'Business License Application', type: 'Online', cat: 'Commerce' },
        { name: 'Property Tax Declaration', type: 'PDF', cat: 'Revenue' },
        { name: 'Building Permit Request', type: 'Online', cat: 'Planning' },
      ].map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.file} size={11} color={T.pri} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{d.name}</div>
            <Tag color={T.pri} bg={T.priBg}>{d.cat}</Tag>
          </div>
          <button style={{ fontSize: '7px', fontWeight: 600, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}>{d.type === 'Online' ? 'Start' : 'Download'}</button>
        </div>
      ))}
    </div>
  );
}

function MiniEventCalendar() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.cal} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Upcoming Events</span>
      </div>
      {[
        { title: 'Town Hall Meeting', date: 'Apr 18, 6:30 PM', loc: 'City Hall', type: 'Public', color: T.pri },
        { title: 'Community Clean-up Drive', date: 'Apr 20, 8:00 AM', loc: 'Central Park', type: 'Volunteer', color: T.green },
        { title: 'Small Business Workshop', date: 'Apr 22, 2:00 PM', loc: 'Library', type: 'Workshop', color: T.acc },
      ].map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `${e.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.users} size={12} color={e.color} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{e.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <I d={ic.clock} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{e.date}</span>
              <Tag color={e.color} bg={`${e.color}10`}>{e.type}</Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}><I d={ic.map} size={7} color={T.t4} /><span style={{ fontSize: '7px', color: T.t4 }}>{e.loc}</span></div>
          </div>
          <Tag color={T.green} bg={T.greenBg}>Free</Tag>
        </div>
      ))}
    </div>
  );
}

function MiniDonation() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.heart} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support Our Mission</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '9px', color: T.t2, lineHeight: 1.4, marginBottom: '5px' }}>Your donation funds clean water access for 12 rural communities.</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[25, 50, 100, 250].map((amt, i) => (
            <div key={amt} style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', textAlign: 'center', border: i === 2 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 2 ? T.accBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '12px', fontWeight: i === 2 ? 700 : 600, color: i === 2 ? T.acc : T.t1 }}>{fmt(amt)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'One-time', sel: true }, { l: 'Monthly' }, { l: 'Annual' }].map(f => (
            <span key={f.l} style={{ flex: 1, textAlign: 'center', padding: '4px', borderRadius: '4px', fontSize: '8px', border: f.sel ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: f.sel ? T.accBg : T.surface, color: f.sel ? T.acc : T.t2, fontWeight: f.sel ? 600 : 400, cursor: 'pointer' }}>{f.l}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Donate {fmt(100)}</button>
      </div>
    </div>
  );
}

function MiniImpactReport() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.chart} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Impact Report -- 2025</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '6px' }}>
          {[{ v: '12', l: 'Communities', color: T.pri }, { v: '$2.4M', l: 'Funds deployed', color: T.green }, { v: '34K', l: 'People reached', color: T.acc }].map(s => (
            <div key={s.l} style={{ padding: '6px 4px', background: `${s.color}08`, borderRadius: '6px', textAlign: 'center', border: `1px solid ${s.color}15` }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: s.color }}>{s.v}</div>
              <div style={{ fontSize: '5px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {['8 clean water wells constructed', '3,200 students received supplies', '4 community health clinics funded', '92% donor satisfaction rating'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
            <I d={ic.check} size={7} color={T.green} stroke={2.5} />
            <span style={{ fontSize: '8px', color: T.t2 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniVolunteerSignup() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.green}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.greenBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.users} size={12} color={T.green} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volunteer With Us</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '5px' }}>
          {[{ l: 'Education', sel: true }, { l: 'Healthcare' }, { l: 'Environment', sel: true }, { l: 'Food Drive' }, { l: 'Admin/Tech' }].map(a => (
            <span key={a.l} style={{ fontSize: '8px', padding: '3px 7px', borderRadius: '9999px', border: a.sel ? `2px solid ${T.green}` : `1px solid ${T.bdr}`, background: a.sel ? T.greenBg : T.surface, color: a.sel ? T.green : T.t2, fontWeight: a.sel ? 600 : 400, cursor: 'pointer' }}>{a.l}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.green, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Sign Up to Volunteer</button>
      </div>
    </div>
  );
}

function MiniProgramCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.layers} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Programs & Initiatives</span>
      </div>
      {[
        { name: 'Clean Water Initiative', status: 'Active', budget: '$840K', progress: 68, color: T.blue },
        { name: 'Youth Education Fund', status: 'Active', budget: '$420K', progress: 85, color: T.acc },
        { name: 'Community Health Clinics', status: 'Planning', budget: '$600K', progress: 15, color: T.pink },
      ].map((p, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1, flex: 1 }}>{p.name}</span>
            <Tag color={p.status === 'Active' ? T.green : T.amber} bg={p.status === 'Active' ? T.greenBg : T.amberBg}>{p.status}</Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ flex: 1, height: '4px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${p.progress}%`, height: '100%', background: p.color, borderRadius: '2px' }} /></div>
            <span style={{ fontSize: '7px', fontWeight: 600, color: p.color }}>{p.progress}%</span>
          </div>
          <div style={{ fontSize: '7px', color: T.t4, marginTop: '1px' }}>{p.budget}</div>
        </div>
      ))}
    </div>
  );
}

function MiniBillPay() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.dollar} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pay Bill</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '8px', color: T.t4 }}>Account: WTR-28471-A</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Water & Sewer -- April 2026</div>
        </div>
        {[{ l: 'Water usage (4,200 gal)', v: '$38.50' }, { l: 'Sewer service', v: '$22.00' }, { l: 'Stormwater fee', v: '$8.50' }].map((line, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{line.l}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{line.v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Amount due</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>$69.00</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>Pay $69.00</button>
      </div>
    </div>
  );
}

function MiniOutageStatus() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.zap} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Service Status</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, display: 'inline-block' }} /><span style={{ fontSize: '7px', color: T.green, fontWeight: 500 }}>Live</span></span>
      </div>
      {[
        { svc: 'Electricity', status: 'Operational', color: T.green },
        { svc: 'Water Supply', status: 'Maintenance', color: T.amber, note: 'Apr 18, 10 PM - Apr 19, 4 AM' },
        { svc: 'Natural Gas', status: 'Operational', color: T.green },
        { svc: 'Internet / Fiber', status: 'Operational', color: T.green },
        { svc: 'Waste Collection', status: 'Delayed', color: T.red, note: 'Thu moved to Fri this week' },
      ].map((s, i) => (
        <div key={i} style={{ padding: '5px 10px', borderBottom: i < 4 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{s.svc}</span>
            <Tag color={s.color} bg={`${s.color}10`}>{s.status}</Tag>
          </div>
          {s.note && <div style={{ fontSize: '7px', color: s.color, marginTop: '2px' }}>{s.note}</div>}
        </div>
      ))}
    </div>
  );
}

function MiniComplaintFiling() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.send} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Submit a Request</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Report Issue', sel: true, color: T.acc }, { l: 'Feedback' }, { l: 'Information' }, { l: 'Complaint' }].map(c => (
            <div key={c.l} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px', borderRadius: '6px', border: c.sel ? `2px solid ${c.color || T.pri}` : `1px solid ${T.bdr}`, background: c.sel ? `${(c.color || T.pri)}08` : T.surface, cursor: 'pointer' }}>
              <span style={{ fontSize: '8px', fontWeight: c.sel ? 600 : 400, color: c.sel ? (c.color || T.pri) : T.t2 }}>{c.l}</span>
            </div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Submit Request</button>
      </div>
    </div>
  );
}

function MiniOfficeLocator() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.map} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Office Locator</span>
      </div>
      {[
        { name: 'City Hall -- Main Office', addr: '100 Civic Center Dr', hours: 'Mon-Fri 8 AM - 5 PM', status: 'Open', color: T.green },
        { name: 'Revenue & Tax Office', addr: '200 Commerce St, Ste 4', hours: 'Mon-Fri 9 AM - 4 PM', status: 'Open', color: T.green },
        { name: 'Public Library -- Main', addr: '50 Knowledge Ave', hours: 'Mon-Sat 9 AM - 8 PM', status: 'Open', color: T.green },
      ].map((o, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.building} size={11} color={T.pri} stroke={1.5} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{o.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
                <span style={{ fontSize: '7px', color: T.t4 }}>{o.addr}</span>
                <Tag color={o.color} bg={`${o.color}10`}>{o.status}</Tag>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '7px', color: T.t4, marginTop: '2px', marginLeft: '28px' }}>{o.hours}</div>
        </div>
      ))}
    </div>
  );
}

function MiniAppointmentBooker() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Book Appointment</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Civil Registry', sel: true }, { l: 'Revenue' }, { l: 'Planning' }].map(d => (
            <span key={d.l} style={{ flex: 1, textAlign: 'center', padding: '5px 3px', borderRadius: '5px', fontSize: '8px', border: d.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: d.sel ? T.priBg : T.surface, color: d.sel ? T.pri : T.t2, fontWeight: d.sel ? 600 : 400, cursor: 'pointer' }}>{d.l}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'].map((t, i) => (
            <div key={t} style={{ padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '8px', border: i === 3 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 3 ? T.priBg : T.surface, color: i === 3 ? T.pri : T.t1, fontWeight: i === 3 ? 600 : 400, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Tue Apr 22, 1 PM</button>
      </div>
    </div>
  );
}

function MiniCommunityFeedback() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.2</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Responsiveness', v: 84 }, { l: 'Accessibility', v: 88 }, { l: 'Transparency', v: 78 }, { l: 'Process clarity', v: 80 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 85 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'JR', name: 'Jennifer R.', text: 'Birth certificate issued in 3 days. Online portal was easy to navigate.', ago: '1w', type: 'Civil Registry' },
        { init: 'DM', name: 'David M.', text: 'Property tax payment was seamless online. Appointment system is helpful.', ago: '3w', type: 'Revenue' },
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

const PU_BLOCKS: VerticalBlockDef[] = [
  { id: 'pu_service_directory', family: 'services', label: 'Service Directory', stage: 'discovery', desc: 'Government/public services with department tags, processing times, fees', preview: MiniServiceDirectory, intents: ['services', 'departments', 'apply', 'certificate', 'license', 'permit', 'tax'], module: 'moduleItems', status: 'active' },
  { id: 'pu_application_tracker', family: 'tracking', label: 'Application Tracker', stage: 'social_proof', desc: 'Multi-step status pipeline with ref number and ETA', preview: MiniApplicationTracker, intents: ['status', 'track', 'application', 'progress', 'reference number'], module: null, status: 'active' },
  { id: 'pu_document_portal', family: 'forms', label: 'Forms & Documents', stage: 'discovery', desc: 'Downloadable and online forms organized by department', preview: MiniDocumentPortal, intents: ['forms', 'documents', 'download', 'application form', 'PDF'], module: 'moduleItems', status: 'active' },
  { id: 'pu_event_calendar', family: 'community', label: 'Community Events', stage: 'discovery', desc: 'Upcoming public events, meetings, workshops, festivals', preview: MiniEventCalendar, intents: ['events', 'town hall', 'meeting', 'festival', 'workshop', 'calendar'], module: 'moduleItems', status: 'active' },
  { id: 'pu_donation', family: 'fundraising', label: 'Donation', stage: 'conversion', desc: 'Preset amount grid, frequency selector, trust badges', preview: MiniDonation, intents: ['donate', 'give', 'support', 'contribute', 'fund', 'charity'], module: null, status: 'active' },
  { id: 'pu_impact_report', family: 'transparency', label: 'Impact Report', stage: 'social_proof', desc: '3-stat hero grid, key outcomes checklist, next-year goal', preview: MiniImpactReport, intents: ['impact', 'results', 'transparency', 'annual report', 'outcomes'], module: null, status: 'active' },
  { id: 'pu_volunteer', family: 'community', label: 'Volunteer Sign-up', stage: 'conversion', desc: 'Interest area multi-select, availability selector, sign-up CTA', preview: MiniVolunteerSignup, intents: ['volunteer', 'help', 'sign up', 'join', 'community service'], module: null, status: 'active' },
  { id: 'pu_program_card', family: 'programs', label: 'Program Card', stage: 'discovery', desc: 'Active programs with status, budget, progress bar', preview: MiniProgramCard, intents: ['programs', 'initiatives', 'projects', 'mission', 'causes'], module: 'moduleItems', status: 'active' },
  { id: 'pu_bill_pay', family: 'billing', label: 'Bill Payment', stage: 'conversion', desc: 'Account context, line-item breakdown, total due, pay CTA', preview: MiniBillPay, intents: ['pay bill', 'payment', 'account', 'balance', 'utility bill', 'water bill'], module: null, status: 'active' },
  { id: 'pu_outage_status', family: 'operations', label: 'Service Status', stage: 'social_proof', desc: 'Live status per utility with operational/maintenance/delayed indicators', preview: MiniOutageStatus, intents: ['outage', 'status', 'service down', 'maintenance', 'power'], module: null, status: 'active' },
  { id: 'pu_complaint', family: 'engagement', label: 'Request / Complaint', stage: 'conversion', desc: 'Category selector, subject input, details textarea, submit CTA', preview: MiniComplaintFiling, intents: ['report', 'complaint', 'issue', 'feedback', 'problem', 'pothole'], module: null, status: 'active' },
  { id: 'pu_office_locator', family: 'info', label: 'Office Locator', stage: 'discovery', desc: 'Location list with address, hours, open/closed status', preview: MiniOfficeLocator, intents: ['office', 'location', 'where', 'address', 'hours', 'directions'], module: null, status: 'active' },
  { id: 'pu_appointment', family: 'booking', label: 'Appointment Scheduler', stage: 'conversion', desc: 'Department selector, date strip, time grid, confirmation CTA', preview: MiniAppointmentBooker, intents: ['appointment', 'book', 'schedule', 'visit', 'in person'], module: null, status: 'active' },
  { id: 'pu_feedback', family: 'social_proof', label: 'Community Feedback', stage: 'social_proof', desc: 'Public-sector criteria bars, department-tagged feedback', preview: MiniCommunityFeedback, intents: ['reviews', 'feedback', 'satisfaction', 'ratings', 'citizen feedback'], module: null, status: 'active' },
];

const PU_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'government_office', name: 'Government Offices', industryId: 'public_nonprofit', blocks: ['pu_service_directory', 'pu_application_tracker', 'pu_document_portal', 'pu_appointment', 'pu_bill_pay', 'pu_complaint', 'pu_office_locator', 'pu_outage_status', 'pu_feedback'] },
  { id: 'ngo_nonprofit', name: 'NGOs & Non-Profits', industryId: 'public_nonprofit', blocks: ['pu_program_card', 'pu_donation', 'pu_impact_report', 'pu_volunteer', 'pu_event_calendar', 'pu_document_portal', 'pu_feedback'] },
  { id: 'religious_org', name: 'Religious Organizations', industryId: 'public_nonprofit', blocks: ['pu_event_calendar', 'pu_donation', 'pu_volunteer', 'pu_program_card', 'pu_office_locator', 'pu_feedback'] },
  { id: 'community_assoc', name: 'Community Associations', industryId: 'public_nonprofit', blocks: ['pu_event_calendar', 'pu_complaint', 'pu_document_portal', 'pu_volunteer', 'pu_office_locator', 'pu_feedback'] },
  { id: 'utilities_infra', name: 'Utilities & Infrastructure', industryId: 'public_nonprofit', blocks: ['pu_bill_pay', 'pu_outage_status', 'pu_service_directory', 'pu_application_tracker', 'pu_complaint', 'pu_appointment', 'pu_office_locator', 'pu_feedback'] },
  { id: 'edu_cultural', name: 'Educational & Cultural', industryId: 'public_nonprofit', blocks: ['pu_event_calendar', 'pu_program_card', 'pu_document_portal', 'pu_donation', 'pu_volunteer', 'pu_office_locator', 'pu_feedback'] },
];

const PU_FAMILIES: Record<string, VerticalFamilyDef> = {
  services: { label: 'Service Directory', color: '#164e63' },
  tracking: { label: 'Application Tracking', color: '#1d4ed8' },
  forms: { label: 'Forms & Documents', color: '#0f766e' },
  community: { label: 'Community', color: '#15803d' },
  fundraising: { label: 'Donations & Giving', color: '#7e22ce' },
  transparency: { label: 'Transparency', color: '#b45309' },
  programs: { label: 'Programs', color: '#7e22ce' },
  billing: { label: 'Bill Payment', color: '#164e63' },
  operations: { label: 'Service Status', color: '#1d4ed8' },
  engagement: { label: 'Requests', color: '#be185d' },
  info: { label: 'Facility Info', color: '#7a7a70' },
  booking: { label: 'Appointments', color: '#15803d' },
  social_proof: { label: 'Feedback', color: '#be185d' },
};

export const PU_CONFIG: VerticalConfig = {
  id: 'public_nonprofit',
  industryId: 'public_nonprofit',
  name: 'Public, Non-Profit & Utilities',
  iconName: 'Building2',
  accentColor: '#164e63',
  blocks: PU_BLOCKS,
  subVerticals: PU_SUBVERTICALS,
  families: PU_FAMILIES,
};