'use client';

import { useState } from 'react';
import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ShoppingBag, Minus, Plus, Tag, Truck, ChevronRight } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

export const definition: BlockDefinition = {
  id: 'ecom_cart',
  family: 'cart',
  label: 'Shopping Cart',
  description: 'Cart with items, quantities, coupon, and checkout CTA',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['cart', 'bag', 'basket', 'checkout', 'pay', 'order'],
    queryPatterns: ['show my cart', 'view bag', 'ready to *', 'checkout'],
    dataConditions: ['has_cart_items'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Cart Items' },
    ],
    optional: [
      { field: 'couponCode', type: 'text', label: 'Coupon Code' },
      { field: 'couponDiscount', type: 'currency', label: 'Coupon Discount' },
      { field: 'deliveryFee', type: 'currency', label: 'Delivery Fee' },
      { field: 'deliveryLabel', type: 'text', label: 'Delivery Label' },
    ],
  },
  variants: ['default', 'with_coupon', 'empty'],
  sampleData: {
    items: [
      { name: 'Block Print Kurta Set', variant: 'Indigo, M', price: 2800, quantity: 1 },
      { name: 'Kundan Choker Set', variant: 'Gold, Adjustable', price: 4200, quantity: 1 },
    ],
    couponCode: '',
    couponDiscount: 0,
    deliveryFee: 0,
    deliveryLabel: 'FREE',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function formatCurrency(amount: number, currency: string): string {
  return formatMoney(amount, currency);
}

export default function CartBlock({ data, theme, variant }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  // Currency from the data envelope (partner-level). Falls back to
  // INR for legacy data shapes that haven't been region-tagged yet.
  const currency: string = data.currency ?? 'INR';
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(items.map((item, i) => [i, item.quantity || 1]))
  );

  if (variant === 'empty' || items.length === 0) {
    return (
      <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <ShoppingBag size={32} color={theme.t4} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: theme.t2, marginTop: '12px' }}>Your bag is empty</div>
        <div style={{ fontSize: '11px', color: theme.t3, marginTop: '4px' }}>Add items to get started</div>
        <div style={{ marginTop: '16px', padding: '10px 20px', background: theme.accent, color: '#fff', fontSize: '12px', fontWeight: 600, borderRadius: '8px', display: 'inline-block', cursor: 'pointer' }}>
          Start Shopping
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item, i) => sum + (item.price * (quantities[i] || 1)), 0);
  const couponDiscount = data.couponDiscount || 0;
  const deliveryFee = data.deliveryFee || 0;
  const deliveryLabel = data.deliveryLabel || (deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee, currency));
  const total = subtotal - couponDiscount + deliveryFee;

  const updateQty = (idx: number, delta: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      next[idx] = Math.max(1, (next[idx] || 1) + delta);
      return next;
    });
  };

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={16} color={theme.accent} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: theme.t1 }}>Your Bag</span>
        <span style={{ fontSize: '11px', color: theme.t3 }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
      </div>

      <div style={{ padding: '10px 14px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: '6px', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={16} color={theme.t4} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.t1 }}>{item.name}</div>
              {item.variant && <div style={{ fontSize: '10px', color: theme.t3, marginTop: '2px' }}>{item.variant}</div>}
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme.accent, marginTop: '4px' }}>{formatCurrency(item.price, currency)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div onClick={() => updateQty(i, -1)} style={{ width: 24, height: 24, borderRadius: '6px', border: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Minus size={10} color={theme.t3} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: theme.t1, minWidth: '16px', textAlign: 'center' }}>{quantities[i] || 1}</span>
              <div onClick={() => updateQty(i, 1)} style={{ width: 24, height: 24, borderRadius: '6px', border: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus size={10} color={theme.t3} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.bdr}` }}>
        {data.couponCode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: theme.greenBg, border: `1px solid ${theme.greenBdr}`, borderRadius: '8px', marginBottom: '10px' }}>
            <Tag size={12} color={theme.green} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: theme.green }}>{data.couponCode} applied</span>
            <span style={{ fontSize: '11px', color: theme.green, marginLeft: 'auto' }}>-{formatCurrency(couponDiscount, currency)}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', border: `1px dashed ${theme.bdrM}`, borderRadius: '8px', marginBottom: '10px', cursor: 'pointer' }}>
            <Tag size={12} color={theme.t4} />
            <span style={{ fontSize: '11px', color: theme.t3 }}>Have a coupon?</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: theme.t3 }}>Subtotal</span>
          <span style={{ fontSize: '11px', color: theme.t2 }}>{formatCurrency(subtotal, currency)}</span>
        </div>
        {couponDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: theme.green }}>Discount</span>
            <span style={{ fontSize: '11px', color: theme.green }}>-{formatCurrency(couponDiscount, currency)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: theme.t3, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Truck size={10} /> Delivery
          </span>
          <span style={{ fontSize: '11px', color: deliveryFee === 0 ? theme.green : theme.t2, fontWeight: deliveryFee === 0 ? 600 : 400 }}>
            {deliveryLabel}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${theme.bdr}` }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: theme.t1 }}>Total</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: theme.accent }}>{formatCurrency(total, currency)}</span>
        </div>
      </div>

      <div style={{ padding: '10px 14px 14px' }}>
        <div style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          background: theme.accent,
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          textAlign: 'center',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          Checkout <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
