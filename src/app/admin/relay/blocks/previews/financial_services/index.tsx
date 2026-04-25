// @ts-nocheck
'use client';

import React from 'react';
import { T as BaseT, I, Tag, Stars, fmt } from '../_theme';
import { ic } from '../_icons';
import type { VerticalConfig, VerticalBlockDef, SubVerticalDef, VerticalFamilyDef } from '../_types';

const T = {
  ...BaseT,
  pri: '#064e3b', priLt: '#059669', priBg: 'rgba(6,78,59,0.06)', priBg2: 'rgba(6,78,59,0.12)',
  acc: '#92400e', accBg: 'rgba(146,64,14,0.06)', accBg2: 'rgba(146,64,14,0.14)',
  bg: '#f8f9f7',
};

const pct = (n: number) => n.toFixed(2) + '%';

function MiniProductCard() {
  const prods = [
    { name: 'Premium Savings Account', cat: 'Savings', apy: '4.75%', min: fmt(500), badge: 'Top Rate', img: 'linear-gradient(135deg, #064e3b, #059669, #34d399)' },
    { name: 'Business Line of Credit', cat: 'Lending', rate: 'Prime + 2.5%', limit: 'Up to $250K', img: 'linear-gradient(135deg, #1e293b, #475569, #94a3b8)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {prods.map((p, i) => (
        <div key={i} style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '8px 10px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: p.img, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I d={ic.dollar} size={18} color="rgba(255,255,255,0.4)" stroke={1.3} />
              {p.badge && <div style={{ position: 'absolute', top: 3, left: 3 }}><Tag color="#fff" bg={T.acc}>{p.badge}</Tag></div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, lineHeight: 1.2 }}>{p.name}</div>
              <Tag color={T.pri} bg={T.priBg}>{p.cat}</Tag>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: T.pri }}>{p.apy || p.rate}</span>
                <button style={{ fontSize: '8px', fontWeight: 600, color: '#fff', background: T.pri, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>Apply</button>
              </div>
              <div style={{ fontSize: '7px', color: T.t4, marginTop: '1px' }}>{p.min ? `Min: ${p.min}` : p.limit}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLoanCalculator() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.dollar} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loan Calculator</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {[['Loan amount', fmt(50000)], ['Term', '60 months'], ['Interest rate', '6.49% APR'], ['Monthly payment', fmt(978)]].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ fontSize: '9px', color: T.t3 }}>{k}</span>
            <span style={{ fontSize: i === 3 ? '14px' : '9px', fontWeight: i === 3 ? 700 : 600, color: i === 3 ? T.pri : T.t1 }}>{v}</span>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Apply Now -- {pct(6.49)} APR</button>
      </div>
    </div>
  );
}

