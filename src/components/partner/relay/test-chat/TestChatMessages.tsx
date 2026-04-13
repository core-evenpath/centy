'use client';

import { useEffect, useRef } from 'react';
import BlockRenderer from '@/components/relay/blocks/BlockRenderer';
import type { RelayBlock } from '@/components/relay/blocks/BlockRenderer';
import type { RelayTheme, BlockCallbacks } from '@/components/relay/blocks/types';
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
  block?: RelayBlock;
  type?: string;
}

// ── Scrollable message list ──────────────────────────────────────────
//
// Composes BotBubble + BlockRenderer + UserBubble + SuggestionChips +
// TypingIndicator + EmptyChat.

export default function TestChatMessages({
  messages,
  sending,
  theme,
  brandName,
  brandEmoji,
  tagline,
  callbacks,
  onSend,
}: {
  messages: TestChatMessage[];
  sending: boolean;
  theme: RelayTheme;
  brandName: string;
  brandEmoji?: string;
  tagline?: string;
  callbacks: BlockCallbacks;
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

            const block = msg.block;
            const isTextOnly = !block || block.type === 'text';
            const followUps =
              block && 'suggestions' in block && Array.isArray((block as { suggestions?: unknown }).suggestions)
                ? ((block as { suggestions?: string[] }).suggestions as string[])
                : undefined;

            // Guard: if the assistant text looks like stringified JSON
            // (upstream parse or token-truncation miss), hide it rather
            // than dumping a JSON blob into the bubble.
            const safeText = looksLikeJson(msg.content) ? '' : msg.content;

            return (
              <div key={i}>
                {isTextOnly ? (
                  <BotBubble
                    text={safeText || "I'm here to help — what would you like to know?"}
                    emoji={brandEmoji}
                    theme={theme}
                  />
                ) : (
                  <BotBubble text={safeText || undefined} emoji={brandEmoji} theme={theme}>
                    <BlockRenderer block={block as RelayBlock} theme={theme} callbacks={callbacks} />
                  </BotBubble>
                )}
                {followUps && followUps.length > 0 && (
                  <SuggestionChips chips={followUps} onTap={onSend} theme={theme} />
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
// as stringified JSON we should not display verbatim. The server should
// have parsed it already, so a raw blob here means parsing failed
// upstream.
function looksLikeJson(text: string | undefined): boolean {
  if (!text) return false;
  const t = text.trim();
  if (!t) return false;
  const first = t[0];
  return first === '{' || first === '[';
}
