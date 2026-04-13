'use client';

import type { ReactNode } from 'react';
import type { RelayTheme } from '@/components/relay/blocks/types';

// ── Bot avatar ───────────────────────────────────────────────────────

export function BotAvatar({
  emoji,
  theme,
}: {
  emoji?: string;
  theme: RelayTheme;
}) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 9999,
        flexShrink: 0,
        background: theme.accentBg2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: theme.accent,
      }}
    >
      {emoji || '🤖'}
    </div>
  );
}

// ── Bot bubble (text + optional children for block previews) ─────────

export function BotBubble({
  text,
  emoji,
  theme,
  children,
}: {
  text?: string;
  emoji?: string;
  theme: RelayTheme;
  children?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
      <BotAvatar emoji={emoji} theme={theme} />
      <div style={{ maxWidth: 'calc(100% - 40px)', width: children ? '100%' : 'auto' }}>
        {text && (
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.bdrL}`,
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: theme.text,
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </div>
        )}
        {children && <div style={{ marginTop: text ? 8 : 0 }}>{children}</div>}
      </div>
    </div>
  );
}

// ── User bubble ──────────────────────────────────────────────────────

export function UserBubble({ text, theme }: { text: string; theme: RelayTheme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <div
        style={{
          maxWidth: '80%',
          background: theme.accent,
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '16px 16px 4px 16px',
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────

export function TypingIndicator({
  emoji,
  theme,
}: {
  emoji?: string;
  theme: RelayTheme;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
      <BotAvatar emoji={emoji} theme={theme} />
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.bdrL}`,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          gap: 4,
        }}
      >
        {[0, 0.15, 0.3].map((d) => (
          <span
            key={d}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: theme.t4,
              animation: `testChatPulse 1s infinite ${d}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Suggestion chips ─────────────────────────────────────────────────

export function SuggestionChips({
  chips,
  onTap,
  theme,
}: {
  chips: string[];
  onTap: (chip: string) => void;
  theme: RelayTheme;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 12,
        marginLeft: 36,
      }}
    >
      {chips.map((s) => (
        <button
          key={s}
          onClick={() => onTap(s)}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: theme.accent,
            background: theme.accentBg,
            border: `1px solid ${theme.accentBg2}`,
            padding: '6px 14px',
            borderRadius: 9999,
            cursor: 'pointer',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────

export function EmptyChat({
  brandName,
  tagline,
  emoji,
  theme,
  suggestions,
  onSuggestionTap,
}: {
  brandName: string;
  tagline?: string;
  emoji?: string;
  theme: RelayTheme;
  suggestions: string[];
  onSuggestionTap: (s: string) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: theme.accentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        {emoji || '✨'}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
          {brandName}
        </div>
        {tagline && (
          <div style={{ fontSize: 12, color: theme.t3, lineHeight: 1.5 }}>{tagline}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 260 }}>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionTap(s)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: `1px solid ${theme.bdrL}`,
              background: theme.surface,
              fontSize: 12,
              fontWeight: 500,
              color: theme.t2,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
