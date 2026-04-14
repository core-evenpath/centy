'use client';

import { useEffect, useRef } from 'react';
import type { RelayTheme } from '@/components/relay/blocks/types';
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
}: {
  messages: TestChatMessage[];
  sending: boolean;
  theme: RelayTheme;
  brandName: string;
  brandEmoji?: string;
  tagline?: string;
  onSend: (text: string) => void;
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
                    <TestChatBlockPreview blockId={msg.blockId!} blockData={msg.blockData} />
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
