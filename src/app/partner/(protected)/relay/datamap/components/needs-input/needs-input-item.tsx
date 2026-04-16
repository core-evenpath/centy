'use client';

// ── "Needs your input" expandable card ────────────────────────────────
//
// Replaces the previous flat amber row + separate DataInputPanel. The
// header is a collapsed summary; expanded, partners see three options
// (Upload / Core Memory / Let AI collect). Picking the AI option
// swaps the options grid for the AIFlowPanel.

import { useState } from 'react';
import { Icon } from '../inline-icon';
import { ACCENT, theme } from '../../constants';
import AIFlowPanel from './ai-flow-panel';
import type { GeneratedPrompt, MappedFeature } from '../../types';

interface Props {
  feature: MappedFeature;
  partnerId: string;
  onUpload: (featureId: string) => void;
  onUseMemory: (featureId: string) => void;
  onConnectModule: (featureId: string, moduleId: string) => void;
  onActivateAICollection: (
    featureId: string,
    prompts: GeneratedPrompt[],
    suggestedModuleName: string,
  ) => void;
}

export default function NeedsInputItem({
  feature,
  partnerId,
  onUpload,
  onUseMemory,
  onConnectModule,
  onActivateAICollection,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiFlowOpen, setAiFlowOpen] = useState(false);

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${isOpen ? theme.amberBdr2 : theme.amberBdr}`,
        background: isOpen ? '#fff' : theme.amberBg,
        marginBottom: 6,
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (!next) setAiFlowOpen(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: 'rgba(217,119,6,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name={feature.icon} size={12} color={theme.amber} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: theme.t1 }}>
            {feature.customer}
          </div>
          {feature.missReason && (
            <div style={{ fontSize: 9.5, color: theme.amber, marginTop: 2 }}>
              {feature.missReason}
            </div>
          )}
        </div>
        <Icon
          name={isOpen ? 'chevronUp' : 'chevronDown'}
          size={14}
          color={theme.t4}
        />
      </button>

      {isOpen && (
        <div style={{ padding: '0 12px 14px' }}>
          <div style={{ height: 1, background: theme.amberBdr, marginBottom: 12 }} />

          <div
            style={{
              fontSize: 11,
              color: theme.t3,
              lineHeight: 1.5,
              padding: '8px 10px',
              background: theme.bg,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            {feature.you}
          </div>

          {!aiFlowOpen && (
            <>
              <OptionButton
                icon="upload"
                iconColor="#1865dc"
                iconBg="rgba(22,101,220,0.08)"
                title="Upload a document"
                desc="PDF, CSV, Excel — AI reads and maps fields"
                onClick={() => onUpload(feature.id)}
              />
              <OptionButton
                icon="db"
                iconColor="#534ab7"
                iconBg="rgba(99,99,220,0.08)"
                title="Use Core Memory documents"
                desc="Extract from files already in your account"
                onClick={() => onUseMemory(feature.id)}
              />
              <OptionButton
                icon="zap"
                iconColor={ACCENT}
                iconBg={theme.accentBg2}
                title="Let AI collect it for you"
                desc="Auto-prompts ask customers directly; answers saved to a custom module."
                onClick={() => setAiFlowOpen(true)}
                highlighted
                badge="AI"
              />
            </>
          )}

          {aiFlowOpen && (
            <AIFlowPanel
              feature={feature}
              partnerId={partnerId}
              onConnect={(moduleId) => {
                onConnectModule(feature.id, moduleId);
                setAiFlowOpen(false);
                setIsOpen(false);
              }}
              onActivateCollection={(prompts, name) => {
                onActivateAICollection(feature.id, prompts, name);
                setAiFlowOpen(false);
                setIsOpen(false);
              }}
              onCancel={() => setAiFlowOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function OptionButton({
  icon,
  iconColor,
  iconBg,
  title,
  desc,
  onClick,
  highlighted,
  badge,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  onClick: () => void;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '10px 11px',
        width: '100%',
        borderRadius: 7,
        border: `1px solid ${highlighted ? theme.accentBg2 : theme.bdrL}`,
        background: highlighted ? theme.accentBg : '#fff',
        cursor: 'pointer',
        marginBottom: 6,
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={13} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.t1 }}>
          {title}
        </div>
        <div style={{ fontSize: 9.5, color: theme.t3, marginTop: 1, lineHeight: 1.4 }}>
          {desc}
        </div>
      </div>
      {badge ? (
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: theme.accentBg2,
            color: ACCENT,
            letterSpacing: 0.3,
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      ) : (
        <Icon name="arrowR" size={13} color={theme.t4} />
      )}
    </button>
  );
}
