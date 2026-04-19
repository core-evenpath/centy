'use client';
import Link from 'next/link';
import { useState } from 'react';
import { C, F, FS, FM, icons } from './theme';

const Ic = ({ d, size = 18, color = C.t2 }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Check = ({ color = C.green }: { color?: string }) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d={icons.check} />
  </svg>
);

const tiers = [
  {
    name: 'Starter',
    price: { annual: 0, monthly: 0 },
    tag: 'Free forever',
    desc: 'For evaluating Pingbox on a single location.',
    cta: 'Start free',
    href: '/early-access',
    accent: false,
    features: [
      'Web widget (1 location)',
      '100 AI conversations/month',
      'Core block library',
      'Service Cards, Booking Flows, Pricing Tables',
      'Community support',
    ],
  },
  {
    name: 'Growth',
    price: { annual: 79, monthly: 99 },
    tag: 'Most popular',
    desc: 'For single-location operators actively scaling inbound.',
    cta: 'Start 14-day trial',
    href: '/early-access?plan=growth',
    accent: true,
    features: [
      'All channels (web, WhatsApp, Instagram, SMS)',
      '1,000 AI conversations/month',
      'Full vertical block library',
      'Engage unified inbox',
      'Revenue attribution dashboard',
      'Priority support via email + Slack',
    ],
  },
  {
    name: 'Scale',
    price: { annual: 199, monthly: 249 },
    tag: 'Multi-location brands',
    desc: 'For multi-location brands and franchise groups.',
    cta: 'Talk to sales',
    href: '/contact/sales',
    accent: false,
    features: [
      'Everything in Growth',
      'Multi-location admin (unlimited locations)',
      '5,000+ AI conversations/month',
      'Custom block templates',
      'SAML 2.0 SSO (Okta, Azure AD, Google)',
      'HubSpot / Salesforce / ServiceTitan integrations',
      'Full API access',
      'Dedicated success manager',
      'White-glove rollout',
      'HIPAA-ready, SOC 2 Type II aligned',
      'Audit logs',
    ],
  },
];

const featureMatrix = [
  { category: 'Channels', rows: [
    { name: 'Web widget', starter: true, growth: true, scale: true },
    { name: 'WhatsApp, Instagram, SMS', starter: false, growth: true, scale: true },
  ]},
  { category: 'AI Conversations', rows: [
    { name: 'Monthly conversations', starter: '100', growth: '1,000', scale: '5,000+' },
    { name: 'Overage handling', starter: false, growth: 'Soft limit', scale: 'Unlimited' },
  ]},
  { category: 'Block Library', rows: [
    { name: 'Core blocks (Catalog, Booking, Pricing)', starter: true, growth: true, scale: true },
    { name: 'Full vertical block library', starter: false, growth: true, scale: true },
    { name: 'Custom block templates', starter: false, growth: false, scale: true },
  ]},
  { category: 'Team Features', rows: [
    { name: 'Locations', starter: '1', growth: '1', scale: 'Unlimited' },
    { name: 'Multi-location admin', starter: false, growth: false, scale: true },
    { name: 'Role-based access control', starter: false, growth: false, scale: true },
    { name: 'Audit logs', starter: false, growth: false, scale: true },
  ]},
  { category: 'Security', rows: [
    { name: 'SOC 2 Type II aligned', starter: true, growth: true, scale: true },
    { name: 'SAML 2.0 SSO', starter: false, growth: false, scale: true },
    { name: 'HIPAA-ready (signed BAA)', starter: false, growth: false, scale: true },
  ]},
  { category: 'Integrations', rows: [
    { name: 'Zapier (3,000+ apps)', starter: false, growth: true, scale: true },
    { name: 'HubSpot, Salesforce', starter: false, growth: false, scale: true },
    { name: 'ServiceTitan, Mindbody, etc.', starter: false, growth: false, scale: true },
    { name: 'Full REST API', starter: false, growth: false, scale: true },
  ]},
  { category: 'Support', rows: [
    { name: 'Community support', starter: true, growth: true, scale: true },
    { name: 'Priority email + Slack', starter: false, growth: true, scale: true },
    { name: 'Dedicated success manager', starter: false, growth: false, scale: true },
    { name: 'White-glove onboarding', starter: false, growth: false, scale: true },
  ]},
];

