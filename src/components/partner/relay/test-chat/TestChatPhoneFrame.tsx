'use client';

import type { ReactNode } from 'react';
import type { RelayTheme } from '@/components/relay/blocks/types';

// ── iPhone-style device frame ────────────────────────────────────────
//
// 375×720 device chrome with 6px bezel, 32px outer radius, and a notch
// at the top. Content slots into the inner screen area.

export default function TestChatPhoneFrame({
  children,
  theme,
}: {
  children: ReactNode;
  theme: RelayTheme;
}) {
  return (
    <div
      style={{
        width: 375,
        height: 720,
        borderRadius: 32,
        border: '6px solid #1c1917',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(28,25,23,0.15)',
        background: theme.surface,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 110,
          height: 24,
          background: '#1c1917',
          borderRadius: '0 0 14px 14px',
          zIndex: 30,
        }}
      />
      {/* Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 26,
          overflow: 'hidden',
          background: theme.surface,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
