'use client';
import Link from 'next/link';
import { C, F, FM, FS } from './theme';

export default function CustomersPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox</Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>Customers</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          Operators who replaced text chat with interactive decisions.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 17px)', color: C.t2, lineHeight: 1.65, marginBottom: 48 }}>
          See how service brands across dental, HVAC, fitness, and real estate converted more of the traffic they were already paying for.
        </p>

        {/* Beta callout */}
        <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 16, padding: 'clamp(24px, 3vw, 40px)', textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.amber, marginBottom: 12 }}>Launching with design partners</div>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7, marginBottom: 20 }}>
            We're launching with a small cohort of design partners. Want to be one of the first 20 brands to deploy Pingbox?
          </p>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>
            Apply for early access →
          </Link>
        </div>
      </section>

      {/* What case studies will look like */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.t3, marginBottom: 20, textAlign: 'center' }}>Case study template — coming soon</h2>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, opacity: 0.7 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: C.surfaceDeep, borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>[Customer name]</div>
                <div style={{ fontSize: 12, color: C.t3 }}>Dental · 12 locations</div>
              </div>
              <div style={{ marginLeft: 'auto', background: C.accentSoft, color: C.accent, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>Dental</div>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, marginBottom: 10 }}>4.2x lift on inquiry-to-decision conversion across 42 dental practices</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
              {['Conversion lift', 'Time-to-decision', 'Leads recovered', 'Cost per lead'].map((stat) => (
                <div key={stat} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, marginBottom: 4 }}>—</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{stat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>Your brand could be next.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>Start free for 14 days, or talk to our team about a rollout.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
          <Link href="/contact/sales" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Talk to sales</Link>
        </div>
      </section>
    </div>
  );
}
