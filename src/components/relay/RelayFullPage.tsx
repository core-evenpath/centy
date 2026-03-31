'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { RelayConfig } from '@/actions/relay-actions';
import { getRelayStorefrontDataAction } from '@/actions/relay-storefront-actions';
import type { RelayStorefrontData } from '@/actions/relay-storefront-actions';
import BlockRenderer from '@/components/relay/blocks/BlockRenderer';
import type { RelayBlock } from '@/components/relay/blocks/BlockRenderer';
import { DEFAULT_THEME } from '@/components/relay/blocks/types';
import type { RelayTheme, BlockCallbacks } from '@/components/relay/blocks/types';
import {
  BotBubble, UserBubble, Divider, ModuleBar,
  ChatHeader, ChatInputBar, TypingIndicator, RELAY_KEYFRAMES,
} from '@/components/relay/primitives';
import RelayBentoGrid from '@/components/relay/RelayBentoGrid';

interface RelayFullPageProps {
  partnerId: string;
  config: RelayConfig;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  block?: RelayBlock;
  type?: string;
  divider?: string;
}

const STAGE_LABELS: Record<string, string> = {
  greeting: 'Welcome',
  discovery: 'Exploring',
  qualification: 'Qualifying',
  presentation: 'Presenting',
  action: 'Converting',
  handoff: 'Team Connect',
};

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
  const [view, setView] = useState<'bento' | 'chat'>('bento');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [stage, setStage] = useState('greeting');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [storefrontData, setStorefrontData] = useState<RelayStorefrontData | null>(null);
  const [storefrontLoading, setStorefrontLoading] = useState(true);
  const [conversationId] = useState(() => `relay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const theme = useMemo(() => buildTheme(config.accentColor || '#6366f1'), [config.accentColor]);

  useEffect(() => {
    (async () => {
      try {
        const result = await getRelayStorefrontDataAction(partnerId);
        if (result.success && result.data) {
          setStorefrontData(result.data);
        }
      } catch (e) {
        console.error('Failed to load storefront data:', e);
      } finally {
        setStorefrontLoading(false);
      }
    })();
  }, [partnerId]);

  const stageLabels = useMemo(() => {
    if (!storefrontData?.flowDefinition?.stages) return STAGE_LABELS;
    const custom: Record<string, string> = { ...STAGE_LABELS };
    storefrontData.flowDefinition.stages.forEach(s => {
      custom[s.type || s.id] = s.label;
    });
    return custom;
  }, [storefrontData]);

  const moduleBarItems = useMemo(() => {
    if (!storefrontData?.modules) return [];
    return storefrontData.modules.map(m => ({ id: m.slug, label: m.name }));
  }, [storefrontData]);

  const buildInitialSuggestions = (): string[] => {
    if (storefrontData?.modules && storefrontData.modules.length > 0) {
      const suggestions = ['What do you offer?'];
      const first = storefrontData.modules[0];
      if (first) suggestions.push(first.name);
      suggestions.push('How to reach you?');
      return suggestions;
    }
    return ['Tell me about your business', 'How to reach you?', 'What services do you provide?'];
  };

  const updateStageFromResponse = (response: { type?: string; suggestions?: string[] }) => {
    if (response.type === 'greeting' || response.type === 'welcome') setStage('greeting');
    else if (response.type === 'catalog' || response.type === 'services' || response.type === 'menu') setStage('presentation');
    else if (response.type === 'book' || response.type === 'appointment' || response.type === 'lead_capture') setStage('action');
    else if (response.type === 'handoff' || response.type === 'connect') setStage('handoff');
    else if (response.type === 'info' || response.type === 'faq') setStage('discovery');
    else if (response.suggestions && response.suggestions.length > 0) setStage('discovery');
  };

  const sendToApi = async (allMessages: ChatMessage[]) => {
    setSending(true);
    try {
      const res = await fetch('/api/relay/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          conversationId,
          messages: allMessages
            .filter(m => !m.divider)
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.success && data.response) {
        const botMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: data.response.text || '',
          block: data.response as RelayBlock,
          type: data.response.type,
        };
        setMessages(prev => [...prev, botMsg]);
        updateStageFromResponse(data.response);
      } else {
        setMessages(prev => [...prev, {
          id: uid(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: uid(),
        role: 'assistant',
        content: 'Connection error. Please try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  const enterChat = (moduleSlug: string | null) => {
    setView('chat');
    setActiveModule(moduleSlug);

    if (moduleSlug) {
      const mod = storefrontData?.modules.find(m => m.slug === moduleSlug);
      const moduleName = mod?.name || moduleSlug;
      const userMsg: ChatMessage = { id: uid(), role: 'user', content: `Show me ${moduleName}` };
      setMessages([userMsg]);
      setStage('discovery');
      sendToApi([userMsg]);
    } else {
      if (config.welcomeMessage) {
        setMessages([{
          id: uid(),
          role: 'assistant',
          content: config.welcomeMessage,
          block: {
            type: 'text',
            text: config.welcomeMessage,
            suggestions: buildInitialSuggestions(),
          },
        }]);
      }
      setStage('greeting');
    }
  };

  const reset = () => {
    setView('bento');
    setMessages([]);
    setStage('greeting');
    setActiveModule(null);
  };

  const handleModuleSwitch = (item: { id: string; label: string }) => {
    setActiveModule(item.id);
    setStage('presentation');
    const dividerMsg: ChatMessage = { id: uid(), divider: item.label, role: 'assistant', content: '' };
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: `Show me ${item.label}` };
    const updated = [...messagesRef.current, dividerMsg, userMsg];
    setMessages(updated);
    sendToApi(updated);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    sendToApi(updated);
  };

  const callbacks: BlockCallbacks = useMemo(() => ({
    onSendMessage: (text: string) => {
      if (view === 'bento') {
        enterChat(null);
        setTimeout(() => {
          const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
          setMessages(prev => [...prev, userMsg]);
          sendToApi([...messagesRef.current, userMsg]);
        }, 100);
      } else {
        const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
        const updated = [...messagesRef.current, userMsg];
        setMessages(updated);
        sendToApi(updated);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [view, partnerId, sending]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  if (view === 'bento') {
    if (storefrontLoading) {
      return (
        <div
          style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.bg,
            fontFamily: theme.fontFamily,
          }}
        >
          <Loader2 size={24} strokeWidth={2} style={{ color: theme.t4, animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      );
    }

    return (
      <div style={{ height: '100vh', width: '100vw', background: theme.bg }}>
        <RelayBentoGrid
          brand={{
            name: storefrontData?.brand.name || config.brandName || 'Chat',
            tagline: storefrontData?.brand.tagline || config.tagline || '',
          }}
          modules={storefrontData?.modules || []}
          contact={storefrontData?.contact}
          usp={storefrontData?.usp}
          hasRag={storefrontData?.hasRag}
          theme={theme}
          onModuleClick={(slug) => enterChat(slug)}
          onAsk={() => enterChat(null)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: theme.bg,
        fontFamily: theme.fontFamily,
      }}
    >
      <style>{RELAY_KEYFRAMES}</style>

      <ChatHeader
        brandName={storefrontData?.brand.name || config.brandName || 'Chat'}
        stage={stage}
        stageLabel={stageLabels[stage] || stage}
        theme={theme}
      />

      {moduleBarItems.length > 0 && (
        <ModuleBar
          items={moduleBarItems}
          active={activeModule}
          onSelect={handleModuleSwitch}
          onHome={reset}
          theme={theme}
        />
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.map((m) => {
          if (m.divider) {
            return <Divider key={m.id} text={m.divider} theme={theme} />;
          }
          if (m.role === 'user') {
            return <UserBubble key={m.id} text={m.content} theme={theme} />;
          }
          if (m.block) {
            return (
              <BotBubble key={m.id} theme={theme}>
                <BlockRenderer block={m.block} theme={theme} callbacks={callbacks} />
              </BotBubble>
            );
          }
          return <BotBubble key={m.id} text={m.content} theme={theme} />;
        })}

        {sending && <TypingIndicator theme={theme} />}
        <div ref={chatEndRef} />
      </div>

      <ChatInputBar
        value={input}
        onChange={setInput}
        onSend={handleSend}
        placeholder="Type a message..."
        disabled={sending}
        theme={theme}
      />

      <div style={{ textAlign: 'center', padding: '6px 0', background: theme.surface }}>
        <a
          href="https://pingbox.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: theme.t4, textDecoration: 'none', fontFamily: theme.fontFamily }}
        >
          Powered by Pingbox
        </a>
      </div>
    </div>
  );
}
