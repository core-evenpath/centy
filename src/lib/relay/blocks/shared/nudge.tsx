'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Info, ChevronRight } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'shared_nudge',
  family: 'shared',
  label: 'Smart Nudge',
  description: 'Contextual inline prompt with optional action button',
  applicableCategories: ['ecommerce', 'retail', 'fashion', 'd2c', 'beauty', 'hospitality', 'real_estate', 'healthcare', 'services'],
  intentTriggers: {
    keywords: [],
    queryPatterns: [],
    dataConditions: ['has_nudge_context'],
  },
  dataContract: {
    required: [
      { field: 'text', type: 'text', label: 'Nudge Text' },
    ],
    optional: [
      { field: 'actionLabel', type: 'text', label: 'Action Label' },
      { field: 'iconName', type: 'text', label: 'Icon Name' },
      { field: 'colorVariant', type: 'select', label: 'Color Variant', options: ['default', 'green', 'amber', 'red'] },
    ],
  },
  variants: ['default', 'green', 'amber', 'red'],
  sampleData: {
    text: '2 items in your bag worth ₹7,000. Free shipping above ₹999!',
    actionLabel: 'View bag',
    colorVariant: 'default',
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 60,
};

export default function NudgeBlock({ data, theme, variant }: BlockComponentProps) {
  const colorKey = data.colorVariant || variant || 'default';

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    default: { bg: theme.accentBg, border: theme.accentBg2, text: theme.accent, icon: theme.accent },
    green: { bg: theme.greenBg, border: theme.greenBdr, text: theme.green, icon: theme.green },
    amber: { bg: theme.amberBg, border: theme.amberBg, text: theme.amber, icon: theme.amber },
    red: { bg: theme.redBg, border: theme.redBg, text: theme.red, icon: theme.red },
  };

  const colors = colorMap[colorKey] || colorMap.default;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '10px',
    }}>
      <Info size={14} color={colors.icon} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '11px', color: theme.t1, lineHeight: 1.4 }}>{data.text}</div>
      {data.actionLabel && (
        <div style={{
          padding: '5px 10px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          background: theme.surface,
          fontSize: '10px',
          fontWeight: 600,
          color: colors.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          flexShrink: 0,
          whiteSpace: 'nowrap' as const,
        }}>
          {data.actionLabel}
          <ChevronRight size={10} />
        </div>
      )}
    </div>
  );
}
