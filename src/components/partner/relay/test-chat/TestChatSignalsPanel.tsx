'use client';

// ── Orchestrator signals debug panel ─────────────────────────────────
//
// Sits below the phone frame in the Test Chat tab. Shows the composite
// decision the orchestrator made last turn: intent, RAG usage, cart /
// order state, the allow-list, any rejected blocks + why, and the
// composition path (block_only / rag_only / …).

import type { RelayTheme } from '@/components/relay/blocks/types';
import type { OrchestratorSignalsDebug } from '@/lib/relay/orchestrator/types';

export type TestChatSignalsDebug = OrchestratorSignalsDebug;

interface Props {
  signals: TestChatSignalsDebug | null;
  flowStage?: string;
  theme: RelayTheme;
}

export default function TestChatSignalsPanel({
  signals,
  flowStage,
  theme,
}: Props) {
  if (!signals) return null;

  const MAX_ALLOWED_BADGES = 6;
  const MAX_REJECTED_ROWS = 3;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        background: theme.bg,
        borderRadius: 10,
        border: `1px solid ${theme.bdrL}`,
        fontSize: 11,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: theme.t3,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Orchestrator signals
        </div>
        <span
          style={{
            fontSize: 9,
            padding: '2px 7px',
            borderRadius: 4,
            background: theme.accentBg2,
            color: theme.accent,
            fontWeight: 600,
          }}
        >
          {signals.compositionPath}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 10,
          rowGap: 4,
          fontSize: 11,
        }}
      >
        <Label theme={theme}>Flow</Label>
        <Val theme={theme}>
          {flowStage ? flowStage : '—'} · intent: {signals.intent ?? '—'}
        </Val>

        <Label theme={theme}>RAG</Label>
        <Val theme={theme}>
          {signals.ragUsed
            ? `✓ ${signals.ragSources} source${signals.ragSources === 1 ? '' : 's'}`
            : `skipped · ${signals.ragReason}`}
        </Val>

        <Label theme={theme}>Session</Label>
        <Val theme={theme}>
          {signals.cartItems > 0
            ? `🛒 ${signals.cartItems} cart`
            : 'no cart'}
          {signals.hasOrders ? ' · 📦 has orders' : ''}
        </Val>

        <Label theme={theme}>Allowed</Label>
        <Val theme={theme}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {signals.allowedBlocks.slice(0, MAX_ALLOWED_BADGES).map((b) => (
              <span
                key={b}
                style={{
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: 'rgba(22,163,74,0.08)',
                  color: '#16a34a',
                  fontSize: 9,
                  fontWeight: 500,
                }}
              >
                {b}
              </span>
            ))}
            {signals.allowedBlocks.length > MAX_ALLOWED_BADGES && (
              <span style={{ fontSize: 9, color: theme.t3 }}>
                +{signals.allowedBlocks.length - MAX_ALLOWED_BADGES}
              </span>
            )}
            {signals.allowedBlocks.length === 0 && (
              <span style={{ fontSize: 9, color: theme.t3 }}>none</span>
            )}
          </div>
        </Val>

        {signals.rejectedBlocks.length > 0 && (
          <>
            <Label theme={theme}>Rejected</Label>
            <Val theme={theme}>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {signals.rejectedBlocks
                  .slice(0, MAX_REJECTED_ROWS)
                  .map((r) => (
                    <span
                      key={r.blockId}
                      style={{ fontSize: 9, color: theme.t3 }}
                    >
                      <code
                        style={{
                          background: 'rgba(217,119,6,0.08)',
                          color: '#d97706',
                          padding: '0 3px',
                          borderRadius: 3,
                          fontSize: 8.5,
                        }}
                      >
                        {r.blockId}
                      </code>
                      {' — ' + r.reason}
                    </span>
                  ))}
                {signals.rejectedBlocks.length > MAX_REJECTED_ROWS && (
                  <span style={{ fontSize: 9, color: theme.t4 }}>
                    +{signals.rejectedBlocks.length - MAX_REJECTED_ROWS} more
                  </span>
                )}
              </div>
            </Val>
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
        Composed from{' '}
        <LinkOut href="/admin/relay/flows" theme={theme}>flows</LinkOut>
        {' · '}
        <LinkOut href="/partner/relay/blocks" theme={theme}>blocks</LinkOut>
        {' · '}
        <LinkOut href="/partner/relay/datamap" theme={theme}>datamap</LinkOut>
        {' · commerce · RAG'}
      </div>
    </div>
  );
}

function Label({
  theme,
  children,
}: {
  theme: RelayTheme;
  children: React.ReactNode;
}) {
  return (
    <span style={{ fontSize: 10, color: theme.t3, fontWeight: 500 }}>
      {children}
    </span>
  );
}

function Val({
  theme,
  children,
}: {
  theme: RelayTheme;
  children: React.ReactNode;
}) {
  return <span style={{ fontSize: 11, color: theme.text }}>{children}</span>;
}

function LinkOut({
  href,
  theme,
  children,
}: {
  href: string;
  theme: RelayTheme;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: theme.accent, textDecoration: 'underline' }}
    >
      {children}
    </a>
  );
}
