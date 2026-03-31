'use client';

import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Radio, Home, ArrowUp } from 'lucide-react';
import type { RelayTheme } from '@/components/relay/blocks/types';

export const RELAY_KEYFRAMES = `@keyframes relay-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`;

export interface IconBoxProps {
  icon: LucideIcon;
  size?: number;
  bg?: string;
  color?: string;
  rounded?: boolean;
  theme: RelayTheme;
}

export function IconBox({ icon: Icon, size = 28, bg, color, rounded, theme }: IconBoxProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? 9999 : size > 24 ? 10 : 7,
        background: bg || theme.accentBg2,
        color: color || theme.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </div>
  );
}

export interface BotAvatarProps {
  theme: RelayTheme;
  size?: number;
}

export function BotAvatar({ theme, size = 28 }: BotAvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: theme.accent,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Radio size={Math.round(size * 0.5)} strokeWidth={2} />
    </div>
  );
}

export interface UserBubbleProps {
  text: string;
  theme: RelayTheme;
}

export function UserBubble({ text, theme }: UserBubbleProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        style={{
          maxWidth: '80%',
          background: theme.accent,
          color: '#fff',
          borderRadius: '16px 16px 4px 16px',
          padding: '10px 16px',
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: theme.fontFamily,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export interface BotBubbleProps {
  text?: string;
  children?: React.ReactNode;
  theme: RelayTheme;
}

export function BotBubble({ text, children, theme }: BotBubbleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <BotAvatar theme={theme} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {text && (
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.bdrL}`,
              borderRadius: 14,
              padding: '10px 14px',
              fontSize: 13,
              lineHeight: 1.5,
              color: theme.text,
              fontFamily: theme.fontFamily,
            }}
          >
            {text}
          </div>
        )}
        {children && <div style={{ marginTop: text ? 8 : 0 }}>{children}</div>}
      </div>
    </div>
  );
}

export interface SuggestionPillsProps {
  items: string[];
  onSelect?: (item: string) => void;
  theme: RelayTheme;
}

export function SuggestionPills({ items, onSelect, theme }: SuggestionPillsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect?.(item)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: theme.accent,
            background: hoveredIdx === i ? theme.accentBg2 : theme.accentBg,
            border: `1px solid ${theme.accentBg2}`,
            padding: '6px 14px',
            borderRadius: 9999,
            cursor: 'pointer',
            fontFamily: theme.fontFamily,
            lineHeight: 1.4,
            transition: 'background 0.15s',
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export interface DividerProps {
  text: string;
  theme: RelayTheme;
}

export function Divider({ text, theme }: DividerProps) {
  const lineStyle: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: theme.bdrL,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <div style={lineStyle} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: theme.t4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontFamily: theme.fontFamily,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      <div style={lineStyle} />
    </div>
  );
}

export interface NudgeProps {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'green' | 'dark';
  theme: RelayTheme;
}

export function Nudge({ text, actionLabel, onAction, variant = 'default', theme }: NudgeProps) {
  const variantStyles: Record<string, { bg: string; border: string; btnColor: string }> = {
    default: { bg: theme.accentBg, border: theme.accentBg2, btnColor: theme.accent },
    green: {
      bg: 'rgba(22,163,74,0.05)',
      border: 'rgba(22,163,74,0.12)',
      btnColor: 'rgb(22,163,74)',
    },
    dark: {
      bg: 'rgba(28,25,23,0.04)',
      border: 'rgba(28,25,23,0.10)',
      btnColor: theme.text,
    },
  };

  const v = variantStyles[variant];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        background: v.bg,
        border: `1px solid ${v.border}`,
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: theme.t2,
          lineHeight: 1.4,
          fontFamily: theme.fontFamily,
        }}
      >
        {text}
      </span>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: v.btnColor,
            background: theme.surface,
            border: `1px solid ${theme.bdrL}`,
            padding: '5px 14px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            fontFamily: theme.fontFamily,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export interface ModuleBarItem {
  id: string;
  label: string;
}

export interface ModuleBarProps {
  items: ModuleBarItem[];
  active?: string | null;
  onSelect: (item: ModuleBarItem) => void;
  onHome: () => void;
  theme: RelayTheme;
}

export function ModuleBar({ items, active, onSelect, onHome, theme }: ModuleBarProps) {
  const isHomeActive = active === null || active === undefined;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: `1px solid ${theme.bdrL}`,
        background: theme.surface,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 6,
          padding: '8px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={onHome}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1px solid ${theme.bdrL}`,
            background: isHomeActive ? theme.text : theme.surface,
            color: isHomeActive ? '#fff' : theme.t3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <Home size={14} strokeWidth={2} />
        </button>

        <div
          style={{
            width: 1,
            height: 20,
            background: theme.bdrL,
            flexShrink: 0,
            alignSelf: 'center',
          }}
        />

        {items.map((item) => {
          const isActive = active === item.id;
          const shortLabel = item.label.split(' ').pop() || item.label;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              style={{
                padding: '5px 14px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: theme.fontFamily,
                background: isActive ? theme.accent : theme.surface,
                color: isActive ? '#fff' : theme.t3,
                border: isActive ? 'none' : `1px solid ${theme.bdrL}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: 1.4,
              }}
            >
              {shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface StageIndicatorProps {
  stage: string;
  label: string;
  theme: RelayTheme;
}

export function StageIndicator({ label, theme }: StageIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        background: theme.accentBg,
        borderRadius: 9999,
        fontSize: 10,
        color: theme.accent,
        fontWeight: 600,
        fontFamily: theme.fontFamily,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 9999,
          background: theme.accent,
          animation: 'relay-pulse 2s infinite',
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

export interface TypingIndicatorProps {
  theme: RelayTheme;
}

export function TypingIndicator({ theme }: TypingIndicatorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <BotAvatar theme={theme} />
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.bdrL}`,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'row',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {[0, 0.15, 0.3].map((delay, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: theme.t4,
              animation: `relay-pulse 1.5s infinite ${delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export interface ChatHeaderProps {
  brandName: string;
  stage?: string;
  stageLabel?: string;
  theme: RelayTheme;
}

export function ChatHeader({ brandName, stage, stageLabel, theme }: ChatHeaderProps) {
  return (
    <div
      style={{
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: theme.surface,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: theme.accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Radio size={14} strokeWidth={2} />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: theme.text,
            fontFamily: theme.fontFamily,
          }}
        >
          {brandName}
        </span>
      </div>
      {stage && stageLabel && <StageIndicator stage={stage} label={stageLabel} theme={theme} />}
    </div>
  );
}

export interface ChatInputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  theme: RelayTheme;
}

export function ChatInputBar({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  disabled,
  theme,
}: ChatInputBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        padding: '10px 14px',
        borderTop: `1px solid ${theme.bdrL}`,
        background: theme.surface,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: theme.bg,
            borderRadius: 10,
            border: `1px solid ${theme.bdrL}`,
          }}
        >
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              fontSize: 13,
              color: theme.text,
              fontFamily: theme.fontFamily,
              lineHeight: 1.4,
            }}
          />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: theme.accent,
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled || !value.trim() ? 'default' : 'pointer',
            opacity: disabled || !value.trim() ? 0.5 : 1,
            flexShrink: 0,
            padding: 0,
          }}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
