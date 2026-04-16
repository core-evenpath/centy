'use client';

// ── Checkout flow overlay ───────────────────────────────────────────────
//
// Small stateful wrapper that (a) opens on demand, (b) renders the
// address form, (c) calls `useRelayCheckout.checkout`, and (d) invokes
// `onOrderCreated` with the newly-created order. The host decides what
// to do with the result (e.g. surface an order_confirmation block).

import { useCallback, useState } from 'react';
import { useRelayCheckout } from '@/hooks/useRelayCheckout';
import type { RelayTheme } from '@/components/relay/blocks/types';
import type { RelayOrder } from '@/lib/relay/order-types';
import CheckoutAddressForm from './CheckoutAddressForm';

interface Props {
  partnerId: string;
  conversationId: string;
  theme: RelayTheme;
  open: boolean;
  onClose: () => void;
  onOrderCreated?: (order: RelayOrder) => void;
}

export default function CheckoutFlow({
  partnerId,
  conversationId,
  theme: t,
  open,
  onClose,
  onOrderCreated,
}: Props) {
  const { checkout, loading, error } = useRelayCheckout({
    partnerId,
    conversationId,
    onOrderCreated,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (address: Parameters<typeof checkout>[0], method: Parameters<typeof checkout>[1]) => {
      setLocalError(null);
      const created = await checkout(address, method);
      if (!created) {
        setLocalError('Checkout failed — please try again');
        return;
      }
      onClose();
    },
    [checkout, onClose],
  );

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface,
          borderRadius: 14,
          padding: 18,
          maxWidth: 480,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: t.shL,
          fontFamily: t.fontFamily,
          color: t.text,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 4,
            fontFamily: t.headingFont,
          }}
        >
          Checkout
        </div>
        <div style={{ fontSize: 12, color: t.t3, marginBottom: 14 }}>
          Shipping address &amp; payment
        </div>

        <CheckoutAddressForm
          theme={t}
          submitting={loading}
          error={localError ?? error}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
