'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { BlockTheme } from '@/lib/relay/types';
import type { RelaySessionCache } from '@/lib/relay/session-cache';
import { classifyIntent } from '@/lib/relay/intent-engine';
import { resolveBlock } from '@/lib/relay/block-resolver';
import { generateRelayResponseAction, generateRelayResponseWithDocsAction } from '@/actions/relay-rag-actions';
import type { ConversationMessage } from '@/lib/relay/rag-context-builder';
import type { BlockCallbacks } from './blocks/types';
import type { RelayChatMessage } from './chat-message-types';
import RegisteredBlock from './RegisteredBlock';

type ChatMessage = RelayChatMessage;

interface ChatInterfaceProps {
  cache: RelaySessionCache;
  theme: BlockTheme;
  partnerId: string;
  conversationId?: string;
  callbacks?: BlockCallbacks;
  onSendMessage?: (message: string) => void;
  /**
   * Optional parent-injected message. Each time the `id` changes (and
   * hasn't been seen before) it's appended to the local message list —
   * used by the checkout flow to surface order confirmations.
   */
  injectMessage?: ChatMessage | null;
}

export default function ChatInterface({
  cache,
  theme,
  partnerId,
  injectMessage,
}: ChatInterfaceProps) {
  // `conversationId` and `callbacks` are accepted for parent-driven
  // session wiring; this widget renders messages as plain text bubbles
  // (block previews removed) so they're not consumed locally yet —
  // forwarded by the parent (RelayWidget) to the home-screen renderer.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenInjectedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parent-driven message injection (e.g. order confirmation after
  // checkout). Dedup by id so the same message can't accidentally be
  // appended twice if the parent re-renders.
  useEffect(() => {
    if (!injectMessage) return;
    if (seenInjectedIds.current.has(injectMessage.id)) return;
    seenInjectedIds.current.add(injectMessage.id);
    setMessages((prev) => [...prev, injectMessage]);
  }, [injectMessage]);

  async function handleSend(text?: string) {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'customer',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const intent = classifyIntent(messageText, cache);
    const blockResolution = resolveBlock(intent, cache);

    if (blockResolution.blockId) {
      const blockMsg: ChatMessage = {
        id: `block_${Date.now()}`,
        role: 'assistant',
        text: '',
        block: blockResolution,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, blockMsg]);
    }

    const history: ConversationMessage[] = messages.slice(-6).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    let ragResponse;
    if (intent.type === 'general' && cache.hasRag()) {
      ragResponse = await generateRelayResponseWithDocsAction(
        partnerId,
        messageText,
        history
      );
    } else {
      ragResponse = await generateRelayResponseAction(
        partnerId,
        messageText,
        blockResolution,
        history,
        intent.type
      );
    }

    if (ragResponse.success && ragResponse.reply) {
      const textMsg: ChatMessage = {
        id: `text_${Date.now()}`,
        role: 'assistant',
        text: ragResponse.reply,
        followUps: ragResponse.followUps,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev];
        const lastBlockIdx = updated.findLastIndex(
          (m) => m.role === 'assistant' && m.block && !m.text
        );
        if (lastBlockIdx >= 0) {
          updated[lastBlockIdx] = {
            ...updated[lastBlockIdx],
            text: ragResponse.reply,
            followUps: ragResponse.followUps,
          };
          return updated;
        }
        return [...updated, textMsg];
      });
    } else if (!blockResolution.blockId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `fallback_${Date.now()}`,
          role: 'assistant',
          text: 'I\'m here to help! Could you tell me more about what you\'re looking for?',
          followUps: ['Show me products', 'Contact support', 'Track my order'],
          timestamp: Date.now(),
        },
      ]);
    }

    setLoading(false);
  }

  function handleChipTap(text: string) {
    handleSend(text);
  }

  const S = {
    container: { display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' },
    messageArea: { flex: 1, overflowY: 'auto' as const, padding: '12px', display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    customerBubble: { alignSelf: 'flex-end' as const, maxWidth: '80%', padding: '8px 12px', borderRadius: '12px 12px 2px 12px', background: theme.accent, color: '#fff', fontSize: '13px', lineHeight: 1.5 },
    assistantBubble: { alignSelf: 'flex-start' as const, maxWidth: '90%', fontSize: '13px', lineHeight: 1.5, color: theme.t2 },
    assistantText: { padding: '8px 12px', background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: '12px 12px 12px 2px' },
    chipRow: { display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginTop: '6px' },
    chip: { padding: '5px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 500, background: theme.accentBg, color: theme.accent, border: `1px solid ${theme.accentBg2}`, cursor: 'pointer' },
    inputBar: { display: 'flex', gap: '8px', padding: '10px 12px', borderTop: `1px solid ${theme.bdr}`, background: theme.surface },
    inputField: { flex: 1, padding: '8px 12px', borderRadius: '9999px', border: `1px solid ${theme.bdr}`, fontSize: '13px', outline: 'none', background: theme.bg, color: theme.t1 },
    sendBtn: { width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  };

  return (
    <div style={S.container}>
      <div style={S.messageArea}>
        {messages.map((msg) => {
          if (msg.role === 'customer') {
            return <div key={msg.id} style={S.customerBubble}>{msg.text}</div>;
          }

          return (
            <div key={msg.id} style={S.assistantBubble}>
              {/* Registry-driven block render (e.g. order confirmation
                  injected by the parent widget after checkout). Falls
                  back silently to text + suggestions when no block id
                  is supplied on the message. */}
              {msg.blockId && (
                <div style={{ marginBottom: 6 }}>
                  <RegisteredBlock
                    blockId={msg.blockId}
                    data={msg.blockData}
                    theme={theme}
                  />
                </div>
              )}
              {msg.text && <div style={S.assistantText}>{msg.text}</div>}
              {msg.followUps && msg.followUps.length > 0 && (
                <div style={S.chipRow}>
                  {msg.followUps.map((chip) => (
                    <span key={chip} style={S.chip} onClick={() => handleChipTap(chip)}>
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 12px', color: theme.t4, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Loader2 size={14} className="animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={S.inputBar}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask anything..."
          style={S.inputField}
          disabled={loading}
        />
        <button onClick={() => handleSend()} style={{ ...S.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }} disabled={loading || !input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
