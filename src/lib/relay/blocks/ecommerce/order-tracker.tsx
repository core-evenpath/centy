'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Check, Package, Truck, MapPin, Home } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'ecom_order_tracker',
  family: 'tracking',
  label: 'Order Tracker',
  description: 'Shipment progress with step indicator',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['track', 'order', 'shipping', 'delivery', 'where', 'status', 'shipped'],
    queryPatterns: ['track my order', 'where is my *', 'order status', 'when will * arrive'],
    dataConditions: ['has_order_id'],
  },
  dataContract: {
    required: [
      { field: 'orderId', type: 'text', label: 'Order ID' },
      { field: 'status', type: 'select', label: 'Status', options: ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'] },
    ],
    optional: [
      { field: 'orderDate', type: 'text', label: 'Order Date' },
      { field: 'expectedDate', type: 'text', label: 'Expected Date' },
      { field: 'carrier', type: 'text', label: 'Carrier' },
    ],
  },
  variants: ['default'],
  sampleData: {
    orderId: '#PBX-284910',
    status: 'Shipped',
    orderDate: '28 Mar',
    expectedDate: 'Thu, 2 Apr',
    carrier: 'Delhivery',
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 60,
};

const STEPS = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const STEP_ICONS = [Check, Package, Truck, MapPin, Home];

export default function OrderTrackerBlock({ data, theme }: BlockComponentProps) {
  const currentIdx = STEPS.indexOf(data.status);
  const isDelivered = data.status === 'Delivered';

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.bdr}` }}>
        <div>
          <div style={{ fontSize: '10px', color: theme.t3 }}>Order {data.orderId}</div>
          {data.orderDate && <div style={{ fontSize: '11px', color: theme.t2, marginTop: '2px' }}>Placed {data.orderDate}</div>}
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          background: isDelivered ? theme.greenBg : theme.accentBg,
          color: isDelivered ? theme.green : theme.accent,
          border: `1px solid ${isDelivered ? theme.greenBdr : theme.accentBg2}`,
        }}>
          {data.status}
        </div>
      </div>

      <div style={{ padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            height: 2,
            background: theme.bdr,
            zIndex: 0,
          }} />
          {currentIdx >= 0 && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              width: `${Math.min(currentIdx / (STEPS.length - 1), 1) * (100 - (24 / 3))}%`,
              height: 2,
              background: isDelivered ? theme.green : theme.accent,
              zIndex: 1,
            }} />
          )}
          {STEPS.map((step, i) => {
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;
            const Icon = STEP_ICONS[i];
            const circleColor = isDone ? (isDelivered ? theme.green : theme.accent) : theme.bdr;
            const iconColor = isDone ? '#fff' : theme.t4;

            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isDone ? circleColor : theme.surface,
                  border: isDone ? 'none' : `2px solid ${theme.bdr}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? `0 0 0 3px ${isDelivered ? theme.greenBg : theme.accentBg2}` : 'none',
                }}>
                  {isDone ? <Check size={10} color={iconColor} strokeWidth={3} /> : <Icon size={10} color={iconColor} />}
                </div>
                <div style={{
                  fontSize: '8px',
                  color: isDone ? theme.t1 : theme.t4,
                  fontWeight: isCurrent ? 700 : 400,
                  marginTop: '6px',
                  textAlign: 'center',
                  maxWidth: '52px',
                  lineHeight: 1.2,
                }}>
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.status === 'Shipped' && data.expectedDate && (
        <div style={{ padding: '10px 14px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: theme.bg, borderRadius: '8px', border: `1px solid ${theme.bdr}` }}>
            <div>
              <div style={{ fontSize: '10px', color: theme.t3 }}>Expected by</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme.t1 }}>{data.expectedDate}</div>
              {data.carrier && <div style={{ fontSize: '10px', color: theme.t3, marginTop: '2px' }}>via {data.carrier}</div>}
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: theme.accent,
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Track
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
