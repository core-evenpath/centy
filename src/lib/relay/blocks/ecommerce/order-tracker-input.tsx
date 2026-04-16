'use client';

// ── OrderTrackerInput ───────────────────────────────────────────────────
//
// Rendered by `OrderTrackerLive` when the chat resolves the
// `order_status` intent without an explicit order id (i.e. the visitor
// said "track my order" without quoting an id). Collects a single
// id from the user and hands it up so the parent can fetch.

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { BlockTheme } from '../../types';
import { normalizeOrderIdInput } from '../../order-id-parser';

interface Props {
  theme: BlockTheme;
  onSubmit: (orderId: string) => void;
}

export default function OrderTrackerInput({ theme, onSubmit }: Props) {
  const [raw, setRaw] = useState('');

  const normalized = normalizeOrderIdInput(raw);
  const canSubmit = !!normalized;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized) return;
    onSubmit(normalized);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 14,
        background: theme.surface,
        border: `1px solid ${theme.bdr}`,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: theme.t1,
          marginBottom: 4,
        }}
      >
        Track your order
      </div>
      <div style={{ fontSize: 11, color: theme.t3, marginBottom: 10 }}>
        Enter your order id (e.g. <code>ORD-ABC123</code>) and we&apos;ll pull
        up the latest status.
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="ORD-ABC123"
          spellCheck={false}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            borderRadius: 8,
            border: `1px solid ${theme.bdr}`,
            background: theme.bg,
            color: theme.t1,
            outline: 'none',
            textTransform: 'uppercase',
          }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background: canSubmit ? theme.accent : theme.bdr,
            color: canSubmit ? '#fff' : theme.t3,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Track
          <ArrowRight size={12} />
        </button>
      </div>
    </form>
  );
}
