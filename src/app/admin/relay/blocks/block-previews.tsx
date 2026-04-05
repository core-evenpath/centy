'use client';

import React from 'react';
import { T, PRODUCTS, CONCERNS, CATS, fmt, disc } from './block-data';
import type { Product, ScenarioMessage } from './block-data';

// ── Shared UI ───────────────────────────────────────────────────────

const Img = ({ bg, w, h, r }: { bg: string; w: string; h: string; r?: string }) => (
  <div style={{ width: w, height: h, borderRadius: r || '8px', background: bg, flexShrink: 0 }} />
);

const Badge = ({ text, color }: { text: string; color?: string }) => (
  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' as const, padding: '2px 6px', borderRadius: '4px', background: color === 'green' ? T.greenBg : color === 'red' ? T.redBg : color === 'amber' ? T.amberBg : T.priBg, color: color === 'green' ? T.green : color === 'red' ? T.red : color === 'amber' ? T.amber : T.pri }}>{text}</span>
);

const Stars = ({ r, count }: { r: number; count?: number }) => (
  <span style={{ fontSize: '11px', color: T.amber }}>{'★'.repeat(Math.floor(r))}{'☆'.repeat(5 - Math.floor(r))}{count != null && <span style={{ color: T.t3, marginLeft: '4px', fontSize: '10px' }}>({count.toLocaleString()})</span>}</span>
);

const Row = ({ children, gap, style }: { children: React.ReactNode; gap?: string; style?: React.CSSProperties }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: gap || '8px', ...style }}>{children}</div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: T.surface, borderRadius: '14px', border: `1px solid ${T.bdr}`, padding: '14px', ...style }}>{children}</div>
);

const Btn = ({ text, primary, small, icon }: { text: string; primary?: boolean; small?: boolean; icon?: string }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: small ? '5px 10px' : '8px 14px', borderRadius: '8px', fontSize: small ? '11px' : '12px', fontWeight: 600, background: primary ? T.pri : T.priBg, color: primary ? '#fff' : T.pri, cursor: 'pointer' }}>{icon && <span>{icon}</span>}{text}</div>
);

export const Sug = ({ items }: { items: string[] }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
    {items.map((s, i) => (
      <span key={i} style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${T.bdr}`, background: T.surface, color: T.t2 }}>{s}</span>
    ))}
  </div>
);

export const Nudge = ({ text, action, variant, icon }: { text: string; action: string; variant: string; icon: string }) => {
  const bg = variant === 'green' ? T.greenBg : variant === 'amber' ? T.amberBg : variant === 'pink' ? T.pinkBg : T.priBg;
  const clr = variant === 'green' ? T.green : variant === 'amber' ? T.amber : variant === 'pink' ? T.pink : T.pri;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: bg, border: `1px solid ${clr}22` }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: T.t1, lineHeight: 1.4 }}>{text}</div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: clr, marginTop: '4px' }}>{action} →</div>
      </div>
    </div>
  );
};

const Bot = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: '92%' }}>{children}</div>
);

const User = ({ text }: { text: string }) => (
  <div style={{ maxWidth: '80%', marginLeft: 'auto', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', background: T.pri, color: '#fff', fontSize: '13px', lineHeight: 1.4 }}>{text}</div>
);

// ── Block Previews ──────────────────────────────────────────────────

const GreetingBlock = () => (
  <Card>
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>✧</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: T.t1, marginBottom: '4px' }}>Welcome to VEIL</div>
      <div style={{ fontSize: '12px', color: T.t3, lineHeight: 1.5 }}>Clean, clinical skincare that works. What can I help you find today?</div>
    </div>
  </Card>
);

const SkinQuiz = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>✧ Quick Skin Assessment</div>
    {['What is your skin type?', 'Top skin concern?', 'Current routine step count?'].map((q, i) => (
      <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
        <div style={{ fontSize: '11px', color: T.t3, marginBottom: '4px' }}>Question {i + 1} of 3</div>
        <div style={{ fontSize: '12px', color: T.t1, fontWeight: 500 }}>{q}</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {(i === 0 ? ['Oily', 'Dry', 'Combo', 'Normal'] : i === 1 ? ['Acne', 'Aging', 'Dark spots', 'Dryness'] : ['0-2', '3-5', '6+']).map((o, j) => (
            <span key={j} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${j === 0 ? T.pri : T.bdr}`, background: j === 0 ? T.priBg : 'transparent', color: j === 0 ? T.pri : T.t2 }}>{o}</span>
          ))}
        </div>
      </div>
    ))}
  </Card>
);

