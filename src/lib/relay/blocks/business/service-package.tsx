'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Briefcase, Users } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'biz_service_package',
  family: 'catalog',
  label: 'Service Package Card',
  description: 'Engagement offering with pricing model, scope summary, and client count',
  applicableCategories: ['business', 'professional', 'consulting', 'agency', 'freelance'],
  intentTriggers: {
    keywords: ['services', 'packages', 'offerings', 'pricing', 'engagement', 'retainer', 'hourly'],
    queryPatterns: ['what services *', 'show me packages', 'pricing options', 'how much *'],
    dataConditions: ['has_services'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Package Name' },
      { field: 'pricingModel', type: 'select', label: 'Pricing Model', options: ['hourly', 'project', 'retainer'] },
    ],
    optional: [
      { field: 'price', type: 'currency', label: 'Price' },
      { field: 'scope', type: 'text', label: 'Scope Summary' },
      { field: 'clientCount', type: 'number', label: 'Client Count' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'features', type: 'tags', label: 'Included Features' },
    ],
  },
  variants: ['default', 'compact', 'featured'],
  sampleData: {
    items: [
      { name: 'Growth Strategy', pricingModel: 'project', price: 8500, scope: 'Full GTM audit + 90-day plan', clientCount: 34, badge: 'Popular', features: ['Market Analysis', 'Positioning', 'Roadmap'] },
      { name: 'Fractional CMO', pricingModel: 'retainer', price: 4500, scope: '20 hrs/month strategic leadership', clientCount: 12, features: ['Weekly Syncs', 'Board Decks', 'Team Coaching'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

const MODEL_LABELS: Record<string, string> = { hourly: '/hr', project: ' fixed', retainer: '/mo' };

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function ServicePackageBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Briefcase size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No packages available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((pkg, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{pkg.name}</div>
              <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{pkg.scope}</div>
            </div>
            {pkg.badge && <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 6px', borderRadius: 6 }}>{pkg.badge}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            {pkg.price && <span style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>{fmt(pkg.price)}</span>}
            <span style={{ fontSize: 9, color: theme.t4 }}>{MODEL_LABELS[pkg.pricingModel] || ''}</span>
          </div>
          {pkg.features?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {pkg.features.map((f: string) => <span key={f} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t3, border: `1px solid ${theme.bdr}` }}>{f}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {pkg.clientCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: theme.t3 }}>
                <Users size={10} color={theme.t4} />{pkg.clientCount} clients served
              </div>
            )}
            <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto' }}>Inquire</button>
          </div>
        </div>
      ))}
    </div>
  );
}
