'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { FileText } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_house_rules',
  family: 'support',
  label: 'House Rules & Policies',
  description: 'Check-in/out times, cancellation, pets, children, quiet hours',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb', 'vacation_rental'],
  intentTriggers: {
    keywords: ['rules', 'policy', 'cancellation', 'pets', 'check-in time', 'check-out time', 'children'],
    queryPatterns: ['what are the rules', 'cancellation policy', 'pet policy', 'check-in time'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [{ field: 'rules', type: 'tags', label: 'Rules' }],
  },
  variants: ['default'],
  sampleData: {
    rules: [
      { label: 'Check-in', value: '3:00 PM' },
      { label: 'Check-out', value: '11:00 AM' },
      { label: 'Cancellation', value: 'Free up to 48h before' },
      { label: 'Children', value: 'Welcome — Under 5 free' },
      { label: 'Pets', value: 'Allowed — $25/night fee' },
      { label: 'Smoking', value: 'Outdoor areas only' },
      { label: 'Quiet hours', value: '10 PM – 7 AM' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function HouseRulesBlock({ data, theme }: BlockComponentProps) {
  const rules: Array<{ label: string; value: string }> = data.rules || [];
  if (!rules.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <FileText size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>House Rules & Policies</span>
      </div>
      {rules.map((r, i) => (
        <div key={i} style={{ padding: '6px 12px', borderBottom: i < rules.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8, background: i % 2 === 0 ? theme.bg : theme.surface }}>
          <span style={{ fontSize: 9, color: theme.t3, width: 80, flexShrink: 0 }}>{r.label}</span>
          <span style={{ fontSize: 9, fontWeight: 500, color: theme.t1 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}
