'use client';

// ── Checkout address form ───────────────────────────────────────────────
//
// Controlled form matching the `OrderAddress` shape. Pure UI — the
// parent `CheckoutFlow` owns state / submission so this stays trivial
// to style/reorder.

import { useState } from 'react';
import type { OrderAddress, PaymentMethod } from '@/lib/relay/order-types';
import type { RelayTheme } from '@/components/relay/blocks/types';
import { ADDRESS_FIELDS, DEFAULT_ADDRESS } from './address-form-fields';

interface Props {
  theme: RelayTheme;
  initial?: Partial<OrderAddress>;
  defaultPaymentMethod?: PaymentMethod;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (address: OrderAddress, paymentMethod: PaymentMethod) => void;
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string }[] = [
  { id: 'cod', label: 'Cash on delivery' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'online', label: 'Online' },
];

export default function CheckoutAddressForm({
  theme: t,
  initial,
  defaultPaymentMethod = 'cod',
  submitting = false,
  error,
  submitLabel = 'Place order',
  onCancel,
  onSubmit,
}: Props) {
  const [address, setAddress] = useState<OrderAddress>({
    ...DEFAULT_ADDRESS,
    ...(initial ?? {}),
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    defaultPaymentMethod,
  );

  const handleChange = (key: keyof OrderAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(address, paymentMethod);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {ADDRESS_FIELDS.map((f) => (
          <label
            key={f.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 11,
              color: t.t3,
              flex: f.grow ? '1 1 100%' : '1 1 calc(50% - 5px)',
              minWidth: 120,
            }}
          >
            <span style={{ marginBottom: 3 }}>
              {f.label}
              {f.required ? ' *' : ''}
            </span>
            <input
              type={f.type ?? 'text'}
              value={(address[f.key] as string) ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              required={f.required}
              placeholder={f.placeholder}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${t.bdr}`,
                fontSize: 13,
                fontFamily: t.fontFamily,
                color: t.text,
                background: t.surface,
                outline: 'none',
              }}
            />
          </label>
        ))}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            color: t.t3,
            marginBottom: 4,
          }}
        >
          Payment method
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentMethod === opt.id;
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  background: active ? t.accent : t.bg,
                  color: active ? '#fff' : t.t2,
                  border: `1px solid ${active ? t.accent : t.bdr}`,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: t.red || '#D94839' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: `1px solid ${t.bdr}`,
              background: t.surface,
              color: t.t2,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: t.accent,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: submitting ? 'progress' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Placing order…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
