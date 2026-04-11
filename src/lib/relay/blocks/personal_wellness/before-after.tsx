'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { ArrowRight, ImageIcon } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_before_after',
  family: 'proof',
  label: 'Before / After Gallery',
  description: 'Side-by-side transformation placeholders with treatment and client tag',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'skincare'],
  intentTriggers: {
    keywords: ['before after', 'results', 'transformations', 'gallery', 'portfolio'],
    queryPatterns: ['show results', 'before and after *', 'transformations'],
    dataConditions: ['has_gallery'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'items', type: 'tags', label: 'Gallery Items' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { treatment: 'Balayage Color', client: 'Jessica R.', beforeUrl: '', afterUrl: '' },
      { treatment: 'Hydrafacial', client: 'Amy L.', beforeUrl: '', afterUrl: '' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function BeforeAfterBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <ImageIcon size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No transformations yet</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((t, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden', padding: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 72, borderRadius: 6, background: `linear-gradient(135deg, ${theme.bg}, ${theme.accentBg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.t4 }}>BEFORE</span>
            </div>
            <ArrowRight size={14} color={theme.accent} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, height: 72, borderRadius: 6, background: `linear-gradient(135deg, ${theme.accentBg}, ${theme.accentBg2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 600, color: theme.accent }}>AFTER</span>
            </div>
          </div>
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{t.treatment}</span>
            <span style={{ fontSize: 8, color: theme.t3 }}>{t.client}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
