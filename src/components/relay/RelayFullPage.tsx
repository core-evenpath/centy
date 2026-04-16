'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RelayConfig } from '@/actions/relay-actions';
import TestChatBlockPreview from '@/components/partner/relay/test-chat/TestChatBlockPreview';
import { DEFAULT_THEME } from '@/components/relay/blocks/types';
import type { RelayTheme } from '@/components/relay/blocks/types';
import { Send, Loader2 } from 'lucide-react';
import { useRelaySession } from '@/hooks/useRelaySession';

interface RelayFullPageProps {
  partnerId: string;
  config: RelayConfig;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  blockId?: string;
  blockData?: Record<string, unknown>;
  suggestions?: string[];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

function buildTheme(accent: string): RelayTheme {
  const [r, g, b] = hexToRgb(accent);
  return {
    ...DEFAULT_THEME,
    accent,
    accentHi: rgbToHex(r + 30, g + 30, b + 30),
    accentDk: rgbToHex(r - 25, g - 25, b - 25),
    accentBg: `rgba(${r},${g},${b},0.06)`,
    accentBg2: `rgba(${r},${g},${b},0.13)`,
  };
}

export default function RelayFullPage({ partnerId, config }: RelayFullPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId] = useState(() => `relay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const theme = useMemo(() => buildTheme(config.accentColor || '#6366f1'), [config.accentColor]);

  // Instantiate the runtime cart/booking session for this conversation.
  // The admin-preview blocks rendered by `TestChatBlockPreview` don't yet
  // accept callbacks, so cart mutations are not wired through them — but
  // the session document is live, ready for the production widget that
  // does drive `BlockRenderer` directly (see RelayWidget).
  useRelaySession({ conversationId, partnerId });

  useEffect(() => {
    if (config.welcomeMessage) {
      setMessages([{
        role: 'assistant',
        content: config.welcomeMessage,
        suggestions: ['What do you offer?', 'Show me your services', 'How to reach you?'],
      }]);
    }
  }, [config.welcomeMessage]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/relay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          conversationId,
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.success && data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response.text || '',
          blockId: typeof data.response.blockId === 'string' ? data.response.blockId : undefined,
          blockData: data.response.blockData && typeof data.response.blockData === 'object'
            ? data.response.blockData
            : undefined,
          suggestions: Array.isArray(data.response.suggestions) ? data.response.suggestions : undefined,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen w-screen" style={{ backgroundColor: theme.bg }}>
      <header
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ backgroundColor: '#fff', borderColor: theme.bdrL }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: theme.accentBg2 }}
        >
          {config.brandEmoji || '💬'}
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-sm truncate" style={{ color: theme.text }}>
            {config.brandName || 'Chat'}
          </h1>
          {config.tagline && (
            <p className="text-xs truncate" style={{ color: theme.t3 }}>
              {config.tagline}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex gap-2 justify-end">
                <div
                  className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-white"
                  style={{ backgroundColor: theme.accent }}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 justify-start">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-sm"
                  style={{ backgroundColor: theme.accentBg2 }}
                >
                  {config.brandEmoji || '💬'}
                </div>
                <div className="max-w-[90%] space-y-2">
                  {msg.content && (
                    <div
                      className="rounded-lg px-3 py-2 text-sm bg-white border"
                      style={{ borderColor: theme.bdrL }}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                  {msg.blockId && <TestChatBlockPreview blockId={msg.blockId} blockData={msg.blockData} />}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {msg.suggestions.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => sendMessage(s)}
                          className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                          style={{
                            borderColor: theme.accent,
                            color: theme.accent,
                            backgroundColor: '#fff',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm"
              style={{ backgroundColor: theme.accentBg2 }}
            >
              {config.brandEmoji || '💬'}
            </div>
            <div className="rounded-lg px-4 py-3 bg-white border" style={{ borderColor: theme.bdrL }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.t4, animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.t4, animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.t4, animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="px-4 py-3 border-t shrink-0" style={{ backgroundColor: '#fff', borderColor: theme.bdrL }}>
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-offset-0"
            style={{ borderColor: theme.bdr, focusRingColor: theme.accent } as React.CSSProperties}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className="rounded-full w-10 h-10 flex items-center justify-center text-white shrink-0 disabled:opacity-50"
            style={{ backgroundColor: theme.accent }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <footer className="text-center py-2 shrink-0" style={{ backgroundColor: '#fff' }}>
        <a
          href="https://pingbox.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline"
          style={{ color: theme.t4 }}
        >
          Powered by Pingbox
        </a>
      </footer>
    </div>
  );
}
