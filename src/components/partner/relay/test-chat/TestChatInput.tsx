'use client';

import { useState, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';

// ── Pill input + circular send FAB ───────────────────────────────────

export default function TestChatInput({
  theme,
  disabled,
  onSend,
}: {
  theme: RelayTheme;
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState('');

  function submit() {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue('');
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        padding: '10px 14px',
        borderTop: `1px solid ${theme.bdrL}`,
        background: theme.surface,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask anything..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: theme.bg,
            borderRadius: 9999,
            border: `1px solid ${theme.bdrL}`,
            fontSize: 13,
            color: theme.text,
            outline: 'none',
          }}
        />
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: theme.accent,
            border: 'none',
            color: '#fff',
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: canSend ? 1 : 0.45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'opacity 120ms ease',
          }}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
