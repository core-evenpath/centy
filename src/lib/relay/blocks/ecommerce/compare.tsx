'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Sparkles } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'ecom_compare',
  family: 'compare',
  label: 'Compare Products',
  description: 'Side-by-side comparison table with AI verdict',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty'],
  intentTriggers: {
    keywords: ['compare', 'versus', 'vs', 'difference', 'better', 'which one'],
    queryPatterns: ['compare * and *', '* vs *', '* or *', 'which is better'],
    dataConditions: ['has_multiple_items'],
  },
  dataContract: {
    required: [
      { field: 'items', type: 'tags', label: 'Items to Compare' },
      { field: 'rows', type: 'tags', label: 'Comparison Rows' },
    ],
    optional: [
      { field: 'verdict', type: 'text', label: 'AI Verdict' },
      { field: 'verdictProduct', type: 'text', label: 'Winner Product' },
    ],
  },
  variants: ['default'],
  sampleData: {
    itemLabels: ['Aurelia', 'Libas'],
    rows: [
      ['Price', '₹2,800', '₹3,400'],
      ['Fabric', 'Pure Cotton', 'Cotton Blend'],
      ['Pieces', '3-piece', '2-piece'],
      ['Rating', '4.2 ★', '3.9 ★'],
      ['Delivery', '3-5 days', '5-7 days'],
    ],
    verdict: 'Aurelia wins on value — more pieces, better fabric, lower price.',
    verdictProduct: 'Aurelia',
  },
  preloadable: false,
  streamable: true,
  cacheDuration: 60,
};

export default function CompareBlock({ data, theme }: BlockComponentProps) {
  const labels: string[] = data.itemLabels || ['Product A', 'Product B'];
  const rows: string[][] = data.rows || [];
  const verdict: string = data.verdict || '';

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${theme.bdr}` }}>
        <div style={{ padding: '10px 12px', fontSize: '10px', fontWeight: 600, color: theme.t3, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Feature</div>
        <div style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: theme.accent, textAlign: 'center' }}>{labels[0]}</div>
        <div style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: theme.t1, textAlign: 'center' }}>{labels[1]}</div>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: i % 2 === 0 ? theme.bg : theme.surface,
            borderBottom: i < rows.length - 1 ? `1px solid ${theme.bdr}` : 'none',
          }}
        >
          <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: theme.t2 }}>{row[0]}</div>
          <div style={{ padding: '8px 12px', fontSize: '11px', color: theme.t1, textAlign: 'center' }}>{row[1]}</div>
          <div style={{ padding: '8px 12px', fontSize: '11px', color: theme.t1, textAlign: 'center' }}>{row[2]}</div>
        </div>
      ))}
      {verdict && (
        <div style={{ padding: '12px', background: theme.accentBg, borderTop: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Sparkles size={14} color={theme.accent} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '11px', color: theme.t1, lineHeight: 1.5 }}>{verdict}</div>
        </div>
      )}
    </div>
  );
}
