'use client';

// ── Flow debug panel ───────────────────────────────────────────────────
//
// Sits below the phone frame in the Test Chat tab. Surfaces the flow
// state (stage / lead temp / turn count / suggested blocks) so partners
// can see exactly what the admin-configured flow is doing as they
// interact with the preview.

import type { RelayTheme } from '@/components/relay/blocks/types';

export interface TestChatFlowMeta {
  stageId?: string;
  stageLabel?: string;
  stageType?: string;
  suggestedBlockTypes?: string[];
  leadTemperature?: string;
  interactionCount?: number;
}

interface Props {
  flowMeta: TestChatFlowMeta | null;
  theme: RelayTheme;
}

export default function TestChatFlowPanel({ flowMeta, theme }: Props) {
  if (!flowMeta) return null;

  const hasAnyField =
    !!flowMeta.stageLabel ||
    !!flowMeta.leadTemperature ||
    flowMeta.interactionCount !== undefined ||
    (flowMeta.suggestedBlockTypes &&
      flowMeta.suggestedBlockTypes.length > 0);
  if (!hasAnyField) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        background: theme.bg,
        borderRadius: 8,
        border: `1px solid ${theme.bdrL}`,
        fontSize: 11,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: theme.t3,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 8,
        }}
      >
        Flow state
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 10,
          rowGap: 4,
          alignItems: 'start',
        }}
      >
        {flowMeta.stageLabel && (
          <>
            <span style={{ color: theme.t3 }}>Stage</span>
            <span style={{ color: theme.text, fontWeight: 600 }}>
              {flowMeta.stageLabel}
            </span>
          </>
        )}
        {flowMeta.leadTemperature && (
          <>
            <span style={{ color: theme.t3 }}>Lead</span>
            <span style={{ color: theme.text }}>
              {flowMeta.leadTemperature}
            </span>
          </>
        )}
        {typeof flowMeta.interactionCount === 'number' && (
          <>
            <span style={{ color: theme.t3 }}>Turns</span>
            <span style={{ color: theme.text }}>
              {flowMeta.interactionCount}
            </span>
          </>
        )}
        {flowMeta.suggestedBlockTypes &&
          flowMeta.suggestedBlockTypes.length > 0 && (
            <>
              <span style={{ color: theme.t3 }}>Blocks</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {flowMeta.suggestedBlockTypes.slice(0, 5).map((b) => (
                  <span
                    key={b}
                    style={{
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: theme.accentBg2,
                      color: theme.accent,
                      fontSize: 9,
                      fontWeight: 500,
                    }}
                  >
                    {b}
                  </span>
                ))}
                {flowMeta.suggestedBlockTypes.length > 5 && (
                  <span style={{ fontSize: 9, color: theme.t3 }}>
                    +{flowMeta.suggestedBlockTypes.length - 5}
                  </span>
                )}
              </div>
            </>
          )}
      </div>

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${theme.bdrL}`,
          fontSize: 9,
          color: theme.t4,
        }}
      >
        Flow loaded from{' '}
        <a
          href="/admin/relay/flows"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme.accent, textDecoration: 'underline' }}
        >
          /admin/relay/flows
        </a>
      </div>
    </div>
  );
}
