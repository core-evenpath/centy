'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ChefHat, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'fb_kitchen_queue',
  family: 'operations',
  label: 'Kitchen Queue',
  description: 'Live order pipeline 5-step tracker with estimated time',
  applicableCategories: ['food_beverage', 'restaurant', 'cloud_kitchen', 'cafe'],
  intentTriggers: {
    keywords: ['order status', 'kitchen', 'queue', 'ready', 'cooking', 'preparation'],
    queryPatterns: ['where is my order', 'order status *', 'how long until *', 'is my food ready'],
    dataConditions: ['has_active_order'],
  },
  dataContract: {
    required: [
      { field: 'orderId', type: 'text', label: 'Order ID' },
      { field: 'currentStep', type: 'number', label: 'Current Step (1-5)' },
    ],
    optional: [
      { field: 'steps', type: 'tags', label: 'Pipeline Steps' },
      { field: 'estimatedMinutes', type: 'number', label: 'Est. Minutes' },
      { field: 'items', type: 'tags', label: 'Order Items' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    orderId: '#A42', currentStep: 3, estimatedMinutes: 8,
    steps: ['Received', 'Preparing', 'Cooking', 'Plating', 'Ready'],
    items: ['Truffle Risotto', 'Caesar Salad'],
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 0,
};

export default function KitchenQueueBlock({ data, theme }: BlockComponentProps) {
  const steps: string[] = data.steps || ['Received', 'Preparing', 'Cooking', 'Plating', 'Ready'];
  const current = data.currentStep || 1;
  const items: string[] = data.items || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChefHat size={14} color={theme.accent} />
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Order {data.orderId}</span>
        </div>
        {data.estimatedMinutes && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} color={theme.amber} />
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.amber }}>~{data.estimatedMinutes} min</span>
          </div>
        )}
      </div>
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {steps.map((step, i) => {
            const done = i + 1 <= current;
            const active = i + 1 === current;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i > 0 && (
                  <div style={{ position: 'absolute', top: 8, right: '50%', width: '100%', height: 3, background: done ? theme.accent : theme.bdr, zIndex: 0 }} />
                )}
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? theme.accent : theme.bg, border: `2px solid ${done ? theme.accent : theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: active ? `0 0 0 3px ${theme.accentBg}` : 'none' }}>
                  {done && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ fontSize: 7, color: done ? theme.accent : theme.t4, fontWeight: active ? 700 : 500, marginTop: 4, textAlign: 'center' }}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>
      {items.length > 0 && (
        <div style={{ padding: '8px 14px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {items.map((item, i) => (
            <span key={i} style={{ fontSize: 9, color: theme.t2, background: theme.bg, padding: '3px 7px', borderRadius: 4, border: `1px solid ${theme.bdr}` }}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}