const ConcernPicker = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Select your concerns</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
      {CONCERNS.map((c, i) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', border: `1px solid ${i < 2 ? T.pri : T.bdr}`, background: i < 2 ? T.priBg : 'transparent' }}>
          <span style={{ fontSize: '16px' }}>{c.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 500, color: i < 2 ? T.pri : T.t2 }}>{c.label}</span>
        </div>
      ))}
    </div>
  </Card>
);

const ProductCard = ({ p }: { p: Product }) => (
  <Card style={{ padding: '0', overflow: 'hidden' }}>
    <Img bg={p.img} w="100%" h="100px" r="14px 14px 0 0" />
    <div style={{ padding: '10px 12px' }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>{p.name}</span>
        {p.badge && <Badge text={p.badge} />}
      </Row>
      <div style={{ fontSize: '10px', color: T.t3, margin: '2px 0 6px' }}>{p.desc}</div>
      <Row style={{ justifyContent: 'space-between' }}>
        <Stars r={p.rating} count={p.reviews} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</span>
      </Row>
    </div>
  </Card>
);

const ProductCatalog = ({ filter }: { filter?: string }) => {
  const items = filter ? PRODUCTS.filter(p => p.concern.includes(filter)).slice(0, 3) : PRODUCTS.slice(0, 3);
  return (
    <Card>
      <Row style={{ marginBottom: '10px', overflowX: 'auto', gap: '6px' }}>
        {CATS.slice(0, 4).map((c, i) => (
          <span key={c.id} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap', background: i === 0 ? T.pri : 'transparent', color: i === 0 ? '#fff' : T.t3, border: `1px solid ${i === 0 ? T.pri : T.bdr}` }}>{c.icon} {c.label}</span>
        ))}
      </Row>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(p => (
          <Row key={p.id} gap="10px">
            <Img bg={p.img} w="52px" h="52px" r="10px" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>{p.name}</div>
              <div style={{ fontSize: '10px', color: T.t3 }}>{p.desc}</div>
              <Row style={{ marginTop: '2px', justifyContent: 'space-between' }}>
                <Stars r={p.rating} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: T.pri }}>{fmt(p.price)}</span>
              </Row>
            </div>
          </Row>
        ))}
      </div>
    </Card>
  );
};

