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

            return (
              <div key={i}>
                {isTextOnly ? (
                  <BotBubble text={msg.content} emoji={brandEmoji} theme={theme} />
                ) : (
                  <BotBubble text={msg.content || undefined} emoji={brandEmoji} theme={theme}>
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
