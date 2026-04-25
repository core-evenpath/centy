'use client';

import React from 'react';
import type { Engine } from '@/lib/relay/engine-types';
import { ENGINES } from '@/lib/relay/engine-types';

// Tab display metadata. Keys match the canonical `ENGINES` tuple, but
// labels are reframed as **transaction flows** (PR fix-13): the verb
// the user actually asks ("buy", "book", "engage") not the internal
// engine name. Engine slugs stay for routing/backwards-compat.
const ENGINE_META: Record<Engine, { label: string; emoji: string }> = {
  commerce: { label: 'Buying', emoji: '🛒' },
  booking: { label: 'Booking', emoji: '📅' },
  lead: { label: 'Lead', emoji: '🎯' },
  engagement: { label: 'Engaging', emoji: '💬' },
  info: { label: 'Info', emoji: 'ℹ️' },
  service: { label: 'Service', emoji: '🔧' },
};

// Engines that have full tab content. All 5 primary engines active.
// Service stays overlay-only. Booking/Commerce/Lead/Engagement shipped
// Phase 1 M08 + Phase 2 commerce/lead/engagement.M04; Info in Phase 2
// info.M04.
export const ACTIVATED_ENGINES: ReadonlySet<Engine> = new Set(['booking', 'commerce', 'lead', 'engagement', 'info']);

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
            title={activated ? undefined : `${meta.label} flow — coming in Phase 2`}
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
