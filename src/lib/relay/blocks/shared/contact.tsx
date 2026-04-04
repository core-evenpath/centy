'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Headphones, MessageSquare, Phone, Mail, ChevronRight } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'shared_contact',
  family: 'support',
  label: 'Contact',
  description: 'Multi-channel contact options',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty', 'hospitality', 'real_estate', 'healthcare', 'services'],
  intentTriggers: {
    keywords: ['contact', 'call', 'email', 'phone', 'reach', 'support', 'help'],
    queryPatterns: ['how to contact *', 'phone number', 'email address', 'customer service'],
    dataConditions: ['has_contact_info'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'whatsapp', type: 'phone', label: 'WhatsApp' },
      { field: 'phone', type: 'phone', label: 'Phone' },
      { field: 'email', type: 'email', label: 'Email' },
      { field: 'phoneHours', type: 'text', label: 'Phone Hours' },
    ],
  },
  variants: ['default'],
  sampleData: {
    whatsapp: '+91 98765 43210',
    phone: '+91 98765 43210',
    email: 'care@store.in',
    phoneHours: 'Mon-Sat, 10 AM-7 PM',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

interface ContactRow {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  iconColor: string;
}

export default function ContactBlock({ data, theme }: BlockComponentProps) {
  const rows: ContactRow[] = [];

  if (data.whatsapp) {
    rows.push({ icon: MessageSquare, label: 'WhatsApp', value: data.whatsapp, iconColor: '#25D366' });
  }
  if (data.phone) {
    rows.push({ icon: Phone, label: 'Phone', value: data.phone, iconColor: theme.accent });
  }
  if (data.email) {
    rows.push({ icon: Mail, label: 'Email', value: data.email, iconColor: theme.accent });
  }

  if (rows.length === 0) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Headphones size={16} color={theme.accent} />
        <span style={{ fontSize: '14px', fontWeight: 700, color: theme.t1 }}>Need Help?</span>
      </div>
      <div style={{ padding: '6px' }}>
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: `1px solid transparent`,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color={row.iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.t1 }}>{row.label}</div>
                <div style={{ fontSize: '11px', color: theme.t3 }}>{row.value}</div>
              </div>
              <ChevronRight size={14} color={theme.t4} />
            </div>
          );
        })}
        {data.phoneHours && (
          <div style={{ padding: '6px 10px 8px', fontSize: '10px', color: theme.t3, textAlign: 'center' }}>
            {data.phoneHours}
          </div>
        )}
      </div>
    </div>
  );
}
