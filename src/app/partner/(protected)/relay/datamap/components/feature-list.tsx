'use client';

// ── Feature list orchestrator ──────────────────────────────────────────
//
// Two sections — "Needs your input" (amber) and "Live now" (green).
// Previously each row was a small amber/green strip; now each is an
// expandable card (`NeedsInputItem` / `LiveNowItem`). This component
// owns only the active-live selection so multiple "live now" rows don't
// expand at once.

import { useState } from 'react';
import { theme } from '../constants';
import NeedsInputItem from './needs-input/needs-input-item';
import LiveNowItem from './live-now/live-now-item';
import type { GeneratedPrompt, MappedFeature } from '../types';

interface FeatureListProps {
  notReady: MappedFeature[];
  ready: MappedFeature[];
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

export function FeatureList({
  notReady,
  ready,
  partnerId,
  onUpload,
  onUseMemory,
  onConnectModule,
  onActivateAICollection,
}: FeatureListProps) {
  const [activeLiveId, setActiveLiveId] = useState<string | null>(null);

  return (
    <div>
      {notReady.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SectionHeader color={theme.amber}>
            Needs your input ({notReady.length})
          </SectionHeader>
          {notReady.map((f) => (
            <NeedsInputItem
              key={f.id}
              feature={f}
              partnerId={partnerId}
              onUpload={onUpload}
              onUseMemory={onUseMemory}
              onConnectModule={onConnectModule}
              onActivateAICollection={onActivateAICollection}
            />
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <div>
          <SectionHeader color={theme.green}>
            Live now ({ready.length})
          </SectionHeader>
          {ready.map((f) => (
            <LiveNowItem
              key={f.id}
              feature={f}
              isActive={activeLiveId === f.id}
              onToggle={() =>
                setActiveLiveId(activeLiveId === f.id ? null : f.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: 99, background: color }}
      />
      {children}
    </div>
  );
}

