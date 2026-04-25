'use client';

// ── Chat Example (PR fix-13) ────────────────────────────────────────
//
// Phone-style preview of the canonical conversation for a flow. Each
// bot turn that fires a block is keyed to that block's id — hovering a
// turn lights up the matching tile in the HappyPathStrip above. Makes
// the abstract flow concrete: admin sees what the user sees and what
// fires when.

import React from 'react';
import type { FlowDefinition } from './flow-definitions';

interface Props {
  flow: FlowDefinition;
  /** External hover state — the strip and example sync via the
   *  parent. */
  highlightedBlockId?: string | null;
  onHover?: (blockId: string | null) => void;
}

export function ChatExample({ flow, highlightedBlockId, onHover }: Props) {
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #e8e4dc',
        borderRadius: 12,
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a18' }}>
          Sample conversation
        </h3>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7a7a70' }}>
          Hover a bot turn to highlight the block that fires above.
        </p>
      </header>
      <div
        style={{
          background: '#f7f3ec',
          borderRadius: 14,
          padding: 14,
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {flow.chatExample.map((turn, i) => {
          if (turn.from === 'user') {
            return (
              <div
                key={i}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '80%',
                  background: flow.accent.text,
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '14px 14px 2px 14px',
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {turn.text}
              </div>
            );
          }
          const isHighlighted = !!turn.blockId && highlightedBlockId === turn.blockId;
          return (
            <div
              key={i}
              onMouseEnter={() => turn.blockId && onHover?.(turn.blockId)}
              onMouseLeave={() => onHover?.(null)}
              style={{
                alignSelf: 'flex-start',
                maxWidth: '85%',
                background: isHighlighted ? flow.accent.bg : '#ffffff',
                color: '#1a1a18',
                padding: '8px 12px',
                borderRadius: '14px 14px 14px 2px',
                fontSize: 13,
                lineHeight: 1.4,
                border: isHighlighted
                  ? `1.5px solid ${flow.accent.border}`
                  : '1px solid #e8e4dc',
                cursor: turn.blockId ? 'pointer' : 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transition: 'background 120ms ease, border-color 120ms ease',
              }}
            >
              <div>{turn.text}</div>
              {turn.blockId && (
                <code
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 9,
                    fontFamily: 'ui-monospace, monospace',
                    background: flow.accent.bg,
                    color: flow.accent.text,
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: `1px solid ${flow.accent.border}`,
                  }}
                >
                  fires {turn.blockId}
                </code>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
