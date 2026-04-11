'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Trophy, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pw_loyalty_progress',
  family: 'retention',
  label: 'Loyalty / Rewards',
  description: 'Points progress bar, tier status, visit count, and rewards earned',
  applicableCategories: ['personal_wellness', 'salon', 'spa', 'beauty', 'fitness'],
  intentTriggers: {
    keywords: ['loyalty', 'rewards', 'points', 'tier', 'perks'],
    queryPatterns: ['my rewards', 'loyalty status', 'how many points *'],
    dataConditions: ['has_loyalty'],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'tier', type: 'text', label: 'Current Tier' },
      { field: 'points', type: 'number', label: 'Current Points' },
      { field: 'nextTierPoints', type: 'number', label: 'Points for Next Tier' },
      { field: 'nextTier', type: 'text', label: 'Next Tier Name' },
      { field: 'visits', type: 'number', label: 'Visit Count' },
      { field: 'rewardsEarned', type: 'number', label: 'Rewards Earned' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    tier: 'Gold', points: 1240, nextTierPoints: 2000, nextTier: 'Platinum', visits: 28, rewardsEarned: 5,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function LoyaltyProgressBlock({ data, theme }: BlockComponentProps) {
  const points = data.points || 0;
  const nextPts = data.nextTierPoints || 1;
  const pct = Math.min(100, Math.round((points / nextPts) * 100));

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: theme.accentBg, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Trophy size={12} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Loyalty Rewards</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={12} fill={theme.amber} color={theme.amber} />
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.t1 }}>{data.tier || 'Member'}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: theme.accent }}>{points.toLocaleString()} pts</span>
        </div>
        <div style={{ height: 6, background: theme.bg, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: theme.accent, borderRadius: 3 }} />
        </div>
        {data.nextTier && <div style={{ fontSize: 8, color: theme.t3, marginBottom: 8 }}>{nextPts - points} pts to {data.nextTier}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          {data.visits != null && (
            <div style={{ flex: 1, background: theme.bg, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{data.visits}</div>
              <div style={{ fontSize: 7, color: theme.t3 }}>Visits</div>
            </div>
          )}
          {data.rewardsEarned != null && (
            <div style={{ flex: 1, background: theme.greenBg, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.green }}>{data.rewardsEarned}</div>
              <div style={{ fontSize: 7, color: theme.t3 }}>Rewards</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
