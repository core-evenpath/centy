'use client';

import React from 'react';
import {
  T,
  STAGE_POSITIONS,
  DEFAULT_STAGE_POSITION,
  FLOW_STAGE_STYLES,
} from './flow-builder-types';
import type { FlowBuilderStage, FlowBuilderTransition } from './flow-builder-types';

// ── Constants ────────────────────────────────────────────────────────

const CANVAS_W = 1200;
const CANVAS_H = 420;
const NODE_W = 160;
const NODE_H_APPROX = 60;
const FONT = "'Karla', -apple-system, BlinkMacSystemFont, sans-serif";

const DEFAULT_STAGE_STYLE = { color: '#f3f3f0', textColor: '#555550' };

// ── Props ────────────────────────────────────────────────────────────

interface FlowCanvasProps {
  stages: FlowBuilderStage[];
  transitions: FlowBuilderTransition[];
  selectedStageId: string | null;
  onSelectStage: (id: string | null) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getPos(stageType: string): { x: number; y: number } {
  return STAGE_POSITIONS[stageType] ?? DEFAULT_STAGE_POSITION;
}

function getStyle(stageType: string): { color: string; textColor: string } {
  return FLOW_STAGE_STYLES[stageType] ?? DEFAULT_STAGE_STYLE;
}

// Build a map from stage id → stage type for position lookups
function buildTypeMap(stages: FlowBuilderStage[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of stages) m.set(s.id, s.type);
  return m;
}

// ── Component ────────────────────────────────────────────────────────

export default function FlowCanvas({
  stages,
  transitions,
  selectedStageId,
  onSelectStage,
}: FlowCanvasProps) {
  const typeMap = buildTypeMap(stages);

  return (
    <div
      style={{
        position: 'relative',
        overflowX: 'auto',
        background: T.surface,
        border: `1px solid ${T.bdr}`,
        borderRadius: 12,
        fontFamily: FONT,
      }}
    >
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>
        {/* SVG transition layer */}
        <svg
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          <defs>
            <marker
              id="flow-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L8,3 L0,6 Z" fill={T.bdrM} />
            </marker>
          </defs>

          {transitions.map((tr, i) => {
            const fromType = typeMap.get(tr.from);
            const toType = typeMap.get(tr.to);
            if (!fromType || !toType) return null;

            const from = getPos(fromType);
            const to = getPos(toType);

            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H_APPROX / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H_APPROX / 2;

            const cx1 = x1 + 40;
            const cx2 = x2 - 40;

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;

            return (
              <g key={`${tr.from}-${tr.to}-${i}`}>
                <path
                  d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={T.bdr}
                  strokeWidth={1.5}
                  markerEnd="url(#flow-arrow)"
                />
                <text
                  x={mx}
                  y={my - 6}
                  textAnchor="middle"
                  fill={T.t4}
                  fontSize={9}
                  fontFamily={FONT}
                >
                  {tr.trigger}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Stage nodes */}
        {stages.map(stage => {
          const pos = getPos(stage.type);
          const style = getStyle(stage.type);
          const isSelected = stage.id === selectedStageId;

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage(isSelected ? null : stage.id)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: NODE_W,
                padding: '10px 12px',
                borderRadius: 10,
                background: style.color,
                color: style.textColor,
                border: `2px solid ${isSelected ? T.acc : 'transparent'}`,
                boxShadow: isSelected
                  ? `0 0 0 3px ${T.accBg2}`
                  : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                fontFamily: FONT,
                transition: 'border-color 0.15s, box-shadow 0.15s',
                userSelect: 'none' as const,
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {stage.isEntry && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: T.green,
                      flexShrink: 0,
                    }}
                  />
                )}
                {stage.isExit && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: T.red,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: '16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {stage.name}
                </span>
              </div>

              {/* Meta row */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 5,
                  fontSize: 9,
                  opacity: 0.75,
                  fontWeight: 500,
                }}
              >
                <span>{stage.blockIds.length} block{stage.blockIds.length !== 1 ? 's' : ''}</span>
                <span>{stage.intentTriggers.length} intent{stage.intentTriggers.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
