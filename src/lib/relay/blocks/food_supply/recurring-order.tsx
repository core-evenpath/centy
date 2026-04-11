'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { RefreshCw, CalendarDays } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fs_recurring_order',
  family: 'ordering',
  label: 'Standing Orders',
  description: 'Subscription-style order manager with frequency and next delivery date',
  applicableCategories: ['food_supply', 'wholesale', 'distributor'],
  intentTriggers: {
    keywords: ['recurring', 'standing', 'subscription', 'repeat', 'regular', 'schedule'],
    queryPatterns: ['my standing orders', 'recurring orders *', 'set up regular *'],
    dataConditions: ['has_recurring_orders'],
  },
  dataContract: {
    required: [
      { field: 'orders', type: 'tags', label: 'Standing Orders' },
    ],
    optional: [],
  },
  variants: ['default'],
  sampleData: {
    orders: [
      { name: 'Weekly Produce Box', items: 8, frequency: 'Weekly', nextDelivery: 'Mon, Apr 14', total: 485.00, status: 'active' },
      { name: 'Monthly Dairy Restock', items: 12, frequency: 'Monthly', nextDelivery: 'May 1', total: 1240.00, status: 'active' },
      { name: 'Bi-weekly Seafood', items: 5, frequency: 'Bi-weekly', nextDelivery: 'Apr 21', total: 890.00, status: 'paused' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function RecurringOrderBlock({ data, theme }: BlockComponentProps) {
  const orders: Array<Record<string, any>> = data.orders || [];
  if (!orders.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={13} color={theme.accent} />
        <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Standing Orders</span>
        <span style={{ fontSize: 9, color: theme.t4, marginLeft: 'auto' }}>{orders.length} active</span>
      </div>
      <div style={{ padding: '4px 14px 8px' }}>
        {orders.map((o, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < orders.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: o.status === 'active' ? theme.t1 : theme.t4 }}>{o.name}</div>
                <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{o.items} items · {o.frequency}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>${o.total.toFixed(2)}</div>
                <span style={{ fontSize: 7, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: o.status === 'active' ? theme.greenBg : theme.amberBg, color: o.status === 'active' ? theme.green : theme.amber, textTransform: 'capitalize' }}>
                  {o.status}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, fontSize: 8, color: theme.t3 }}>
              <CalendarDays size={8} /> Next: {o.nextDelivery}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
