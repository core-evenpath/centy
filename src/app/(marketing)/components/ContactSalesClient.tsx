'use client';
import Link from 'next/link';
import { useState } from 'react';
import { C, F, FM, FS, icons } from './theme';

const Ic = ({ d, size = 18, color = C.t3 }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const trust = [
  { icon: icons.shield, label: 'SOC 2 Type II aligned' },
  { icon: icons.lock, label: 'SAML 2.0 SSO' },
  { icon: icons.users, label: 'White-glove onboarding' },
  { icon: icons.clock, label: 'Response within 4 business hours' },
];

export default function ContactSalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', locations: '', vertical: '', volume: '', challenge: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox</Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(48px, 7vw, 96px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 64, alignItems: 'start' }}>

          {/* Left — form */}
          <div>
            <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>Enterprise sales</p>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>Let's build your rollout.</h1>
            <p style={{ fontSize: 15, color: C.t2, lineHeight: 1.6, marginBottom: 36 }}>
              Tell us about your brand and we'll put together a custom demo and rollout plan. Most teams hear back within four business hours.
            </p>

            {submitted ? (
              <div style={{ background: C.greenSoft, border: `1px solid ${C.green}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.green, marginBottom: 8 }}>Request received</h2>
                <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>We'll follow up within four business hours with a calendar link and a rollout framework tailored to your brand.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'name', label: 'Name', type: 'text', placeholder: 'Your full name' },
                  { key: 'email', label: 'Work email', type: 'email', placeholder: 'you@company.com' },
                  { key: 'company', label: 'Company name', type: 'text', placeholder: 'Acme Corp' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 6 }}>{label}</label>
                    <input required type={type} placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F, fontSize: 14, color: C.t1, background: C.surface, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                {[
                  { key: 'role', label: 'Your role', opts: ['Owner / Founder', 'VP of Operations', 'Marketing', 'Revenue / Sales', 'Technology / IT', 'Other'] },
                  { key: 'locations', label: 'Number of locations', opts: ['1', '2–5', '6–20', '21–100', '100+'] },
                  { key: 'vertical', label: 'Primary vertical', opts: ['Dental / Aesthetic', 'HVAC / Home Services', 'Boutique Fitness', 'Real Estate', 'Law / Insurance', 'B2B Wholesale', 'Other'] },
                  { key: 'volume', label: 'Monthly inbound volume', opts: ['< 50 inquiries', '50–200', '200–1,000', '1,000–5,000', '5,000+'] },
                ].map(({ key, label, opts }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 6 }}>{label}</label>
                    <select required value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F, fontSize: 14, color: form[key as keyof typeof form] ? C.t1 : C.t3, background: C.surface, outline: 'none', appearance: 'none', boxSizing: 'border-box' }}>
                      <option value="" disabled>Select…</option>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 6 }}>What's your biggest challenge right now? <span style={{ color: C.t3, fontWeight: 400 }}>(optional)</span></label>
                  <textarea rows={3} placeholder="We're spending $20K/month on ads but our front desk can't keep up with the volume..."
                    value={form.challenge} onChange={(e) => setForm({ ...form, challenge: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F, fontSize: 14, color: C.t1, background: C.surface, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ background: C.accent, color: '#fff', border: 'none', fontFamily: F, fontSize: 15, fontWeight: 700, padding: '14px', borderRadius: 9, cursor: 'pointer', marginTop: 4 }}>
                  Request demo
                </button>
              </form>
            )}
          </div>

          {/* Right — trust signals */}
          <div style={{ position: 'sticky', top: 84 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 16 }}>What happens after you submit</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { n: '1', text: 'You\'ll receive a confirmation email immediately' },
                  { n: '2', text: 'A calendar link for a 30-min intro call within 4 business hours' },
                  { n: '3', text: 'A PDF of our multi-location rollout framework' },
                  { n: '4', text: 'Links to relevant case studies for your vertical' },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>{n}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 16 }}>Built for enterprise rollouts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {trust.map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Ic d={icon} size={16} color={C.accent} />
                    <span style={{ fontSize: 13, color: C.t2 }}>{label}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ic d={icons.zap} size={16} color={C.accent} />
                  <span style={{ fontSize: 13, color: C.t2 }}>Rollouts typically complete in under 30 days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ic d={icons.layout} size={16} color={C.accent} />
                  <span style={{ fontSize: 13, color: C.t2 }}>HIPAA-ready configurations available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
