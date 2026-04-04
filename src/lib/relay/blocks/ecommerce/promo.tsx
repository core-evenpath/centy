'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Flame, Tag, Copy, Gift, Truck, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'ecom_promo',
  family: 'promo',
  label: 'Promotional Offer',
  description: 'Flash sale, coupon code, or festive offer',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['sale', 'discount', 'offer', 'deal', 'coupon', 'promo', 'code'],
    queryPatterns: ['any * running', 'do you have * off', '* deals'],
    dataConditions: ['has_active_promo'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Title' },
    ],
    optional: [
      { field: 'subtitle', type: 'text', label: 'Subtitle' },
      { field: 'code', type: 'text', label: 'Coupon Code' },
      { field: 'discount', type: 'text', label: 'Discount' },
      { field: 'minOrder', type: 'text', label: 'Minimum Order' },
      { field: 'expiresIn', type: 'text', label: 'Expires In' },
      { field: 'ctaLabel', type: 'text', label: 'CTA Label' },
    ],
  },
  variants: ['flash', 'coupon', 'festive', 'free_shipping'],
  sampleData: {
    title: 'FLAT 40% OFF',
    subtitle: 'All kurta sets, No code needed',
    code: '',
    discount: '40%',
    expiresIn: '2h 14m',
    ctaLabel: 'Shop the Sale',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

function FlashVariant({ data, theme }: BlockComponentProps) {
  return (
    <div style={{ background: '#1c1917', border: `1px solid #292524`, borderRadius: '12px', overflow: 'hidden', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Flame size={14} color={theme.red} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.red, textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Flash Sale</span>
        {data.expiresIn && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} color="#a8a29e" />
            <span style={{ fontSize: '10px', color: '#a8a29e' }}>{data.expiresIn}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{data.title}</div>
      {data.subtitle && <div style={{ fontSize: '12px', color: '#a8a29e', marginBottom: '12px' }}>{data.subtitle}</div>}
      {data.ctaLabel && (
        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '8px', background: theme.red, color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          {data.ctaLabel}
        </div>
      )}
    </div>
  );
}

function CouponVariant({ data, theme }: BlockComponentProps) {
  return (
    <div style={{ background: theme.surface, border: `2px dashed ${theme.accentBg2}`, borderRadius: '12px', padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Tag size={14} color={theme.accent} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: theme.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Coupon</span>
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: theme.t1, marginBottom: '4px' }}>{data.title}</div>
      {data.subtitle && <div style={{ fontSize: '11px', color: theme.t3, marginBottom: '10px' }}>{data.subtitle}</div>}
      {data.code && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ padding: '8px 14px', background: theme.accentBg, border: `1px dashed ${theme.accent}`, borderRadius: '6px', fontSize: '14px', fontWeight: 700, color: theme.accent, letterSpacing: '1px' }}>
            {data.code}
          </div>
          <div style={{ padding: '8px 12px', borderRadius: '6px', border: `1px solid ${theme.bdr}`, fontSize: '11px', fontWeight: 600, color: theme.t2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Copy size={10} /> Copy
          </div>
        </div>
      )}
      {data.minOrder && <div style={{ fontSize: '10px', color: theme.t3 }}>Min. order: {data.minOrder}</div>}
    </div>
  );
}

function FestiveVariant({ data, theme }: BlockComponentProps) {
  return (
    <div style={{ background: `linear-gradient(135deg, #fffbeb, #fef3c7)`, border: `1px solid #fde68a`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
      <Gift size={24} color="#d97706" style={{ marginBottom: '8px' }} />
      <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>{data.title}</div>
      {data.subtitle && <div style={{ fontSize: '12px', color: '#a16207', marginBottom: '12px' }}>{data.subtitle}</div>}
      {data.ctaLabel && (
        <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '8px', background: '#d97706', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          {data.ctaLabel}
        </div>
      )}
    </div>
  );
}

function FreeShippingVariant({ data, theme }: BlockComponentProps) {
  return (
    <div style={{ background: theme.greenBg, border: `1px solid ${theme.greenBdr}`, borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: 32, height: 32, borderRadius: '8px', background: theme.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Truck size={16} color="#fff" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.green }}>{data.title}</div>
        {data.subtitle && <div style={{ fontSize: '11px', color: theme.t2, marginTop: '2px' }}>{data.subtitle}</div>}
      </div>
    </div>
  );
}

export default function PromoBlock({ data, theme, variant }: BlockComponentProps) {
  const v = variant || 'coupon';
  const props = { data, theme, variant };

  switch (v) {
    case 'flash':
      return <FlashVariant {...props} />;
    case 'festive':
      return <FestiveVariant {...props} />;
    case 'free_shipping':
      return <FreeShippingVariant {...props} />;
    case 'coupon':
    default:
      return <CouponVariant {...props} />;
  }
}
