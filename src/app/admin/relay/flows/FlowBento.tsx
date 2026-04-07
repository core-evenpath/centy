'use client';

import { useMemo } from 'react';
import { T } from './flow-helpers';
import { buildBentoTiles } from './bento-tiles';
import {
  Radio, Search, Eye, BarChart3, Star, ShoppingBag, Shield, Phone, Clock,
  MessageCircle, Layers, ChevronRight, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Search, Eye, BarChart3, Star, ShoppingBag, Shield, Phone, Clock,
  MessageCircle, Layers,
};

interface Props {
  functionId: string;
  subVerticalName: string;
  accentColor: string;
  onStartChat: () => void;
}

export default function FlowBento({ functionId, subVerticalName, accentColor, onStartChat }: Props) {
  const tiles = useMemo(() => buildBentoTiles(functionId), [functionId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.surface }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${T.bdrL}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Radio size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t1 }}>{subVerticalName}</div>
            <div style={{ fontSize: 12, color: T.t3 }}>AI-powered storefront</div>
          </div>
        </div>
      </div>

      {/* Tiles */}
      <div style={{
        padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        flex: 1, overflow: 'auto', alignContent: 'start', scrollbarWidth: 'none',
      }}>
        {tiles.map(tile => {
          const Icon = ICON_MAP[tile.iconName] || Layers;
          const tileColor = tile.familyColor || accentColor;
          const isLarge = tile.size === 'large';
          return (
            <div key={tile.id} onClick={onStartChat} style={{
              gridColumn: isLarge ? '1 / -1' : 'auto',
              background: T.bg, border: `1px solid ${T.bdrL}`, borderRadius: 12,
              padding: isLarge ? 16 : 14, cursor: 'pointer',
              display: 'flex', flexDirection: isLarge ? 'row' : 'column',
              alignItems: isLarge ? 'center' : 'flex-start', gap: isLarge ? 14 : 8,
            }}>
              <div style={{
                width: isLarge ? 36 : 28, height: isLarge ? 36 : 28,
                borderRadius: isLarge ? 10 : 7,
                background: `${tileColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: tileColor, flexShrink: 0,
              }}>
                <Icon size={Math.round((isLarge ? 36 : 28) * 0.48)} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{tile.label}</div>
                <div style={{ fontSize: 11, color: T.t4 }}>{tile.sub}</div>
              </div>
              <ChevronRight size={14} color={T.t4} />
            </div>
          );
        })}
      </div>

      {/* Bottom */}
      <div style={{ padding: '10px 12px 16px', borderTop: `1px solid ${T.bdrL}` }}>
        <div onClick={onStartChat} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
          background: T.bg, borderRadius: 10, border: `1px solid ${T.bdrL}`, cursor: 'pointer',
        }}>
          <Sparkles size={14} color={T.t4} />
          <span style={{ fontSize: 13, color: T.t4 }}>Ask anything...</span>
        </div>
      </div>
    </div>
  );
}
