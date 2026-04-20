'use client';
import { C, F, icons } from './theme';

const Ic = ({ d, size = 18, color = C.t3, sw = 2 }: { d: string; size?: number; color?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export interface BlockTileDef {
  label: string;
  sub?: string;
  iconKey?: keyof typeof icons;
  color?: string;
}

const tintFor = (hex: string) => {
  // Accept hex — return rgba tint @ ~10% opacity
  const h = hex.replace('#', '');
  if (h.length !== 6) return 'rgba(78,63,255,0.10)';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.12)`;
};

export function BlockTiles({
  blocks,
  title = 'Block library',
  subtitle = 'Interactive blocks rendered inside the chat widget.',
  variant = 'bento',
}: {
  blocks: BlockTileDef[];
  title?: string;
  subtitle?: string;
  variant?: 'bento' | 'grid';
}) {
  const withDefaults = blocks.map((b, i) => ({
    ...b,
    color: b.color || [C.accent, C.blue, C.amber, C.rust, C.indigo, C.green][i % 6],
    iconKey: b.iconKey || (['grid', 'calendar', 'dollar', 'users', 'star', 'phone', 'tag', 'chart', 'clock', 'file', 'msg'][i % 11] as keyof typeof icons),
  }));

  // Bento layout: first tile is large (full width), rest auto-grid
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 'clamp(16px, 2.2vw, 22px)',
        boxShadow: '0 1px 0 rgba(10,10,10,0.02)',
      }}
    >
      {/* Header, mirroring FlowBento */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: `1px solid ${C.borderLight}`, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic d={icons.broadcast} size={18} color="#fff" sw={2.5} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, fontFamily: F }}>{title}</div>
          <div style={{ fontSize: 12, color: C.t3, fontFamily: F }}>{subtitle}</div>
        </div>
      </div>

      {/* Tile grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {withDefaults.map((b, i) => {
          const isLarge = variant === 'bento' && i === 0;
          const iconD = icons[b.iconKey];
          return (
            <div
              key={b.label}
              style={{
                gridColumn: isLarge ? '1 / -1' : 'auto',
                background: C.bg,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 12,
                padding: isLarge ? 16 : 14,
                display: 'flex',
                alignItems: isLarge ? 'center' : 'flex-start',
                flexDirection: isLarge ? 'row' : 'column',
                gap: isLarge ? 14 : 10,
                transition: 'border-color 0.15s, transform 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = b.color!;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.borderLight;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: isLarge ? 36 : 32,
                  height: isLarge ? 36 : 32,
                  borderRadius: isLarge ? 10 : 8,
                  background: tintFor(b.color!),
                  color: b.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ic d={iconD} size={isLarge ? 18 : 15} color={b.color} sw={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, fontFamily: F, lineHeight: 1.25 }}>{b.label}</div>
                {b.sub && <div style={{ fontSize: 11.5, color: C.t3, fontFamily: F, marginTop: 2, lineHeight: 1.4 }}>{b.sub}</div>}
              </div>
              <Ic d={icons.chevRight} size={14} color={C.t4} sw={2} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function parseBlocks(raw: string[]): BlockTileDef[] {
  return raw.map((s) => {
    const [label, ...rest] = s.split(' — ');
    return { label: label.trim(), sub: rest.join(' — ').trim() || undefined };
  });
}