function MiniAccountSnapshot() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.layers} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Account Overview</span>
      </div>
      {[
        { name: 'Premium Checking', num: '****4821', bal: 12480.50, type: 'Checking', color: T.pri },
        { name: 'High-Yield Savings', num: '****7103', bal: 48250.00, type: 'Savings', color: T.green },
        { name: 'Business Line', num: '****2917', bal: -18400.00, type: 'Credit', color: T.amber },
      ].map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `${a.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.dollar} size={12} color={a.color} stroke={1.5} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>{a.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
              <span style={{ fontSize: '7px', color: T.t4, fontFamily: 'monospace' }}>{a.num}</span>
              <Tag color={a.color} bg={`${a.color}10`}>{a.type}</Tag>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: a.bal < 0 ? T.red : T.pri }}>{a.bal < 0 ? '-' : ''}{fmt(Math.abs(a.bal))}</span>
        </div>
      ))}
    </div>
  );
}

function MiniApplicationForm() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.acc}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.accBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.clip} size={12} color={T.acc} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.acc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Apply</span>
        <Tag color={T.green} bg={T.greenBg}>5 min</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '5px 7px', background: T.bg, borderRadius: '5px', marginBottom: '5px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Personal Loan -- {fmt(50000)} at {pct(6.49)}</div>
          <div style={{ fontSize: '7px', color: T.t3 }}>60 months -- Est. {fmt(978)}/mo</div>
        </div>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['Debt consolidation', 'Home improvement', 'Business', 'Education'].map((p, i) => (
            <span key={p} style={{ fontSize: '7px', padding: '3px 5px', borderRadius: '4px', border: i === 0 ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, background: i === 0 ? T.accBg : T.surface, color: i === 0 ? T.acc : T.t2, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{p}</span>
          ))}
        </div>
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.acc, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Check Eligibility -- No credit impact</button>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
          {[['256-bit encrypted'], ['Soft pull only'], ['Decision in 2 min']].map(([l], j) => (
            <span key={j} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '7px', color: T.t4 }}><I d={ic.check} size={7} color={T.green} stroke={2} />{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniRateComparison() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.chart} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Rate Comparison</span>
      </div>
      {[
        { product: 'High-Yield Savings', our: '4.75%', market: '4.20%', diff: '+0.55%' },
        { product: '12-Month CD', our: '5.10%', market: '4.65%', diff: '+0.45%' },
        { product: 'Personal Loan', our: '6.49%', market: '7.80%', diff: '-1.31%' },
        { product: 'Mortgage (30yr)', our: '6.25%', market: '6.50%', diff: '-0.25%' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
          <span style={{ fontSize: '9px', color: T.t1, flex: 1 }}>{r.product}</span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: T.pri, width: '34px', textAlign: 'right' }}>{r.our}</span>
          <span style={{ fontSize: '7px', color: T.t4, width: '28px', textAlign: 'right' }}>{r.market}</span>
          <span style={{ fontSize: '7px', fontWeight: 600, color: T.green, background: T.greenBg, padding: '1px 4px', borderRadius: '3px' }}>{r.diff}</span>
        </div>
      ))}
    </div>
  );
}

function MiniPortfolioSummary() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.trendUp} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Portfolio Summary</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
          <div><div style={{ fontSize: '8px', color: T.t4 }}>Total Value</div><div style={{ fontSize: '18px', fontWeight: 700, color: T.pri }}>{fmt(284500)}</div></div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: T.green }}>+12.4% YTD</span>
        </div>
        <div style={{ display: 'flex', gap: '2px', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
          <div style={{ width: '45%', background: T.pri }} /><div style={{ width: '25%', background: T.acc }} /><div style={{ width: '20%', background: T.teal }} /><div style={{ width: '10%', background: T.amber }} />
        </div>
        {[
          { name: 'US Equities', alloc: '45%', val: fmt(128025), ret: '+18.2%', color: T.pri },
          { name: 'Fixed Income', alloc: '25%', val: fmt(71125), ret: '+4.1%', color: T.acc },
          { name: 'International', alloc: '20%', val: fmt(56900), ret: '+9.8%', color: T.teal },
          { name: 'Alternatives', alloc: '10%', val: fmt(28450), ret: '+6.5%', color: T.amber },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: 1, background: a.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '8px', color: T.t1, flex: 1 }}>{a.name}</span>
            <span style={{ fontSize: '7px', color: T.t4 }}>{a.alloc}</span>
            <span style={{ fontSize: '8px', fontWeight: 600, color: T.t1, width: '50px', textAlign: 'right' }}>{a.val}</span>
            <span style={{ fontSize: '7px', fontWeight: 600, color: T.green, width: '32px', textAlign: 'right' }}>{a.ret}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniInsuranceQuote() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.shield} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Insurance Quote</span>
      </div>
      {[
        { plan: 'Essential', premium: 89, cover: '$100K', deduct: '$2,500' },
        { plan: 'Comprehensive', premium: 149, cover: '$500K', deduct: '$1,000', sel: true, pop: true },
        { plan: 'Premium', premium: 249, cover: '$1M', deduct: '$500' },
      ].map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none', background: p.sel ? T.priBg : 'transparent' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: p.sel ? `5px solid ${T.pri}` : `2px solid ${T.bdrM}`, background: T.surface, flexShrink: 0, boxSizing: 'border-box' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: p.sel ? 600 : 400, color: T.t1 }}>{p.plan}</span>
              {p.pop && <Tag color="#fff" bg={T.pri}>Best Value</Tag>}
            </div>
            <div style={{ fontSize: '7px', color: T.t3, marginTop: '1px' }}>Coverage: {p.cover} -- Deductible: {p.deduct}</div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: T.pri }}>{fmt(p.premium)}<span style={{ fontSize: '6px', color: T.t4 }}>/mo</span></span>
        </div>
      ))}
    </div>
  );
}

function MiniCreditScore() {
  const score = 742;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.activity} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Credit Health</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.greenBg, border: `3px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: T.green }}>{score}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: T.green }}>Very Good</div>
            <div style={{ fontSize: '8px', color: T.t3 }}>Top 25% of applicants</div>
            <div style={{ fontSize: '8px', color: T.green, fontWeight: 500 }}>+18 pts since Jan</div>
          </div>
        </div>
        {[{ l: 'Payment history', v: 98 }, { l: 'Credit utilization', v: 78 }, { l: 'Account age', v: 70 }, { l: 'Recent inquiries', v: 90 }].map(f => (
          <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
            <span style={{ fontSize: '7px', color: T.t4, width: '60px' }}>{f.l}</span>
            <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${f.v}%`, height: '100%', background: f.v >= 80 ? T.green : T.pri, borderRadius: '2px' }} /></div>
            <span style={{ fontSize: '7px', fontWeight: 600, color: f.v >= 80 ? T.green : T.pri, width: '18px', textAlign: 'right' }}>{f.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTransferQuote() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.pri}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.priBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.globe} size={12} color={T.pri} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.pri, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Send Money</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
          <div style={{ flex: 1, padding: '5px 7px', background: T.bg, borderRadius: '5px' }}><div style={{ fontSize: '6px', color: T.t4 }}>You send</div><div style={{ fontSize: '14px', fontWeight: 700, color: T.t1 }}>$1,000</div><div style={{ fontSize: '7px', color: T.t4 }}>USD</div></div>
          <I d={ic.repeat} size={14} color={T.pri} stroke={1.5} />
          <div style={{ flex: 1, padding: '5px 7px', background: T.priBg, borderRadius: '5px' }}><div style={{ fontSize: '6px', color: T.pri }}>They receive</div><div style={{ fontSize: '14px', fontWeight: 700, color: T.pri }}>83,420</div><div style={{ fontSize: '7px', color: T.pri }}>INR</div></div>
        </div>
        {[['Exchange rate', '1 USD = 83.42 INR'], ['Fee', fmt(4.99)], ['Delivery', '1-2 business days']].map(([k, v], i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.bdr}` }}>
            <span style={{ fontSize: '8px', color: T.t3 }}>{k}</span>
            <span style={{ fontSize: '8px', fontWeight: 500, color: T.t1 }}>{v}</span>
          </div>
        ))}
        <button style={{ width: '100%', padding: '8px', borderRadius: '7px', border: 'none', background: T.pri, color: '#fff', fontSize: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>Send {fmt(1000)} to India</button>
      </div>
    </div>
  );
}