const ProductDetail = ({ p }: { p?: Product }) => {
  const product = p || PRODUCTS[1];
  return (
    <Card style={{ padding: '0', overflow: 'hidden' }}>
      <Img bg={product.img} w="100%" h="120px" r="14px 14px 0 0" />
      <div style={{ padding: '12px 14px' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: T.t1 }}>{product.name}</div>
            <div style={{ fontSize: '11px', color: T.t3, marginTop: '2px' }}>{product.desc}</div>
          </div>
          {product.badge && <Badge text={product.badge} />}
        </Row>
        <Row style={{ margin: '8px 0', justifyContent: 'space-between' }}>
          <Stars r={product.rating} count={product.reviews} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(product.price)}</span>
        </Row>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {product.sizes.map((s, i) => (
            <span key={s} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${i === 0 ? T.pri : T.bdr}`, background: i === 0 ? T.priBg : 'transparent', color: i === 0 ? T.pri : T.t3 }}>{s}</span>
          ))}
        </div>
        <Row gap="8px">
          <Btn text="Add to Bag" primary icon="+" />
          <Btn text="Save" icon="♡" />
        </Row>
      </div>
    </Card>
  );
};

const IngredientsBlock = () => {
  const ingredients = [
    { name: '15% L-Ascorbic Acid', role: 'Brightening', pct: '15%', star: true },
    { name: 'Ferulic Acid', role: 'Antioxidant booster', pct: '1%', star: true },
    { name: 'Vitamin E', role: 'Barrier support', pct: '1%', star: false },
    { name: 'Hyaluronic Acid', role: 'Hydration', pct: '2%', star: false },
  ];
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Key Ingredients</div>
      {ingredients.map((ing, i) => (
        <Row key={i} style={{ padding: '6px 0', borderBottom: i < 3 ? `1px solid ${T.bdr}` : 'none', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: ing.star ? 600 : 400, color: T.t1 }}>{ing.star ? '★ ' : ''}{ing.name}</div>
            <div style={{ fontSize: '10px', color: T.t3 }}>{ing.role}</div>
          </div>
          <Badge text={ing.pct} color={ing.star ? 'green' : undefined} />
        </Row>
      ))}
      <div style={{ fontSize: '10px', color: T.t3, marginTop: '8px', lineHeight: 1.4 }}>✓ Fragrance-free · ✓ Vegan · ✓ Cruelty-free · ✓ Non-comedogenic</div>
    </Card>
  );
};

const CompareBlock = () => {
  const items = [PRODUCTS[1], PRODUCTS[2]];
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Compare Products</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {items.map(p => (
          <div key={p.id} style={{ textAlign: 'center' }}>
            <Img bg={p.img} w="100%" h="60px" r="8px" />
            <div style={{ fontSize: '11px', fontWeight: 600, color: T.t1, marginTop: '6px' }}>{p.name}</div>
            <Stars r={p.rating} count={p.reviews} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: T.pri, marginTop: '4px' }}>{fmt(p.price)}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '10px', borderTop: `1px solid ${T.bdr}`, paddingTop: '8px' }}>
        {['Best for', 'Key ingredient', 'Texture'].map((label, i) => (
          <Row key={i} style={{ justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
            <span style={{ fontSize: '10px', color: T.t3, width: '30%' }}>{label}</span>
            <span style={{ fontSize: '10px', color: T.t2, width: '30%', textAlign: 'center' }}>{i === 0 ? 'Brightening' : i === 1 ? 'Vitamin C' : 'Lightweight'}</span>
            <span style={{ fontSize: '10px', color: T.t2, width: '30%', textAlign: 'center' }}>{i === 0 ? 'Anti-aging' : i === 1 ? 'Retinol' : 'Rich'}</span>
          </Row>
        ))}
      </div>
    </Card>
  );
};

const ReviewsBlock = () => {
  const reviews = [
    { user: 'Sarah M.', rating: 5, text: 'My dark spots faded noticeably after 3 weeks. The texture is beautiful — not sticky at all.', verified: true, helpful: 47 },
    { user: 'Priya K.', rating: 4, text: 'Effective but takes time to see results. Love that it does not pill under sunscreen.', verified: true, helpful: 23 },
  ];
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1 }}>Reviews</div>
        <Row gap="4px"><Stars r={4.7} /><span style={{ fontSize: '11px', color: T.t3 }}>4,210 reviews</span></Row>
      </Row>
      {reviews.map((rv, i) => (
        <div key={i} style={{ padding: '8px 0', borderBottom: i < 1 ? `1px solid ${T.bdr}` : 'none' }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap="4px">
              <span style={{ fontSize: '11px', fontWeight: 600, color: T.t1 }}>{rv.user}</span>
              {rv.verified && <Badge text="Verified" color="green" />}
            </Row>
            <Stars r={rv.rating} />
          </Row>
          <div style={{ fontSize: '11px', color: T.t2, lineHeight: 1.4, marginTop: '4px' }}>{rv.text}</div>
          <div style={{ fontSize: '10px', color: T.t4, marginTop: '4px' }}>{rv.helpful} found helpful</div>
        </div>
      ))}
    </Card>
  );
};

const ShadeFinderBlock = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>✧ Find Your Shade</div>
    <div style={{ fontSize: '11px', color: T.t3, marginBottom: '10px' }}>Answer 3 quick questions for your perfect match</div>
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: T.t2, marginBottom: '6px' }}>What is your undertone?</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {['Cool', 'Neutral', 'Warm'].map((u, i) => (
          <div key={u} style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px', border: `1px solid ${i === 1 ? T.pri : T.bdr}`, background: i === 1 ? T.priBg : 'transparent', fontSize: '11px', color: i === 1 ? T.pri : T.t2 }}>{u}</div>
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', margin: '10px 0' }}>
      {['#f5d6b8', '#e8c4a0', '#d4a574', '#b8845c', '#8b6343', '#5c3d2e'].map((c, i) => (
        <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: i === 2 ? `2px solid ${T.pri}` : '2px solid transparent' }} />
      ))}
    </div>
    <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: T.pri }}>Your match: Shade 3N — Sand</div>
  </Card>
);

const RoutineBuilder = () => {
  const morning = [PRODUCTS[1], PRODUCTS[3], PRODUCTS[4]];
  const evening = [PRODUCTS[3], PRODUCTS[2], PRODUCTS[0]];
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Your Personalized Routine</div>
      {[{ label: '☀ Morning', items: morning }, { label: '🌙 Evening', items: evening }].map((routine, ri) => (
        <div key={ri} style={{ marginBottom: ri === 0 ? '10px' : 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: T.t2, marginBottom: '6px' }}>{routine.label}</div>
          {routine.items.map((p, i) => (
            <Row key={p.id} gap="8px" style={{ padding: '4px 0' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: T.priBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: T.pri }}>{i + 1}</div>
              <Img bg={p.img} w="28px" h="28px" r="6px" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: T.t1 }}>{p.name}</div>
                <div style={{ fontSize: '10px', color: T.t3 }}>{fmt(p.price)}</div>
              </div>
            </Row>
          ))}
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: T.t1 }}>Full routine: {fmt(morning.concat(evening).reduce((s, p) => s + p.price, 0))}</span>
        <Btn text="Add All" primary small />
      </div>
    </Card>
  );
};

const PromoBlock = ({ variant }: { variant?: string }) => {
  if (variant === 'coupon') return (
    <Card style={{ background: T.accBg, border: `1px dashed ${T.acc}` }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: T.acc }}>NEWGLOW</div>
          <div style={{ fontSize: '11px', color: T.t2 }}>15% off your first order</div>
        </div>
        <Btn text="Apply" primary small />
      </Row>
    </Card>
  );
  return (
    <Card style={{ background: `linear-gradient(135deg, ${T.priBg} 0%, ${T.accBg} 100%)`, border: `1px solid ${T.acc}22` }}>
      <div style={{ textAlign: 'center', padding: '6px 0' }}>
        <Badge text="Limited Time" color="amber" />
        <div style={{ fontSize: '15px', fontWeight: 700, color: T.t1, margin: '8px 0 4px' }}>Summer Glow Sale</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: T.acc }}>25% OFF</div>
        <div style={{ fontSize: '11px', color: T.t3, marginTop: '4px' }}>All serums & treatments · Ends Sunday</div>
        <div style={{ marginTop: '10px' }}><Btn text="Shop the Sale" primary /></div>
      </div>
    </Card>
  );
};

const BundleBlock = () => {
  const items = [PRODUCTS[1], PRODUCTS[0], PRODUCTS[4]];
  const total = items.reduce((s, p) => s + p.price, 0);
  const bundlePrice = Math.round(total * 0.8);
  return (
    <Card>
      <Badge text="Save 20%" color="green" />
      <div style={{ fontSize: '14px', fontWeight: 700, color: T.t1, margin: '8px 0 4px' }}>The Glow Essentials Set</div>
      <div style={{ fontSize: '11px', color: T.t3, marginBottom: '10px' }}>Complete brightening routine in one box</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {items.map(p => (
          <div key={p.id} style={{ flex: 1, textAlign: 'center' }}>
            <Img bg={p.img} w="100%" h="50px" r="8px" />
            <div style={{ fontSize: '9px', color: T.t3, marginTop: '4px' }}>{p.name.split(' ').slice(0, 2).join(' ')}</div>
          </div>
        ))}
      </div>
      <Row style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div><span style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{fmt(bundlePrice)}</span><span style={{ fontSize: '11px', color: T.t4, textDecoration: 'line-through', marginLeft: '6px' }}>{fmt(total)}</span></div>
        <Btn text="Add Set" primary small />
      </Row>
    </Card>
  );
};

const GiftCardBlock = () => (
  <Card style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.surface} 100%)` }}>
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>🎁</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: T.t1 }}>VEIL Gift Card</div>
      <div style={{ fontSize: '11px', color: T.t3, margin: '4px 0 10px' }}>Give the gift of great skin</div>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
        {[25, 50, 75, 100].map((v, i) => (
          <span key={v} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${i === 1 ? T.pri : T.bdr}`, background: i === 1 ? T.priBg : 'transparent', fontWeight: i === 1 ? 600 : 400, color: i === 1 ? T.pri : T.t2 }}>{fmt(v)}</span>
        ))}
      </div>
      <Btn text="Send Gift Card" primary />
    </div>
  </Card>
);

const CartBlock = ({ withCode }: { withCode?: boolean }) => {
  const items = [PRODUCTS[1], PRODUCTS[0], PRODUCTS[4]];
  const subtotal = items.reduce((s, p) => s + p.price, 0);
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Your Bag ({items.length})</div>
      {items.map((p, i) => (
        <Row key={p.id} gap="10px" style={{ padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${T.bdr}` : 'none' }}>
          <Img bg={p.img} w="40px" h="40px" r="8px" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: T.t1 }}>{p.name}</div>
            <div style={{ fontSize: '10px', color: T.t3 }}>{p.sizes[0]}</div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>{fmt(p.price)}</span>
        </Row>
      ))}
      {withCode && (
        <Row style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '8px', background: T.greenBg, border: `1px solid ${T.green}22` }}>
          <span style={{ fontSize: '11px', color: T.green, fontWeight: 600 }}>NEWGLOW applied — 15% off</span>
        </Row>
      )}
      <div style={{ borderTop: `1px solid ${T.bdr}`, marginTop: '8px', paddingTop: '8px' }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: T.t3 }}>Subtotal</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>{fmt(withCode ? subtotal * 0.85 : subtotal)}</span>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontSize: '11px', color: T.green }}>Free shipping</span>
          <span style={{ fontSize: '11px', color: T.green }}>✓</span>
        </Row>
        <div style={{ marginTop: '10px' }}><Btn text="Checkout" primary /></div>
      </div>
    </Card>
  );
};

