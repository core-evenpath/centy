'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Sparkles, TrendingUp, Tag, Package } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'ecom_greeting',
  family: 'navigation',
  label: 'Greeting',
  description: 'Welcome block with brand info and quick action grid',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['hello', 'hi', 'hey', 'start', 'help'],
    queryPatterns: [],
    dataConditions: ['is_first_message', 'is_new_session'],
  },
  dataContract: {
    required: [
      { field: 'brandName', type: 'text', label: 'Brand Name' },
      { field: 'tagline', type: 'text', label: 'Tagline' },
    ],
    optional: [
      { field: 'welcomeMessage', type: 'textarea', label: 'Welcome Message' },
      { field: 'logoUrl', type: 'image', label: 'Logo' },
      {
        field: 'quickActions',
        type: 'tags',
        label: 'Quick Actions',
      },
    ],
  },
  variants: ['default', 'minimal', 'expanded'],
  sampleData: {
    brandName: 'Aurelia',
    tagline: 'Handcrafted fashion for every occasion',
    welcomeMessage: 'Welcome! Browse our collection or tell me what you are looking for.',
    quickActions: ['New Arrivals', 'Bestsellers', 'Sale', 'Track Order'],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

const ACTION_ICONS = [Sparkles, TrendingUp, Tag, Package];
const ACTION_SUBS = ['Just dropped', 'Top picks', 'Up to 50% off', 'Check status'];

export default function GreetingBlock({ data, theme }: BlockComponentProps) {
  const brand = data.brandName || 'Store';
  const tagline = data.tagline || '';
  const welcome = data.welcomeMessage || 'Welcome! How can I help you today?';
  const actions: string[] = data.quickActions || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 700 }}>
            {brand.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: theme.t1 }}>{brand}</div>
            {tagline && <div style={{ fontSize: '11px', color: theme.t3 }}>{tagline}</div>}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: theme.t2, marginTop: '8px', lineHeight: 1.5 }}>{welcome}</div>
      </div>
      {actions.length > 0 && (
        <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {actions.slice(0, 4).map((action, i) => {
            const Icon = ACTION_ICONS[i % ACTION_ICONS.length];
            const sub = ACTION_SUBS[i % ACTION_SUBS.length];
            return (
              <div key={action} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: theme.bg, borderRadius: '8px', cursor: 'pointer', border: `1px solid ${theme.bdr}` }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.accent, flexShrink: 0 }}>
                  <Icon size={12} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: theme.t1 }}>{action}</div>
                  <div style={{ fontSize: '9px', color: theme.t4 }}>{sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
