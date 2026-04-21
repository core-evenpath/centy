'use client';
import Link from 'next/link';
import { C, F, FM, FS, icons } from './theme';
import { BlockLibraryVisual, HOMEPAGE_FLOWS } from './blocks';

const Ic = ({ d, size = 18, color = C.t3 }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const categories = [
  { name: 'Catalog', desc: 'Service Cards, Product Grids, Treatment Menus', count: '12+ blocks' },
  { name: 'Commerce', desc: 'Pricing Tables, Quote Builders, Promo Cards', count: '8+ blocks' },
  { name: 'Action', desc: 'Booking Flows, Order Forms, Appointment Schedulers', count: '10+ blocks' },
  { name: 'Proof', desc: 'Review Cards, Testimonials, Case Study Cards', count: '6+ blocks' },
  { name: 'Capture', desc: 'Lead Forms, Intake Questionnaires, Document Upload', count: '7+ blocks' },
  { name: 'Info', desc: 'FAQ Blocks, Location Maps, Instructor Profiles', count: '9+ blocks' },
];

export default function RelayPage() {
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
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>Product — Relay</p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          The chat widget that replies in interactive UI.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, lineHeight: 1.6, marginBottom: 32 }}>
          Relay is the embeddable widget that converts your website's inbound traffic into decisions. Instead of sending text, Relay sends the right block for the right intent — service catalogs, booking flows, pricing tables, quote builders, and dozens more.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free for 14 days</Link>
          <Link href="/contact/sales" style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
        </div>
      </section>

      {/* Comparison — text vs UI */}
      <section style={{ padding: '64px 24px', background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 40 }}>Why interactive UI converts better</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.rust, background: C.rustSoft, padding: '3px 9px', borderRadius: 6 }}>Text-only chatbot</span>
              </div>
              <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>"How much for a cleaning?"</p>
              <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, marginBottom: 8 }}>Bot: "We offer cleanings for $150. We have openings Tuesday and Thursday. Let me know if you'd like to book."</p>
              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.6 }}>Now the customer has to type again. And again. Three rounds of back-and-forth before anything is decided.</p>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 14, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.green, background: C.greenSoft, padding: '3px 9px', borderRadius: 6 }}>Relay interactive block</span>
              </div>
              <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>"How much for a cleaning?"</p>
              <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, marginBottom: 8 }}>Relay sends: a tappable pricing card with three cleaning types and visible prices, a booking flow with real calendar slots, and a single tap to confirm.</p>
              <p style={{ fontSize: 13, color: C.green, lineHeight: 1.6, fontWeight: 600 }}>The customer makes the decision in 15 seconds. No typing after the first message.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Block library — live demo */}
      <section style={{ padding: '72px 24px 56px', background: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 720, marginBottom: 48, textAlign: 'center', margin: '0 auto 48px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: F, marginBottom: 12 }}>The block library</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02, marginBottom: 16, color: C.ink }}>
              Every intent has <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 500, color: C.accent }}>a block</span>.
            </h2>
            <p style={{ fontSize: 17, color: C.t2, fontFamily: F, lineHeight: 1.6 }}>
              Relay ships tappable UI blocks — not text. The AI picks the right block for each customer intent and chains them into sequences that convert.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <BlockLibraryVisual flows={HOMEPAGE_FLOWS} label="LIVE BLOCK FLOWS" />
          </div>
        </div>
      </section>

      {/* Block categories — breadth grid */}
      <section style={{ padding: '0 24px 72px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: C.t3, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: F }}>Block categories — there are many more</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {categories.map(({ name, desc, count }, i) => {
              const color = [C.accent, C.blue, C.green, C.amber, C.indigo, C.rust][i % 6];
              return (
                <div key={name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic d={icons.grid} size={14} color={color} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: F }}>{name}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: 4, fontFamily: F }}>{count}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.t2, margin: 0, lineHeight: 1.5, fontFamily: F }}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Embedding */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', background: C.ink, borderRadius: 20, padding: 'clamp(32px, 4vw, 56px)' }}>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>One line of JavaScript.</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 24, lineHeight: 1.6 }}>Drop it into your site footer, any CMS, any framework. Pingbox handles the rest — knowledge sync, channel routing, conversation analytics.</p>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px', fontFamily: FM, fontSize: 13, color: 'rgba(255,255,255,0.85)', overflowX: 'auto' }}>
            {'<script src="https://cdn.pingbox.io/relay.js" data-site-id="YOUR_ID"></script>'}
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {['Brand colors + typography', 'Sticky button, inline CTA, or proactive popup', 'Mobile-responsive', 'Accessible (ARIA, keyboard nav)'].map((f) => (
              <span key={f} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6 }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: C.accentSoft, borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Start free for 14 days.</h2>
        <p style={{ fontSize: 15, color: C.t2, marginBottom: 28 }}>Embed Relay on your site in 5 minutes.</p>
        <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 9, textDecoration: 'none' }}>Start free → /early-access</Link>
      </section>
    </div>
  );
}