const CheckoutBlock = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Checkout</div>
    {['Shipping address', 'Payment method'].map((label, i) => (
      <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${T.bdr}` }}>
        <div style={{ fontSize: '10px', color: T.t3, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: T.t1 }}>{i === 0 ? '123 Main St, New York, NY 10001' : '•••• 4242'}</div>
      </div>
    ))}
    <Row style={{ justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
      <Btn text="Pay with Card" primary />
      <Btn text=" Pay" small />
    </Row>
  </Card>
);

const ConfirmationBlock = () => (
  <Card style={{ background: T.greenBg, border: `1px solid ${T.green}22` }}>
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: T.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '18px' }}>✓</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: T.t1 }}>Order Confirmed!</div>
      <div style={{ fontSize: '11px', color: T.t3, margin: '4px 0' }}>Order #VL-28491</div>
      <div style={{ fontSize: '11px', color: T.t2, lineHeight: 1.4 }}>Estimated delivery: 3-5 business days<br />Confirmation sent to your email</div>
    </div>
  </Card>
);

const OrderTracker = () => {
  const steps = [
    { label: 'Order placed', date: 'Apr 1', done: true },
    { label: 'Processing', date: 'Apr 1', done: true },
    { label: 'Shipped', date: 'Apr 2', done: true },
    { label: 'Delivered', date: 'Apr 5', done: false },
  ];
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1 }}>Order #VL-28491</div>
        <Badge text="In Transit" color="amber" />
      </Row>
      <div style={{ position: 'relative', paddingLeft: '20px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ position: 'relative', paddingBottom: i < 3 ? '16px' : 0, paddingLeft: '10px', borderLeft: i < 3 ? `2px solid ${s.done ? T.green : T.bdr}` : 'none' }}>
            <div style={{ position: 'absolute', left: '-7px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: s.done ? T.green : T.bdr, border: `2px solid ${T.surface}` }} />
            <div style={{ fontSize: '12px', fontWeight: s.done ? 600 : 400, color: s.done ? T.t1 : T.t3 }}>{s.label}</div>
            <div style={{ fontSize: '10px', color: T.t4 }}>{s.date}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ReturnBlock = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Start a Return</div>
    <Row gap="10px" style={{ padding: '8px', borderRadius: '10px', background: T.card, marginBottom: '10px' }}>
      <Img bg={PRODUCTS[1].img} w="40px" h="40px" r="8px" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: T.t1 }}>{PRODUCTS[1].name}</div>
        <div style={{ fontSize: '10px', color: T.t3 }}>Ordered Apr 1 · {fmt(PRODUCTS[1].price)}</div>
      </div>
    </Row>
    <div style={{ fontSize: '11px', color: T.t2, marginBottom: '8px' }}>Reason for return:</div>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
      {['Skin reaction', 'Wrong item', 'Changed mind', 'Damaged'].map((r, i) => (
        <span key={r} style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${i === 0 ? T.pri : T.bdr}`, background: i === 0 ? T.priBg : 'transparent', color: i === 0 ? T.pri : T.t2 }}>{r}</span>
      ))}
    </div>
    <Btn text="Generate Prepaid Label" primary />
  </Card>
);

