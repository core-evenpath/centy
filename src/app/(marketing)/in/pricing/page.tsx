'use client';
import Link from 'next/link';
import { useState } from 'react';
import { C, F, FM, FS, icons } from '../../components/theme';

const Check = ({ color = C.green }: { color?: string }) => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d={icons.check} />
  </svg>
);

const tiers = [
  {
    name: 'Starter',
    price: { annual: '₹0', monthly: '₹0' },
    tag: 'Free forever',
    desc: 'For evaluating Pingbox on a single WhatsApp number.',
    cta: 'Start free',
    href: '/early-access',
    accent: false,
    features: [
      '1 WhatsApp number',
      '100 AI conversations/month',
      'Core block library',
      'Web widget',
      'Community support',
    ],
  },
  {
    name: 'Growth',
    price: { annual: '₹6,999', monthly: '₹8,999' },
    tag: 'Most popular',
    desc: 'For single-location operators actively scaling inbound.',
    cta: 'Start 14-day trial',
    href: '/early-access?plan=growth',
    accent: true,
    features: [
      'All channels (WhatsApp, Instagram, website, SMS)',
      '1,000 AI conversations/month',
      'Full vertical block library',
      'Engage unified inbox',
      'Revenue attribution dashboard',
      'Priority support via WhatsApp + email',
    ],
  },
  {
    name: 'Scale',
    price: { annual: '₹16,999', monthly: '₹21,999' },
    tag: 'Multi-location brands',
    desc: 'For multi-location Indian brands and franchise groups.',
    cta: 'Talk to sales',
    href: '/in/contact/sales',
    accent: false,
    features: [
      'Everything in Growth',
      'Multi-location admin (unlimited locations)',
      '5,000+ AI conversations/month',
      'Zoho CRM + LeadSquared integrations',
      'Razorpay payment collection',
      'Dedicated success manager',
      'DPDP Act 2023 compliance tools',
      'Data residency options',
    ],
  },
];

export default function IndiaPricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/in" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox <span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>India</span></Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      <section style={{ padding: 'clamp(56px, 7vw, 88px) 24px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>India pricing</p>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Less than the cost of one full-time receptionist.
        </h1>
        <p style={{ fontSize: 15, color: C.t2, maxWidth: 540, margin: '0 auto 12px', lineHeight: 1.6 }}>
          A single WhatsApp lead converted per week typically covers Growth tier. Scale pays for itself at roughly ₹50,000/month in recovered inbound.
        </p>
        <p style={{ fontSize: 13, color: C.t3, marginBottom: 36 }}>All prices include 18% GST. Billed via Razorpay. UPI, cards, and net banking accepted.</p>

        <div style={{ display: 'inline-flex', background: C.surfaceAlt, borderRadius: 10, padding: 4, gap: 2, marginBottom: 48 }}>
          {(['Annual', 'Monthly'] as const).map((label, i) => (
            <button key={label} onClick={() => setAnnual(i === 0)}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 600,
                background: (i === 0) === annual ? C.surface : 'transparent',
                color: (i === 0) === annual ? C.t1 : C.t3,
                boxShadow: (i === 0) === annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {label}{i === 0 ? <span style={{ color: C.green, fontSize: 11, marginLeft: 6 }}>Save 22%</span> : ''}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          {tiers.map((tier) => (
            <div key={tier.name} style={{
              background: tier.accent ? C.accent : C.surface,
              border: `1px solid ${tier.accent ? 'transparent' : C.border}`,
              borderRadius: 16, padding: 26, display: 'flex', flexDirection: 'column',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tier.accent ? 'rgba(255,255,255,0.65)' : C.t3, marginBottom: 6, display: 'block' }}>{tier.tag}</span>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: tier.accent ? '#fff' : C.t1, marginBottom: 6 }}>{tier.name}</h2>
              <p style={{ fontSize: 13, color: tier.accent ? 'rgba(255,255,255,0.7)' : C.t2, marginBottom: 18, lineHeight: 1.5, flexGrow: 1 }}>{tier.desc}</p>
              <div style={{ marginBottom: 18 }}>
                {tier.price.annual === '₹0' ? (
                  <span style={{ fontSize: 32, fontWeight: 800, color: tier.accent ? '#fff' : C.t1 }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: 32, fontWeight: 800, color: tier.accent ? '#fff' : C.t1 }}>{annual ? tier.price.annual : tier.price.monthly}</span>
                    <span style={{ fontSize: 12, color: tier.accent ? 'rgba(255,255,255,0.55)' : C.t3 }}>/mo</span>
                    {annual && <span style={{ fontSize: 11, color: tier.accent ? 'rgba(255,255,255,0.5)' : C.t4, display: 'block' }}>billed annually · incl. GST</span>}
                  </>
                )}
              </div>
              <Link href={tier.href} style={{
                display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 8, textDecoration: 'none',
                fontFamily: F, fontSize: 14, fontWeight: 700, marginBottom: 20,
                background: tier.accent ? '#fff' : C.accent,
                color: tier.accent ? C.accent : '#fff',
              }}>{tier.cta}</Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}><Check color={tier.accent ? '#fff' : C.green} /></div>
                    <span style={{ fontSize: 12, color: tier.accent ? 'rgba(255,255,255,0.85)' : C.t2, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '64px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>Same ad spend. More qualified leads.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>Start free for 14 days. No credit card required.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
          <Link href="/in/contact/sales" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Talk to sales</Link>
        </div>
      </section>
    </div>
  );
}
