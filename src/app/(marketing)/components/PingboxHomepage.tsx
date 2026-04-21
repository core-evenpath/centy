'use client';

import { useState, useEffect, useRef } from 'react';
import { C, F, FM, FS, icons } from './theme';
import { BlockLibraryVisual } from './blocks';

// ── Primitives ────────────────────────────────────────────────────────────────

function Ic({ d, size = 20, stroke = 'currentColor', fill = 'none', sw = 1.8 }: { d: string; size?: number; stroke?: string; fill?: string; sw?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function FadeIn({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [v, setV] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(16px)', transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, href = '#', variant = 'primary', style = {}, onClick }: { children: React.ReactNode; href?: string; variant?: string; style?: React.CSSProperties; onClick?: () => void }) {
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: F, cursor: 'pointer', border: 'none', transition: 'all 0.2s ease', whiteSpace: 'nowrap' };
  const variants: Record<string, React.CSSProperties> = {
    primary: { ...base, background: C.ink, color: '#fff' },
    accent: { ...base, background: C.accent, color: '#fff', boxShadow: '0 2px 10px rgba(78,63,255,0.25)' },
    secondary: { ...base, background: '#fff', color: C.ink, border: `1px solid ${C.border}` },
    ghost: { ...base, background: 'transparent', color: C.t2 },
  };
  return <a href={href} onClick={onClick} style={{ ...(variants[variant] || variants.primary), ...style }}>{children}</a>;
}

function Eyebrow({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color, fontFamily: F, display: 'inline-block', marginBottom: 12 }}>{children}</span>;
}

function Stars({ rating = 4.9, size = 7 }: { rating?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {[0,1,2,3,4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < Math.round(rating) ? C.amber : 'rgba(255,255,255,0.12)'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 8, color: C.amber, fontFamily: F, fontWeight: 700, marginLeft: 3 }}>{rating}</span>
    </div>
  );
}

function Chip({ children, bg = 'rgba(78,63,255,0.14)', color = '#D9955F' }: { children: React.ReactNode; bg?: string; color?: string }) {
  return <span style={{ fontSize: 8, fontWeight: 700, color, background: bg, padding: '2px 6px', borderRadius: 4, fontFamily: F, lineHeight: 1, whiteSpace: 'nowrap' }}>{children}</span>;
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [prodOpen, setProdOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const prods = [
    { label: 'Relay', desc: 'The AI storefront widget', icon: icons.layout, color: C.accent, softBg: C.accentSoft, href: '/relay' },
    { label: 'Engage', desc: 'Inbox + broadcast, one hub', icon: icons.broadcast, color: C.blue, softBg: C.blueSoft, href: '/engage' },
    { label: 'Intelligence', desc: 'Revenue attribution', icon: icons.chart, color: C.indigo, softBg: C.indigoSoft, href: '/intelligence' },
  ];
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled ? 'rgba(250,248,245,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(16px) saturate(150%)' : 'none', borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent', transition: 'all 0.3s ease', padding: '0 24px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <a href="/" aria-label="Pingbox home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/images/brand/logo.svg" alt="Pingbox" style={{ height: 32, width: 'auto', display: 'block' }} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ position: 'relative', height: 64, display: 'flex', alignItems: 'center' }} onMouseEnter={() => setProdOpen(true)} onMouseLeave={() => setProdOpen(false)}>
            <span style={{ fontSize: 14, fontWeight: 500, color: C.t2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: F }}>Products <Ic d={icons.chevDown} size={13} /></span>
            {prodOpen && (
              <div style={{ position: 'absolute', top: 56, left: -24, background: '#fff', borderRadius: 14, boxShadow: '0 16px 48px rgba(10,10,10,0.12), 0 0 0 1px rgba(10,10,10,0.04)', padding: 6, minWidth: 280, animation: 'fadeDown 0.15s ease' }}>
                {prods.map(p => (
                  <a key={p.label} href={p.href} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, textDecoration: 'none', color: C.ink, transition: 'background 0.12s' }} onMouseEnter={e => (e.currentTarget.style.background = C.surfaceAlt)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: p.softBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, flexShrink: 0 }}><Ic d={p.icon} size={17} /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: F }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: C.t3, fontFamily: F }}>{p.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          <a href="#industries" style={{ fontSize: 14, fontWeight: 500, color: C.t2, textDecoration: 'none', fontFamily: F }}>Industries</a>
          <a href="/for/teams" style={{ fontSize: 14, fontWeight: 500, color: C.t2, textDecoration: 'none', fontFamily: F }}>For Teams</a>
          <a href="/customers" style={{ fontSize: 14, fontWeight: 500, color: C.t2, textDecoration: 'none', fontFamily: F }}>Customers</a>
          <a href="#pricing" style={{ fontSize: 14, fontWeight: 500, color: C.t2, textDecoration: 'none', fontFamily: F }}>Pricing</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="/partner/login" style={{ fontSize: 14, fontWeight: 500, color: C.t2, textDecoration: 'none', fontFamily: F, padding: '8px 14px' }}>Sign in</a>
          <Btn href="/early-access" variant="primary" style={{ padding: '9px 18px', fontSize: 13.5, borderRadius: 8 }}>Start free</Btn>
        </div>
      </div>
    </nav>
  );
}

// ── Phone Animation ────────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', animation: `typeDot 1.2s ease-in-out ${i*0.15}s infinite` }} />)}
    </div>
  );
}

