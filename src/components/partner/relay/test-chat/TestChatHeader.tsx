'use client';

import { Radio, Trash2 } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';

// ── In-frame header ──────────────────────────────────────────────────
//
// Brand avatar + brand name on the left, optional "Test Chat" pill and
// a subtle clear button on the right.

export default function TestChatHeader({
  brandName,
  brandEmoji,
  theme,
  canClear,
  onClear,
}: {
  brandName: string;
  brandEmoji?: string;
  theme: RelayTheme;
  canClear: boolean;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme.surface,
        borderBottom: `1px solid ${theme.bdrL}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: theme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
          }}
        >
          {brandEmoji ? brandEmoji : <Radio size={14} strokeWidth={2.5} />}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, lineHeight: 1.2 }}>
            {brandName || 'Relay'}
          </div>
          <div style={{ fontSize: 10, color: theme.t3, marginTop: 2 }}>Test Chat</div>
        </div>
      </div>
      {canClear && (
        <button
          onClick={onClear}
          aria-label="Clear chat"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            background: 'transparent',
            border: `1px solid ${theme.bdrL}`,
            borderRadius: 9999,
            color: theme.t3,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={12} /> Clear
        </button>
      )}
    </div>
  );
}
