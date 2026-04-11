'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Crown, Check } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_membership_tier',
  family: 'pricing',
  label: 'Membership Plans',
  description: 'Tier comparison with perks, pricing, and best-value badge',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'fitness', 'gym'],
  intentTriggers: {
    keywords: ['membership', 'plans', 'subscribe', 'tiers', 'pricing', 'monthly'],
    queryPatterns: ['membership options', 'pricing plans', 'how much is membership'],
    dataConditions: ['has_memberships'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'plans', type: 'tags', label: 'Membership Plans' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    plans: [
      { name: 'Essential', price: 49, period: 'mo', perks: ['1 service/month', '10% retail discount'], bestValue: false },
      { name: 'Premium', price: 99, period: 'mo', perks: ['3 services/month', '20% retail discount', 'Priority booking'], bestValue: true },
      { name: 'VIP', price: 179, period: 'mo', perks: ['Unlimited services', '30% retail', 'Guest passes', 'Exclusive events'], bestValue: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function MembershipTierBlock({ data, theme }: BlockComponentProps) {
  const plans: Array<Record<string, any>> = data.plans || [];
  if (!plans.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Crown size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Membership Plans</span>
      </div>
      {plans.map((p, i) => (
        <div key={i} style={{ padding: '10px 12px', borderBottom: i < plans.length - 1 ? `1px solid ${theme.bdr}` : 'none', background: p.bestValue ? theme.accentBg : 'transparent', position: 'relative' }}>
          {p.bestValue && <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 7, fontWeight: 700, color: '#fff', background: theme.accent, padding: '2px 6px', borderRadius: 4 }}>Best Value</div>}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{p.name}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: theme.accent }}>${p.price}</span>
            <span style={{ fontSize: 8, color: theme.t4 }}>/{p.period || 'mo'}</span>
          </div>
          {p.perks?.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {p.perks.map((pk: string, j: number) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <Check size={9} color={theme.green} />
                  <span style={{ fontSize: 9, color: theme.t2 }}>{pk}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
