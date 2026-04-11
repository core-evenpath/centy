'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { AlertTriangle, Phone } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_emergency',
  family: 'urgent',
  label: 'Emergency Service',
  description: 'Emergency types with response times, 24/7 badge, call CTA button',
  applicableCategories: ['home_property', 'home_services', 'repair', 'plumbing', 'electrical'],
  intentTriggers: {
    keywords: ['emergency', 'urgent', 'leak', 'flood', 'no power', 'gas smell', 'burst pipe'],
    queryPatterns: ['I have an emergency', 'urgent help', 'pipe burst', 'no hot water'],
    dataConditions: ['is_emergency'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'emergencyTypes', type: 'tags', label: 'Emergency Types' },
      { field: 'phone', type: 'phone', label: 'Emergency Phone' },
      { field: 'avgResponse', type: 'text', label: 'Avg Response' },
    ],
  },
  variants: ['default'],
  sampleData: {
    emergencyTypes: [
      { name: 'Burst Pipe', responseTime: '30 min' },
      { name: 'Gas Leak', responseTime: '15 min' },
      { name: 'Power Outage', responseTime: '45 min' },
      { name: 'Flooding', responseTime: '30 min' },
    ],
    phone: '+1-800-555-0199',
    avgResponse: '< 30 min',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function EmergencyBlock({ data, theme }: BlockComponentProps) {
  const types: Array<Record<string, any>> = data.emergencyTypes || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.red}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.redBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertTriangle size={12} color={theme.red} />
          <span style={{ fontSize: 10, fontWeight: 700, color: theme.red, textTransform: 'uppercase', letterSpacing: 0.5 }}>Emergency Service</span>
        </div>
        <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: theme.red, padding: '2px 6px', borderRadius: 4 }}>24/7</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        {types.map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < types.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: theme.t1 }}>{t.name}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '2px 6px', borderRadius: 4 }}>{t.responseTime}</span>
          </div>
        ))}
        {data.avgResponse && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 9, color: theme.t3 }}>
            Average response time: <strong style={{ color: theme.t1 }}>{data.avgResponse}</strong>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.red, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <Phone size={12} /> Call Emergency Line
        </button>
      </div>
    </div>
  );
}
