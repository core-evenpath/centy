'use client';
import Link from 'next/link';
import { C, F, FM, FS, icons } from './theme';

const Ic = ({ d, size = 18, color = C.t3 }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const dashboards = [
  {
    title: 'Executive dashboard',
    desc: 'Top-line view: total inbound this month, conversion rate, revenue attributed, AI resolution rate. Trend over time. One-click export for board decks.',
  },
  {
    title: 'Location benchmarking',
    desc: 'Side-by-side comparison of every location: inbound volume, conversion rate, revenue per conversation, response time, AI resolution rate. Find your top quartile and your bottom quartile.',
  },
  {
    title: 'Channel analytics',
    desc: 'Compare web widget vs WhatsApp vs SMS vs Instagram. See which channel drives the highest-value conversions. See cost-per-acquired-customer by channel.',
  },
  {
    title: 'Block performance',
    desc: 'Which blocks convert best? Which get abandoned? Service Catalog at 42%, Pricing Table at 67%, Booking Flow at 89% — ship more of what converts. Swap out what doesn\'t.',
  },
  {
    title: 'Conversation insights',
    desc: 'Top asked questions by week. Emerging themes. Peak hours. Drop-off points in flows. Qualitative patterns from the AI\'s perspective.',
  },
  {
    title: 'Pipeline dashboard',
    desc: 'Real-time funnel: inbound → engaged → qualified → decision — by week, by location, rolled up for the whole brand. Export to your BI tool.',
  },
];

const integrations = [
  { name: 'Stripe', note: 'Conversation → charge attribution' },
  { name: 'Shopify', note: 'Conversation → order attribution' },
  { name: 'HubSpot', note: 'Bidirectional deal sync' },
  { name: 'Salesforce', note: 'Opportunity attribution' },
  { name: 'Google Analytics', note: 'Custom events for conversations' },
  { name: 'Meta Ads Manager', note: 'Conversion signal for ad optimization' },
];

export default function IntelligencePage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" aria-label="Pingbox home" style={{ display: 'inline-flex', alignItems: 'center' }}><img src="/images/brand/logo.svg" alt="Pingbox" style={{ height: 28, width: 'auto', display: 'block' }} /></Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>Product — Intelligence</p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          Know which message made you money.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, lineHeight: 1.6, marginBottom: 32 }}>
          Intelligence tracks every conversation as pipeline — so you see revenue by channel, by location, by AI response, and by block. Benchmark your locations. Spot your outliers. Double down on what works.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free for 14 days</Link>
          <Link href="/contact/sales" style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
        </div>
      </section>

      {/* Revenue attribution */}
      <section style={{ padding: '64px 24px', background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>Every conversation, tied to actual revenue</h2>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.7, marginBottom: 28, maxWidth: 560, margin: '0 auto 28px' }}>
            When a customer messages, Intelligence tracks the conversation, the blocks shown, and the decision made. When that decision becomes a booking, purchase, or contract — Intelligence attributes the revenue back to the conversation that generated it.
          </p>
          <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>Revenue sync works with Stripe, Shopify, HubSpot, Salesforce, and most CRMs via webhook. Set it up once, attribution runs automatically.</p>
        </div>
      </section>

      {/* Dashboards */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 36 }}>Six dashboards that tell the full story</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {dashboards.map(({ title, desc }) => (
              <div key={title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Ic d={icons.chart} size={16} color={C.accent} />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.t1, margin: 0 }}>{title}</h3>
                </div>
                <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Lift */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: C.ink, borderRadius: 16, padding: 'clamp(28px, 4vw, 48px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>AI lift tracking</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                How much is the AI doing vs how much needs humans? Track percentage of conversations resolved entirely by AI, percentage requiring human escalation, and the conversion rate of each. This is how you quantify the AI's economic contribution.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'AI resolution rate', value: '—' },
                { label: 'Human escalations', value: '—' },
                { label: 'Conversion — AI', value: '—' },
                { label: 'Conversion — Human', value: '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>live from your data</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>Attribution integrations</h2>
          <p style={{ fontSize: 14, color: C.t2, marginBottom: 24, lineHeight: 1.6 }}>Connect your revenue stack once. Intelligence attributes automatically from then on.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {integrations.map(({ name, note }) => (
              <div key={name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 3 }}>{name}</div>
                <div style={{ fontSize: 12, color: C.t3 }}>{note}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.t3, marginTop: 16 }}>Every view exports to CSV, PDF, and via API. Scheduled reports to email or Slack. Webhook integration with Looker, Tableau, Mode.</p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: C.accentSoft, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>Start seeing which messages made you money.</h2>
        <p style={{ fontSize: 14, color: C.t2, marginBottom: 26 }}>Intelligence is included in Growth and Scale tiers.</p>
        <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
      </section>
    </div>
  );
}
