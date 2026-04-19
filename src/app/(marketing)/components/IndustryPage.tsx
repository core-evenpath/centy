'use client';
import Link from 'next/link';
import { C, F, FM, FS, icons } from './theme';

const Ic = ({ d, size = 16, color = C.accent }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export interface IndustryPageProps {
  eyebrow: string;
  headline: string;
  subheadline: string;
  problemStats: string;
  blocks: string[];
  integrations: { name: string; note: string }[];
  roi: string;
  complianceNote?: string;
  seoTarget?: string;
}

export default function IndustryPage({ eyebrow, headline, subheadline, problemStats, blocks, integrations, roi, complianceNote }: IndustryPageProps) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox</Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/pricing" style={{ fontSize: 13, color: C.t2, textDecoration: 'none' }}>Pricing</Link>
            <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 24px 64px', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>{eyebrow}</p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>{headline}</h1>
        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: C.t2, lineHeight: 1.65, marginBottom: 32, maxWidth: 620, margin: '0 auto 32px' }}>{subheadline}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Start free for 14 days</Link>
          <Link href="/contact/sales" style={{ background: C.surface, color: C.t1, border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, padding: '12px 24px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
        </div>
      </section>

      {/* Problem stats */}
      <section style={{ padding: '56px 24px', background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>The problem</h2>
          <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.75 }}>{problemStats}</p>
        </div>
      </section>

      {/* Blocks */}
      <section style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>Built-in blocks for your vertical</h2>
          <p style={{ fontSize: 14, color: C.t2, marginBottom: 28, lineHeight: 1.6 }}>Every block renders inside the chat widget, fills with your data, and converts into the relevant next step.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {blocks.map((b) => {
              const [title, ...rest] = b.split(' — ');
              return (
                <div key={b} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Ic d={icons.zap} size={14} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 2 }}>{title}</div>
                    {rest.length > 0 && <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.4 }}>{rest.join(' — ')}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>Integrations for your stack</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {integrations.map(({ name, note }) => (
              <div key={name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 12, color: C.t3 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 'clamp(24px, 3vw, 36px)' }}>
          <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>The ROI math</h2>
          <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.75, margin: 0 }}>{roi}</p>
          {complianceNote && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: C.blueSoft, border: `1px solid ${C.blue}`, borderRadius: 9 }}>
              <p style={{ fontSize: 13, color: C.blue, lineHeight: 1.6, margin: 0 }}>{complianceNote}</p>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '72px 24px', background: C.ink, textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 12 }}>Start free for 14 days.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28 }}>No credit card required.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Start free</Link>
          <Link href="/contact/sales" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '13px 26px', borderRadius: 9, textDecoration: 'none' }}>Book a demo</Link>
        </div>
      </section>
    </div>
  );
}
