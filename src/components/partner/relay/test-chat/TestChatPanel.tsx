'use client';

import type { BlockCallbacks, RelayTheme } from '@/components/relay/blocks/types';
import TestChatPhoneFrame from './TestChatPhoneFrame';
import TestChatHeader from './TestChatHeader';
import TestChatMessages, { type TestChatMessage } from './TestChatMessages';
import TestChatInput from './TestChatInput';

// ── Top-level Test Chat panel ────────────────────────────────────────
//
// Renders the phone frame and composes header / messages / input. Keeps
// no local state beyond what the child components own; all chat state
// lives in the parent page so we share it with other tabs / diagnostics.

export default function TestChatPanel({
  brandName,
  brandEmoji,
  tagline,
  theme,
  messages,
  sending,
  onSend,
  onClear,
  callbacks,
  currentStageLabel,
}: {
  brandName: string;
  brandEmoji?: string;
  tagline?: string;
  theme: RelayTheme;
  messages: TestChatMessage[];
  sending: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
  /** Passed down to `TestChatMessages` → commerce blocks. */
  callbacks?: BlockCallbacks;
  /** Surfaced in the header while the flow engine is running. */
  currentStageLabel?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '24px 0 12px',
        background: 'transparent',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @keyframes testChatPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
      <TestChatPhoneFrame theme={theme}>
        <TestChatHeader
          brandName={brandName}
          brandEmoji={brandEmoji}
          theme={theme}
          canClear={messages.length > 0}
          onClear={onClear}
          stageLabel={currentStageLabel}
        />
        <TestChatMessages
          messages={messages}
          sending={sending}
          theme={theme}
          brandName={brandName}
          brandEmoji={brandEmoji}
          tagline={tagline}
          onSend={onSend}
          callbacks={callbacks}
        />
        <TestChatInput theme={theme} disabled={sending} onSend={onSend} />
      </TestChatPhoneFrame>
    </div>
  );
}
