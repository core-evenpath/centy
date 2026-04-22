'use client';

// ── Product chain diagnostic panel ─────────────────────────────────────
//
// Sits below the existing Signals + Flow panels in Test Chat. Walks the
// six steps of the product_card render chain (modules → selection →
// items → flow allow-list → dispatch → last-turn outcome) and shows
// where it broke. Read-only — fixes nothing, just makes the failure
// point visible. Refreshes when refreshKey changes (parent increments
// after each chat turn).

import { useEffect, useState } from 'react';
import type { RelayTheme } from '@/components/relay/blocks/types';

type Status = 'OK' | 'WARN' | 'FAIL';

interface Check {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  status: Status;
  message: string;
  details?: Record<string, unknown>;
}

interface DiagnosticResponse {
  partnerId: string;
  conversationId: string;
  checks: Check[];
  summary: {
    firstFailure: number | null;
    verdict: 'ALL_OK' | 'PARTIAL' | 'BROKEN';
  };
}

interface Props {
  partnerId: string;
  conversationId: string;
  theme: RelayTheme;
  /**
   * Refresh trigger — parent increments after each chat turn so the
   * diagnostic re-runs without a manual refresh button.
   */
  refreshKey?: number;
}

const STATUS_COLORS: Record<Status, { fg: string; bg: string; icon: string }> =
  {
    OK: { fg: '#16a34a', bg: 'rgba(22,163,74,0.10)', icon: '✓' },
    WARN: { fg: '#d97706', bg: 'rgba(217,119,6,0.10)', icon: '●' },
    FAIL: { fg: '#dc2626', bg: 'rgba(220,38,38,0.10)', icon: '✕' },
  };

const VERDICT_LABEL: Record<DiagnosticResponse['summary']['verdict'], string> =
  {
    ALL_OK: 'all ok',
    PARTIAL: 'partial',
    BROKEN: 'broken',
  };

export default function TestChatProductDiagnostic({
  partnerId,
  conversationId,
  theme,
  refreshKey = 0,
}: Props) {
  const [data, setData] = useState<DiagnosticResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerId) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    const url = `/api/debug/relay-product-chain?partnerId=${encodeURIComponent(
      partnerId,
    )}&conversationId=${encodeURIComponent(conversationId)}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as DiagnosticResponse;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[product-diagnostic] fetch failed:', err);
        setFetchError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [partnerId, conversationId, refreshKey]);

  const verdict = data?.summary.verdict;

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
          Product chain diagnostic
        </div>
        {verdict && (
          <span
            style={{
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 4,
              background:
                verdict === 'ALL_OK'
                  ? STATUS_COLORS.OK.bg
                  : verdict === 'PARTIAL'
                    ? STATUS_COLORS.WARN.bg
                    : STATUS_COLORS.FAIL.bg,
              color:
                verdict === 'ALL_OK'
                  ? STATUS_COLORS.OK.fg
                  : verdict === 'PARTIAL'
                    ? STATUS_COLORS.WARN.fg
                    : STATUS_COLORS.FAIL.fg,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {VERDICT_LABEL[verdict]}
          </span>
        )}
      </div>

      {loading && !data && (
        <div style={{ fontSize: 11, color: theme.t3 }}>Running checks…</div>
      )}

      {fetchError && (
        <Row
          theme={theme}
          step={0}
          status="FAIL"
          name="Debug API unreachable — check console"
          message={fetchError}
        />
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.checks.map((c) => (
            <Row
              key={c.step}
              theme={theme}
              step={c.step}
              status={c.status}
              name={c.name}
              message={c.message}
              details={c.details}
            />
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: `1px solid ${theme.bdrL}`,
          fontSize: 9,
          color: theme.t4,
        }}
      >
        Read-only diagnostic ·{' '}
        <code
          style={{
            background: theme.accentBg2,
            color: theme.accent,
            padding: '0 4px',
            borderRadius: 3,
            fontSize: 9,
          }}
        >
          /api/debug/relay-product-chain
        </code>
      </div>
    </div>
  );
}

function Row({
  theme,
  step,
  status,
  name,
  message,
  details,
}: {
  theme: RelayTheme;
  step: number;
  status: Status;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}) {
  const c = STATUS_COLORS[status];
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span
        aria-label={status}
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: c.bg,
          color: c.fg,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: '18px',
          textAlign: 'center',
        }}
      >
        {c.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            color: theme.text,
            fontWeight: 600,
          }}
        >
          {step > 0 ? `Step ${step} — ` : ''}
          {name}
        </div>
        <div style={{ fontSize: 10, color: theme.t3, marginTop: 1 }}>
          {message}
        </div>
        {details && Object.keys(details).length > 0 && (
          <details style={{ marginTop: 4 }}>
            <summary
              style={{
                fontSize: 9,
                color: theme.t4,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              details
            </summary>
            <pre
              style={{
                margin: '4px 0 0',
                padding: 6,
                background: theme.accentBg2,
                borderRadius: 4,
                fontSize: 9,
                color: theme.text,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
