'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Sun } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'tl_destination_card',
  family: 'catalog',
  label: 'Destination Card',
  description: 'Destination spotlight with best season, starting price, photo grid placeholder',
  applicableCategories: ['travel', 'tours', 'agencies', 'holidays'],
  intentTriggers: {
    keywords: ['destination', 'where to go', 'explore', 'popular places', 'spotlight'],
    queryPatterns: ['show destinations', 'where should I go', 'popular destinations *', 'explore *'],
    dataConditions: ['has_destinations'],
  },
  dataContract: {
    required: [{ field: 'name', type: 'text', label: 'Destination Name' }],
    optional: [
      { field: 'country', type: 'text', label: 'Country' },
      { field: 'bestSeason', type: 'text', label: 'Best Season' },
      { field: 'startingPrice', type: 'currency', label: 'Starting Price' },
      { field: 'description', type: 'textarea', label: 'Description' },
      { field: 'tags', type: 'tags', label: 'Tags' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    items: [
      { name: 'Santorini', country: 'Greece', bestSeason: 'Jun - Sep', startingPrice: 1150, description: 'Iconic sunsets, whitewashed villages, and volcanic beaches.', tags: ['Beach', 'Romance', 'Culture'] },
      { name: 'Kyoto', country: 'Japan', bestSeason: 'Mar - May', startingPrice: 1480, description: 'Ancient temples, bamboo groves, and seasonal cherry blossoms.', tags: ['Culture', 'Nature', 'History'] },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function DestinationCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((d, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ height: 48, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color={theme.t4} />
          </div>
          <div style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{d.name}</div>
                {d.country && <div style={{ fontSize: 9, color: theme.t3 }}>{d.country}</div>}
              </div>
              {d.bestSeason && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: theme.amber }}>
                  <Sun size={10} />
                  <span>{d.bestSeason}</span>
                </div>
              )}
            </div>
            {d.description && <div style={{ fontSize: 9, color: theme.t2, lineHeight: 1.4, marginTop: 4 }}>{d.description}</div>}
            {d.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 6 }}>
                {d.tags.map((t: string) => <span key={t} style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{t}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 8, color: theme.t4 }}>from</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(d.startingPrice)}</span>
              </div>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>Explore</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