const ReorderBlock = () => {
  const items = [PRODUCTS[1], PRODUCTS[3]];
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '4px' }}>Quick Reorder</div>
      <div style={{ fontSize: '11px', color: T.t3, marginBottom: '10px' }}>From your recent orders</div>
      {items.map((p, i) => (
        <Row key={p.id} gap="10px" style={{ padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${T.bdr}` : 'none' }}>
          <Img bg={p.img} w="36px" h="36px" r="8px" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: T.t1 }}>{p.name}</div>
            <div style={{ fontSize: '10px', color: T.t3 }}>Last ordered Feb 12</div>
          </div>
          <Btn text="Reorder" small />
        </Row>
      ))}
    </Card>
  );
};

const FeedbackBlock = () => (
  <Card>
    <div style={{ textAlign: 'center', padding: '6px 0' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '4px' }}>How was your experience?</div>
      <div style={{ fontSize: '11px', color: T.t3, marginBottom: '10px' }}>{PRODUCTS[1].name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '22px', marginBottom: '10px' }}>
        {['★', '★', '★', '★', '☆'].map((s, i) => (
          <span key={i} style={{ color: i < 4 ? T.amber : T.bdr, cursor: 'pointer' }}>{s}</span>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: T.t3, marginBottom: '8px' }}>Tap to rate · Write an optional review</div>
      <Btn text="Submit Review" primary small />
    </div>
  </Card>
);

const SubscriptionBlock = () => (
  <Card>
    <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1 }}>Subscribe & Save</div>
      <Badge text="Up to 20% off" color="green" />
    </Row>
    {[{ freq: 'Every 30 days', disc: '15%' }, { freq: 'Every 60 days', disc: '10%' }, { freq: 'Every 90 days', disc: '5%' }].map((opt, i) => (
      <Row key={i} style={{ padding: '8px 10px', borderRadius: '8px', border: `1px solid ${i === 0 ? T.pri : T.bdr}`, background: i === 0 ? T.priBg : 'transparent', marginBottom: '6px', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? T.pri : T.t2 }}>{opt.freq}</div>
          {i === 0 && <div style={{ fontSize: '10px', color: T.green }}>Most popular</div>}
        </div>
        <Badge text={`Save ${opt.disc}`} color={i === 0 ? 'green' : undefined} />
      </Row>
    ))}
    <div style={{ marginTop: '4px' }}><Btn text="Subscribe Now" primary /></div>
  </Card>
);

const LoyaltyBlock = () => (
  <Card>
    <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1 }}>Glow Rewards</div>
        <div style={{ fontSize: '10px', color: T.acc, fontWeight: 600 }}>Gold Member</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: T.pri }}>2,450</div>
        <div style={{ fontSize: '10px', color: T.t3 }}>points</div>
      </div>
    </Row>
    <div style={{ height: '6px', borderRadius: '3px', background: T.bdr, marginBottom: '4px' }}>
      <div style={{ height: '100%', width: '65%', borderRadius: '3px', background: `linear-gradient(90deg, ${T.pri}, ${T.acc})` }} />
    </div>
    <div style={{ fontSize: '10px', color: T.t3, marginBottom: '10px' }}>550 points to Platinum tier</div>
    <Row gap="6px">
      <Btn text="Redeem $10" small />
      <Btn text="View Perks" small />
    </Row>
  </Card>
);

const WishlistBlock = () => {
  const items = [PRODUCTS[1], PRODUCTS[5], PRODUCTS[0]];
  return (
    <Card>
      <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Saved Items ({items.length})</div>
      {items.map((p, i) => (
        <Row key={p.id} gap="10px" style={{ padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${T.bdr}` : 'none' }}>
          <Img bg={p.img} w="36px" h="36px" r="8px" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: T.t1 }}>{p.name}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: T.pri }}>{fmt(p.price)}</div>
          </div>
          <Btn text="Add" small />
        </Row>
      ))}
    </Card>
  );
};

