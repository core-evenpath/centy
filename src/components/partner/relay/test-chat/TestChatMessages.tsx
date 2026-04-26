'use client';

import { useEffect, useRef } from 'react';
import type { BlockCallbacks, RelayTheme } from '@/components/relay/blocks/types';
import TestChatBlockPreview from './TestChatBlockPreview';
import {
  BotBubble,
  UserBubble,
  TypingIndicator,
  SuggestionChips,
  EmptyChat,
} from './TestChatBubbles';

export interface TestChatMessage {
  role: 'user' | 'assistant';
  content: string;
  blockId?: string;
  blockData?: Record<string, unknown>;
  suggestions?: string[];
  /** Flow stage that produced this message (surfaced for debugging). */
  stageId?: string;
  /** Phase 3C: true when the block is rendering its internal sample
   * data because the partner has no real items for this content type
   * yet. Test-chat shows a "Sample data" badge above the block. */
  isSample?: boolean;
}

// ── Scrollable message list ──────────────────────────────────────────
//
// Composes BotBubble + TestChatBlockPreview (admin preview dispatcher)
// + UserBubble + SuggestionChips + TypingIndicator + EmptyChat.
//
// The assistant's response has an optional `blockId` pointing at an
// admin preview component (e.g. `ecom_cart`, `greeting`). If present we
// render the preview inside the bot bubble; otherwise the bubble shows
// plain text only.

export default function TestChatMessages({
  messages,
  sending,
  theme,
  brandName,
  brandEmoji,
  tagline,
  onSend,
  callbacks,
}: {
  messages: TestChatMessage[];
  sending: boolean;
  theme: RelayTheme;
  brandName: string;
  brandEmoji?: string;
  tagline?: string;
  onSend: (text: string) => void;
  /**
   * Passed straight into `TestChatBlockPreview` — commerce blocks fire
   * these when users interact. Undefined falls through to the
   * admin-preview (design-only) path.
   */
  callbacks?: BlockCallbacks;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  const showEmpty = messages.length === 0;

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: showEmpty ? 0 : '16px 14px 8px',
        background: theme.bg,
      }}
    >
      {showEmpty ? (
        <EmptyChat
          brandName={brandName || 'Relay'}
          tagline={tagline}
          emoji={brandEmoji}
          theme={theme}
          suggestions={['What do you offer?', 'Show me your services', 'How to reach you?']}
          onSuggestionTap={onSend}
        />
      ) : (
        <>
          {messages.map((msg, i) => {
            if (msg.role === 'user') {
              return <UserBubble key={i} text={msg.content} theme={theme} />;
            }

            // Guard: if the assistant text looks like stringified JSON
            // (upstream parse miss), hide it rather than dumping a JSON
            // blob into the bubble.
            const safeText = looksLikeJson(msg.content) ? '' : msg.content;
            const hasBlock = !!msg.blockId;

            return (
              <div key={i}>
                {hasBlock ? (
                  <BotBubble text={safeText || undefined} emoji={brandEmoji} theme={theme}>
                    {msg.isSample && <SampleDataBadge theme={theme} />}
                    <TestChatBlockPreview
                      blockId={msg.blockId!}
                      blockData={msg.blockData}
                      theme={theme}
                      callbacks={callbacks}
                    />
                  </BotBubble>
                ) : (
                  <BotBubble
                    text={safeText || "I'm here to help — what would you like to know?"}
                    emoji={brandEmoji}
                    theme={theme}
                  />
                )}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <SuggestionChips chips={msg.suggestions} onTap={onSend} theme={theme} />
                )}
              </div>
            );
          })}
          {sending && <TypingIndicator emoji={brandEmoji} theme={theme} />}
          <div ref={endRef} />
        </>
      )}
    </div>
  );
}

// Heuristic: treat anything that starts with `{` / `[` (after trimming)
// as stringified JSON we should not display verbatim.
function looksLikeJson(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;
  const first = t[0];
  return first === '{' || first === '[';
}

// ── Sample-data badge (Phase 3C) ────────────────────────────────────
//
// Pinned above the block when the partner has no real data for it
// yet — keeps it obvious that what's rendered is placeholder, not
// their content. Test-chat-only; production never shows this.
function SampleDataBadge({ theme }: { theme: RelayTheme }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        background: 'rgba(217, 119, 6, 0.10)',
        color: '#92400e',
        border: '1px solid rgba(217, 119, 6, 0.30)',
      }}
      title="No real items yet — this block is rendering with sample placeholder data."
    >
      <span aria-hidden style={{ fontSize: 10 }}>•</span>
      Sample data
      <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.8, color: theme.t3 }}>
        — add yours to make it live
      </span>
    </div>
  );
}
