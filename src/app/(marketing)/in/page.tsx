'use client';
import Link from 'next/link';
import { useState } from 'react';
import { C, F, FM, FS, icons } from '../components/theme';

const Ic = ({ d, size = 16, color = C.accent }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const faqs = [
  { q: 'Do you support Hindi, Tamil, Marathi, and Bengali?', a: 'Yes. Pingbox supports Hindi, Tamil, Marathi, Bengali, and English out of the box. The AI replies in whichever language the customer writes in.' },
  { q: 'Are you a Meta BSP-verified provider?', a: 'Yes. Pingbox is a Meta BSP-verified partner, which means faster approval, higher message limits, and official compliance with WhatsApp Business API terms.' },
  { q: 'How does DPDP Act 2023 compliance work?', a: 'Pingbox aligns with the Digital Personal Data Protection Act 2023. Customer data collected via Pingbox is stored securely, and consent flows are built in. Data residency options are available on Scale.' },
  { q: 'Can I keep my existing WhatsApp Business number?', a: 'Yes. We port your existing verified number to the WhatsApp Business API. The process takes 1–3 business days.' },
  { q: 'How does GST invoicing work?', a: 'All invoices include 18% GST and are issued to your GSTIN. Available for download from your billing dashboard.' },
  { q: 'What payment methods do you accept?', a: 'UPI, credit/debit cards, and net banking — all via Razorpay. Annual plans can also be paid by NEFT/RTGS bank transfer.' },
  { q: 'Do you integrate with Zoho, LeadSquared, Interakt, and Razorpay?', a: 'Yes. Native integrations for Zoho CRM, LeadSquared, and Razorpay. Interakt can be connected via webhook. Full API for custom integrations.' },
];

export default function IndiahomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/in" aria-label="Pingbox India home" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}><img src="/images/brand/logo.svg" alt="Pingbox" style={{ height: 28, width: 'auto', display: 'block' }} /><span style={{ fontSize: 11, color: C.t3, fontWeight: 400, fontFamily: FM }}>India</span></Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/in/pricing" style={{ fontSize: 13, color: C.t2, textDecoration: 'none' }}>Pricing</Link>
            <Link href="/in/customers" style={{ fontSize: 13, color: C.t2, textDecoration: 'none' }}>Customers</Link>
            <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* Region banner */}
      <div style={{ background: C.accentSoft, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: C.accent }}>
          You're viewing Pingbox India (₹ pricing, WhatsApp-first). <Link href="/" style={{ color: C.accent, fontWeight: 600, textDecoration: 'underline' }}>Switch to US site →</Link>
        </span>
      </div>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>Pingbox India</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          The AI sales assistant for<br />Indian service brands.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, lineHeight: 1.65, marginBottom: 16, maxWidth: 620, margin: '0 auto 16px' }}>
          Every WhatsApp inquiry becomes a qualified lead. Interactive catalogs, booking flows, and quotes — sent in 30 seconds, in Hindi, Tamil, Marathi, or English.
        </p>
        <p style={{ fontSize: 14, color: C.t3, marginBottom: 36 }}>Built for Indian operators, compliant with Meta BSP and DPDP Act 2023.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Start free trial</Link>
          <Link href="/in/contact/sales" style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Schedule WhatsApp demo</Link>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ padding: '20px 24px 48px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
          {[
            'Meta BSP-verified partner',
            'DPDP Act 2023 aligned',
            'GST-invoiced',
            'Integrated with Zoho, LeadSquared, Razorpay',
            'Hindi, Tamil, Marathi, Bengali, English',
          ].map((t) => (
            <span key={t} style={{ fontSize: 13, color: C.t2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ic d={icons.check} size={13} color={C.green} />{t}
            </span>
          ))}
        </div>
      </section>

      {/* Problem section */}
      <section style={{ padding: '72px 24px', background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>Paying for leads, losing them on WhatsApp</h2>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.75, marginBottom: 14 }}>
            Indian service brands spend lakhs monthly on Google, Meta, and local lead aggregators. The leads land on WhatsApp — and sit unanswered for hours because one person can't watch WhatsApp 24/7 across three phones and four locations. Your cost-per-lead compounds because most never convert.
          </p>
          <div style={{ background: C.surface, border: `1px solid ${C.amber}`, borderRadius: 12, padding: '16px 20px', display: 'inline-block' }}>
            <p style={{ fontSize: 14, color: C.t1, lineHeight: 1.7, margin: 0 }}>
              <strong>Indian operator math:</strong> if you're spending ₹5 lakh/month on ads and your WhatsApp conversion is 4%, you're leaving roughly ₹3 lakh/month on the table. Pingbox catches every WhatsApp message, replies in 30 seconds, and converts with interactive buttons — not text.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 32 }}>Live in 10 minutes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { n: '1', title: 'Upload your knowledge (2 min)', desc: 'Drop your service list, brochure, or price sheet in any language. Pingbox builds a searchable brain in Hindi, Tamil, Marathi, or English.' },
              { n: '2', title: 'Connect WhatsApp (1 min)', desc: 'Verify your WhatsApp Business API via Meta BSP. Keep your existing number or get a new one. Pingbox handles the Meta verification paperwork.' },
              { n: '3', title: 'AI replies with interactive UI', desc: 'Customers message. Pingbox ships the right block — service catalog, booking form, pricing table — with WhatsApp buttons and list messages. Customers tap. You get bookings.' },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{n}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 5 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{ padding: '0 24px 72px', background: C.surfaceAlt, paddingTop: 56, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em' }}>Simple ₹ pricing</h2>
            <Link href="/in/pricing" style={{ fontSize: 13, color: C.accent, fontWeight: 600, textDecoration: 'none' }}>See full pricing →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { name: 'Starter', price: '₹0', tag: 'Free forever', features: ['1 WhatsApp number', '100 AI conversations/month', 'Core block library', 'Web widget'] },
              { name: 'Growth', price: '₹6,999', tag: '/mo annual', features: ['All channels', '1,000 conversations/month', 'Full block library', 'Engage inbox', 'Revenue tracking'], accent: true },
              { name: 'Scale', price: '₹16,999', tag: '/mo annual', features: ['Everything in Growth', 'Multi-location admin', 'Zoho + LeadSquared integrations', 'Dedicated success manager', 'Custom blocks'] },
            ].map((tier) => (
              <div key={tier.name} style={{ background: tier.accent ? C.accent : C.surface, border: `1px solid ${tier.accent ? 'transparent' : C.border}`, borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: tier.accent ? '#fff' : C.t1, marginBottom: 4 }}>{tier.name}</h3>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: tier.accent ? '#fff' : C.t1 }}>{tier.price}</span>
                  <span style={{ fontSize: 12, color: tier.accent ? 'rgba(255,255,255,0.6)' : C.t3 }}>{tier.tag}</span>
                </div>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                    <Ic d={icons.check} size={13} color={tier.accent ? '#fff' : C.green} />
                    <span style={{ fontSize: 12, color: tier.accent ? 'rgba(255,255,255,0.85)' : C.t2, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.t3, marginTop: 14 }}>All prices include 18% GST. Billed via Razorpay. UPI, cards, net banking accepted.</p>
        </div>
      </section>

      {/* Industry links */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 28 }}>Built for your vertical</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { href: '/in/for/dental-clinics', label: 'Dental Clinics', sub: 'Consultation → booking' },
              { href: '/in/for/hvac', label: 'AC & Home Services', sub: 'Emergency → service call' },
              { href: '/in/for/fitness', label: 'Fitness Studios', sub: 'Inquiry → trial' },
              { href: '/in/for/real-estate', label: 'Real Estate', sub: 'Listing → viewing' },
              { href: '/in/for/b2b-wholesale', label: 'B2B Wholesale', sub: 'RFQ → order' },
            ].map(({ href, label, sub }) => (
              <Link key={href} href={href} style={{ display: 'block', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 12, color: C.t3 }}>{sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 28 }}>India-specific questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 9, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: openFaq === i ? C.surfaceAlt : C.surface, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.t1, fontFamily: F }}>{faq.q}</span>
                  <Ic d={openFaq === i ? 'M18 15l-6-6-6 6' : icons.chevDown} size={15} color={C.t3} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 18px 14px', background: C.surfaceAlt }}>
                    <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 12 }}>Same ad spend. More qualified leads.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 32 }}>Start free for 14 days. No credit card. Live in 10 minutes.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
          <Link href="/in/contact/sales" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Schedule WhatsApp demo</Link>
        </div>
      </section>
    </div>
  );
}