const ReferralBlock = () => (
  <Card style={{ background: `linear-gradient(135deg, ${T.priBg} 0%, ${T.greenBg} 100%)` }}>
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: '18px', marginBottom: '6px' }}>💝</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: T.t1 }}>Give $15, Get $15</div>
      <div style={{ fontSize: '11px', color: T.t3, margin: '4px 0 10px', lineHeight: 1.4 }}>Share your unique link — your friend gets $15 off, and you earn $15 when they order.</div>
      <div style={{ padding: '8px 12px', borderRadius: '8px', background: T.surface, border: `1px solid ${T.bdr}`, fontSize: '12px', fontWeight: 600, color: T.pri, marginBottom: '10px' }}>veil.co/ref/SARAH15</div>
      <Row gap="8px" style={{ justifyContent: 'center' }}>
        <Btn text="Copy Link" primary small />
        <Btn text="Share" small />
      </Row>
    </div>
  </Card>
);

const SocialProofBlock = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Why People Love VEIL</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
      {[{ n: '4.8', l: 'Avg Rating' }, { n: '50K+', l: 'Happy Customers' }, { n: '92%', l: 'Repurchase Rate' }].map((s, i) => (
        <div key={i} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: '8px', background: T.card }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: T.pri }}>{s.n}</div>
          <div style={{ fontSize: '9px', color: T.t3 }}>{s.l}</div>
        </div>
      ))}
    </div>
    <Row gap="6px" style={{ flexWrap: 'wrap' }}>
      {['As seen in Vogue', 'Allure Best of Beauty', 'Clean at Sephora'].map((b, i) => (
        <Badge key={i} text={b} />
      ))}
    </Row>
  </Card>
);