function MiniDocumentUpload() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.upload} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Required Documents</span>
        <Tag color={T.amber} bg={T.amberBg}>2 pending</Tag>
      </div>
      {[
        { name: 'Government-issued ID', status: 'uploaded' },
        { name: 'Proof of income (2 months)', status: 'uploaded' },
        { name: 'Bank statements (3 months)', status: 'pending' },
        { name: 'Proof of address', status: 'pending' },
      ].map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none' }}>
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

function MiniApplicationTracker() {
  const steps = ['Applied', 'Under Review', 'Verification', 'Approval', 'Funded'];
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '6px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <I d={ic.clip} size={11} color={T.t1} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 600, color: T.t1 }}>Application Status</span>
        <Tag color={T.amber} bg={T.amberBg}>In Progress</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ padding: '4px 7px', background: T.bg, borderRadius: '5px', marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: T.t1 }}>Personal Loan -- {fmt(50000)}</div>
          <div style={{ fontSize: '7px', color: T.t3 }}>Ref: LN-2026-48291</div>
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

function MiniAdvisorProfile() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I d={ic.user} size={20} color="rgba(255,255,255,0.8)" stroke={1.5} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.t1 }}>Sarah Mitchell, CFP</div>
          <div style={{ fontSize: '9px', color: T.pri, fontWeight: 500 }}>Senior Financial Advisor</div>
          <div style={{ fontSize: '8px', color: T.t4, marginTop: '2px' }}>CFA -- Series 65 -- 14 years</div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {[{ v: '4.9', l: 'Rating' }, { v: '$42M', l: 'AUM' }, { v: '120+', l: 'Clients' }].map(s => (
              <span key={s.l} style={{ fontSize: '8px', color: T.t3 }}><span style={{ fontWeight: 700, color: T.t1 }}>{s.v}</span> {s.l}</span>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {['Retirement', 'Tax Strategy', 'Estate Planning', 'Investments'].map(s => (
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

function MiniClientReview() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.bdr}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.bdr}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: 42, height: 42, borderRadius: '8px', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>4.8</span>
        </div>
        <div style={{ flex: 1 }}>
          {[{ l: 'Transparency', v: 96 }, { l: 'Rates & fees', v: 92 }, { l: 'Speed', v: 90 }, { l: 'Trust', v: 95 }].map(cat => (
            <div key={cat.l} style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
              <span style={{ fontSize: '7px', color: T.t4, width: '52px' }}>{cat.l}</span>
              <div style={{ flex: 1, height: '3px', background: T.bdr, borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${cat.v}%`, height: '100%', background: cat.v >= 94 ? T.green : T.pri, borderRadius: '2px' }} /></div>
              <span style={{ fontSize: '7px', fontWeight: 700, color: T.t1, width: '14px', textAlign: 'right' }}>{(cat.v / 10).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      {[
        { init: 'KR', name: 'Karen R.', text: 'Refinanced my mortgage and saved $340/month. Funded in 18 days.', ago: '1w', type: 'Mortgage' },
        { init: 'AL', name: 'Andre L.', text: 'Portfolio restructured before retirement. Clear communication, no jargon.', ago: '3w', type: 'Advisory' },
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

function MiniEligibilityCheck() {
  return (
    <div style={{ background: T.surface, border: `2px solid ${T.green}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: T.greenBg, display: 'flex', alignItems: 'center', gap: '5px' }}>
        <I d={ic.check} size={12} color={T.green} stroke={2} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: T.green, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check Eligibility</span>
        <Tag color={T.green} bg="rgba(21,128,61,0.12)">No credit impact</Tag>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: '3px', marginBottom: '5px' }}>
          {['Under $50K', '$50-100K', '$100-200K', '$200K+'].map((r, i) => (
            <span key={r} style={{ flex: 1, textAlign: 'center', padding: '4px 2px', borderRadius: '4px', fontSize: '7px', border: i === 2 ? `2px solid ${T.green}` : `1px solid ${T.bdr}`, background: i === 2 ? T.greenBg : T.surface, color: i === 2 ? T.green : T.t2, fontWeight: i === 2 ? 600 : 400, cursor: 'pointer' }}>{r}</span>
          ))}
        </div>
        <div style={{ padding: '6px 8px', background: T.greenBg, borderRadius: '6px', border: `1px solid ${T.greenBdr}`, textAlign: 'center', marginTop: '4px' }}>
          <I d={ic.check} size={14} color={T.green} stroke={2} />
          <div style={{ fontSize: '10px', fontWeight: 600, color: T.green, marginTop: '2px' }}>You likely qualify for 3 products</div>
          <div style={{ fontSize: '7px', color: T.t3 }}>Personal Loan -- High-Yield Savings -- Rewards Card</div>
        </div>
        <button style={{ width: '100%', padding: '7px', borderRadius: '7px', border: 'none', background: T.green, color: '#fff', fontSize: '9px', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>View My Offers</button>
      </div>
    </div>
  );
}

const FIN_BLOCKS: VerticalBlockDef[] = [
  { id: 'fin_product_card', family: 'catalog', label: 'Financial Product', stage: 'discovery', desc: 'Savings, loan, or card product with rate/APY, minimums, apply CTA', preview: MiniProductCard, intents: ['products', 'accounts', 'savings', 'loan', 'credit', 'rates', 'open account'], module: 'financial_services_catalog', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'price', 'category'] },
  { id: 'fin_loan_calc', family: 'tools', label: 'Loan Calculator', stage: 'showcase', desc: 'Amount, term, APR inputs with monthly payment and total cost output', preview: MiniLoanCalculator, intents: ['calculator', 'monthly payment', 'EMI', 'loan', 'mortgage', 'affordability'], module: 'financial_services_tools', status: 'active', engines: ['lead'] },
  { id: 'fin_account_snapshot', family: 'accounts', label: 'Account Overview', stage: 'social_proof', desc: 'Multi-account summary with balances, APY, available credit', preview: MiniAccountSnapshot, intents: ['balance', 'accounts', 'overview', 'statement', 'checking', 'savings'], module: 'financial_services_accounts', status: 'active', engines: ['lead', 'service'] },
  { id: 'fin_application', family: 'onboarding', label: 'Quick Application', stage: 'conversion', desc: 'Streamlined apply form with product context and soft-pull trust badges', preview: MiniApplicationForm, intents: ['apply', 'open account', 'sign up', 'eligible', 'qualify'], module: 'financial_services_onboarding', status: 'active', engines: ['lead'] },
  { id: 'fin_rate_compare', family: 'tools', label: 'Rate Comparison', stage: 'showcase', desc: 'Our rate vs market average with advantage differential per product', preview: MiniRateComparison, intents: ['rates', 'compare', 'APY', 'APR', 'best rate', 'competitive'], module: 'financial_services_tools', status: 'active', engines: ['lead'] },
  { id: 'fin_portfolio', family: 'wealth', label: 'Portfolio Summary', stage: 'social_proof', desc: 'Total value, YTD return, asset allocation bar with per-class returns', preview: MiniPortfolioSummary, intents: ['portfolio', 'investments', 'performance', 'returns', 'allocation', 'holdings'], module: 'financial_services_wealth', status: 'active', engines: ['lead', 'service'] },
  { id: 'fin_insurance', family: 'insurance', label: 'Insurance Quote', stage: 'showcase', desc: '3-tier coverage selector with limits, deductibles, monthly premiums', preview: MiniInsuranceQuote, intents: ['insurance', 'coverage', 'quote', 'premium', 'protect', 'policy'], module: 'financial_services_insurance', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url'] },
  { id: 'fin_credit_score', family: 'credit', label: 'Credit Health', stage: 'social_proof', desc: 'Score gauge, trend indicator, 4-factor breakdown', preview: MiniCreditScore, intents: ['credit score', 'credit health', 'my score', 'credit report', 'improve score'], module: 'financial_services_credit', status: 'active', engines: ['lead', 'service'] },
  { id: 'fin_transfer', family: 'payments', label: 'Money Transfer', stage: 'conversion', desc: 'Send/receive amounts with live exchange rate, fee, delivery time', preview: MiniTransferQuote, intents: ['send money', 'transfer', 'remittance', 'exchange rate', 'forex', 'wire'], module: 'financial_services_payments', status: 'active', engines: ['commerce'] },
  { id: 'fin_doc_upload', family: 'onboarding', label: 'Document Upload', stage: 'conversion', desc: 'KYC/verification checklist with uploaded/pending status', preview: MiniDocumentUpload, intents: ['documents', 'upload', 'KYC', 'verification', 'ID', 'proof'], module: 'financial_services_onboarding', status: 'active', engines: ['lead', 'service'] },
  { id: 'fin_app_tracker', family: 'tracking', label: 'Application Tracker', stage: 'social_proof', desc: '5-step pipeline from Applied to Funded with ref number and ETA', preview: MiniApplicationTracker, intents: ['status', 'track', 'application', 'approved', 'reference'], module: 'financial_services_tracking', status: 'active', engines: ['lead', 'service'] },
  { id: 'fin_advisor', family: 'people', label: 'Advisor Profile', stage: 'discovery', desc: 'CFP/CFA with credentials, AUM, client count, specialties', preview: MiniAdvisorProfile, intents: ['advisor', 'planner', 'consultant', 'CFP', 'financial advisor', 'wealth manager'], module: 'financial_services_people', status: 'active', engines: ['lead'], reads: ['name', 'description', 'image_url', 'subtitle', 'badges'] },
  { id: 'fin_review', family: 'social_proof', label: 'Client Reviews', stage: 'social_proof', desc: 'Finance-specific criteria bars with product-tagged reviews', preview: MiniClientReview, intents: ['reviews', 'ratings', 'testimonials', 'feedback', 'trust'], module: 'financial_services_social_proof', status: 'active', engines: ['lead'] },
  { id: 'fin_eligibility', family: 'tools', label: 'Eligibility Checker', stage: 'discovery', desc: 'Pre-qualification tool with instant result and no credit impact', preview: MiniEligibilityCheck, intents: ['eligible', 'qualify', 'pre-qualify', 'can I get', 'pre-approval'], module: 'financial_services_tools', status: 'active', engines: ['lead'] },
];

const FIN_SUBVERTICALS: SubVerticalDef[] = [
  { id: 'retail_banking', name: 'Retail Banking', industryId: 'financial_services', blocks: ['fin_product_card', 'fin_account_snapshot', 'fin_loan_calc', 'fin_application', 'fin_rate_compare', 'fin_credit_score', 'fin_doc_upload', 'fin_app_tracker', 'fin_review', 'fin_eligibility'] },
  { id: 'alt_lending', name: 'Alternative Lending', industryId: 'financial_services', blocks: ['fin_product_card', 'fin_loan_calc', 'fin_application', 'fin_eligibility', 'fin_doc_upload', 'fin_app_tracker', 'fin_rate_compare', 'fin_review'] },
  { id: 'consumer_lending', name: 'Consumer Lending', industryId: 'financial_services', blocks: ['fin_product_card', 'fin_loan_calc', 'fin_application', 'fin_eligibility', 'fin_credit_score', 'fin_doc_upload', 'fin_app_tracker', 'fin_review'] },
  { id: 'commercial_lending', name: 'Commercial Lending', industryId: 'financial_services', blocks: ['fin_product_card', 'fin_loan_calc', 'fin_application', 'fin_doc_upload', 'fin_app_tracker', 'fin_advisor', 'fin_rate_compare', 'fin_review'] },
  { id: 'payments_processing', name: 'Payments & Processing', industryId: 'financial_services', blocks: ['fin_transfer', 'fin_product_card', 'fin_rate_compare', 'fin_review'] },
  { id: 'wealth_mgmt', name: 'Wealth Management', industryId: 'financial_services', blocks: ['fin_portfolio', 'fin_advisor', 'fin_product_card', 'fin_rate_compare', 'fin_review'] },
  { id: 'insurance_broker', name: 'Insurance Brokerage', industryId: 'financial_services', blocks: ['fin_insurance', 'fin_product_card', 'fin_advisor', 'fin_application', 'fin_doc_upload', 'fin_review'] },
  { id: 'accounting_tax', name: 'Accounting & Tax', industryId: 'financial_services', blocks: ['fin_advisor', 'fin_product_card', 'fin_application', 'fin_doc_upload', 'fin_review'] },
  { id: 'investment_trading', name: 'Investment & Trading', industryId: 'financial_services', blocks: ['fin_portfolio', 'fin_product_card', 'fin_rate_compare', 'fin_advisor', 'fin_eligibility', 'fin_review'] },
  { id: 'forex_remittance', name: 'FX & Remittance', industryId: 'financial_services', blocks: ['fin_transfer', 'fin_rate_compare', 'fin_product_card', 'fin_review'] },
  { id: 'credit_advisory', name: 'Credit Advisory', industryId: 'financial_services', blocks: ['fin_credit_score', 'fin_loan_calc', 'fin_eligibility', 'fin_advisor', 'fin_application', 'fin_review'] },
  { id: 'fintech', name: 'Fintech', industryId: 'financial_services', blocks: ['fin_product_card', 'fin_eligibility', 'fin_loan_calc', 'fin_application', 'fin_account_snapshot', 'fin_rate_compare', 'fin_transfer', 'fin_credit_score', 'fin_review'] },
  { id: 'community_savings', name: 'Community Savings', industryId: 'financial_services', blocks: ['fin_account_snapshot', 'fin_product_card', 'fin_advisor', 'fin_review'] },
];

const FIN_FAMILIES: Record<string, VerticalFamilyDef> = {
  catalog: { label: 'Products', color: '#064e3b' },
  tools: { label: 'Calculators & Tools', color: '#92400e' },
  accounts: { label: 'Account Management', color: '#1d4ed8' },
  onboarding: { label: 'Applications', color: '#15803d' },
  wealth: { label: 'Wealth Management', color: '#0f766e' },
  insurance: { label: 'Insurance', color: '#064e3b' },
  credit: { label: 'Credit & Score', color: '#b45309' },
  payments: { label: 'Payments & FX', color: '#064e3b' },
  tracking: { label: 'Application Tracking', color: '#1d4ed8' },
  people: { label: 'Advisors', color: '#92400e' },
  social_proof: { label: 'Reviews & Trust', color: '#be185d' },
};

export const FIN_CONFIG: VerticalConfig = {
  id: 'financial_services',
  industryId: 'financial_services',
  name: 'Financial Services',
  iconName: 'Landmark',
  accentColor: '#064e3b',
  blocks: FIN_BLOCKS,
  subVerticals: FIN_SUBVERTICALS,
  families: FIN_FAMILIES,
};