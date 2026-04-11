'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Camera } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_property_gallery',
  family: 'detail',
  label: 'Property Gallery',
  description: 'Photo grid of property areas with labels',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb', 'vacation_rental'],
  intentTriggers: {
    keywords: ['photos', 'pictures', 'gallery', 'images', 'see the property', 'what does it look like'],
    queryPatterns: ['show me photos', 'can I see *', 'pictures of *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'images', type: 'images', label: 'Gallery Images' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    images: [
      { label: 'Lobby', color: '#bfdbfe' },
      { label: 'Pool', color: '#a7f3d0' },
      { label: 'Restaurant', color: '#fed7aa' },
      { label: 'Spa', color: '#ddd6fe' },
      { label: 'Beach', color: '#93c5fd' },
      { label: 'Garden', color: '#bbf7d0' },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 3600,
};

export default function PropertyGalleryBlock({ data, theme }: BlockComponentProps) {
  const images: Array<{ label?: string; url?: string; color?: string }> = data.images || [];
  if (!images.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Camera size={11} color={theme.t1} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>Property Gallery</span>
        <span style={{ fontSize: 9, color: theme.t4, marginLeft: 'auto' }}>{images.length} photos</span>
      </div>
      <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
        {images.slice(0, 6).map((img, i) => (
          <div key={i} style={{ aspectRatio: '4/3', borderRadius: 6, background: img.url ? `url(${img.url}) center/cover` : `linear-gradient(135deg, ${img.color || theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 3, overflow: 'hidden', position: 'relative' }}>
            {img.label && (
              <span style={{ fontSize: 7, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '2px 6px', borderRadius: 3, backdropFilter: 'blur(4px)' }}>
                {img.label}
              </span>
            )}
          </div>
        ))}
      </div>
      {images.length > 6 && (
        <div style={{ padding: '6px 12px', borderTop: `1px solid ${theme.bdr}`, textAlign: 'center' }}>
          <span style={{ fontSize: 9, color: theme.accent, fontWeight: 600, cursor: 'pointer' }}>View all {images.length} photos →</span>
        </div>
      )}
    </div>
  );
}
