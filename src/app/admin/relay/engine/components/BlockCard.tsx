'use client';

import React from 'react';
import type { ServerBlockData } from '../../blocks/previews/_registry-data';
import { HealthDots, type BlockDotSummary } from './HealthDots';

interface Props {
  block: ServerBlockData;
  dotSummary?: BlockDotSummary | null;
  /** When no partner is selected, dots are hidden (catalog view). */
  hideHealth?: boolean;
}

export function BlockCard({ block, dotSummary, hideHealth }: Props) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e8e4dc',
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 180,
        maxWidth: 240,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a18', lineHeight: 1.3 }}>
          {block.label}
        </div>
        <HealthDots summary={dotSummary} hidden={hideHealth} />
      </div>
      <div style={{ fontSize: 10, color: '#7a7a70', lineHeight: 1.4 }}>
        {block.desc}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 8,
            padding: '1px 5px',
            borderRadius: 3,
            background: '#f7f3ec',
            color: '#3d3d38',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {block.id}
        </span>
        {block.module && (
          <span
            style={{
              fontSize: 8,
              padding: '1px 5px',
              borderRadius: 3,
              background: 'rgba(29,78,216,0.08)',
              color: '#1d4ed8',
            }}
            title={`Binds module: ${block.module}`}
          >
            📦 {block.module}
          </span>
        )}
      </div>
    </div>
  );
}
