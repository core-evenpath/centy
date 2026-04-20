'use client';
import Link from 'next/link';
import { C, F, FM, FS, icons } from './theme';

const Ic = ({ d, size = 16, color = C.accent }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const features = [
  {
    title: 'Multi-location admin',
    desc: 'One dashboard for the whole brand. Each location inherits shared knowledge (brand voice, common policies, response templates) and overlays location-specific data (pricing, hours, staff, local promos). Add or remove locations in one click.',
  },
  {
    title: 'Per-location routing',
    desc: 'Customer asks about the Phoenix location? Goes to Phoenix staff. Phoenix offline? Falls back to central ops. Load too high? Auto-triages to available franchisees. All rules configurable, all auditable.',
  },
  {
    title: 'Cross-location benchmarking',
    desc: 'See which locations are converting best. Which are slow. Which question types dominate in each market. Real-time dashboard shows pipeline by location, response time by location, AI-resolution rate by location.',
  },
  {
    title: 'Enterprise security',
    desc: 'SOC 2 Type II aligned. SAML 2.0 SSO via Okta, Azure AD, Google Workspace. Role-based access control down to per-location permissions. Full audit logs for every conversation, every AI response, every human intervention.',
  },
];

const integrations = [
  { category: 'CRM & marketing', items: ['HubSpot — bidirectional sync', 'Salesforce — opportunity creation', 'Marketo — lead routing + scoring'] },
  { category: 'Vertical tools', items: ['ServiceTitan (HVAC)', 'DentalIntel (dental)', 'Mindbody (fitness)', 'Housecall Pro'] },
  { category: 'Communications', items: ['Twilio — SMS, voice handoff', 'Meta Business — Instagram, WhatsApp', 'Slack — escalation alerts', 'Zapier — 3,000+ app connections'] },
];

const rollout = [
  { phase: 'Weeks 1–2', title: 'Pilot', desc: 'Pick 3–5 representative locations. Deploy, train AI on shared knowledge, observe conversion lift. Iterate blocks based on real customer questions.' },
  { phase: 'Weeks 3–6', title: 'Regional expansion', desc: 'Roll out to a region (e.g., all Southwest locations). Add per-location data overlays. Configure routing rules. Benchmark pilot vs. region performance.' },
  { phase: 'Weeks 7–12', title: 'Full deployment', desc: 'Scale to all locations. Integrate with central CRM. Set up dashboards for regional managers and central ops. Handoff to dedicated success manager.' },
];

export default function ForTeamsPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" aria-label="Pingbox home" style={{ display: 'inline-flex', alignItems: 'center' }}><img src="/images/brand/logo.svg" alt="Pingbox" style={{ height: 28, width: 'auto', display: 'block' }} /></Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/pricing" style={{ fontSize: 13, color: C.t2, textDecoration: 'none' }}>Pricing</Link>
            <Link href="/contact/sales" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Book a demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>For multi-location operators</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          Deploy across every location.<br />From one admin.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, lineHeight: 1.65, marginBottom: 32 }}>
          Pingbox gives multi-location brands a single platform to manage inbound across all franchises, all channels, and all teams — with per-location data, shared brand logic, and enterprise-grade security.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/contact/sales" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
          <Link href="/early-access" style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free trial</Link>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ padding: '20px 24px 56px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {['Multi-location rollouts typically complete in the same week', 'Franchise networks of 50+ locations deployed in under 30 days', 'SOC 2 Type II aligned', 'SSO via SAML 2.0', 'HIPAA-ready configurations available'].map((t) => (
            <span key={t} style={{ fontSize: 13, color: C.t2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ic d={icons.check} size={13} color={C.green} />{t}
            </span>
          ))}
        </div>
      </section>

      {/* Problem section */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>Every location is a separate conversation. Until now.</h2>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.75 }}>When you run 10, 50, or 500 locations, every franchise has its own inbound: different managers checking different inboxes, different response times, different conversion rates. Some locations crush it. Others leak leads. You can't see which, and you can't fix it from the top.</p>
          <p style={{ fontSize: 15, color: C.t1, fontWeight: 600, marginTop: 16 }}>Pingbox consolidates every inbound conversation into one operator console — with per-location routing, shared AI knowledge base, and brand-wide benchmarking.</p>
        </div>
      </section>

      {/* Feature blocks */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {features.map(({ title, desc }) => (
            <div key={title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
              <Ic d={icons.layout} size={18} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t1, marginTop: 10, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section style={{ padding: '0 24px 72px', background: C.surfaceAlt, paddingTop: 56, paddingBottom: 56 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 28 }}>Plugs into your existing stack</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {integrations.map(({ category, items }) => (
              <div key={category}>
                <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.t3, marginBottom: 12 }}>{category}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map((item) => (
                    <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <Ic d={icons.chevRight} size={13} />
                      <span style={{ fontSize: 13, color: C.t2 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rollout framework */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>From pilot to 500 locations in 90 days</h2>
          <p style={{ fontSize: 14, color: C.t2, marginBottom: 28 }}>Our standard multi-location rollout playbook:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rollout.map(({ phase, title, desc }, i) => (
              <div key={phase} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.t4, marginBottom: 2 }}>{phase}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 4 }}>{title}</div>
                  <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 12 }}>Let's talk about your rollout.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Book a 30-minute call with our team. We'll map your current inbound volume, identify the highest-leverage locations, and build a pilot plan specific to your brand.</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>Most teams hear back within four business hours.</p>
        <Link href="/contact/sales" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
      </section>
    </div>
  );
}
