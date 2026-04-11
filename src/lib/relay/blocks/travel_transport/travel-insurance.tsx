'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Shield, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_travel_insurance',
  family: 'protection',
  label: 'Travel Insurance',
  description: 'Coverage tier radio with details, limits, and recommended badge',
  applicableCategories: ['travel', 'insurance', 'agencies', 'airlines'],
  intentTriggers: {
    keywords: ['insurance', 'coverage', 'protection', 'travel insurance', 'medical cover'],
    queryPatterns: ['do I need insurance', 'travel insurance *', 'coverage options', 'add insurance'],
    dataConditions: ['has_insurance_options'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'tiers', type: 'tags', label: 'Insurance Tiers' },
      { field: 'selected', type: 'text', label: 'Selected Tier' },
    ],
  },
  variants: ['default'],
  sampleData: {
    tiers: [
      { name: 'Basic', price: 29, medical: '$50k', cancellation: '$1k', baggage: '$500', features: ['Medical', 'Cancellation'] },
      { name: 'Standard', price: 59, medical: '$250k', cancellation: '$5k', baggage: '$2k', features: ['Medical', 'Cancellation', 'Baggage', 'Delay'], recommended: true },
      { name: 'Premium', price: 99, medical: '$1M', cancellation: '$10k', baggage: '$5k', features: ['Medical', 'Cancellation', 'Baggage', 'Delay', 'Adventure'] },
    ],
    selected: 'Standard',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n; }

export default function TravelInsuranceBlock({ data, theme }: BlockComponentProps) {
  const tiers: Array<Record<string, any>> = data.tiers || [];
  const selected = data.selected || '';
  if (!tiers.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Shield size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Travel Insurance</span>
      </div>
      {tiers.map((t, i) => {
        const isSelected = t.name === selected;
        return (
          <div key={i} style={{ padding: '8px 12px', borderBottom: i < tiers.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: isSelected ? theme.accentBg : 'transparent', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: isSelected ? `5px solid ${theme.accent}` : `2px solid ${theme.bdr}`, background: theme.surface, flexShrink: 0, boxSizing: 'border-box' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400, color: theme.t1 }}>{t.name}</span>
                  {t.recommended && <span style={{ fontSize: 7, fontWeight: 600, color: theme.green, background: theme.greenBg, padding: '1px 4px', borderRadius: 3 }}>Recommended</span>}
                </div>
                <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>Medical {t.medical} · Cancel {t.cancellation}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent }}>{fmt(t.price)}</span>
            </div>
            {isSelected && t.features && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, marginLeft: 24 }}>
                {t.features.map((f: string) => <span key={f} style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.greenBg, color: theme.green, display: 'flex', alignItems: 'center', gap: 2 }}><Check size={7} />{f}</span>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
