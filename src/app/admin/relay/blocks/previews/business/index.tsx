// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#1e293b', priLt: '#334155', priBg: 'rgba(30,41,59,0.06)', priBg2: 'rgba(30,41,59,0.12)',
  acc: '#7c3aed', accBg: 'rgba(124,58,237,0.06)', accBg2: 'rgba(124,58,237,0.14)',
  bg: '#f8f8f6',
};

function MiniServicePackage() {
  const pkgs = [
    { name: 'Growth Strategy Advisory', type: 'Retainer', price: '5,000', unit: '/month', scope: 'Weekly calls, quarterly roadmap, KPI tracking', icon: ic.chart, badge: 'Popular', rating: 4.9, clients: 48 },
    { name: 'Market Entry Analysis', type: 'Project', price: '12,000', unit: 'fixed', scope: '8-week delivery, 3 workshops, final report', icon: ic.target, rating: 4.7, clients: 124 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {pkgs.map((p, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <I d={p.icon} size={18} color={T.pri} stroke={1.5} />
              {p.badge && <div style={{ position: 'absolute', top: -2, right: -2 }}><Tag color="#fff" bg={T.acc}>{p.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Tag color={p.type === 'Retainer' ? T.acc : T.teal} bg={p.type === 'Retainer' ? T.accBg : T.tealBg}>{p.type}</Tag>
                <I d={ic.users} size={8} color={T.t4} /><span style={{ fontSize: '8px', color: T.t4 }}>{p.clients} clients</span>
              </div>
              <div style={{ fontSize: '8px', color: T.t3, marginTop: '2px' }}>{p.scope}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>${p.price}</span>
                  <span style={{ fontSize: '8px', color: T.t4 }}>{p.unit}</span>
                  <Stars r={p.rating} size={7} />
                </div>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Inquire</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniExpertProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #e0e7ff, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I d={ic.user} size={22} color="rgba(255,255,255,0.8)" stroke={1.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Alexandra Chen, MBA</div>
          <div style={{ fontSize: '9px', color: T.acc, fontWeight: 500 }}>Senior Strategy Consultant</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>McKinsey alum -- 12 years -- Columbia MBA</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '85+', l: 'Projects' }, { v: '12yr', l: 'Exp.' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['Growth Strategy', 'M&A Advisory', 'Market Entry', 'Digital Transformation'].map(s => (
            <span key={s} style={{ fontSize: '7px', padding: '2px 5px', borderRadius: '3px', background: T.priBg, color: T.pri, border: `1px solid ${T.priBg2}` }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderTop: `1px solid ${T.bdr}`, background: T.bg, display: 'flex', gap: '4px', marginTop: '4px' }}>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>View Profile</button>
        <button style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Book Consult</button>
      </div>
    </div>
  );
}

function MiniConsultationBooking() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.cal} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Book a Consultation</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Topic</div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '5px' }}>
          {[{ l: 'Strategy Review', sel: true }, { l: 'New Project' }, { l: 'Legal Matter' }, { l: 'General Inquiry' }].map(t => (
            <span key={t.l} style={{ fontSize: '8px', padding: '4px 8px', borderRadius: '5px', border: t.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: t.sel ? T.priBg : T.surface, color: t.sel ? T.pri : T.t2, fontWeight: t.sel ? 600 : 400, cursor: 'pointer' }}>{t.l}</span>
          ))}
        </div>
        <div style={{ fontSize: '8px', fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Format</div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Video Call', icon: ic.video, sel: true }, { l: 'Phone', icon: ic.phone }, { l: 'In Person', icon: ic.building }].map(f => (
            <div key={f.l} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '6px', borderRadius: '5px', border: f.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: f.sel ? T.priBg : T.surface, cursor: 'pointer' }}>
              <I d={f.icon} size={10} color={f.sel ? T.pri : T.t4} stroke={1.5} />
              <span style={{ fontSize: '8px', fontWeight: f.sel ? 600 : 400, color: f.sel ? T.pri : T.t2 }}>{f.l}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', marginBottom: '5px' }}>
          {['Tue 10 AM', 'Tue 2 PM', 'Wed 9 AM', 'Wed 3 PM', 'Thu 11 AM', 'Fri 10 AM'].map((t, i) => (
            <div key={t} style={{ padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '8px', border: i === 1 ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: i === 1 ? T.priBg : T.surface, color: i === 1 ? T.pri : T.t1, fontWeight: i === 1 ? 600 : 400, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
        <div style={{ padding: '4px 7px', background: T.greenBg, borderRadius: '5px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <I d={ic.clock} size={8} color={T.green} stroke={2} />
          <span style={{ fontSize: '8px', color: T.green }}>30 min discovery call -- complimentary</span>
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Confirm -- Tue Apr 15, 2:00 PM</button>
      </div>
    </div>
  );
}

function MiniProjectScope() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.target} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Project Scope</span>
        <Tag color={T.acc} bg={T.accBg}>Draft</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>Market Entry -- Southeast Asia</div>
        <div style={{ fontSize: '8px', color: T.t3, marginTop: '2px' }}>SaaS expansion feasibility and go-to-market strategy</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '6px', marginBottom: '6px' }}>
          {[{ v: '8 wk', l: 'Timeline' }, { v: '6', l: 'Deliverables' }, { v: '$35K', l: 'Est. Budget' }].map(s => (
            <div key={s.l} style={{ padding: '5px', background: T.bg, borderRadius: '5px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '6px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        {['Market sizing and TAM analysis', 'Competitive landscape mapping', 'Regulatory and compliance review', 'Go-to-market playbook', 'Partner/channel identification', 'Financial model and projections'].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '2px 0' }}>
            <I d={ic.check} size={8} color={T.green} stroke={2.5} />
            <span style={{ fontSize: '8px', color: T.t2 }}>{d}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
          <button style={{ flex: 1, padding: '6px', borderRadius: '6px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Request Changes</button>
          <button style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Accept Scope</button>
        </div>
      </div>
    </div>
  );
}

function MiniCaseStudy() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '48px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #64748b 100%)', display: 'flex', alignItems: 'flex-end', padding: '6px 10px' }}>
        <div>
          <Tag color="#fff" bg="rgba(255,255,255,0.2)">Case Study</Tag>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>FinTech Series B -- Growth Strategy</div>
        </div>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
          <Tag color={T.teal} bg={T.tealBg}>Fintech</Tag>
          <Tag color={T.t2} bg={T.bg}>B2B SaaS</Tag>
        </div>
        <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.4, marginBottom: '4px' }}>Post-Series B payments startup needed to 3x revenue in 18 months while entering two new markets.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
          {[{ v: '3.2x', l: 'Revenue growth', color: T.green }, { v: '2', l: 'New markets', color: T.pri }, { v: '14mo', l: 'Timeline', color: T.teal }].map(s => (
            <div key={s.l} style={{ padding: '5px', background: `${s.color}08`, borderRadius: '5px', textAlign: 'center', border: `1px solid ${s.color}15` }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: s.color }}>{s.v}</div>
              <div style={{ fontSize: '6px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniProposalSummary() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.file} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Engagement Proposal</span>
        <Tag color={T.amber} bg={T.amberBg}>Action Required</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, marginBottom: '2px' }}>Digital Transformation Advisory</div>
        <div style={{ fontSize: '8px', color: T.t3, marginBottom: '5px' }}>Proposal #P-2026-0412 -- Valid until May 15</div>
        {[
          { phase: '1. Discovery & Audit', wk: 'Wk 1-2', fee: '$8,000' },
          { phase: '2. Strategy & Roadmap', wk: 'Wk 3-5', fee: '$15,000' },
          { phase: '3. Implementation Support', wk: 'Wk 6-12', fee: '$24,000' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ fontSize: '9px', color: T.t1, flex: 1, fontWeight: 500 }}>{p.phase}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{p.wk}</span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.pri }}>{p.fee}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Total engagement</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(47000)}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          <button style={{ flex: 1, padding: '7px', borderRadius: '6px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '9px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Download PDF</button>
          <button style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', background: T.acc, fontSize: '9px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Accept Proposal</button>
        </div>
      </div>
    </div>
  );
}

function MiniEngagementTimeline() {
  const phases = [
    { label: 'Discovery & Audit', date: 'Apr 1-14', status: 'done', detail: 'Stakeholder interviews completed' },
    { label: 'Strategy Development', date: 'Apr 15-May 5', status: 'active', detail: 'Workshop 2 of 3 scheduled' },
    { label: 'Roadmap Delivery', date: 'May 6-12', status: 'upcoming', detail: 'Final presentation & handover' },
    { label: 'Implementation Support', date: 'May 13 - Jul 28', status: 'upcoming', detail: 'Bi-weekly check-ins' },
  ];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.activity} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Engagement Progress</span>
        <Tag color={T.green} bg={T.greenBg}>On Track</Tag>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', position: 'relative', paddingBottom: i < phases.length - 1 ? '8px' : '0' }}>
            {i < phases.length - 1 && <div style={{ position: 'absolute', left: 8, top: 18, width: 1, height: 'calc(100% - 12px)', background: p.status === 'done' ? T.green : T.bdr }} />}
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: p.status === 'done' ? T.green : p.status === 'active' ? T.pri : T.bg, border: `2px solid ${p.status === 'done' ? T.green : p.status === 'active' ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              {p.status === 'done' ? <I d={ic.check} size={9} color="#fff" stroke={3} /> : <span style={{ fontSize: '7px', fontWeight: 700, color: p.status === 'active' ? '#fff' : T.t4 }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: p.status === 'active' ? 600 : 400, color: T.t1 }}>{p.label}</span>
                <span style={{ fontSize: '7px', color: T.t4 }}>{p.date}</span>
              </div>
              <div style={{ fontSize: '8px', color: T.t3, marginTop: '1px' }}>{p.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniRetainerStatus() {
  const used = 32; const total = 40;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clock} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Retainer Status</span>
        <span style={{ fontSize: '8px', color: T.t4, marginLeft: 'auto' }}>Apr 2026</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: 48, height: 48, position: 'relative' }}>
            <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke={T.bdr} strokeWidth="4" /><circle cx="24" cy="24" r="20" fill="none" stroke={T.pri} strokeWidth="4" strokeDasharray={`${(used / total) * 125.6} 125.6`} transform="rotate(-90 24 24)" strokeLinecap="round" /></svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '11px', fontWeight: 800, color: T.pri }}>{used}h</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1 }}>Growth Strategy Advisory</div>
            <div style={{ fontSize: '8px', color: T.t3 }}>{total - used} hours remaining this month</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: T.t4, marginBottom: '2px' }}><span>Used</span><span>{used} / {total} hours</span></div>
        <div style={{ height: 6, background: T.bdr, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${(used / total) * 100}%`, height: '100%', background: T.pri, borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '5px', borderTop: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: '8px', color: T.t4 }}>Renews May 1 -- {fmt(5000)}/month</span>
          <span style={{ fontSize: '8px', color: T.pri, fontWeight: 600, cursor: 'pointer' }}>View logs</span>
        </div>
      </div>
    </div>
  );
}

function MiniCredentialBadge() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.award} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Credentials & Licenses</span>
      </div>
      {[
        { name: 'State Bar of California', id: '#298471', status: 'Active', color: T.green },
        { name: 'Certified M&A Advisor', id: 'AM Institute', status: 'Active', color: T.green },
        { name: 'PMP Certification', id: 'PMI #4829174', status: 'Active', exp: 'Jun 2026', color: T.amber },
      ].map((c, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: `${c.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <I d={ic.shield} size={11} color={c.color} stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{c.name}</div>
            <div style={{ fontSize: '7px', color: T.t4 }}>{c.id}{c.exp ? ` -- Exp: ${c.exp}` : ''}</div>
          </div>
          <Tag color={c.color} bg={`${c.color}10`}>{c.status}</Tag>
        </div>
      ))}
    </div>
  );
}

function MiniDocumentCollector() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.file} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Required Documents</span>
        <Tag color={T.amber} bg={T.amberBg}>2 pending</Tag>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {[
          { name: 'Business Registration', status: 'uploaded', file: 'corp_registration.pdf' },
          { name: 'Tax ID / EIN Certificate', status: 'uploaded', file: 'ein_certificate.pdf' },
          { name: 'Proof of Address', status: 'pending' },
          { name: 'Board Resolution', status: 'pending' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: d.status === 'uploaded' ? T.green : T.bg, border: `1px solid ${d.status === 'uploaded' ? T.green : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {d.status === 'uploaded' && <I d={ic.check} size={9} color="#fff" stroke={3} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 500, color: T.t1 }}>{d.name}</div>
              {d.file && <div style={{ fontSize: '7px', color: T.t4 }}>{d.file}</div>}
            </div>
            {d.status === 'pending' && <button style={{ fontSize: '7px', fontWeight: 600, color: T.pri, background: T.priBg, border: `1px solid ${T.priBg2}`, padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}>Upload</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPropertyListing() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ height: '56px', background: 'linear-gradient(135deg, #1e293b, #475569)', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '5px 8px' }}>
        <Tag color="#fff" bg="rgba(255,255,255,0.2)">For Sale</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>Modern Office Suite -- Downtown</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          <I d={ic.map} size={8} color={T.t4} />
          <span style={{ fontSize: '8px', color: T.t3 }}>350 Market St, San Francisco, CA 94105</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          {[{ v: '2,400', l: 'sq ft' }, { v: '6', l: 'offices' }, { v: 'Floor 12', l: 'level' }].map(s => (
            <div key={s.l} style={{ flex: 1, padding: '4px', background: T.bg, borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: T.pri }}>{s.v}</div>
              <div style={{ fontSize: '6px', color: T.t4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '5px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(1250000)}</span>
          <span style={{ fontSize: '8px', color: T.t4 }}>{fmt(520)}/sq ft</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
          <button style={{ flex: 1, padding: '6px', borderRadius: '6px', border: `1px solid ${T.bdr}`, background: T.surface, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: T.t1 }}>Virtual Tour</button>
          <button style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: T.pri, fontSize: '8px', fontWeight: 600, cursor: 'pointer', color: '#fff' }}>Schedule Viewing</button>
        </div>
      </div>
    </div>
  );
}

function MiniComplianceChecklist() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clip} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Compliance Checklist</span>
        <Tag color={T.amber} bg={T.amberBg}>4 of 7</Tag>
      </div>
      {[
        { l: 'Business registration filed', done: true },
        { l: 'EIN / Tax ID obtained', done: true },
        { l: 'Operating agreement drafted', done: true },
        { l: 'State tax registration', done: true },
        { l: 'Industry-specific licenses', done: false, note: '2 licenses identified' },
        { l: 'Insurance requirements', done: false, note: 'E&O + General Liability' },
        { l: 'Data privacy compliance', done: false },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '5px 10px', borderBottom: i < 6 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: item.done ? T.green : T.bg, border: `1px solid ${item.done ? T.green : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
            {item.done && <I d={ic.check} size={9} color="#fff" stroke={3} />}
          </div>
          <div>
            <div style={{ fontSize: '9px', color: item.done ? T.t3 : T.t1, textDecoration: item.done ? 'line-through' : 'none', fontWeight: item.done ? 400 : 500 }}>{item.l}</div>
            {item.note && <div style={{ fontSize: '7px', color: T.amber, marginTop: '1px' }}>{item.note}</div>}
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
          {[{ l: 'Expertise', v: 98 }, { l: 'Communication', v: 96 }, { l: 'Deliverables', v: 94 }, { l: 'Timeliness', v: 92 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '58px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 95 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'JK', name: 'Jennifer K.', role: 'COO, Series B Fintech', text: 'Transformed our go-to-market strategy completely.', ago: '1w', type: 'Strategy' },
        { init: 'MR', name: 'Michael R.', role: 'Founder, E-commerce', text: 'Clear communication, rigorous analysis, actionable deliverables.', ago: '3w', type: 'Advisory' },
      ].map((rv, i) => (
        <div key={i} style={{ padding: '6px 10px', borderBottom: i === 0 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.priBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 700, color: T.pri, flexShrink: 0 }}>{rv.init}</div>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{rv.name}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{rv.role}</span>
            <Tag color={T.teal} bg={T.tealBg}>{rv.type}</Tag>
          </div>
          <div style={{ fontSize: '8px', color: T.t2, lineHeight: 1.45 }}>{rv.text}</div>
        </div>
      ))}
    </div>
  );
}

function MiniFeeCalculator() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.dollar} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Fee Estimate</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {[{ l: 'Hourly', rate: '$350/hr' }, { l: 'Project', rate: 'Fixed fee', sel: true }, { l: 'Retainer', rate: '$5K/mo' }].map(m => (
            <div key={m.l} style={{ flex: 1, padding: '5px', borderRadius: '5px', textAlign: 'center', border: m.sel ? `2px solid ${T.pri}` : `1px solid ${T.bdr}`, background: m.sel ? T.priBg : T.surface, cursor: 'pointer' }}>
              <div style={{ fontSize: '9px', fontWeight: m.sel ? 600 : 400, color: m.sel ? T.pri : T.t1 }}>{m.l}</div>
              <div style={{ fontSize: '7px', color: T.t4 }}>{m.rate}</div>
            </div>
          ))}
        </div>
        {[
          { l: 'Strategy & research', v: '$12,000', sel: true },
          { l: 'Implementation support', v: '$18,000', sel: true },
          { l: 'Training & handover', v: '$5,000', sel: false },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: item.sel ? T.pri : T.bg, border: `1px solid ${item.sel ? T.pri : T.bdrM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {item.sel && <I d={ic.check} size={8} color="#fff" stroke={3} />}
            </div>
            <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{item.l}</span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: T.pri }}>{item.v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: `2px solid ${T.t1}`, marginTop: '3px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: T.t1 }}>Estimated total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>{fmt(30000)}</span>
        </div>
      </div>
    </div>
  );
}

const BIZ_BLOCKS: VerticalBlockDef[] = [
  { id: 'service_package', family: 'catalog', label: 'Service Package Card', stage: 'discovery', desc: 'Engagement offering with pricing model, scope summary, client count', preview: MiniServicePackage, intents: ['services', 'offerings', 'packages', 'pricing', 'retainer'], module: 'moduleItems', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'expert_profile', family: 'people', label: 'Expert / Team Profile', stage: 'discovery', desc: 'Professional card with credentials, specialization tags, project count', preview: MiniExpertProfile, intents: ['team', 'consultant', 'lawyer', 'advisor', 'expert'], module: 'moduleItems', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'subtitle', 'badges'] },
  { id: 'consultation_booking', family: 'booking', label: 'Consultation Booking', stage: 'conversion', desc: 'Discovery call scheduler with topic selector, format picker, time slots', preview: MiniConsultationBooking, intents: ['book', 'consult', 'meeting', 'schedule', 'discovery call'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'checkout' },
  { id: 'project_scope', family: 'engagement', label: 'Project Scope', stage: 'showcase', desc: 'Scope document with deliverables checklist, timeline, budget estimate', preview: MiniProjectScope, intents: ['scope', 'deliverables', 'timeline', 'project plan', 'SOW'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'ai_generated' },
  { id: 'case_study', family: 'proof', label: 'Case Study / Portfolio', stage: 'social_proof', desc: 'Past engagement with client industry, challenge, result metrics', preview: MiniCaseStudy, intents: ['case study', 'portfolio', 'past work', 'results', 'track record'], module: 'moduleItems', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'subtitle'] },
  { id: 'proposal', family: 'engagement', label: 'Proposal Summary', stage: 'conversion', desc: 'Formal engagement proposal with phased pricing, timeline, total fee', preview: MiniProposalSummary, intents: ['proposal', 'quote', 'estimate', 'pricing', 'contract'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'ai_generated' },
  { id: 'engagement_timeline', family: 'tracking', label: 'Engagement Timeline', stage: 'social_proof', desc: 'Active project phases with milestone dots, completion status', preview: MiniEngagementTimeline, intents: ['progress', 'status', 'timeline', 'milestones', 'project update'], module: null, status: 'active', engines: ['lead', 'service'], noModuleReason: 'ai_generated' },
  { id: 'retainer_status', family: 'tracking', label: 'Retainer Status', stage: 'social_proof', desc: 'Monthly retainer gauge with hours used/remaining, renewal date', preview: MiniRetainerStatus, intents: ['retainer', 'hours', 'usage', 'balance', 'remaining'], module: null, status: 'active', engines: ['lead', 'service'], noModuleReason: 'ai_generated' },
  { id: 'credential_badge', family: 'trust', label: 'Credentials & Licenses', stage: 'social_proof', desc: 'Professional license and certification list with status badges', preview: MiniCredentialBadge, intents: ['credentials', 'licenses', 'certifications', 'qualified'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'design_only' },
  { id: 'document_collector', family: 'operations', label: 'Document Collector', stage: 'conversion', desc: 'Required document checklist with upload status, pending count', preview: MiniDocumentCollector, intents: ['documents', 'upload', 'send files', 'paperwork', 'forms'], module: null, status: 'active', engines: ['lead', 'service'], noModuleReason: 'ai_generated' },
  { id: 'property_listing', family: 'real_estate', label: 'Property Listing', stage: 'discovery', desc: 'Commercial/residential listing with area, price per sqft, tour CTA', preview: MiniPropertyListing, intents: ['listing', 'property', 'office', 'space', 'buy', 'rent', 'lease'], module: 'moduleItems', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'compliance_checklist', family: 'operations', label: 'Compliance Checklist', stage: 'showcase', desc: 'Step-by-step regulatory/legal checklist with progress fraction', preview: MiniComplianceChecklist, intents: ['compliance', 'checklist', 'requirements', 'regulatory'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'ai_generated' },
  { id: 'client_review', family: 'proof', label: 'Client Reviews', stage: 'social_proof', desc: 'B2B testimonials with criteria bars and role + company context', preview: MiniClientReview, intents: ['reviews', 'testimonials', 'ratings', 'client feedback'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'design_only' },
  { id: 'fee_calculator', family: 'pricing', label: 'Fee Calculator', stage: 'showcase', desc: 'Interactive pricing -- select scope items to build estimate', preview: MiniFeeCalculator, intents: ['fees', 'cost', 'pricing', 'how much', 'estimate', 'budget'], module: null, status: 'active', engines: ['lead'], noModuleReason: 'ai_generated' },
];

const BIZ_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'real_estate', name: 'Real Estate Services', industryId: 'business_professional', blocks: ['property_listing', 'service_package', 'expert_profile', 'consultation_booking', 'document_collector', 'client_review', 'credential_badge'] },
  { id: 'legal_services', name: 'Legal Services', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'proposal', 'retainer_status', 'credential_badge', 'document_collector', 'compliance_checklist', 'client_review'] },
  { id: 'consulting_advisory', name: 'Consulting & Advisory', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'project_scope', 'proposal', 'retainer_status', 'engagement_timeline', 'credential_badge', 'client_review'] },
  { id: 'marketing_advertising', name: 'Marketing & Advertising', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'proposal', 'retainer_status', 'engagement_timeline', 'client_review'] },
  { id: 'software_it', name: 'Software & IT Services', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'project_scope', 'proposal', 'engagement_timeline', 'fee_calculator', 'client_review', 'credential_badge'] },
  { id: 'hr_recruitment', name: 'HR & Recruitment', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'proposal', 'engagement_timeline', 'fee_calculator', 'client_review'] },
  { id: 'architecture_design', name: 'Architecture & Design', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'project_scope', 'engagement_timeline', 'fee_calculator', 'client_review'] },
  { id: 'pr_communications', name: 'PR & Communications', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'consultation_booking', 'case_study', 'retainer_status', 'client_review'] },
  { id: 'translation_docs', name: 'Translation & Documentation', industryId: 'business_professional', blocks: ['service_package', 'expert_profile', 'fee_calculator', 'document_collector', 'engagement_timeline', 'client_review', 'credential_badge'] },
  { id: 'notary_compliance', name: 'Notary & Compliance', industryId: 'business_professional', blocks: ['service_package', 'consultation_booking', 'credential_badge', 'document_collector', 'compliance_checklist', 'fee_calculator', 'client_review'] },
];

const BIZ_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Service Catalog', color: '#1e293b' },
  people: { label: 'Team & Experts', color: '#7c3aed' },
  booking: { label: 'Consultation', color: '#15803d' },
  engagement: { label: 'Engagement & Proposals', color: '#7c3aed' },
  proof: { label: 'Social Proof', color: '#be185d' },
  tracking: { label: 'Project Tracking', color: '#1d4ed8' },
  trust: { label: 'Credentials & Trust', color: '#0f766e' },
  operations: { label: 'Operations & Docs', color: '#1e293b' },
  real_estate: { label: 'Real Estate', color: '#b45309' },
  pricing: { label: 'Pricing', color: '#b45309' },
};

export const BIZ_CONFIG: VerticalConfig = {
  id: 'business_professional',
  industryId: 'business_professional',
  name: 'Business & Professional',
  iconName: 'Briefcase',
  accentColor: '#1e293b',
  blocks: BIZ_BLOCKS,
  subVerticals: BIZ_SUBVERTICALS,
  families: BIZ_FAMILIES,
};