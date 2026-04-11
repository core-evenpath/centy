'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Package, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_spa_package',
  family: 'marketing',
  label: 'Spa / Service Package',
  description: 'Bundled services with total duration, savings, and combined price',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'massage'],
  intentTriggers: {
    keywords: ['package', 'bundle', 'combo', 'deal', 'special'],
    queryPatterns: ['spa packages', 'any bundles *', 'package deals'],
    dataConditions: ['has_packages'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Package Name' },
      { field: 'price', type: 'currency', label: 'Package Price' },
    ],
    optional: [
      { field: 'services', type: 'tags', label: 'Included Services' },
      { field: 'totalDuration', type: 'number', label: 'Total Duration (min)' },
      { field: 'originalPrice', type: 'currency', label: 'Original Price' },
      { field: 'badge', type: 'text', label: 'Badge' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Serenity Escape', services: ['Swedish Massage 60m', 'Express Facial', 'Scalp Treatment'], totalDuration: 120, price: 195, originalPrice: 250, badge: 'Save 22%' },
      { name: 'Bridal Glow', services: ['Full Facial', 'Mani-Pedi', 'Blowout'], totalDuration: 180, price: 280, originalPrice: 340 },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function SpaPackageBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || (data.name ? [data] : []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((p, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Package size={12} color={theme.accent} />
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.t1 }}>{p.name}</span>
            </div>
            {p.badge && <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: theme.green, padding: '2px 6px', borderRadius: 4 }}>{p.badge}</span>}
          </div>
          <div style={{ padding: '8px 12px' }}>
            {p.services?.map((s: string, j: number) => (
              <div key={j} style={{ fontSize: 9, color: theme.t2, padding: '2px 0', borderBottom: j < p.services.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
                {s}
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} color={theme.t4} />
              <span style={{ fontSize: 9, color: theme.t3 }}>{p.totalDuration || 90} min total</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              {p.originalPrice && <span style={{ fontSize: 9, color: theme.t4, textDecoration: 'line-through' }}>{fmt(p.originalPrice)}</span>}
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(p.price)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
