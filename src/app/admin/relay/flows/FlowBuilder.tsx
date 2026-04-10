'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import FlowSidebar from './FlowSidebar';
import FlowChat from './FlowChat';
import FlowBento from './FlowBento';
import FlowScenarioPicker from './FlowScenarioPicker';
import { generateConversation, generateConversationFromScenario } from './flow-conversation';
import { useFlowTemplate } from './useFlowTemplate';
import { useScenarios } from './useScenarios';
import { T, VERTICALS } from './flow-helpers';
import { getSubVertical } from '../blocks/previews/registry';
import { Radio, ArrowUp, Layers } from 'lucide-react';
import { FLOW_STAGE_STYLES } from '../blocks/previews/_types';

const STAGE_LABELS: Record<string, string> = {
  greeting: 'Welcome', discovery: 'Exploring', showcase: 'Presenting',
  comparison: 'Comparing', social_proof: 'Reviews', conversion: 'Converting',
  objection: 'Concerns', handoff: 'Team Connect', followup: 'Follow-up',
};

export default function RelayFlowMockup() {
  const [selectedId, setSelectedId] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { template, source } = useFlowTemplate(selectedId);
  const { scenarios, selected: selectedScenario, selectedIdx, setSelectedIdx, generating, error: scenarioError, regenerate } = useScenarios(selectedId);

  const messages = useMemo(() => {
    if (!selectedId) return [];
    if (selectedScenario) return generateConversationFromScenario(selectedId, selectedScenario, template);
    return generateConversation(selectedId, template);
  }, [selectedId, template, selectedScenario]);

  const prevMsgLen = useRef(messages.length);
  useEffect(() => {
    if (prevMsgLen.current !== messages.length && showChat) {
      setVisibleCount(0); setIsPlaying(true);
    }
    prevMsgLen.current = messages.length;
  }, [messages.length, showChat]);

  const info = useMemo(() => (selectedId ? getSubVertical(selectedId) : null), [selectedId]);
  const accentColor = info?.vertical.accentColor || T.accent;
  const subName = info?.subVertical.name || '';

  const currentStage = useMemo(() => {
    for (let i = visibleCount - 1; i >= 0; i--) {
      if (messages[i]?.type === 'stage-divider') return messages[i].stage || '';
    }
    return '';
  }, [messages, visibleCount]);

  useEffect(() => {
    if (!isPlaying || visibleCount >= messages.length) {
      if (visibleCount >= messages.length && visibleCount > 0) setIsPlaying(false);
      return;
    }
    const next = messages[visibleCount];
    const delay = next?.type === 'stage-divider' ? 800 : next?.type === 'user' ? 1200 : next?.blockPreviews?.length ? 2200 : 1500;
    const timer = setTimeout(() => setVisibleCount(c => c + 1), delay);
    return () => clearTimeout(timer);
  }, [isPlaying, visibleCount, messages]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id); setShowChat(false); setVisibleCount(0); setIsPlaying(false);
  }, []);
  const handleStartChat = useCallback(() => { setShowChat(true); setVisibleCount(0); setIsPlaying(true); }, []);
  const handleReset = useCallback(() => { setShowChat(false); setVisibleCount(0); setIsPlaying(false); }, []);
  const handleTogglePlay = useCallback(() => {
    if (!showChat) { handleStartChat(); return; }
    setIsPlaying(p => !p);
  }, [showChat, handleStartChat]);
  const handleSelectScenario = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setVisibleCount(0);
    const sc = scenarios[idx];
    if (sc?.modelUsed) {
      // AI scenario: skip bento, auto-play immediately
      setShowChat(true);
      setIsPlaying(true);
    } else {
      // Default flow: show bento homescreen
      setShowChat(false);
      setIsPlaying(false);
    }
  }, [setSelectedIdx, scenarios]);

  const isTyping = isPlaying && visibleCount < messages.length;
  const stageStyle = FLOW_STAGE_STYLES[currentStage] || { color: T.accentBg, textColor: T.accent };
  const scenarioName = selectedScenario?.name;

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes flowpulse { 0%,100%{opacity:1} 50%{opacity:.3} } button:active { transform: scale(0.98); } ::-webkit-scrollbar { display: none; }`}</style>

      <FlowSidebar selectedId={selectedId} onSelect={handleSelect} isPlaying={isPlaying} onTogglePlay={handleTogglePlay} onReset={handleReset} templateSource={source} />

      {selectedId && (
        <FlowScenarioPicker functionId={selectedId} scenarios={scenarios} selectedIdx={selectedIdx} onSelect={handleSelectScenario}
          onRegenerate={regenerate} generating={generating} error={scenarioError} accentColor={accentColor} />
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selectedId ? (
          <div style={{ width: 375, height: 720, borderRadius: 32, border: '6px solid #1c1917', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 50px rgba(28,25,23,0.15)' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 110, height: 24, background: '#1c1917', borderRadius: '0 0 14px 14px', zIndex: 30 }} />
            <div style={{ width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden', background: T.surface, display: 'flex', flexDirection: 'column' }}>
              {showChat ? (
                <>
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: T.surface, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Radio size={14} strokeWidth={2.5} />
                      </div>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>{subName}</span>
                        {scenarioName && <div style={{ fontSize: 10, color: T.t3 }}>{scenarioName}</div>}
                      </div>
                    </div>
                    {currentStage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: stageStyle.color, borderRadius: 9999, fontSize: 10, color: stageStyle.textColor, fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: stageStyle.textColor, animation: 'flowpulse 2s infinite' }} />
                        {STAGE_LABELS[currentStage] || currentStage}
                      </div>
                    )}
                  </div>
                  <FlowChat messages={messages.slice(0, visibleCount)} isTyping={isTyping} accentColor={accentColor} onSuggestionTap={() => setIsPlaying(true)} />
                  <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.bdrL}`, background: T.surface, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, padding: '10px 14px', background: T.bg, borderRadius: 10, border: `1px solid ${T.bdrL}` }}>
                        <span style={{ fontSize: 13, color: T.t4 }}>Ask anything...</span>
                      </div>
                      <button style={{ width: 36, height: 36, borderRadius: 8, background: accentColor, border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ArrowUp size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <FlowBento functionId={selectedId} subVerticalName={subName} accentColor={accentColor} onStartChat={handleStartChat} />
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: T.accent }}>
              <Layers size={24} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 6 }}>Select a Sub-Vertical</div>
            <div style={{ fontSize: 13, color: T.t3, lineHeight: 1.6 }}>Choose a sub-vertical from the sidebar to simulate its conversation flow.</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20 }}>
              {[{ label: 'Verticals', value: VERTICALS.length }, { label: 'Sub-verticals', value: VERTICALS.reduce((n, v) => n + v.subVerticals.length, 0) }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.accent }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: T.t4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
