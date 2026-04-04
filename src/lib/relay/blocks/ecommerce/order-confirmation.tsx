'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Check, Package, MessageSquare } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'ecom_order_confirmation',
  family: 'confirmation',
  label: 'Order Confirmation',
  description: 'Order success state with summary and next steps',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: [],
    queryPatterns: [],
    dataConditions: ['order_just_placed'],
  },
  dataContract: {
    required: [
      { field: 'orderId', type: 'text', label: 'Order ID' },
      { field: 'total', type: 'currency', label: 'Total' },
    ],
    optional: [
      { field: 'items', type: 'tags', label: 'Order Items' },
      { field: 'deliveryEstimate', type: 'text', label: 'Delivery Estimate' },
      { field: 'updateChannel', type: 'text', label: 'Update Channel' },
    ],
  },
  variants: ['default'],
  sampleData: {
    orderId: '#PBX-284910',
    total: 6300,
    items: [
      { name: 'Block Print Kurta Set', price: 2800 },
      { name: 'Kundan Choker Set', price: 4200 },
    ],
    deliveryEstimate: '3-5 business days',
    updateChannel: 'WhatsApp + SMS',
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export default function OrderConfirmationBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{
        padding: '20px',
        background: `linear-gradient(135deg, ${theme.greenBg}, ${theme.surface})`,
        textAlign: 'center',
        borderBottom: `1px solid ${theme.greenBdr}`,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
          <Check size={20} color="#fff" strokeWidth={3} />
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: theme.t1 }}>Order Placed!</div>
        <div style={{ fontSize: '12px', color: theme.t3, marginTop: '4px' }}>{data.orderId}</div>
      </div>

      {items.length > 0 && (
        <div style={{ padding: '12px 14px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={12} color={theme.t4} />
                <span style={{ fontSize: '12px', color: theme.t1 }}>{item.name}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: theme.t2 }}>{formatCurrency(item.price)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '4px', borderTop: `1px solid ${theme.bdr}` }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.t1 }}>Total</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.accent }}>{formatCurrency(data.total)}</span>
          </div>
        </div>
      )}

      {(data.deliveryEstimate || data.updateChannel) && (
        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {data.deliveryEstimate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: theme.bg, borderRadius: '8px' }}>
              <Package size={12} color={theme.accent} />
              <div>
                <div style={{ fontSize: '10px', color: theme.t3 }}>Estimated Delivery</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.t1 }}>{data.deliveryEstimate}</div>
              </div>
            </div>
          )}
          {data.updateChannel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: theme.bg, borderRadius: '8px' }}>
              <MessageSquare size={12} color={theme.accent} />
              <div>
                <div style={{ fontSize: '10px', color: theme.t3 }}>Updates via</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.t1 }}>{data.updateChannel}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
