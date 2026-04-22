'use client';

import { useState } from 'react';
import { Send, MessageSquare, Plus, ChevronRight } from 'lucide-react';
import { T } from '@/app/admin/relay/flows/flow-helpers';
import type { Scenario, ScenarioMessage } from '@/lib/relay/scenarios/types';

const FONT_FAMILY = "'Karla', -apple-system, sans-serif";
const NOW = Date.now();

const STUB_SCENARIOS: Scenario[] = [
  {
    id: 'stub-1',
    partnerId: 'stub',
    title: 'New patient booking',
    description: 'Prospective patient asks about teeth whitening availability.',
    vertical: 'dental_care',
    messages: [
      {
        id: 'stub-1-m1',
        role: 'user',
        text: 'Hi, do you offer teeth whitening?',
        timestamp: NOW,
      },
      {
        id: 'stub-1-m2',
        role: 'assistant',
        text: 'Yes, we offer in-office and take-home whitening. Would you like to book a consultation?',
        timestamp: NOW,
      },
      {
        id: 'stub-1-m3',
        role: 'user',
        text: 'Sure, what does a consultation cost?',
        timestamp: NOW,
      },
      {
        id: 'stub-1-m4',
        role: 'assistant',
        text: 'Consultations are complimentary for new patients. I can hold a slot this Thursday at 2pm.',
        timestamp: NOW,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'stub-2',
    partnerId: 'stub',
    title: 'Botox pricing inquiry',
    description: 'Returning client asks about touch-up pricing.',
    vertical: 'aesthetic_clinic',
    messages: [
      {
        id: 'stub-2-m1',
        role: 'user',
        text: 'How much is a botox touch-up for a returning client?',
        timestamp: NOW,
      },
      {
        id: 'stub-2-m2',
        role: 'assistant',
        text: 'For returning clients within 6 months, touch-ups start at $180 per area.',
        timestamp: NOW,
      },
      {
        id: 'stub-2-m3',
        role: 'user',
        text: 'Great, can I book next week?',
        timestamp: NOW,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'stub-3',
    partnerId: 'stub',
    title: 'Emergency appointment',
    description: 'Patient with a broken crown needs same-day help.',
    vertical: 'dental_care',
    messages: [
      {
        id: 'stub-3-m1',
        role: 'user',
        text: 'My crown just broke. Can I come in today?',
        timestamp: NOW,
      },
      {
        id: 'stub-3-m2',
        role: 'assistant',
        text: 'That sounds urgent. We hold emergency slots daily. Are you in pain right now?',
        timestamp: NOW,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  },
];

function newMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PartnerRelayTestChatPage() {
  const [scenarios] = useState<Scenario[]>(STUB_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(STUB_SCENARIOS[0].id);
  const [messages, setMessages] = useState<ScenarioMessage[]>(STUB_SCENARIOS[0].messages);
  const [input, setInput] = useState('');

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];

  const selectScenario = (id: string) => {
    const next = scenarios.find((s) => s.id === id);
    if (!next) return;
    setActiveScenarioId(id);
    setMessages(next.messages);
    setInput('');
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const ts = Date.now();
    const userMsg: ScenarioMessage = {
      id: newMessageId(),
      role: 'user',
      text: trimmed,
      timestamp: ts,
    };
    const assistantMsg: ScenarioMessage = {
      id: newMessageId(),
      role: 'assistant',
      text: 'Received: ' + trimmed,
      timestamp: ts,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        minHeight: '100vh',
        width: '100%',
        background: T.bg,
        fontFamily: FONT_FAMILY,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <style>{`.relay-chat-scroll::-webkit-scrollbar { display: none; } .relay-chat-scroll { scrollbar-width: none; }`}</style>

      <aside
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: `1px solid ${T.bdrL}`,
          background: T.surface,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom: `1px solid ${T.bdrL}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: T.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <MessageSquare size={14} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>Scenarios</div>
              <div style={{ fontSize: 11, color: T.t3 }}>{scenarios.length} saved</div>
            </div>
          </div>
          <button
            type="button"
            disabled
            title="Create scenario (coming soon)"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: T.accentBg,
              border: `1px solid ${T.accentBg2}`,
              color: T.accent,
              cursor: 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div
          className="relay-chat-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {scenarios.map((s) => {
            const active = s.id === activeScenarioId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectScenario(s.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1px solid ${active ? T.accent : T.bdrL}`,
                  background: active ? T.accentBg : T.surface,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? T.accent : T.t1,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.title}
                  </div>
                  {s.description && (
                    <div
                      style={{
                        fontSize: 11,
                        color: T.t3,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {s.description}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 10,
                      color: T.t4,
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{s.messages.length} messages</span>
                    {s.vertical && (
                      <>
                        <span style={{ color: T.bdrM }}>|</span>
                        <span>{s.vertical}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  strokeWidth={2.5}
                  style={{ color: active ? T.accent : T.t4, flexShrink: 0, marginTop: 2 }}
                />
              </button>
            );
          })}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div
          style={{
            width: 375,
            height: 720,
            borderRadius: 32,
            border: '6px solid #1c1917',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(28,25,23,0.15)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 110,
              height: 24,
              background: '#1c1917',
              borderRadius: '0 0 14px 14px',
              zIndex: 30,
            }}
          />
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 26,
              overflow: 'hidden',
              background: T.surface,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: T.surface,
                flexShrink: 0,
                borderBottom: `1px solid ${T.bdrL}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: T.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <MessageSquare size={14} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>Test Chat</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>{activeScenario.title}</div>
                </div>
              </div>
            </div>

            <div
              className="relay-chat-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 14,
                background: T.bg,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {messages.map((m) =>
                m.role === 'user' ? (
                  <div
                    key={m.id}
                    style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        background: T.accent,
                        color: '#fff',
                        padding: '10px 16px',
                        borderRadius: '16px 16px 4px 16px',
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        background: T.surface,
                        border: `1px solid ${T.bdrL}`,
                        color: T.t1,
                        padding: '10px 14px',
                        borderRadius: '16px 16px 16px 4px',
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderTop: `1px solid ${T.bdrL}`,
                background: T.surface,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask anything..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: T.bg,
                    borderRadius: 10,
                    border: `1px solid ${T.bdrL}`,
                    fontSize: 13,
                    color: T.t1,
                    fontFamily: FONT_FAMILY,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: input.trim() ? T.accent : T.bdrM,
                    border: 'none',
                    color: '#fff',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
