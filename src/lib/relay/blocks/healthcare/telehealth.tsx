'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Video, CheckSquare } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_telehealth',
  family: 'virtual',
  label: 'Telehealth Visit',
  description: 'Virtual visit card with provider info, pre-visit checklist items',
  applicableCategories: ['healthcare', 'medical', 'telehealth', 'clinic'],
  intentTriggers: {
    keywords: ['telehealth', 'virtual', 'video visit', 'remote', 'online consultation'],
    queryPatterns: ['start a video visit', 'virtual appointment *', 'telehealth *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'providerName', type: 'text', label: 'Provider Name' },
      { field: 'specialty', type: 'text', label: 'Specialty' },
      { field: 'scheduledTime', type: 'text', label: 'Scheduled Time' },
      { field: 'checklist', type: 'tags', label: 'Pre-visit Checklist' },
    ],
  },
  variants: ['default'],
  sampleData: {
    providerName: 'Dr. Sarah Chen', specialty: 'Internal Medicine',
    scheduledTime: 'Today, 2:30 PM',
    checklist: [
      { label: 'Test camera & microphone', done: true },
      { label: 'Update medication list', done: true },
      { label: 'Prepare questions for provider', done: false },
      { label: 'Have insurance card ready', done: false },
    ],
  },
  preloadable: false,
  streamable: false,
  cacheDuration: 0,
};

export default function TelehealthBlock({ data, theme }: BlockComponentProps) {
  const checklist: Array<{ label: string; done: boolean }> = data.checklist || [];

  return (
    <div style={{ background: theme.surface, border: `2px solid ${theme.accent}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Video size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Telehealth Visit</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {data.providerName && (
          <div style={{ padding: '6px 8px', background: theme.bg, borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.accentBg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={12} color={theme.accent} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{data.providerName}</div>
              <div style={{ fontSize: 8, color: theme.t3 }}>{data.specialty}{data.scheduledTime ? ` · ${data.scheduledTime}` : ''}</div>
            </div>
          </div>
        )}
        {checklist.length > 0 && (
          <div>
            <label style={{ fontSize: 8, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pre-visit Checklist</label>
            <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {checklist.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.bdr}` }}>
                  <CheckSquare size={12} color={item.done ? theme.green : theme.t4} />
                  <span style={{ fontSize: 9, color: item.done ? theme.t3 : theme.t1, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
          Join Video Visit
        </button>
      </div>
    </div>
  );
}
