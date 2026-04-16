'use client';

// ── "Live now" expandable row ─────────────────────────────────────────
//
// Expanded state renders `LiveNowPreview`. Collapsed state shows an
// item count or "automatic" badge and the source label.

import { Icon } from '../inline-icon';
import { theme } from '../../constants';
import LiveNowPreview from './live-now-preview';
import type { MappedFeature } from '../../types';

interface Props {
  feature: MappedFeature;
  isActive: boolean;
  onToggle: () => void;
}

function buildSubLabel(f: MappedFeature): string {
  const primary = f.items > 0 ? `${f.items} items` : f.auto ? 'Automatic' : 'Connected';
  const sourceKind = f.source?.startsWith('module:')
    ? f.source.slice('module:'.length)
    : f.source === 'profile' || f.auto
      ? 'profile'
      : f.source;
  return sourceKind ? `${primary} · ${sourceKind}` : primary;
}

export default function LiveNowItem({ feature, isActive, onToggle }: Props) {
  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${isActive ? theme.greenBdr2 : theme.greenBdr}`,
        background: isActive ? '#fff' : theme.greenBg,
        marginBottom: 6,
        overflow: 'hidden',
        transition: 'border-color 0.18s',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'rgba(22,163,74,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={feature.icon} size={12} color={theme.green} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              color: theme.t1,
              lineHeight: 1.3,
            }}
          >
            {feature.customer}
          </div>
          <div style={{ fontSize: 9.5, color: theme.green, marginTop: 2 }}>
            {buildSubLabel(feature)}
          </div>
        </div>
        <Icon
          name={isActive ? 'chevronUp' : 'chevronDown'}
          size={14}
          color={theme.t4}
        />
      </button>

      {isActive && (
        <div style={{ padding: '0 12px 14px' }}>
          <div style={{ height: 1, background: theme.greenBdr, marginBottom: 12 }} />
          <LiveNowPreview feature={feature} />
        </div>
      )}
    </div>
  );
}
