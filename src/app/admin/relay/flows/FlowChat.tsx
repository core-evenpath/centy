'use client';

import { useEffect, useRef } from 'react';
import { T } from './flow-helpers';
import type { FlowMessage } from './flow-conversation';
import { BotBubble, UserBubble, StageDivider, TypingIndicator, SuggestionChips } from './FlowChatBubbles';

interface Props {
  messages: FlowMessage[];
  isTyping: boolean;
  accentColor?: string;
  onSuggestionTap?: (chip: string) => void;
}

export default function FlowChat({ messages, isTyping, accentColor, onSuggestionTap }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: 14, background: T.bg,
      display: 'flex', flexDirection: 'column',
      scrollbarWidth: 'none',
    }}>
      {messages.map((m) => {
        if (m.type === 'stage-divider') {
          return <StageDivider key={m.id} label={m.text || ''} stageType={m.stage || ''} />;
        }

        if (m.type === 'user') {
          return <UserBubble key={m.id} text={m.text || ''} color={accentColor} />;
        }

        if (m.type === 'bot') {
          return (
            <div key={m.id}>
              <BotBubble text={m.text}>
                {m.blockPreviews && m.blockPreviews.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {m.blockPreviews.map((Preview, i) => (
                      <div key={i} style={{ transform: 'scale(0.97)', transformOrigin: 'top left' }}>
                        <Preview />
                      </div>
                    ))}
                  </div>
                )}
              </BotBubble>
              {m.suggestions && m.suggestions.length > 0 && (
                <SuggestionChips chips={m.suggestions} onTap={onSuggestionTap} />
              )}
            </div>
          );
        }

        return null;
      })}

      {isTyping && <TypingIndicator />}
      <div ref={endRef} />
    </div>
  );
}
