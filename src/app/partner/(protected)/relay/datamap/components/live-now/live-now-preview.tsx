'use client';

// ── Detail panel for a "live now" feature ──────────────────────────────
//
// Two-card summary (data source + status), source row or profile-fields
// tag list, and a small placeholder for a future UI preview. Kept
// intentionally static — real UI rendering can be wired in later by
// slotting a `RegisteredBlock` component in place of the placeholder.

import { ACCENT, theme } from '../../constants';
import type { MappedFeature } from '../../types';

const PROFILE_FIELDS_DEFAULT = ['Business name', 'Tagline', 'Hours', 'Quick links'];

export default function LiveNowPreview({ feature }: { feature: MappedFeature }) {
  const isProfile = feature.auto || feature.source === 'profile';
  const sourceLabel = isProfile ? 'Profile' : 'Module';
  const sourceSub = isProfile
    ? 'Business identity'
    : feature.source?.replace(/^module:/, '') || 'Module';

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <InfoCard label="Data source" value={sourceLabel} sub={sourceSub} />
        <InfoCard
          label={isProfile ? 'Status' : 'Items synced'}
          value={isProfile ? 'Auto' : String(feature.items)}
          sub={isProfile ? 'No setup needed' : 'Last updated today'}
        />
      </div>

      {!isProfile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 8px',
            background: theme.bg,
            borderRadius: 6,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 99,
              background: theme.green,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 500, color: theme.t1, flex: 1 }}>
            {sourceSub} module
          </span>
          <span
            style={{
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(22,163,74,0.1)',
              color: theme.green,
              fontWeight: 600,
            }}
          >
            Connected
          </span>
        </div>
      )}

      {isProfile && (
        <>
          <SectionLabel>Fields used from profile</SectionLabel>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              padding: '6px 8px',
              background: theme.bg,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            {PROFILE_FIELDS_DEFAULT.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 9,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: theme.accentBg,
                  color: ACCENT,
                  fontWeight: 500,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </>
      )}

      <SectionLabel>Displays in UI as</SectionLabel>
      <div
        style={{
          background: theme.bg,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.07)',
            padding: '9px 10px',
            fontSize: 11,
          }}
        >
          <div style={{ fontSize: 10, color: theme.t3, marginBottom: 5 }}>
            {feature.customer}
          </div>
          <div style={{ fontSize: 10.5, color: theme.t2 }}>
            Preview available in Test Chat →
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: theme.t3,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 7,
        marginTop: 10,
      }}
    >
      {children}
    </div>
  );
}

function InfoCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div style={{ background: theme.bg, borderRadius: 7, padding: '9px 10px' }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: theme.t3,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1, lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 9.5, color: theme.t3, marginTop: 2 }}>{sub}</div>
    </div>
  );
}
