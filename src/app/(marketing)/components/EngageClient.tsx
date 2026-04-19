'use client';
import Link from 'next/link';
import { C, F, FM, FS, icons } from './theme';

const Ic = ({ d, size = 18, color = C.t3 }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const routingRules = [
  'Route by geography — Phoenix inquiries to Phoenix team',
  'Route by specialty — insurance questions to billing team',
  'Route by urgency — emergencies jump the queue',
  'Route by load — auto-distribute when volume spikes',
  'Route by customer tier — VIPs to senior staff',
  'Fallback rules — if team is offline, route to central ops',
];

const segmentBy = [
  'Behavior (recent inquirers, lapsed customers, booked but not shown)',
  'Lifecycle stage (lead, trial, active, churned)',
  'Location (all Dallas customers, all customers at Location #4)',
  'Last interaction date',
  'Product or service booked',
];

const channels = [
  { name: 'WhatsApp', note: 'Pre-approved template messages' },
  { name: 'SMS', note: 'Via Twilio' },
  { name: 'Email', note: 'Optional — via Resend, Postmark, or your ESP' },
  { name: 'In-widget', note: 'If they return to your site' },
];

export default function EngagePage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox</Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>Product — Engage</p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          Every channel. Every location. One view.
        </h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, lineHeight: 1.6, marginBottom: 32 }}>
          Engage consolidates inbound from web, WhatsApp, Instagram, SMS, and Telegram into a single operator console — with per-location routing, smart escalation, and broadcast campaigns across segments.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free for 14 days</Link>
          <Link href="/contact/sales" style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
        </div>
      </section>

      {/* Unified inbox */}
      <section style={{ padding: '64px 24px', background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>The unified inbox</h2>
          <p style={{ fontSize: 15, color: C.t2, marginBottom: 28, lineHeight: 1.7, maxWidth: 600 }}>Every inbound message, from every channel, for every location, in one stream. Filter by channel, lifecycle stage, location, or team.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              'Full message history across channels',
              'Customer profile and past interactions',
              'Which location the inquiry is for',
              'Which blocks the AI served',
              'Current state (AI / awaiting human / resolved)',
              'Revenue attribution (if Intelligence is enabled)',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', alignItems: 'flex-start' }}>
                <Ic d={icons.check} size={14} color={C.green} />
                <span style={{ fontSize: 13, color: C.t2, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routing */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 48, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>Smart routing, by location and by load</h2>
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7, marginBottom: 20 }}>Configure routing rules once, let them run:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {routingRules.map((r) => (
                <div key={r} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Ic d={icons.chevRight} size={14} color={C.accent} />
                  <span style={{ fontSize: 14, color: C.t2, lineHeight: 1.4 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>AI triage</h2>
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.7 }}>
              The AI handles what it can: FAQs, service catalog browsing, booking flows, price quotes, document uploads. It escalates what it can't: complex questions, upset customers, complaints, out-of-scope requests.
            </p>
            <p style={{ fontSize: 14, color: C.accent, fontWeight: 600, marginTop: 12 }}>Humans only see the messages that need them.</p>
          </div>
        </div>
      </section>

      {/* Broadcast */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 'clamp(24px, 4vw, 44px)' }}>
            <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>Broadcast campaigns</h2>
            <p style={{ fontSize: 14, color: C.t2, marginBottom: 28, lineHeight: 1.7 }}>Segment once. Broadcast everywhere. Send targeted campaigns to segments of your customer base across whatever channels they prefer.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.t3, marginBottom: 10 }}>Segment by</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {segmentBy.map((s) => (
                    <div key={s} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                      <Ic d={icons.chevRight} size={13} color={C.accent} />
                      <span style={{ fontSize: 13, color: C.t2, lineHeight: 1.4 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.t3, marginBottom: 10 }}>Send via</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {channels.map(({ name, note }) => (
                    <div key={name} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{name}</div>
                      <div style={{ fontSize: 12, color: C.t3 }}>{note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', marginBottom: 12 }}>See your inbox unified across every channel.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>Start free for 14 days.</p>
        <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
      </section>
    </div>
  );
}
