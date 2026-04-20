'use client';
import Link from 'next/link';
import { C, F, FS } from './theme';

interface StubPageProps {
  title: string;
  description?: string;
}

export default function StubPage({ title, description }: StubPageProps) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <p style={{ fontFamily: FS, fontStyle: 'italic', fontSize: 13, color: C.t3, marginBottom: 16, letterSpacing: '0.04em' }}>Coming soon</p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: C.t1, textAlign: 'center', marginBottom: 16 }}>{title}</h1>
      {description && (
        <p style={{ fontSize: 16, color: C.t2, textAlign: 'center', maxWidth: 520, lineHeight: 1.6, marginBottom: 40 }}>{description}</p>
      )}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.accent, color: '#fff', fontFamily: F, fontSize: 14, fontWeight: 600, padding: '10px 22px', borderRadius: 8, textDecoration: 'none' }}>
        ← Back to home
      </Link>
    </div>
  );
}