const faqs = [
  { q: 'Can I change plans anytime?', a: 'Yes. Upgrade or downgrade anytime. Annual plans prorate on upgrade; downgrades take effect at renewal.' },
  { q: 'What counts as one AI conversation?', a: 'A conversation starts when a contact sends their first message and ends after 24 hours of inactivity. One session = one conversation, regardless of message count.' },
  { q: 'What happens if I exceed the conversation limit?', a: 'Growth plan: conversations continue with a soft limit notice. We\'ll reach out before anything stops. Scale plan: no hard limit.' },
  { q: 'Are there setup fees, contracts, or cancellation fees?', a: 'No setup fees. No lock-in contracts for Starter or Growth. Scale involves a service agreement that covers rollout and support commitments.' },
  { q: 'How does multi-location pricing work above 20 locations?', a: 'Scale tier covers unlimited locations at a flat monthly rate. For brands above 100 locations, we offer volume pricing — talk to sales.' },
  { q: 'Do you offer nonprofit or education discounts?', a: 'Yes. Contact us at hello@pingbox.io with your org details.' },
  { q: 'Is annual billing required for Scale?', a: 'Not required, but annual billing gives you a ~20% discount vs monthly. Scale can also be invoiced annually on a purchase order.' },
  { q: 'What\'s included in white-glove onboarding?', a: 'A dedicated success manager, kickoff call, AI knowledge base setup, channel connections, first-week performance review, and a 90-day rollout framework.' },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none', letterSpacing: '-0.01em' }}>pingbox</Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontFamily: F, fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 14, color: C.accent, marginBottom: 16 }}>Pricing</p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Pricing that anchors to your<br />ad budget, not your headcount.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Most operators recover Pingbox's monthly cost within one ad cycle. If you're spending $5K/month on Google Ads, even a 10% lift in inquiry-to-decision conversion pays for Scale tier three times over.
        </p>
        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: C.surfaceAlt, borderRadius: 10, padding: 4, gap: 2, marginBottom: 56 }}>
          {(['Annual', 'Monthly'] as const).map((label, i) => (
            <button key={label} onClick={() => setAnnual(i === 0)}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 600,
                background: (i === 0) === annual ? C.surface : 'transparent',
                color: (i === 0) === annual ? C.t1 : C.t3,
                boxShadow: (i === 0) === annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {label}{i === 0 ? <span style={{ color: C.green, fontSize: 11, marginLeft: 6 }}>Save 20%</span> : ''}
            </button>
          ))}
        </div>
      </section>

      {/* Tier cards */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {tiers.map((tier) => (
            <div key={tier.name} style={{
              background: tier.accent ? C.accent : C.surface,
              border: `1px solid ${tier.accent ? 'transparent' : C.border}`,
              borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: tier.accent ? 'rgba(255,255,255,0.65)' : C.t3, marginBottom: 6, display: 'block' }}>{tier.tag}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: tier.accent ? '#fff' : C.t1, marginBottom: 6 }}>{tier.name}</h2>
              <p style={{ fontSize: 13, color: tier.accent ? 'rgba(255,255,255,0.7)' : C.t2, marginBottom: 20, lineHeight: 1.5, flexGrow: 1 }}>{tier.desc}</p>
              <div style={{ marginBottom: 20 }}>
                {tier.price.annual === 0 ? (
                  <span style={{ fontSize: 36, fontWeight: 800, color: tier.accent ? '#fff' : C.t1 }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: 36, fontWeight: 800, color: tier.accent ? '#fff' : C.t1 }}>${annual ? tier.price.annual : tier.price.monthly}</span>
                    <span style={{ fontSize: 13, color: tier.accent ? 'rgba(255,255,255,0.55)' : C.t3 }}>/mo</span>
                    {annual && <span style={{ fontSize: 11, color: tier.accent ? 'rgba(255,255,255,0.55)' : C.t4, display: 'block' }}>billed annually</span>}
                  </>
                )}
              </div>
              <Link href={tier.href} style={{
                display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 8, textDecoration: 'none',
                fontFamily: F, fontSize: 14, fontWeight: 700, marginBottom: 24,
                background: tier.accent ? '#fff' : C.accent,
                color: tier.accent ? C.accent : '#fff',
              }}>{tier.cta}</Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {tier.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}><Check color={tier.accent ? '#fff' : C.green} /></div>
                    <span style={{ fontSize: 13, color: tier.accent ? 'rgba(255,255,255,0.85)' : C.t2, lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROI anchor */}
      <section style={{ padding: '64px 24px', background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>How operators calculate payback</h2>
          <p style={{ fontSize: 15, color: C.t2, marginBottom: 36, lineHeight: 1.7 }}>Scale tier at $199/mo is recovered by:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {[
              { label: 'Dental', value: '1 new patient', sub: '$1,800 avg LTV' },
              { label: 'HVAC', value: '2 service calls', sub: '$400 avg ticket' },
              { label: 'Fitness', value: '3 memberships', sub: '$69/mo avg' },
              { label: 'B2B', value: '1 bulk order', sub: '$500+ avg' },
            ].map((item) => (
              <div key={item.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.t4, marginBottom: 8 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.t1, marginBottom: 3 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: C.t3 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature matrix */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 40 }}>Full feature comparison</h2>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)', background: C.surfaceAlt, padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div />
              {['Starter', 'Growth', 'Scale'].map((n) => (
                <div key={n} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: n === 'Scale' ? C.accent : C.t1 }}>{n}</div>
              ))}
            </div>
            {featureMatrix.map((section) => (
              <div key={section.category}>
                <div style={{ padding: '10px 20px 3px', background: C.surfaceDeep, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.t3 }}>{section.category}</span>
                </div>
                {section.rows.map((row, ri) => (
                  <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)', padding: '11px 20px', borderBottom: `1px solid ${C.borderLight}`, background: ri % 2 === 0 ? C.surface : 'transparent', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: C.t2 }}>{row.name}</span>
                    {([row.starter, row.growth, row.scale] as (boolean | string)[]).map((val, vi) => (
                      <div key={vi} style={{ textAlign: 'center' }}>
                        {typeof val === 'boolean' ? (
                          val ? <Check /> : <span style={{ color: C.t4, fontSize: 16 }}>—</span>
                        ) : (
                          <span style={{ fontSize: 12, color: C.t2 }}>{val}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 36 }}>Frequently asked questions</h2>
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
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 14 }}>Same ads. Same traffic. More decisions.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 32 }}>Start free — 14 days. No credit card required.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontFamily: F, fontSize: 15, fontWeight: 700, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
          <Link href="/contact/sales" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: F, fontSize: 15, fontWeight: 600, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Talk to sales</Link>
        </div>
      </section>
    </div>
  );
}
