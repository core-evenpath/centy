'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Palette } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'evt_mood_board',
  family: 'design',
  label: 'Design Mood Board',
  description: 'Visual theme board with color palette swatches, inspiration image placeholders',
  applicableCategories: ['events', 'entertainment', 'wedding', 'decor', 'party', 'corporate'],
  intentTriggers: {
    keywords: ['mood board', 'design', 'theme', 'colors', 'aesthetic', 'inspiration', 'style'],
    queryPatterns: ['show me the design', 'mood board for *', 'event theme', 'color palette'],
    dataConditions: [],
  },
  dataContract: {
    required: [{ field: 'title', type: 'text', label: 'Theme Title' }],
    optional: [
      { field: 'colors', type: 'tags', label: 'Color Palette' },
      { field: 'images', type: 'images', label: 'Inspiration Images' },
      { field: 'description', type: 'text', label: 'Description' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: 'Rustic Elegance',
    description: 'Warm earth tones with gold accents and natural textures',
    colors: ['#8B7355', '#D4A574', '#C9B896', '#F5F0E8', '#B8860B'],
    images: [{ color: '#D4A574' }, { color: '#8B7355' }, { color: '#C9B896' }, { color: '#F5F0E8' }],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function MoodBoardBlock({ data, theme }: BlockComponentProps) {
  const colors: string[] = data.colors || [];
  const images: Array<{ url?: string; color?: string }> = data.images || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Palette size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mood Board</span>
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.title || 'Untitled Theme'}</div>
        {data.description && <div style={{ fontSize: 9, color: theme.t3, marginTop: 2 }}>{data.description}</div>}
        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginTop: 8 }}>
            {images.slice(0, 4).map((img, i) => (
              <div key={i} style={{ aspectRatio: '3/2', borderRadius: 6, background: img.url ? `url(${img.url}) center/cover` : `linear-gradient(135deg, ${img.color || theme.accentBg2}, ${theme.bg})` }} />
            ))}
          </div>
        )}
        {colors.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {colors.map((c, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: '100%', height: 24, borderRadius: 6, background: c, border: `1px solid ${theme.bdr}` }} />
                <span style={{ fontSize: 7, color: theme.t4, fontFamily: 'monospace' }}>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
