'use client';

import { FLOW_STAGE_STYLES } from '../blocks/previews/_types';
import { T } from './flow-helpers';
import { Radio } from 'lucide-react';

export function BotAvatar({ color }: { color?: string }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '9999px', flexShrink: 0,
      background: color || T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
    }}>
      <Radio size={14} strokeWidth={2.5} />
    </div>
  );
}

export function BotBubble({ text, children }: { text?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
      <BotAvatar />
      <div style={{ maxWidth: 'calc(100% - 40px)', width: children ? '100%' : 'auto' }}>
        {text && (
          <div style={{
            background: T.surface, border: `1px solid ${T.bdrL}`, padding: '10px 14px',
            borderRadius: 12, fontSize: 13, lineHeight: 1.5, color: T.t1,
          }}>{text}</div>
        )}
        {children && <div style={{ marginTop: text ? 8 : 0 }}>{children}</div>}
      </div>
    </div>
  );
}

export function UserBubble({ text, color }: { text: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <div style={{
        maxWidth: '80%', background: color || T.accent, color: '#fff', padding: '10px 16px',
        borderRadius: '16px 16px 4px 16px', fontSize: 13, lineHeight: 1.5,
      }}>{text}</div>
    </div>
  );
}

export function StageDivider({ label, stageType }: { label: string; stageType: string }) {
  const style = FLOW_STAGE_STYLES[stageType] || { color: '#f3f4f6', textColor: '#374151' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.bdrL }} />
      <span style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
        color: style.textColor, background: style.color, padding: '3px 10px', borderRadius: 9999,
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: T.bdrL }} />
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
      <BotAvatar />
      <div style={{
        background: T.surface, border: `1px solid ${T.bdrL}`, borderRadius: 12,
        padding: '12px 16px', display: 'flex', gap: 4,
      }}>
        {[0, 0.15, 0.3].map(d => (
          <span key={d} style={{
            width: 6, height: 6, borderRadius: '50%', background: T.t4,
            animation: `flowpulse 1s infinite ${d}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export function SuggestionChips({ chips, onTap }: { chips: string[]; onTap?: (chip: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, marginLeft: 36 }}>
      {chips.map(s => (
        <button key={s} onClick={() => onTap?.(s)} style={{
          fontSize: 12, fontWeight: 500, color: T.accent, background: T.accentBg,
          border: `1px solid ${T.accentBg2}`, padding: '6px 14px', borderRadius: 9999, cursor: 'pointer',
        }}>{s}</button>
      ))}
    </div>
  );
}
