'use client';

// ── Live order tracker ──────────────────────────────────────────────────
//
// Thin data loader around `OrderTrackerBlock`. Accepts an `orderId`
// (optionally supplied by the chat block data), fetches via
// `/api/relay/order`, and forwards the real status + tracking info to
// the visual block.
//
// When no `orderId` is present (e.g. the intent engine resolved
// `order_status` from "track my order" without a quoted id) we render
// `OrderTrackerInput` so the visitor can type their id inline.

import { useEffect, useState } from 'react';
import OrderTrackerBlock from './order-tracker';
import OrderTrackerInput from './order-tracker-input';
import type { BlockComponentProps } from '../../types';
import { orderStatusToStepLabel } from '../../order-helpers';
import type { OrderLookupResult } from '../../order-types';

interface LivePayload extends OrderLookupResult {}

function formatDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function OrderTrackerLive(props: BlockComponentProps) {
  const orderIdFromData =
    (props.data?.orderId as string | undefined) || undefined;
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const activeOrderId = orderIdFromData ?? pendingOrderId;

  const [loading, setLoading] = useState(!!activeOrderId);
  const [live, setLive] = useState<LivePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrderId) {
      setLoading(false);
      setLive(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/relay/order?orderId=${encodeURIComponent(activeOrderId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.order) setLive(data.order as LivePayload);
        else setError(data.error || 'Order not found');
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Lookup failed'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [activeOrderId]);

  // No order id yet — ask for one inline instead of showing the static
  // design sample. The intent engine may route here without an id when
  // the visitor says "track my order" without quoting the id.
  if (!activeOrderId) {
    return (
      <OrderTrackerInput theme={props.theme} onSubmit={setPendingOrderId} />
    );
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          fontSize: 12,
          color: props.theme.t3,
          border: `1px solid ${props.theme.bdr}`,
          borderRadius: 12,
          background: props.theme.surface,
        }}
      >
        Loading order {activeOrderId}…
      </div>
    );
  }

  if (error || !live) {
    return (
      <div
        style={{
          padding: 16,
          fontSize: 12,
          color: props.theme.red ?? '#D94839',
          border: `1px solid ${props.theme.bdr}`,
          borderRadius: 12,
          background: props.theme.surface,
        }}
      >
        Couldn&apos;t find order {activeOrderId}. {error ?? ''}
      </div>
    );
  }

  // Project the real order into the shape `OrderTrackerBlock` expects.
  const data = {
    ...props.data,
    orderId: live.orderId,
    status: orderStatusToStepLabel(live.status),
    orderDate: formatDate(live.createdAt),
    expectedDate: formatDate(live.estimatedDelivery),
    carrier: live.carrier,
  };

  return <OrderTrackerBlock {...props} data={data} />;
}
