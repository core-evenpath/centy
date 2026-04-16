// ── Constants for the partner orders dashboard ─────────────────────────
//
// Plain data — colors, status-tab definitions, and the linear status
// flow used to compute the "next step" button on the detail panel.
// Kept separate so the presentational components stay thin.

import type { OrderStatus } from '@/lib/relay/order-types';

export type OrderStatusFilter = OrderStatus | 'all';

export interface OrderTabDef {
  value: OrderStatusFilter;
  label: string;
  iconName: OrderTabIcon;
}

export type OrderTabIcon =
  | 'package'
  | 'clock'
  | 'check'
  | 'refresh'
  | 'truck';

export const STATUS_TABS: OrderTabDef[] = [
  { value: 'all', label: 'All', iconName: 'package' },
  { value: 'pending', label: 'Pending', iconName: 'clock' },
  { value: 'confirmed', label: 'Confirmed', iconName: 'check' },
  { value: 'processing', label: 'Processing', iconName: 'refresh' },
  { value: 'shipped', label: 'Shipped', iconName: 'truck' },
  { value: 'delivered', label: 'Delivered', iconName: 'check' },
];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

// Linear "happy path" flow — used to derive the Next Step button.
// `cancelled` / `refunded` are terminal side-branches, not on the path.
export const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export function nextStatusAfter(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}
