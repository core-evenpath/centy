'use client';
import Link from 'next/link';
import { C, F, FM, FS } from '../../components/theme';

export default function IndiaCustomersPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/in" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox <span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>India</span></Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 740, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>India customers</p>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          Operators who turned WhatsApp into their best sales channel.
        </h1>
        <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: C.t2, lineHeight: 1.65, marginBottom: 48 }}>
          See how Indian service brands across dental, fitness, and real estate converted more of the WhatsApp traffic they were already paying for.
        </p>

        <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}`, borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)', textAlign: 'center', maxWidth: 520, margin: '0 auto 48px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.amber, marginBottom: 10 }}>Launching with design partners</div>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7, marginBottom: 20 }}>
            We're launching with a small cohort of Indian design partners — dental chains, fitness studios, and B2B wholesalers. Want to be one of the first 20 brands?
          </p>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '11px 22px', borderRadius: 9, textDecoration: 'none' }}>
            Apply for early access →
          </Link>
        </div>
      </section>

      <section style={{ padding: '72px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>Your brand could be next.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>Start free for 14 days, or schedule a WhatsApp demo with our team.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
          <Link href="/in/contact/sales" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Schedule WhatsApp demo</Link>
        </div>
      </section>
    </div>
  );
}