const BookingBlock = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '4px' }}>Book a Skin Consultation</div>
    <div style={{ fontSize: '11px', color: T.t3, marginBottom: '10px' }}>Free 15-minute virtual session with a licensed esthetician</div>
    <div style={{ fontSize: '11px', fontWeight: 500, color: T.t2, marginBottom: '6px' }}>Available today:</div>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
      {['10:00 AM', '1:00 PM', '3:30 PM', '5:00 PM'].map((t, i) => (
        <span key={t} style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${i === 1 ? T.pri : T.bdr}`, background: i === 1 ? T.priBg : 'transparent', fontWeight: i === 1 ? 600 : 400, color: i === 1 ? T.pri : T.t2 }}>{t}</span>
      ))}
    </div>
    <Btn text="Confirm 1:00 PM" primary />
  </Card>
);

const HandoffBlock = () => (
  <Card style={{ background: T.priBg, border: `1px solid ${T.pri}22` }}>
    <Row gap="10px">
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: T.pri, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>KT</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1 }}>Connecting you with Kate</div>
        <div style={{ fontSize: '10px', color: T.t3 }}>Licensed Esthetician · Available now</div>
      </div>
    </Row>
    <div style={{ marginTop: '10px', padding: '8px', borderRadius: '8px', background: T.surface, fontSize: '11px', color: T.t2, lineHeight: 1.4 }}>
      Hi! I can see you had a reaction to the Vitamin C serum. Let me recommend some gentler alternatives for brightening...
    </div>
  </Card>
);

const InfoBlock = () => (
  <Card>
    <div style={{ fontSize: '13px', fontWeight: 700, color: T.t1, marginBottom: '10px' }}>Consultation Details</div>
    {[
      { q: 'What is covered?', a: 'Skin analysis, personalized routine, ingredient guidance, and free samples.' },
      { q: 'How long?', a: '15 minutes via video call.' },
      { q: 'Is it free?', a: 'Completely free — no purchase required.' },
    ].map((faq, i) => (
      <div key={i} style={{ padding: '6px 0', borderBottom: i < 2 ? `1px solid ${T.bdr}` : 'none' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: T.t1, marginBottom: '2px' }}>{faq.q}</div>
        <div style={{ fontSize: '11px', color: T.t2, lineHeight: 1.4 }}>{faq.a}</div>
      </div>
    ))}
  </Card>
);

// ── renderBlock ─────────────────────────────────────────────────────

export function renderBlock(m: ScenarioMessage): React.ReactNode {
  if (m.t === 'user') return <User text={m.text || ''} />;
  if (m.text && !m.block) return (
    <Bot>
      <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: T.surface, border: `1px solid ${T.bdr}`, fontSize: '13px', color: T.t1, lineHeight: 1.5 }}>{m.text}</div>
    </Bot>
  );

  switch (m.block) {
    case 'greeting': return <Bot><GreetingBlock /></Bot>;
    case 'skin_quiz': return <Bot><SkinQuiz /></Bot>;
    case 'concern_picker': return <Bot><ConcernPicker /></Bot>;
    case 'catalog': return <Bot><ProductCatalog filter={m.filter} /></Bot>;
    case 'products': return <Bot><ProductCatalog filter={m.filter} /></Bot>;
    case 'product_detail': return <Bot><ProductDetail p={m.p} /></Bot>;
    case 'ingredients': return <Bot><IngredientsBlock /></Bot>;
    case 'compare': return <Bot><CompareBlock /></Bot>;
    case 'reviews': return <Bot><ReviewsBlock /></Bot>;
    case 'shade_finder': return <Bot><ShadeFinderBlock /></Bot>;
    case 'routine': return <Bot><RoutineBuilder /></Bot>;
    case 'promo_sale': return <Bot><PromoBlock /></Bot>;
    case 'promo_coupon': return <Bot><PromoBlock variant="coupon" /></Bot>;
    case 'promo': return <Bot><PromoBlock variant={m.variant} /></Bot>;
    case 'bundle': return <Bot><BundleBlock /></Bot>;
    case 'gift_card': return <Bot><GiftCardBlock /></Bot>;
    case 'cart': return <Bot><CartBlock withCode={m.withCode} /></Bot>;
    case 'checkout': return <Bot><CheckoutBlock /></Bot>;
    case 'confirmation': return <Bot><ConfirmationBlock /></Bot>;
    case 'order_tracker': return <Bot><OrderTracker /></Bot>;
    case 'return': return <Bot><ReturnBlock /></Bot>;
    case 'return_exchange': return <Bot><ReturnBlock /></Bot>;
    case 'reorder': return <Bot><ReorderBlock /></Bot>;
    case 'feedback': return <Bot><FeedbackBlock /></Bot>;
    case 'subscription': return <Bot><SubscriptionBlock /></Bot>;
    case 'loyalty': return <Bot><LoyaltyBlock /></Bot>;
    case 'wishlist': return <Bot><WishlistBlock /></Bot>;
    case 'referral': return <Bot><ReferralBlock /></Bot>;
    case 'social_proof': return <Bot><SocialProofBlock /></Bot>;
    case 'booking': return <Bot><BookingBlock /></Bot>;
    case 'handoff': return <Bot><HandoffBlock /></Bot>;
    case 'info': return <Bot><InfoBlock /></Bot>;
    case 'nudge': return <Bot><Nudge text={m.text || ''} action={m.action || ''} variant={m.variant || 'green'} icon={m.icon || '💡'} /></Bot>;
    case 'sug': return <Sug items={m.items || []} />;
    default: return (
      <Bot>
        <Card>
          <div style={{ fontSize: '11px', color: T.t3, textAlign: 'center' }}>Block: {m.block}</div>
        </Card>
      </Bot>
    );
  }
}
