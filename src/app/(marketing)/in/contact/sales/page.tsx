'use client';
import Link from 'next/link';
import { useState } from 'react';
import { C, F, FM, FS } from '../../../components/theme';

export default function IndiaContactSalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', company: '', city: '', role: '', locations: '', vertical: '', demoMode: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/in" style={{ fontFamily: FM, fontSize: 15, fontWeight: 600, color: C.t1, textDecoration: 'none' }}>pingbox <span style={{ fontSize: 11, color: C.t3, fontWeight: 400 }}>India</span></Link>
          <Link href="/early-access" style={{ background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, textDecoration: 'none' }}>Start free</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 7vw, 88px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: 56, alignItems: 'start' }}>
          <div>
            <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.accent, marginBottom: 14 }}>India sales</p>
            <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>Let's build your rollout.</h1>
            <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, marginBottom: 32 }}>
              Tell us about your brand and we'll put together a custom demo and rollout plan. Most teams hear back on WhatsApp within the same business day.
            </p>

            {submitted ? (
              <div style={{ background: C.greenSoft, border: `1px solid ${C.green}`, borderRadius: 12, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 8 }}>Request received</h2>
                <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.6 }}>We'll reach out on WhatsApp within the same business day to schedule your demo.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {[
                  { key: 'name', label: 'Name', type: 'text', placeholder: 'Your full name' },
                  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
                  { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', placeholder: '+91 98765 43210' },
                  { key: 'company', label: 'Company name', type: 'text', placeholder: 'Acme Dental Chain' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 5 }}>{label}</label>
                    <input required={key !== 'whatsapp'} type={type} placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F, fontSize: 14, color: C.t1, background: C.surface, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                {[
                  { key: 'city', label: 'City', opts: ['Mumbai', 'Bangalore', 'Delhi / NCR', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Other'] },
                  { key: 'role', label: 'Your role', opts: ['Owner / Founder', 'Operations Manager', 'Marketing', 'Sales', 'Technology', 'Other'] },
                  { key: 'locations', label: 'Number of locations', opts: ['1', '2–5', '6–20', '21–100', '100+'] },
                  { key: 'vertical', label: 'Primary vertical', opts: ['Dental / Aesthetic Clinics', 'AC & Home Services', 'Boutique Fitness', 'Real Estate', 'B2B Wholesale', 'Other'] },
                  { key: 'demoMode', label: 'Preferred demo format', opts: ['WhatsApp call', 'Google Meet', 'In-person (metro cities)', 'No preference'] },
                ].map(({ key, label, opts }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.t1, marginBottom: 5 }}>{label}</label>
                    <select required value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: F, fontSize: 14, color: form[key as keyof typeof form] ? C.t1 : C.t3, background: C.surface, outline: 'none', appearance: 'none', boxSizing: 'border-box' }}>
                      <option value="" disabled>Select…</option>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <button type="submit" style={{ background: C.accent, color: '#fff', border: 'none', fontFamily: F, fontSize: 15, fontWeight: 700, padding: '13px', borderRadius: 9, cursor: 'pointer', marginTop: 4 }}>
                  Request demo
                </button>
              </form>
            )}
          </div>

          <div style={{ position: 'sticky', top: 84 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 14 }}>What happens after you submit</h3>
              {[
                'WhatsApp confirmation within 2 hours',
                'Founder-led 30-minute demo at your preferred time',
                'Live sandbox access after the demo',
                'Rollout plan tailored to your vertical and city',
              ].map((step, i) => (
                <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.5, margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 12 }}>India-specific compliance</h3>
              {['DPDP Act 2023 aligned', 'GST-invoiced (18% GST included)', 'UPI + cards + net banking via Razorpay', 'Meta BSP-verified WhatsApp partner', 'Data residency options on Scale'].map((item) => (
                <p key={item} style={{ fontSize: 13, color: C.t2, marginBottom: 6 }}>✓ {item}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
