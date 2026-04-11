'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Camera, Image } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_portfolio',
  family: 'proof',
  label: 'Portfolio',
  description: 'Project showcase with photo strip placeholders, event title, type tag, shot count',
  applicableCategories: ['events', 'entertainment', 'photography', 'videography', 'wedding', 'decor'],
  intentTriggers: {
    keywords: ['portfolio', 'past work', 'examples', 'gallery', 'previous events'],
    queryPatterns: ['show me your work', 'past events', 'portfolio for *'],
    dataConditions: ['has_portfolio'],
  },
  dataContract: {
    required: [{ field: 'title', type: 'text', label: 'Event Title' }],
    optional: [
      { field: 'type', type: 'text', label: 'Event Type' },
      { field: 'shotCount', type: 'number', label: 'Shot Count' },
      { field: 'images', type: 'images', label: 'Photos' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { title: 'Johnson Wedding', type: 'Wedding', shotCount: 420, images: [{ color: '#fde68a' }, { color: '#bfdbfe' }, { color: '#c4b5fd' }, { color: '#a7f3d0' }] },
      { title: 'TechCon 2026 Gala', type: 'Corporate', shotCount: 285, images: [{ color: '#93c5fd' }, { color: '#fed7aa' }, { color: '#d9f99d' }] },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function PortfolioBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Camera size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Portfolio</span>
      </div>
      {items.map((p, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < items.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.t1 }}>{p.title}</span>
            {p.type && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{p.type}</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(p.images || []).slice(0, 4).map((img: any, j: number) => (
              <div key={j} style={{ flex: 1, height: 48, borderRadius: 6, background: img.url ? `url(${img.url}) center/cover` : `linear-gradient(135deg, ${img.color || theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!img.url && <Image size={12} color={theme.t4} />}
              </div>
            ))}
          </div>
          {p.shotCount && <div style={{ fontSize: 8, color: theme.t4, marginTop: 4 }}>{p.shotCount} shots delivered</div>}
        </div>
      ))}
    </div>
  );
}
