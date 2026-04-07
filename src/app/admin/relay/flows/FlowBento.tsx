'use client';

import { T } from './flow-helpers';
import { Radio, Search, BarChart3, Star, ShoppingBag, Tag, Phone, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  subVerticalName: string;
  accentColor: string;
  onStartChat: () => void;
}

const TILES = [
  { id: 'browse', label: 'Browse', sub: 'See what we offer', icon: Search, size: 'large' as const },
  { id: 'compare', label: 'Compare', sub: 'Side by side', icon: BarChart3, size: 'medium' as const },
  { id: 'reviews', label: 'Reviews', sub: 'What customers say', icon: Star, size: 'medium' as const },
  { id: 'book', label: 'Book / Buy', sub: 'Get started', icon: ShoppingBag, size: 'small' as const },
  { id: 'offers', label: 'Offers', sub: 'Current deals', icon: Tag, size: 'small' as const },
  { id: 'contact', label: 'Contact', sub: 'Talk to us', icon: Phone, size: 'small' as const },
];

export default function FlowBento({ subVerticalName, accentColor, onStartChat }: Props) {
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
        flex: 1, overflow: 'auto', alignContent: 'start',
        scrollbarWidth: 'none',
      }}>
        {TILES.map(tile => {
          const Icon = tile.icon;
          return (
            <div key={tile.id} onClick={onStartChat} style={{
              gridColumn: tile.size === 'large' ? '1 / -1' : 'auto',
              background: T.bg, border: `1px solid ${T.bdrL}`, borderRadius: 12,
              padding: tile.size === 'large' ? 16 : 14, cursor: 'pointer',
              display: 'flex',
              flexDirection: tile.size === 'large' ? 'row' : 'column',
              alignItems: tile.size === 'large' ? 'center' : 'flex-start',
              gap: tile.size === 'large' ? 14 : 8,
            }}>
              <div style={{
                width: tile.size === 'large' ? 36 : 28, height: tile.size === 'large' ? 36 : 28,
                borderRadius: tile.size === 'large' ? 10 : 7,
                background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor, flexShrink: 0,
              }}>
                <Icon size={Math.round((tile.size === 'large' ? 36 : 28) * 0.48)} strokeWidth={2} />
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
