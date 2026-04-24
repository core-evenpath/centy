'use client';

import type { BlockTag } from '@/lib/relay/engine-types';

// ── Engine chips ────────────────────────────────────────────────────
//
// Tiny presentational component for the engine-tag row on module
// cards and (eventually) block cards. Centralises the colour map so
// every surface agrees on what "booking" looks like.

const ENGINE_COLORS: Record<string, { bg: string; text: string }> = {
  booking: { bg: '#dbeafe', text: '#1e40af' },
  commerce: { bg: '#dcfce7', text: '#166534' },
  lead: { bg: '#fef3c7', text: '#92400e' },
  engagement: { bg: '#fce7f3', text: '#9f1239' },
  info: { bg: '#e0e7ff', text: '#3730a3' },
  service: { bg: '#f3e8ff', text: '#6b21a8' },
  shared: { bg: '#f1f5f9', text: '#475569' },
};

const ENGINE_LABELS: Record<string, string> = {
  booking: 'Booking',
  commerce: 'Commerce',
  lead: 'Lead',
  engagement: 'Engagement',
  info: 'Info',
  service: 'Service',
  shared: 'Shared',
};

interface Props {
  engines?: BlockTag[];
  /** Optional empty-state label when engines is missing / empty. */
  emptyLabel?: string;
}

export default function EngineChips({ engines, emptyLabel }: Props) {
  if (!engines || engines.length === 0) {
    if (!emptyLabel) return null;
    return (
      <span className="text-[11px] text-muted-foreground italic">{emptyLabel}</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {engines.map((engine) => {
        const color = ENGINE_COLORS[engine] ?? ENGINE_COLORS.shared;
        const label = ENGINE_LABELS[engine] ?? engine;
        return (
          <span
            key={engine}
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: color.bg, color: color.text }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
