'use client';

// ── Live order confirmation ─────────────────────────────────────────────
//
// Wraps `OrderConfirmationBlock` with real order data. If a `RelayOrder`
// is passed via `data.order` (post-checkout), it's projected into the
// visual block's expected shape; otherwise the design sample is left
// untouched.

import OrderConfirmationBlock from './order-confirmation';
import type { BlockComponentProps } from '../../types';
import type { RelayOrder } from '../../order-types';

function formatRelativeDelivery(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function OrderConfirmationLive(props: BlockComponentProps) {
  const order = props.data?.order as RelayOrder | undefined;
  if (!order) return <OrderConfirmationBlock {...props} />;

  const data = {
    ...props.data,
    orderId: `#${order.id}`,
    total: order.total,
    items: order.items.map((i) => ({
      name: i.name + (i.variant ? ` · ${i.variant}` : ''),
      price: i.price * i.quantity,
    })),
    deliveryEstimate:
      formatRelativeDelivery(order.tracking?.estimatedDelivery) ??
      '3–5 business days',
    updateChannel:
      order.paymentMethod === 'cod'
        ? 'Pay on delivery · WhatsApp + SMS updates'
        : 'WhatsApp + SMS',
  };

  return <OrderConfirmationBlock {...props} data={data} />;
}
