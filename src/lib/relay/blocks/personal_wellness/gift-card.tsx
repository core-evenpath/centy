'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Gift, CreditCard } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_gift_card',
  family: 'marketing',
  label: 'Gift Card',
  description: 'Denomination selector grid with purchase CTA',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage'],
  intentTriggers: {
    keywords: ['gift card', 'gift', 'voucher', 'present', 'gift certificate'],
    queryPatterns: ['buy a gift card', 'gift options', 'send a gift *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'denominations', type: 'tags', label: 'Denominations' },
      { field: 'selected', type: 'currency', label: 'Selected Amount' },
      { field: 'brandName', type: 'text', label: 'Brand Name' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    brandName: 'Glow Spa',
    denominations: [25, 50, 75, 100, 150, 200],
    selected: 75,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function GiftCardBlock({ data, theme }: BlockComponentProps) {
  const denoms: number[] = data.denominations || [25, 50, 75, 100, 150, 200];
  const selected = data.selected || denoms[2];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 12px 8px', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.accentBg})`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Gift size={16} color={theme.accent} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>Gift Card</div>
          {data.brandName && <div style={{ fontSize: 8, color: theme.t3 }}>{data.brandName}</div>}
        </div>
        <CreditCard size={20} color={theme.t4} style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: theme.t3, marginBottom: 6 }}>Select Amount</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {denoms.map(d => {
            const isSel = d === selected;
            return (
              <div key={d} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: isSel ? '#fff' : theme.t1, background: isSel ? theme.accent : theme.bg, border: `1px solid ${isSel ? theme.accent : theme.bdr}`, cursor: 'pointer' }}>
                ${d}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}` }}>
        <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
          Purchase Gift Card — ${selected}
        </button>
      </div>
    </div>
  );
}
