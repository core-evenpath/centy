'use client';

import React from 'react';
import type { Engine } from '@/lib/relay/engine-types';
import { ENGINES } from '@/lib/relay/engine-types';

// Engine display metadata. Keys match the canonical `ENGINES` tuple.
// Booking is the only fully-activated tab in Phase 1; the rest are
// placeholders until Phase 2 ships their per-engine milestones.
const ENGINE_META: Record<Engine, { label: string; emoji: string }> = {
  commerce: { label: 'Commerce', emoji: '🛍️' },
  booking: { label: 'Booking', emoji: '📅' },
  lead: { label: 'Lead', emoji: '🎯' },
  engagement: { label: 'Engagement', emoji: '💝' },
  info: { label: 'Info', emoji: 'ℹ️' },
  service: { label: 'Service', emoji: '🔧' },
};

// Engines that have full tab content in Phase 1. Everything else shows
// the 'Coming soon' placeholder.
export const ACTIVATED_ENGINES: ReadonlySet<Engine> = new Set(['booking']);

interface Props {
  active: Engine;
  onChange: (engine: Engine) => void;
}

export function EngineTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Engine selector"
      style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #e8e4dc',
        paddingBottom: '0',
        marginBottom: '16px',
        overflowX: 'auto',
      }}
    >
      {ENGINES.map((engine) => {
        const isActive = active === engine;
        const meta = ENGINE_META[engine];
        const activated = ACTIVATED_ENGINES.has(engine);
        return (
          <button
            key={engine}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(engine)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: isActive ? '#1a1a18' : '#7a7a70',
              fontWeight: isActive ? 600 : 500,
              fontSize: '13px',
              borderBottom: isActive ? '2px solid #2d4a3e' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              opacity: activated ? 1 : 0.65,
            }}
            title={activated ? undefined : `${meta.label} engine — coming in Phase 2`}
          >
            <span aria-hidden>{meta.emoji}</span>
            <span>{meta.label}</span>
            {!activated && (
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background: '#e8e4dc',
                  color: '#7a7a70',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                soon
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { ENGINE_META };
