'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Speaker, Monitor } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_equipment',
  family: 'production',
  label: 'AV & Equipment',
  description: 'Audio/visual/lighting catalog with daily rates, availability status dots',
  applicableCategories: ['events', 'entertainment', 'production', 'corporate', 'concerts', 'av_rental'],
  intentTriggers: {
    keywords: ['equipment', 'av', 'audio', 'lighting', 'speakers', 'projector', 'rental'],
    queryPatterns: ['what equipment *', 'av options', 'do you have *', 'rental equipment'],
    dataConditions: ['has_equipment'],
  },
  dataContract: {
    required: [{ field: 'name', type: 'text', label: 'Equipment Name' }],
    optional: [
      { field: 'category', type: 'select', label: 'Category', options: ['Audio', 'Visual', 'Lighting', 'Stage'] },
      { field: 'dailyRate', type: 'currency', label: 'Daily Rate' },
      { field: 'available', type: 'toggle', label: 'Available' },
      { field: 'specs', type: 'text', label: 'Specs' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'JBL PRX 815W Speakers', category: 'Audio', dailyRate: 150, available: true, specs: '1500W, 15"' },
      { name: '4K Laser Projector', category: 'Visual', dailyRate: 300, available: true, specs: '5000 lumens' },
      { name: 'LED Par Can (x10)', category: 'Lighting', dailyRate: 80, available: false, specs: 'RGBW, DMX' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 120,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function EquipmentBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Speaker size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>AV & Equipment</span>
      </div>
      {items.map((eq, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {eq.category === 'Visual' ? <Monitor size={14} color={theme.t4} /> : <Speaker size={14} color={theme.t4} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{eq.name}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: eq.available ? theme.green : theme.red, flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>
              {eq.category}{eq.specs ? ` · ${eq.specs}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.accent }}>{fmt(eq.dailyRate)}</div>
            <div style={{ fontSize: 7, color: theme.t4 }}>/day</div>
          </div>
        </div>
      ))}
    </div>
  );
}
