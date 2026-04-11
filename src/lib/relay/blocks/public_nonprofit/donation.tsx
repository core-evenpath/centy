'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Heart, ShieldCheck } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_donation',
  family: 'fundraising',
  label: 'Donation',
  description: 'Preset amount grid, frequency selector, trust badges',
  applicableCategories: ['nonprofit', 'charity', 'foundation', 'community'],
  intentTriggers: {
    keywords: ['donate', 'donation', 'give', 'contribute', 'fundraise', 'support'],
    queryPatterns: ['I want to donate *', 'how can I give *', 'make a donation'],
    dataConditions: ['accepts_donations'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'presets', type: 'tags', label: 'Preset Amounts' },
      { field: 'currency', type: 'text', label: 'Currency Symbol' },
      { field: 'cause', type: 'text', label: 'Cause Title' },
      { field: 'trustBadges', type: 'tags', label: 'Trust Badges' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    presets: [10, 25, 50, 100, 250],
    currency: '$',
    cause: 'Youth Education Fund',
    trustBadges: ['501(c)(3) Verified', 'SSL Secure', '100% Tax Deductible'],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function DonationBlock({ data, theme }: BlockComponentProps) {
  const presets: number[] = data.presets || [10, 25, 50, 100];
  const cur = data.currency || '$';
  const badges: string[] = data.trustBadges || [];
  const frequencies = ['One-time', 'Monthly'];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Heart size={14} color={theme.accent} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.cause || 'Make a Donation'}</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {frequencies.map(f => (
            <div key={f} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${f === 'One-time' ? theme.accent : theme.bdr}`, background: f === 'One-time' ? theme.accentBg : theme.surface, fontSize: 10, fontWeight: 600, color: f === 'One-time' ? theme.accent : theme.t3, textAlign: 'center', cursor: 'pointer' }}>{f}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
          {presets.map(amt => (
            <div key={amt} style={{ padding: '8px 0', borderRadius: 6, border: `1px solid ${theme.bdr}`, fontSize: 12, fontWeight: 600, color: theme.t1, textAlign: 'center', cursor: 'pointer' }}>{cur}{amt}</div>
          ))}
          <div style={{ padding: '8px 0', borderRadius: 6, border: `1px dashed ${theme.bdr}`, fontSize: 10, color: theme.t4, textAlign: 'center', cursor: 'pointer' }}>Custom</div>
        </div>
        <button style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Donate Now</button>
        {badges.length > 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {badges.map(b => (
              <span key={b} style={{ fontSize: 7, color: theme.t4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShieldCheck size={8} color={theme.green} /> {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