function ServiceCardBlock() {
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '94%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 10, padding: '10px 11px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 9, background: 'linear-gradient(135deg, #0A0A0A, #1F1F1F, #3A3A38)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 12px rgba(10,10,10,0.35)' }}>
          <Ic d={icons.zap} size={20} stroke="rgba(255,255,255,0.65)" sw={1.5} />
          <div style={{ position: 'absolute', top: 3, left: 3 }}><Chip>Today</Chip></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: F, lineHeight: 1.2 }}>AC Diagnostic & Repair</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <Chip bg="rgba(255,255,255,0.06)" color="rgba(255,255,255,0.5)">HVAC</Chip>
            <Ic d={icons.clock} size={8} stroke="rgba(255,255,255,0.3)" sw={2} />
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: F }}>60 min</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#D9955F', fontFamily: F }}>$89</span>
              <Stars />
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#fff', background: C.accent, padding: '4px 11px', borderRadius: 5, fontFamily: F }}>BOOK</div>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '6px 11px', display: 'flex', gap: 8 }}>
        {['Certified techs','Same-day service','90-day warranty'].map((p, pi) => (
          <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Ic d={icons.check} size={8} stroke={C.greenMid} sw={2.5} />
            <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', fontFamily: F }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingFlowBlock() {
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '94%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 3, padding: '7px 11px 4px' }}>
        {[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= 2 ? C.accent : 'rgba(255,255,255,0.08)' }} />)}
      </div>
      <div style={{ padding: '4px 11px 2px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', fontFamily: F, letterSpacing: '0.08em' }}>SELECT A TIME — TODAY</div>
      </div>
      <div style={{ padding: '5px 10px 10px', display: 'flex', gap: 5 }}>
        {[{t:'10:00 AM',s:'3 open'},{t:'1:30 PM',s:'2 open'},{t:'4:00 PM',s:'1 left'}].map((slot, si) => (
          <div key={si} style={{ flex: 1, padding: '8px 4px 7px', borderRadius: 8, background: si===1 ? C.accent : 'rgba(255,255,255,0.04)', border: si===1 ? 'none' : '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: si===1 ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: F }}>{slot.t}</div>
            <div style={{ fontSize: 7.5, color: si===1 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)', fontFamily: F, marginTop: 2 }}>{si===1 ? '✓ Selected' : slot.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmationBlock() {
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '94%', background: 'rgba(21,128,61,0.05)', border: '1px solid rgba(21,128,61,0.3)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '7px 11px', background: 'rgba(21,128,61,0.12)', borderBottom: '1px solid rgba(21,128,61,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'confirmPop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          <Ic d={icons.check} size={9} stroke="#fff" sw={3} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: C.greenMid, fontFamily: F }}>BOOKING CONFIRMED</span>
      </div>
      <div style={{ padding: '7px 12px 5px' }}>
        {[['Service','AC Diagnostic'],['Date · Time','Today · 1:30 PM'],['Technician','Mike R.'],['Total','$89']].map(([k,v], ri) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: ri < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: F, fontWeight: 500 }}>{k}</span>
            <span style={{ fontSize: 9, color: ri===3 ? C.greenMid : '#fff', fontFamily: F, fontWeight: ri===3 ? 800 : 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '4px 11px 9px' }}>
        <div style={{ background: 'rgba(21,128,61,0.1)', borderRadius: 6, padding: '6px 9px', textAlign: 'center' }}>
          <span style={{ fontSize: 8, color: C.greenMid, fontWeight: 600, fontFamily: F }}>📱 Confirmation sent via WhatsApp</span>
        </div>
      </div>
    </div>
  );
}

function RelayPhone() {
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  type Msg = { type: string; text?: string; dur: number };
  const timeline: Msg[] = [
    { type: 'user', text: 'My AC stopped cooling. Can someone come today?', dur: 2200 },
    { type: 'typing', dur: 900 },
    { type: 'ai', text: 'Absolutely — here\'s what we can do:', dur: 1200 },
    { type: 'typing', dur: 600 },
    { type: 'serviceCard', dur: 3200 },
    { type: 'user', text: 'The diagnostic. What times today?', dur: 1800 },
    { type: 'typing', dur: 700 },
    { type: 'bookingFlow', dur: 3000 },
    { type: 'user', text: '1:30 PM works 👍', dur: 1600 },
    { type: 'typing', dur: 600 },
    { type: 'confirmation', dur: 3500 },
    { type: 'ai', text: 'Done! Mike will text you 15 min before he arrives.', dur: 3000 },
    { type: 'pause', dur: 1400 },
  ];
  useEffect(() => {
    const t = setTimeout(() => {
      if (step >= timeline.length - 1) { setCycle(c => c+1); setStep(0); }
      else setStep(s => s+1);
    }, timeline[step].dur);
    return () => clearTimeout(t);
  }, [step, cycle]);
  const messages = timeline.slice(0, step+1).filter(m => m.type !== 'pause');
  const showTyping = messages.length > 0 && messages[messages.length-1].type === 'typing';
  const rendered = messages.filter(m => m.type !== 'typing');
  const windowed = rendered.length > 4 ? rendered.slice(rendered.length-4) : rendered;
  const cutCount = rendered.length > 4 ? rendered.length-4 : 0;
  return (
    <div style={{ position: 'relative', maxWidth: 310, margin: '0 auto' }}>
      <div style={{ position: 'absolute', inset: -20, background: `radial-gradient(ellipse at center, rgba(78,63,255,0.08), transparent 70%)`, borderRadius: 40, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', background: C.ink, borderRadius: 30, padding: 4, boxShadow: '0 28px 72px rgba(10,10,10,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset' }}>
        <div style={{ background: C.ink2, borderRadius: 26, overflow: 'hidden' }}>
          <div style={{ height: 22, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 4, height: 4, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, #163628)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: F }}>A</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 700, fontFamily: F }}>AirPro HVAC</div>
              <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', fontFamily: F }}>AI storefront · Phoenix, AZ</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, animation: 'pulse 2s infinite', boxShadow: `0 0 8px ${C.green}` }} />
          </div>
          <div style={{ padding: '8px 9px 4px', height: 400, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end', position: 'relative' }}>
            {cutCount > 0 && <div style={{ textAlign: 'center', padding: '2px 0 4px' }}><span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', fontFamily: F }}>· · ·</span></div>}
            {windowed.map((msg, i) => {
              const globalIdx = cutCount + i;
              const isNewest = globalIdx === rendered.length - 1;
              const anim = isNewest ? 'relayIn 0.5s cubic-bezier(0.16,1,0.3,1)' : 'none';
              const key = `${cycle}-${globalIdx}`;
              if (msg.type === 'user') return (
                <div key={key} style={{ alignSelf: 'flex-end', maxWidth: '82%', animation: anim }}>
                  <div style={{ background: C.accent, borderRadius: '12px 12px 4px 12px', padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, color: '#fff', fontFamily: F, lineHeight: 1.45 }}>{msg.text}</span>
                  </div>
                </div>
              );
              if (msg.type === 'ai') return (
                <div key={key} style={{ alignSelf: 'flex-start', maxWidth: '82%', animation: anim }}>
                  <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px 12px 12px 4px', padding: '8px 12px' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: F, lineHeight: 1.45 }}>{msg.text}</span>
                  </div>
                </div>
              );
              if (msg.type === 'serviceCard') return <div key={key} style={{ animation: anim }}><ServiceCardBlock /></div>;
              if (msg.type === 'bookingFlow') return <div key={key} style={{ animation: anim }}><BookingFlowBlock /></div>;
              if (msg.type === 'confirmation') return <div key={key} style={{ animation: anim }}><ConfirmationBlock /></div>;
              return null;
            })}
            {showTyping && <TypingBubble />}
          </div>
          <div style={{ padding: '4px 9px 10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', fontFamily: F }}>Message AirPro...</span>
              <Ic d={icons.send} size={13} stroke="rgba(255,255,255,0.15)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroFloatCard({ position }: { position: string }) {
  if (position === 'topLeft') return (
    <div style={{ position: 'absolute', top: 40, left: -50, background: '#fff', borderRadius: 12, padding: '10px 14px', border: `1px solid ${C.border}`, boxShadow: '0 12px 32px rgba(10,10,10,0.1)', display: 'flex', alignItems: 'center', gap: 10, animation: 'floatGentle 4s ease-in-out infinite' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: C.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green }}><Ic d={icons.check} size={14} sw={2.5} /></div>
      <div><div style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F }}>Lead → decision</div><div style={{ fontSize: 9.5, color: C.t3, fontFamily: F, marginTop: 1 }}>Converted in one chat</div></div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', bottom: 60, right: -40, background: '#fff', borderRadius: 12, padding: '10px 14px', border: `1px solid ${C.border}`, boxShadow: '0 12px 32px rgba(10,10,10,0.1)', display: 'flex', alignItems: 'center', gap: 10, animation: 'floatGentle 4s ease-in-out 1s infinite' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}><Ic d={icons.dollar} size={14} sw={2.5} /></div>
      <div><div style={{ fontSize: 11, fontWeight: 700, color: C.ink, fontFamily: F }}>+$89 captured</div><div style={{ fontSize: 9.5, color: C.t3, fontFamily: F, marginTop: 1 }}>From a $4 ad click</div></div>
    </div>
  );
}

function Hero() {
  return (
    <section style={{ paddingTop: 120, paddingBottom: 90, background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 620, height: 620, background: `radial-gradient(circle at center, rgba(78,63,255,0.08), transparent 60%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: '56px 56px', opacity: 0.4, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 900px 500px at 50% 40%, black 20%, transparent 80%)' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <FadeIn>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 5px', background: '#fff', borderRadius: 100, border: `1px solid ${C.border}`, marginBottom: 28, boxShadow: '0 1px 2px rgba(10,10,10,0.03)' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: C.accent, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.08em' }}>NEW</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.t2, fontFamily: F }}>Conversational lead conversion — built for service brands</span>
                <Ic d={icons.arrow} size={12} stroke={C.t3} />
              </div>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h1 style={{ fontFamily: F, fontSize: 72, fontWeight: 800, lineHeight: 0.95, color: C.ink, letterSpacing: '-0.05em', margin: '0 0 28px' }}>
                Turn every inquiry<br />into a <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 500, color: C.accent, letterSpacing: '-0.03em' }}>decision</span>,<br />not just a <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.03em', color: C.t2 }}>reply</span>.
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p style={{ fontSize: 19, lineHeight: 1.55, color: C.t2, maxWidth: 540, margin: '0 0 36px', fontFamily: F, fontWeight: 400 }}>
                You spend thousands on ads to drive traffic. Most of it leaks. Pingbox catches every inbound — from your site, social, or messaging — and converts it with tappable <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 8px', background: C.accentSoft, color: C.accent, borderRadius: 5, fontWeight: 700, fontSize: 16, fontFamily: F, border: `1px solid rgba(78,63,255,0.2)` }}>service cards</span>, booking flows, and quotes.
              </p>
            </FadeIn>
            <FadeIn delay={0.14}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                <Btn href="/early-access" variant="accent" style={{ padding: '15px 28px', fontSize: 15 }}>Start free — 14 days <Ic d={icons.arrow} size={15} /></Btn>
                <Btn href="#how" variant="secondary" style={{ padding: '15px 28px', fontSize: 15 }}>See how it works</Btn>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 13, color: C.t3, fontFamily: F, fontWeight: 500, flexWrap: 'wrap' }}>
                {['No credit card','Live in 5 minutes','Cancel anytime'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Ic d={icons.check} size={13} stroke={C.accent} sw={2.5} />{t}</div>
                ))}
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.18}>
            <div style={{ position: 'relative' }}>
              <RelayPhone />
              <HeroFloatCard position="topLeft" />
              <HeroFloatCard position="bottomRight" />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── TrustBar ──────────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <section style={{ padding: '28px 24px 56px', background: C.bg, borderTop: `1px solid ${C.border}`, marginTop: -40, position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', background: '#fff', borderRadius: 14, padding: '20px 28px', border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(10,10,10,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic d={icons.grid} size={16} stroke={C.accent} sw={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: F }}>One brain. Every location. Every channel.</div>
              <div style={{ fontSize: 11, color: C.t3, fontFamily: F, marginTop: 1 }}>Multi-location rollouts · 100+ languages · SOC 2 aligned</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.t4, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: F }}>Channels</span>
            {[{name:'Web',color:C.accent},{name:'WhatsApp',color:'#25D366'},{name:'Instagram',color:'#E4405F'},{name:'SMS',color:'#F22F46'},{name:'TikTok',color:'#0A0A0A',soon:true}].map((ch, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: (ch as any).color, opacity: (ch as any).soon ? 0.4 : 1 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: (ch as any).soon ? C.t4 : C.t2, fontFamily: F }}>{ch.name}{(ch as any).soon && <span style={{ fontSize: 9, fontWeight: 600, color: C.t4, marginLeft: 4, fontFamily: FM }}>soon</span>}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── ProblemStats ──────────────────────────────────────────────────────────────

function ProblemStats() {
  return (
    <section style={{ padding: '60px 24px 100px', background: C.bg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ maxWidth: 720, marginBottom: 60 }}>
            <Eyebrow color={C.red}>The leak</Eyebrow>
            <h2 style={{ fontFamily: F, fontSize: 48, fontWeight: 800, color: C.ink, letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.02 }}>
              You&apos;re paying for clicks.<br />Then <span style={{ fontFamily: FS, fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.025em' }}>losing</span> them at the door.
            </h2>
            <p style={{ fontSize: 17, color: C.t2, fontFamily: F, lineHeight: 1.6, margin: 0, maxWidth: 600 }}>Every visitor that hits your site cost you money to acquire — Google Ads, Meta, SEO, referrals. Most of them never convert. You&apos;re not under-spending on traffic. You&apos;re under-converting it.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ padding: '28px 32px', background: C.surfaceAlt }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.t3, letterSpacing: '0.1em', fontFamily: F, marginBottom: 4 }}>THE LEAK, IN DOLLARS</div>
                <div style={{ fontFamily: F, fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.025em', lineHeight: 1.1 }}>For every $10K in<br />ad spend, you waste</div>
                <div style={{ fontFamily: F, fontSize: 42, fontWeight: 800, color: C.accent, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 10 }}>~$7.3K</div>
                <div style={{ fontSize: 12, color: C.t3, fontFamily: F, marginTop: 6, lineHeight: 1.5 }}>on traffic that asked, didn&apos;t get a real answer, and bounced.</div>
              </div>
              {[{value:'73%',label:'of website inquiries never become qualified leads',src:'Drift / Marketo benchmarks',color:C.red},{value:'5%',label:'average chat-to-booking conversion across service businesses',src:'HubSpot 2025',color:C.amber},{value:'3-5x',label:'lift on conversion when replies are interactive UI, not text',src:'Pingbox beta data',color:C.accent}].map((s,i) => (
                <div key={i} style={{ padding: '28px 28px 24px', borderLeft: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: F, fontSize: 44, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 10 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: C.t2, fontFamily: F, lineHeight: 1.45, fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 10.5, color: C.t4, fontFamily: F, fontStyle: 'italic' }}>{s.src}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '20px 32px', background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(78,63,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                  <Ic d={icons.lightning} size={18} sw={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: F }}>Pingbox closes the leak. Same traffic. More conversions.</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: F, marginTop: 2 }}>Most operators see Pingbox pay for itself within their first ad cycle.</div>
                </div>
              </div>
              <Btn href="/tools/leak-calculator" variant="accent" style={{ padding: '10px 20px', fontSize: 13 }}>Calculate your leak <Ic d={icons.arrow} size={13} /></Btn>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── HowItWorks visuals ────────────────────────────────────────────────────────

function UploadVisual() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setStage(s => Math.min(s+1, 3)), 800);
    return () => clearTimeout(t);
  }, [stage]);
  const files = [
    {name:'Service Catalog 2025.pdf',size:'2.4 MB',pages:'12 pages',progress:stage>=1?100:0},
    {name:'Pricing Sheet Q1.xlsx',size:'840 KB',pages:'3 sheets',progress:stage>=2?100:0},
    {name:'FAQ & Policies.docx',size:'156 KB',pages:'8 pages',progress:stage>=3?78:0},
  ];
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:24, border:`1px solid ${C.border}`, maxWidth:580, margin:'0 auto', boxShadow:'0 12px 32px rgba(10,10,10,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div><div style={{ fontSize:14, fontWeight:700, color:C.ink, fontFamily:F }}>Knowledge base</div><div style={{ fontSize:12, color:C.t3, fontFamily:F, marginTop:2 }}>3 files · 3,396 words indexed</div></div>
        <div style={{ padding:'6px 12px', borderRadius:8, background:C.accent, fontSize:11, fontWeight:700, color:'#fff', fontFamily:F, display:'flex', alignItems:'center', gap:4 }}><Ic d={icons.file} size={12} sw={2.5} />Add files</div>
      </div>
      {files.map((f,i) => (
        <div key={i} style={{ padding:'14px 0', borderBottom:i<2?`1px solid ${C.borderLight}`:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:C.accentSoft, display:'flex', alignItems:'center', justifyContent:'center', color:C.accent, flexShrink:0 }}><Ic d={icons.file} size={16} sw={2} /></div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.ink, fontFamily:F }}>{f.name}</div>
              <div style={{ fontSize:11, color:C.t3, fontFamily:F, marginTop:2 }}>{f.size} · {f.pages}</div>
            </div>
            <div style={{ fontSize:10, fontWeight:700, fontFamily:F, color:f.progress===100?C.green:f.progress>0?C.amber:C.t4, background:f.progress===100?C.greenSoft:f.progress>0?C.amberSoft:C.surfaceAlt, padding:'4px 10px', borderRadius:5, flexShrink:0 }}>
              {f.progress===100?'✓ INDEXED':f.progress>0?'INDEXING':'QUEUED'}
            </div>
          </div>
          <div style={{ marginTop:8, height:3, background:C.surfaceAlt, borderRadius:2, overflow:'hidden' }}>
            <div style={{ width:`${f.progress}%`, height:'100%', background:f.progress===100?C.green:C.amber, borderRadius:2, transition:'width 0.6s ease' }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop:16, padding:'10px 14px', background:C.greenSoft, borderRadius:8, display:'flex', alignItems:'center', gap:8, border:'1px solid rgba(21,128,61,0.15)' }}>
        <Ic d={icons.check} size={13} stroke={C.green} sw={2.5} />
        <span style={{ fontSize:12, color:C.green, fontFamily:F, fontWeight:600 }}>Your AI now knows {stage===3?'everything about your business':'most of your services'}.</span>
      </div>
    </div>
  );
}

function ConnectVisual() {
  const [connecting, setConnecting] = useState(0);
  useEffect(() => { const t = setTimeout(() => setConnecting(c=>(c+1)%4), 1400); return () => clearTimeout(t); }, [connecting]);
  const channels = [
    {name:'WhatsApp Business',sub:'+1 602-555-0144 · 2,847 contacts',color:'#25D366',icon:icons.msg},
    {name:'SMS via Twilio',sub:'US + CA · +1 555-0198',color:'#F22F46',icon:icons.phone},
    {name:'Telegram Bot',sub:'@airpro_hvac · 421 subscribers',color:'#0088cc',icon:icons.send},
    {name:'Web Chat Widget',sub:'Embedded on airprohvac.com',color:C.indigo,icon:icons.mouse},
  ];
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:24, border:`1px solid ${C.border}`, maxWidth:580, margin:'0 auto', boxShadow:'0 12px 32px rgba(10,10,10,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div><div style={{ fontSize:14, fontWeight:700, color:C.ink, fontFamily:F }}>Channels</div><div style={{ fontSize:12, color:C.t3, fontFamily:F, marginTop:2 }}>4 connected · 1 brain, everywhere</div></div>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:100, background:C.greenSoft }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:C.green, animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:10, fontWeight:700, color:C.green, fontFamily:F }}>ALL LIVE</span>
        </div>
      </div>
      {channels.map((c,i) => (
        <div key={i} style={{ padding:'14px 0', borderBottom:i<3?`1px solid ${C.borderLight}`:'none', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:9, background:c.color+'15', display:'flex', alignItems:'center', justifyContent:'center', color:c.color, flexShrink:0, position:'relative' }}>
            <Ic d={c.icon} size={18} sw={2} />
            {connecting===i&&<div style={{ position:'absolute', inset:-3, borderRadius:12, border:`2px solid ${c.color}`, animation:'connectPulse 1.4s ease-out' }} />}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.ink, fontFamily:F }}>{c.name}</span>
              <Ic d={icons.check} size={11} stroke={C.green} sw={3} />
            </div>
            <div style={{ fontSize:11, color:C.t3, marginTop:2, fontFamily:FM }}>{c.sub}</div>
          </div>
          <div style={{ width:36, height:20, borderRadius:20, background:C.green, position:'relative', flexShrink:0 }}>
            <div style={{ position:'absolute', top:2, left:18, width:16, height:16, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveVisual() {
  const [stream, setStream] = useState<Array<{time:string;channel:string;text:string;color:string;success:boolean|string;revenue?:string}>>([]);
  useEffect(() => {
    const events = [
      {time:'10:42 AM',channel:'WhatsApp',text:'New inquiry → Replied with Service Catalog block',color:'#25D366',success:true},
      {time:'10:43 AM',channel:'WhatsApp',text:'Customer tapped → Sent Booking Flow block',color:'#25D366',success:true},
      {time:'10:44 AM',channel:'WhatsApp',text:'Slot selected → Confirmed · $89 tracked',color:'#25D366',success:true,revenue:'$89'},
      {time:'10:51 AM',channel:'SMS',text:'Pricing inquiry → Replied with Pricing Table block',color:'#F22F46',success:true},
      {time:'10:58 AM',channel:'Web Chat',text:'Complex question → Handed off to Sarah with context',color:C.indigo,success:'human'},
    ];
    events.forEach((e,i) => { setTimeout(() => setStream(s=>[...s,e].slice(-5)), i*800+200); });
  }, []);
  return (
    <div style={{ background:'#fff', borderRadius:14, padding:24, border:`1px solid ${C.border}`, maxWidth:580, margin:'0 auto', boxShadow:'0 12px 32px rgba(10,10,10,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div><div style={{ fontSize:14, fontWeight:700, color:C.ink, fontFamily:F }}>Activity stream</div><div style={{ fontSize:12, color:C.t3, fontFamily:F, marginTop:2 }}>Live · Real conversations, real revenue</div></div>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:100, background:'rgba(78,63,255,0.08)' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:C.accent, animation:'pulse 1.5s infinite' }} />
          <span style={{ fontSize:10, fontWeight:700, color:C.accent, fontFamily:F }}>RECORDING</span>
        </div>
      </div>
      <div style={{ minHeight:280 }}>
        {stream.map((e,i) => (
          <div key={i} style={{ padding:'11px 0', borderBottom:i<stream.length-1?`1px solid ${C.borderLight}`:'none', animation:'streamIn 0.4s cubic-bezier(0.16,1,0.3,1)', display:'flex', alignItems:'flex-start', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0, marginTop:6, boxShadow:`0 0 6px ${e.color}` }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontSize:10, fontFamily:FM, color:C.t4, fontWeight:600 }}>{e.time}</span>
                <span style={{ fontSize:9.5, fontWeight:700, color:e.color, background:e.color+'12', padding:'1px 7px', borderRadius:4, fontFamily:F }}>{e.channel}</span>
                {e.success===true&&<span style={{ fontSize:9.5, color:C.green, fontWeight:700, fontFamily:F }}>✓ AI resolved</span>}
                {e.success==='human'&&<span style={{ fontSize:9.5, color:C.amber, fontWeight:700, fontFamily:F }}>↪ Handed off</span>}
                {e.revenue&&<span style={{ fontSize:10, fontWeight:800, color:C.accent, fontFamily:F }}>+{e.revenue}</span>}
              </div>
              <div style={{ fontSize:12.5, color:C.t2, fontFamily:F, lineHeight:1.45 }}>{e.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HowItWorks ────────────────────────────────────────────────────────────────

function HowItWorks() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setActive((active+1)%3), 4500);
    return () => clearTimeout(t);
  }, [active, auto]);
  const steps = [
    {num:'01',time:'2 min',title:'Upload what your business already runs on',desc:'Drop in your service catalog PDF, price sheet, or FAQ doc. Pingbox indexes everything with semantic search.',visual:<UploadVisual />},
    {num:'02',time:'1 min',title:'Connect your channels',desc:'Web widget embeds on your site in one line. WhatsApp Business API, Instagram DM, SMS via Twilio — authorize in a click.',visual:<ConnectVisual />},
    {num:'03',time:'Ongoing',title:'Your AI replies — with interactive UI',desc:'Customers message. Pingbox picks the right block for the intent — service catalog, booking flow, pricing table — fills it with your data and ships a tappable reply.',visual:<LiveVisual />},
  ];
  return (
    <section id="how" style={{ padding:'100px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1180, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:48, gap:24, flexWrap:'wrap' }}>
            <div style={{ maxWidth:600 }}>
              <Eyebrow>How it works</Eyebrow>
              <h2 style={{ fontFamily:F, fontSize:48, fontWeight:800, color:C.ink, letterSpacing:'-0.04em', margin:'0 0 12px', lineHeight:1.02 }}>
                Live in <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, color:C.accent, letterSpacing:'-0.025em' }}>5 minutes</span>.<br />No code. No consultants.
              </h2>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:C.bg, border:`1px solid ${C.border}`, borderRadius:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:C.green, animation:'pulse 2s infinite' }} />
              <span style={{ fontSize:12, fontWeight:600, color:C.t2, fontFamily:F }}>Total setup time: <strong style={{ color:C.ink }}>~3 minutes</strong></span>
            </div>
          </div>
        </FadeIn>
        <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:40, alignItems:'start' }}>
          <FadeIn delay={0.06}>
            <div style={{ position:'sticky', top:100 }}>
              {steps.map((s,i) => (
                <button key={i} onClick={() => { setActive(i); setAuto(false); }} style={{ display:'block', width:'100%', textAlign:'left', padding:'22px 24px', background:active===i?C.ink:'#fff', color:active===i?'#fff':C.ink, border:`1px solid ${active===i?C.ink:C.border}`, borderRadius:14, marginBottom:10, cursor:'pointer', fontFamily:F, transition:'all 0.3s cubic-bezier(0.16,1,0.3,1)', position:'relative', overflow:'hidden' }}>
                  {active===i&&auto&&<div style={{ position:'absolute', bottom:0, left:0, height:2, background:C.accent, animation:'progressBar 4.5s linear' }} />}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:FM, fontSize:11, fontWeight:700, color:active===i?C.accent:C.t3 }}>{s.num}</span>
                    <span style={{ fontSize:10, fontWeight:600, color:active===i?'rgba(255,255,255,0.5)':C.t4, fontFamily:F, padding:'2px 7px', borderRadius:4, background:active===i?'rgba(255,255,255,0.08)':C.surfaceAlt }}>{s.time}</span>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.015em', marginBottom:6, lineHeight:1.25 }}>{s.title}</div>
                  <div style={{ fontSize:13, color:active===i?'rgba(255,255,255,0.65)':C.t3, fontFamily:F, lineHeight:1.5 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ background:C.bg, borderRadius:18, padding:32, border:`1px solid ${C.border}`, minHeight:480, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div key={active} style={{ width:'100%', animation:'stepIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>{steps[active].visual}</div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ── Platform visuals ──────────────────────────────────────────────────────────
// BlockLibraryVisual is imported from ./blocks

function EngageVisual() {
  const items = [
    {ch:'WhatsApp',color:'#25D366',name:'Sarah Martinez',msg:'Hi, is the 2BR condo on Oak Street still available?',time:'2m',unread:2},
    {ch:'Telegram',color:'#0088cc',name:'Mark Chen',msg:"What's the price for 500 units of SKU BBV-075?",time:'14m',unread:0},
    {ch:'SMS',color:'#F22F46',name:'+1 (713) 555-0192',msg:'Can someone come fix my AC today?',time:'32m',unread:1},
    {ch:'Web',color:C.indigo,name:'Anonymous visitor',msg:'Looking for teeth whitening options',time:'1h',unread:0},
  ];
  return (
    <div style={{ background:C.ink, borderRadius:16, padding:18, boxShadow:'0 20px 60px rgba(10,10,10,0.15)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'0 4px' }}>
        <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:800, color:'#fff', fontFamily:F }}>ENGAGE HUB</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:F, marginTop:1 }}>4 unread · 2 campaigns live</div></div>
        <div style={{ padding:'4px 10px', borderRadius:6, background:C.accent, fontSize:10, fontWeight:700, color:'#fff', fontFamily:F }}>+ Broadcast</div>
      </div>
      {items.map((it,i) => (
        <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, border:'1px solid rgba(255,255,255,0.05)', marginBottom:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:it.color, flexShrink:0 }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#fff', fontFamily:F }}>{it.name}</span>
              <span style={{ fontSize:8, color:it.color, fontFamily:F, fontWeight:600 }}>{it.ch}</span>
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontFamily:F, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.msg}</div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:F }}>{it.time}</div>
            {it.unread>0&&<div style={{ width:14, height:14, borderRadius:'50%', background:C.accent, fontSize:8, fontWeight:800, color:'#fff', fontFamily:F, display:'flex', alignItems:'center', justifyContent:'center', marginTop:3, marginLeft:'auto' }}>{it.unread}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function IntelligenceVisual() {
  const metrics = [
    {label:'Revenue tracked',value:'$142,380',change:'+23.4%'},
    {label:'Conversations',value:'2,847',change:'+18.2%'},
    {label:'Conversion rate',value:'23.1%',change:'+4.2pp'},
    {label:'Avg response time',value:'28s',change:'-12s'},
  ];
  const channels = [{name:'WhatsApp',pct:62,rev:'$88.2K'},{name:'Web Chat',pct:21,rev:'$29.9K'},{name:'SMS',pct:11,rev:'$15.7K'},{name:'Telegram',pct:6,rev:'$8.5K'}];
  return (
    <div style={{ background:C.ink, borderRadius:16, padding:18, boxShadow:'0 20px 60px rgba(10,10,10,0.15)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:800, color:'#fff', fontFamily:F }}>THIS MONTH</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
        {metrics.map((m,i) => (
          <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', border:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:F, marginBottom:3 }}>{m.label}</div>
            <div style={{ fontSize:16, color:'#fff', fontWeight:800, fontFamily:F, letterSpacing:'-0.02em' }}>{m.value}</div>
            <div style={{ fontSize:9, color:C.greenMid, fontFamily:F, fontWeight:700, marginTop:2 }}>{m.change}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:12, border:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:10, fontWeight:800, color:'#fff', fontFamily:F, marginBottom:10 }}>REVENUE BY CHANNEL</div>
        {channels.map((c,i) => (
          <div key={i} style={{ marginBottom:i<3?8:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontFamily:F, marginBottom:3 }}>
              <span style={{ color:'rgba(255,255,255,0.7)' }}>{c.name}</span>
              <span style={{ color:'#fff', fontWeight:700 }}>{c.rev}</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:`${c.pct}%`, height:'100%', background:i===0?C.accent:i===1?C.indigo:i===2?C.amber:C.green, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Platform ──────────────────────────────────────────────────────────────────

function Platform() {
  const [active, setActive] = useState(0);
  const products = [
    {id:'relay',label:'Relay',sub:'The block library',color:C.accent,softBg:C.accentSoft,icon:icons.grid,headline:'A library of interactive blocks. One per vertical intent.',description:"Most chat tools reply with text. Relay replies with a tappable block — the right one, for the right intent, in your industry's language. Service Cards, Booking Flows, Pricing Tables, Lead Forms, Quote Builders, Handoff Cards, and dozens more. Customers tap instead of type. Bookings go up.",features:[{title:'Service Catalogs',desc:'Browsable cards for everything you offer'},{title:'Booking Flows',desc:'Calendar scheduling without redirects'},{title:'Pricing Tables',desc:'Dynamic quotes from your price list'},{title:'Lead Capture',desc:'Forms that qualify before a human touches it'},{title:'Review Cards',desc:'Social proof inline in the conversation'},{title:'Handoff Cards',desc:'Full context transfer to your team'}],stat:{number:'3-5x',label:'lift on conversion'}},
    {id:'engage',label:'Engage',sub:'Inbox + broadcast',color:C.blue,softBg:C.blueSoft,icon:icons.broadcast,headline:'Every channel. Every location. One view.',description:'Consolidate inbound from web, WhatsApp, Instagram, and SMS into a single operator console. Route conversations by location, team, or lifecycle stage. Broadcast to segmented audiences across all locations without switching tools.',features:[{title:'Unified Inbox',desc:'All channels, all locations, one stream'},{title:'Location Routing',desc:'Auto-route by geography, team, or load'},{title:'Broadcast Campaigns',desc:'Segment by behavior, location, lifecycle'},{title:'Smart Escalation',desc:'AI triages complex requests to humans'},{title:'Drip Sequences',desc:'Automated follow-ups with revenue tracking'},{title:'Template Library',desc:'Pre-approved WhatsApp & SMS templates'}],stat:{number:'5',label:'channels, one inbox'}},
    {id:'intelligence',label:'Intelligence',sub:'Revenue attribution',color:C.indigo,softBg:C.indigoSoft,icon:icons.chart,headline:'Know which message made you money.',description:'Every conversation tracked as pipeline. See revenue by location, channel, and AI response category. Benchmark performance across your brand and spot the outliers — the location drowning in inquiries, the channel silently converting.',features:[{title:'Revenue Attribution',desc:'Conversations tied to actual payments'},{title:'Location Benchmarking',desc:'Compare performance across locations'},{title:'Channel Analytics',desc:'Compare web vs WhatsApp vs SMS ROI'},{title:'AI Lift Tracking',desc:'What AI resolved vs what needed humans'},{title:'Conversation Trends',desc:'Top questions, peak hours, drop-offs'},{title:'Pipeline Dashboard',desc:'Real-time funnel, by location or rolled up'}],stat:{number:'$142K',label:'tracked last month'}},
  ];
  const p = products[active];
  const tabIcon = (id: string) => id === 'relay' ? icons.grid : id === 'engage' ? icons.broadcast : icons.chart;
  return (
    <section style={{ padding:'100px 24px', background:C.bg }}>
      <div style={{ maxWidth:1180, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ textAlign:'center', marginBottom:50 }}>
            <Eyebrow>The platform</Eyebrow>
            <h2 style={{ fontFamily:F, fontSize:48, fontWeight:800, color:C.ink, letterSpacing:'-0.04em', margin:'0 0 12px', lineHeight:1.02 }}>Three products. <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.025em' }}>One brain.</span></h2>
            <p style={{ fontSize:16, color:C.t2, fontFamily:F, maxWidth:520, margin:'0 auto', fontWeight:400 }}>Everything you need to reply fast, manage every channel, and track what actually converts — built on one connected foundation.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.06}>
          <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:40, flexWrap:'wrap' }}>
            {products.map((pr,i) => (
              <button key={pr.id} onClick={() => setActive(i)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 22px', borderRadius:12, border:`1px solid ${active===i?C.ink:C.border}`, cursor:'pointer', fontFamily:F, fontSize:14, fontWeight:700, background:active===i?C.ink:'#fff', color:active===i?'#fff':C.t2, transition:'all 0.2s ease' }}>
                <Ic d={tabIcon(pr.id)} size={15} stroke={active===i?pr.color:C.t3} />
                {pr.label}
                <span style={{ fontSize:11, fontWeight:500, color:active===i?'rgba(255,255,255,0.5)':C.t4, borderLeft:`1px solid ${active===i?'rgba(255,255,255,0.15)':C.border}`, paddingLeft:10 }}>{pr.sub}</span>
              </button>
            ))}
          </div>
        </FadeIn>
        <FadeIn key={p.id} delay={0.05}>
          <div style={{ background:'#fff', borderRadius:20, border:`1px solid ${C.border}`, boxShadow:'0 2px 8px rgba(10,10,10,0.03)', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:520 }}>
              <div style={{ padding:'48px 48px 40px', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column' }}>
                <div id={p.id} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:100, background:p.softBg, marginBottom:20, alignSelf:'flex-start' }}>
                  <Ic d={tabIcon(p.id)} size={12} stroke={p.color} />
                  <span style={{ fontSize:11, fontWeight:800, color:p.color, fontFamily:F, letterSpacing:'0.04em', textTransform:'uppercase' }}>{p.label}</span>
                </div>
                <h3 style={{ fontFamily:F, fontSize:32, fontWeight:800, color:C.ink, margin:'0 0 16px', letterSpacing:'-0.03em', lineHeight:1.08 }}>{p.headline}</h3>
                <p style={{ fontSize:15, color:C.t2, fontFamily:F, lineHeight:1.65, margin:'0 0 32px', fontWeight:400 }}>{p.description}</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24 }}>
                  {p.features.map((f,i) => (
                    <div key={i} style={{ padding:'14px 16px', borderRadius:10, background:C.bg, border:`1px solid ${C.borderLight}` }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.ink, fontFamily:F, marginBottom:4 }}>{f.title}</div>
                      <div style={{ fontSize:12, color:C.t2, fontFamily:F, lineHeight:1.5 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:'auto', paddingTop:20, borderTop:`1px solid ${C.borderLight}`, display:'flex', alignItems:'baseline', gap:12 }}>
                  <span style={{ fontFamily:F, fontSize:40, fontWeight:800, color:p.color, letterSpacing:'-0.04em', lineHeight:1 }}>{p.stat.number}</span>
                  <span style={{ fontSize:13, color:C.t3, fontFamily:F, fontWeight:500 }}>{p.stat.label}</span>
                </div>
              </div>
              <div style={{ padding:48, background:`radial-gradient(ellipse at center, ${p.softBg} 0%, ${C.bg} 80%)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {p.id === 'relay' && <BlockLibraryVisual />}
                {p.id === 'engage' && <EngageVisual />}
                {p.id === 'intelligence' && <IntelligenceVisual />}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Comparison ────────────────────────────────────────────────────────────────

function Comparison() {
  const rows = [
    {feature:'Reply format',others:'Text messages',us:'Tappable UI: catalogs, booking flows, quotes'},
    {feature:'What it optimizes for',others:'Response speed',us:'Conversion outcomes'},
    {feature:'Vertical-specific blocks',others:'Generic templates',us:'Pre-built per industry'},
    {feature:'Customer effort',others:'Type back and forth',us:'Tap to decide — no typing'},
    {feature:'Lead-to-conversion lift',others:'Same as text channels',us:'3–5× higher conversion'},
    {feature:'Built for',others:'Reputation + reviews',us:'Inbound revenue acquisition'},
  ];
  return (
    <section style={{ padding:'100px 24px', background:C.bg }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ maxWidth:720, marginBottom:50, textAlign:'center', margin:'0 auto 50px' }}>
            <Eyebrow>The difference</Eyebrow>
            <h2 style={{ fontFamily:F, fontSize:42, fontWeight:800, color:C.ink, letterSpacing:'-0.035em', margin:'0 0 14px', lineHeight:1.05 }}>
              Other tools send <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.02em' }}>messages</span>.<br />Pingbox sends <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, color:C.accent, letterSpacing:'-0.02em' }}>decisions</span>.
            </h2>
            <p style={{ fontSize:16, color:C.t2, fontFamily:F, lineHeight:1.65, margin:'14px auto 0', maxWidth:600 }}>
              Legacy chat and messaging platforms compete on response time. We compete on revenue. We call it <strong style={{ color:C.ink }}>conversational lead conversion</strong>.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div style={{ background:'#fff', borderRadius:18, border:`1px solid ${C.border}`, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', borderBottom:`1px solid ${C.border}`, background:C.surfaceAlt }}>
              <div style={{ padding:'20px 28px' }}><span style={{ fontSize:11, fontWeight:800, color:C.t3, fontFamily:F }}>VS.</span></div>
              <div style={{ padding:'20px 28px', borderLeft:`1px solid ${C.border}` }}><span style={{ fontSize:13, fontWeight:700, color:C.t3, fontFamily:F }}>Legacy messaging tools</span></div>
              <div style={{ padding:'20px 28px', borderLeft:`1px solid ${C.border}`, background:'#fff', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:18, height:18, borderRadius:5, background:C.ink, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:6, height:6, borderRadius:'50%', background:C.accent }} /></div>
                <span style={{ fontSize:13, fontWeight:800, color:C.ink, fontFamily:F }}>Pingbox</span>
                <span style={{ fontSize:9, fontWeight:700, color:C.accent, background:C.accentSoft, padding:'2px 7px', borderRadius:4, fontFamily:F, marginLeft:'auto' }}>NEW CATEGORY</span>
              </div>
            </div>
            {rows.map((r,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', borderBottom:i<rows.length-1?`1px solid ${C.borderLight}`:'none' }}>
                <div style={{ padding:'20px 28px', display:'flex', alignItems:'center' }}><span style={{ fontSize:13, fontWeight:700, color:C.ink, fontFamily:F }}>{r.feature}</span></div>
                <div style={{ padding:'20px 28px', borderLeft:`1px solid ${C.borderLight}`, display:'flex', alignItems:'center', gap:10 }}>
                  <Ic d={icons.x} size={14} stroke={C.t4} sw={2.5} />
                  <span style={{ fontSize:13, color:C.t3, fontFamily:F }}>{r.others}</span>
                </div>
                <div style={{ padding:'20px 28px', borderLeft:`1px solid ${C.borderLight}`, background:C.accentSoft+'55', display:'flex', alignItems:'center', gap:10 }}>
                  <Ic d={icons.check} size={14} stroke={C.accent} sw={2.5} />
                  <span style={{ fontSize:13, color:C.ink, fontFamily:F, fontWeight:600 }}>{r.us}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Industries ────────────────────────────────────────────────────────────────

function Industries() {
  const items = [
    {name:'Dental & Aesthetic Clinics',q:'"How much is teeth whitening? Openings this week?"',color:C.accent,softBg:C.accentSoft,hoverBdr:'#8A7DFF',href:'/for/dental-clinics',tag:'Most popular'},
    {name:'HVAC & Home Services',q:'"My AC stopped working. Can someone come today?"',color:C.blue,softBg:C.blueSoft,hoverBdr:'#A8B8E0',href:'/for/hvac',tag:null},
    {name:'Boutique Fitness Studios',q:'"What morning class times are open? Free trial?"',color:C.indigo,softBg:C.indigoSoft,hoverBdr:'#B5B0FF',href:'/for/fitness',tag:null},
    {name:'Real Estate',q:'"Is the 2BR condo on Oak Street still available?"',color:C.green,softBg:C.greenSoft,hoverBdr:C.greenMid,href:'/for/real-estate',tag:null},
    {name:'Law & Insurance',q:"\"Do you handle personal injury? What's the process?\"",color:C.amber,softBg:C.amberSoft,hoverBdr:'#C9B88E',href:'/for/law-insurance',tag:null},
    {name:'B2B Wholesale',q:'"Bulk price for 500 units of SKU BBV-075?"',color:C.rust,softBg:C.rustSoft,hoverBdr:'#E8A590',href:'/for/b2b-wholesale',tag:null},
  ];
  return (
    <section id="industries" style={{ padding:'100px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ maxWidth:680, marginBottom:48 }}>
            <Eyebrow>Built for your industry</Eyebrow>
            <h2 style={{ fontFamily:F, fontSize:42, fontWeight:800, color:C.ink, letterSpacing:'-0.035em', margin:'0 0 14px', lineHeight:1.05 }}>
              Built for your industry,<br />not <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.02em' }}>just</span> your use case.
            </h2>
          </div>
        </FadeIn>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {items.map((ind,i) => (
            <FadeIn key={i} delay={i*0.04}>
              <a href={ind.href} style={{ display:'block', background:C.bg, borderRadius:14, padding:'24px 22px', border:`1px solid ${C.borderLight}`, textDecoration:'none', transition:'all 0.2s ease' }} onMouseEnter={e=>{e.currentTarget.style.borderColor=ind.hoverBdr;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 28px rgba(10,10,10,0.06)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderLight;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
                {ind.tag&&<div style={{ fontSize:9, fontWeight:800, color:ind.color, background:ind.softBg, padding:'3px 8px', borderRadius:4, fontFamily:F, display:'inline-block', marginBottom:10 }}>{ind.tag}</div>}
                <div style={{ fontSize:16, fontWeight:700, color:C.ink, fontFamily:F, marginBottom:12 }}>{ind.name}</div>
                <div style={{ background:'#fff', borderRadius:9, padding:'11px 13px', border:`1px solid ${C.borderLight}`, marginBottom:12 }}>
                  <div style={{ fontSize:12, color:C.t2, fontFamily:F, fontStyle:'italic', lineHeight:1.5 }}>{ind.q}</div>
                </div>
                <span style={{ fontSize:11, color:ind.color, fontWeight:700, fontFamily:F }}>AI replies in 30s →</span>
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WhyNot ────────────────────────────────────────────────────────────────────

function WhyNot() {
  const objections = [
    {q:"Isn't this just another chatbot?",a:"No. Chatbots reply with text. Pingbox replies with tappable UI — catalogs, booking forms, pricing tables. Customers tap instead of type. In tests across service verticals, that's a 3–5x lift on conversion."},
    {q:"How does it roll out across multiple locations?",a:"One deployment. Each location inherits the shared knowledge base, then overlays location-specific data — pricing, hours, staff, local promos. Deploy to 10 locations or 200 from a single admin."},
    {q:"Does it integrate with our existing stack?",a:"Yes. REST APIs and webhooks into HubSpot, Salesforce, ServiceTitan, DentalIntel, Mindbody, and most major CRMs and scheduling tools. SSO via SAML 2.0 on Scale plans."},
    {q:"Can we control what the AI is allowed to say?",a:"Completely. The AI only answers from your approved documents. Set guardrails by topic, by location, by channel. Flag any response category for human review before it sends."},
  ];
  return (
    <section style={{ padding:'100px 24px', background:C.bg }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ maxWidth:680, marginBottom:40 }}>
            <Eyebrow color={C.t3}>The hard questions</Eyebrow>
            <h2 style={{ fontFamily:F, fontSize:42, fontWeight:800, color:C.ink, letterSpacing:'-0.035em', margin:'0 0 12px', lineHeight:1.05 }}>
              What operators ask <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.02em' }}>before</span> they sign up.
            </h2>
          </div>
        </FadeIn>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {objections.map((o,i) => (
            <FadeIn key={i} delay={i*0.05}>
              <div style={{ background:'#fff', borderRadius:14, padding:'26px 28px', border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:16, fontWeight:700, color:C.ink, fontFamily:F, marginBottom:10 }}>{o.q}</div>
                <div style={{ fontSize:14, color:C.t2, fontFamily:F, lineHeight:1.65 }}>{o.a}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  const [annual, setAnnual] = useState(true);
  const plans = [
    {name:'Starter',price:0,desc:'Evaluate the product on a single location.',cta:'Start free',ctaHref:'/early-access',featured:false,features:['Web widget, 1 channel','100 AI conversations / month','Core block library (Services, Booking, Pricing)','Community support']},
    {name:'Growth',price:annual?79:99,desc:'For single-location operators scaling inbound.',cta:'Start 14-day trial',ctaHref:'/early-access?plan=growth',featured:true,features:['All channels (Web, WhatsApp, Instagram, SMS)','1,000 AI conversations / month','Full vertical block library','Engage hub (unified inbox + broadcast)','Revenue attribution & pipeline dashboard','Priority email + Slack support']},
    {name:'Scale',price:annual?199:249,desc:'For multi-location brands and franchise groups.',cta:'Talk to sales',ctaHref:'/contact/sales',featured:false,features:['Everything in Growth','Multi-location admin · unlimited locations','5,000+ AI conversations / month','Custom block templates · SSO · SAML 2.0','CRM & ATS integrations · Full API access','Dedicated success manager · white-glove rollout']},
  ];
  return (
    <section id="pricing" style={{ padding:'100px 24px', background:'#fff' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <Eyebrow>Pricing</Eyebrow>
            <h2 style={{ fontFamily:F, fontSize:42, fontWeight:800, color:C.ink, letterSpacing:'-0.035em', margin:'0 0 12px', lineHeight:1.05 }}>Start free. Upgrade when it&apos;s <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.02em' }}>paying for itself</span>.</h2>
            <p style={{ fontSize:16, color:C.t2, fontFamily:F, marginBottom:24 }}>No per-seat fees. No surprise charges. Cancel anytime.</p>
            <div style={{ display:'inline-flex', background:C.surfaceAlt, borderRadius:10, padding:3, border:`1px solid ${C.border}` }}>
              <button onClick={() => setAnnual(true)} style={{ padding:'8px 20px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:F, fontSize:13, fontWeight:700, background:annual?C.ink:'transparent', color:annual?'#fff':C.t3, transition:'all 0.2s' }}>Annual · save 20%</button>
              <button onClick={() => setAnnual(false)} style={{ padding:'8px 20px', borderRadius:7, border:'none', cursor:'pointer', fontFamily:F, fontSize:13, fontWeight:700, background:!annual?C.ink:'transparent', color:!annual?'#fff':C.t3, transition:'all 0.2s' }}>Monthly</button>
            </div>
          </div>
        </FadeIn>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, alignItems:'stretch' }}>
          {plans.map((plan,i) => (
            <FadeIn key={plan.name} delay={i*0.06}>
              <div style={{ background:plan.featured?C.ink:'#fff', borderRadius:18, padding:'32px 28px', border:plan.featured?'none':`1px solid ${C.border}`, position:'relative', height:'100%', display:'flex', flexDirection:'column', boxShadow:plan.featured?'0 20px 48px rgba(10,10,10,0.2)':'none' }}>
                {plan.featured&&<div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:C.accent, color:'#fff', fontSize:10, fontWeight:800, padding:'5px 14px', borderRadius:20, fontFamily:F, letterSpacing:'0.06em' }}>MOST POPULAR</div>}
                <div style={{ fontSize:14, fontWeight:700, color:plan.featured?'rgba(255,255,255,0.55)':C.t3, fontFamily:F, marginBottom:8 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:8 }}>
                  <span style={{ fontFamily:F, fontSize:48, fontWeight:800, color:plan.featured?'#fff':C.ink, letterSpacing:'-0.04em', lineHeight:1 }}>{plan.price===0?'Free':`$${plan.price}`}</span>
                  {plan.price>0&&<span style={{ fontSize:14, color:plan.featured?'rgba(255,255,255,0.4)':C.t3, fontFamily:F }}>/mo</span>}
                </div>
                <p style={{ fontSize:13, color:plan.featured?'rgba(255,255,255,0.55)':C.t3, fontFamily:F, marginBottom:22, lineHeight:1.5 }}>{plan.desc}</p>
                <a href={plan.ctaHref} style={{ display:'block', textAlign:'center', padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:700, textDecoration:'none', fontFamily:F, background:plan.featured?C.accent:C.ink, color:'#fff', marginBottom:22 }}>{plan.cta}</a>
                <div style={{ flex:1, paddingTop:8, borderTop:plan.featured?'1px solid rgba(255,255,255,0.1)':`1px solid ${C.borderLight}` }}>
                  {plan.features.map((f,fi) => (
                    <div key={fi} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'6px 0' }}>
                      <div style={{ flexShrink:0, marginTop:2 }}><Ic d={icons.check} size={14} stroke={plan.featured?C.greenMid:C.green} sw={2.5} /></div>
                      <span style={{ fontSize:13, color:plan.featured?'rgba(255,255,255,0.85)':C.t1, fontFamily:F, lineHeight:1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState(0);
  const items = [
    {q:'How long does setup actually take?',a:'Most brands go live in under 10 minutes on a single location. Multi-location rollouts typically complete the same business day.'},
    {q:'Do we need to migrate our existing phone number or accounts?',a:'No. Keep your existing WhatsApp Business number, SMS line, and social accounts. Pingbox routes through the official APIs — your number, contacts, and history stay intact.'},
    {q:'Does it support multiple languages across our locations?',a:'Yes. Pingbox supports 100+ languages out of the box including Hindi, Tamil, Spanish, Portuguese, Arabic, and French.'},
    {q:'Can I control what the AI says?',a:'Completely. Review and approve responses, set guardrails per location or per channel, restrict topics, and the AI only answers from your approved documents.'},
    {q:"What happens when the AI can't answer something?",a:"It hands off to your team with the full conversation context and what the customer was trying to do. The human already knows everything, including which location and which block the customer was on."},
    {q:'Is our customer data safe?',a:'End-to-end encrypted at rest and in transit. Each brand gets an isolated tenant. SOC 2 Type II aligned. We never train AI models on your data.'},
    {q:'Can we cancel anytime?',a:'Yes. No contracts, no lock-in, no early termination fees. Export all your data on the way out.'},
  ];
  return (
    <section id="faq" style={{ padding:'100px 24px', background:C.bg }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <FadeIn>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <Eyebrow color={C.t3}>FAQ</Eyebrow>
            <h2 style={{ fontFamily:F, fontSize:42, fontWeight:800, color:C.ink, letterSpacing:'-0.035em', margin:0, lineHeight:1.05 }}>Everything <span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, letterSpacing:'-0.02em' }}>else</span> you&apos;d want to know.</h2>
          </div>
        </FadeIn>
        <div style={{ background:'#fff', borderRadius:14, border:`1px solid ${C.border}`, overflow:'hidden' }}>
          {items.map((item,i) => (
            <div key={i} style={{ borderBottom:i<items.length-1?`1px solid ${C.borderLight}`:'none' }}>
              <button onClick={() => setOpen(open===i?-1:i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:15, fontWeight:600, color:C.ink, fontFamily:F, paddingRight:16 }}>{item.q}</span>
                <div style={{ transform:open===i?'rotate(180deg)':'rotate(0)', transition:'transform 0.25s', color:C.t3, flexShrink:0 }}><Ic d={icons.chevDown} size={18} /></div>
              </button>
              <div style={{ maxHeight:open===i?200:0, overflow:'hidden', transition:'max-height 0.3s ease' }}>
                <p style={{ fontSize:14, color:C.t2, fontFamily:F, lineHeight:1.7, margin:'0 24px 20px 24px', paddingRight:40 }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FinalCTA ──────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section style={{ padding:'100px 24px', background:C.ink, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-120, right:-120, width:500, height:500, background:'radial-gradient(circle, rgba(78,63,255,0.25), transparent 65%)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ maxWidth:720, margin:'0 auto', textAlign:'center', position:'relative' }}>
        <FadeIn>
          <h2 style={{ fontFamily:F, fontSize:52, fontWeight:800, color:'#fff', letterSpacing:'-0.04em', margin:'0 0 18px', lineHeight:1 }}>
            Same ads. Same traffic.<br /><span style={{ fontFamily:FS, fontStyle:'italic', fontWeight:500, color:'#8A7DFF', letterSpacing:'-0.025em' }}>More decisions.</span>
          </h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.6)', fontFamily:F, marginBottom:32, lineHeight:1.5, maxWidth:540, margin:'0 auto 32px' }}>
            Pingbox catches every inbound and converts it with interactive UI. Most operators see it pay for itself within a single ad cycle.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Btn href="/early-access" variant="accent" style={{ padding:'16px 32px', fontSize:15 }}>Start free — 14 days <Ic d={icons.arrow} size={16} /></Btn>
            <Btn href="/contact/sales" variant="secondary" style={{ padding:'16px 32px', fontSize:15, background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}>Talk to sales</Btn>
          </div>
          <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:22, fontSize:13, color:'rgba(255,255,255,0.4)', fontFamily:F, fontWeight:500 }}>
            {['No credit card','No sales call required','Deploy in 5 minutes'].map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:5 }}><Ic d={icons.check} size={12} stroke="#8A7DFF" sw={2.5} />{t}</div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    {title:'Product',links:[{label:'Relay',href:'/relay'},{label:'Engage',href:'/engage'},{label:'Intelligence',href:'/intelligence'},{label:'Pricing',href:'/pricing'},{label:'Changelog',href:'/changelog'}]},
    {title:'Industries',links:[{label:'Dental clinics',href:'/for/dental-clinics'},{label:'HVAC',href:'/for/hvac'},{label:'Fitness',href:'/for/fitness'},{label:'Real estate',href:'/for/real-estate'},{label:'Law & insurance',href:'/for/law-insurance'},{label:'B2B Wholesale',href:'/for/b2b-wholesale'}]},
    {title:'Resources',links:[{label:'Documentation',href:'/docs'},{label:'API reference',href:'/docs/api'},{label:'Blog',href:'/blog'},{label:'Case studies',href:'/case-studies'},{label:'Help center',href:'/help'}]},
    {title:'Company',links:[{label:'About',href:'/about'},{label:'Careers',href:'/careers'},{label:'Privacy',href:'/privacy'},{label:'Terms',href:'/terms'},{label:'Security',href:'/security'}]},
  ];
  const regions = [{label:'Global',href:'/',flag:'🌐'},{label:'United States',href:'/us',flag:'🇺🇸'},{label:'India',href:'/in',flag:'🇮🇳'}];
  return (
    <footer style={{ padding:'56px 24px 32px', background:C.ink, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:40, marginBottom:40 }}>
          <div>
            <a href="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, textDecoration:'none' }}>
              <div style={{ width:28, height:28, background:'#fff', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:8, height:8, borderRadius:'50%', background:C.accent }} /></div>
              <span style={{ fontFamily:F, fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-0.025em' }}>Pingbox</span>
            </a>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', fontFamily:F, lineHeight:1.6, maxWidth:260, margin:'0 0 16px' }}>Conversational lead conversion for service brands. Turn every inquiry into a decision, not just a reply.</p>
            <a href="mailto:hey@pingbox.io" style={{ fontSize:12, color:'rgba(255,255,255,0.45)', fontFamily:F, textDecoration:'none' }}>hey@pingbox.io</a>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', fontFamily:F, marginBottom:16, textTransform:'uppercase' }}>{col.title}</div>
              {col.links.map(l => <a key={l.href} href={l.href} style={{ display:'block', fontSize:13, color:'rgba(255,255,255,0.6)', textDecoration:'none', fontFamily:F, padding:'5px 0', transition:'color 0.12s' }} onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>{l.label}</a>)}
            </div>
          ))}
        </div>
        <div style={{ paddingTop:24, paddingBottom:20, borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:F }}>Region</span>
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:3 }}>
              {regions.map(r => <a key={r.href} href={r.href} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', textDecoration:'none', fontFamily:F }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='#fff';}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,0.6)';}}>
                <span style={{ fontSize:13 }}>{r.flag}</span>{r.label}
              </a>)}
            </div>
          </div>
        </div>
        <div style={{ paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:F }}>© 2025 Pingbox Inc. · Delaware, USA</span>
          <div style={{ display:'flex', gap:18 }}>
            {[{l:'Privacy',h:'/privacy'},{l:'Terms',h:'/terms'},{l:'Cookies',h:'/cookies'}].map(({l,h}) => <a key={h} href={h} style={{ fontSize:12, color:'rgba(255,255,255,0.3)', textDecoration:'none', fontFamily:F }}>{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function PingboxHomepage() {
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:F }}>
      <Nav />
      <Hero />
      <TrustBar />
      <ProblemStats />
      <HowItWorks />
      <Platform />
      <Comparison />
      <Industries />
      <WhyNot />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
