'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Wifi, Wind, Droplets, Dumbbell, Coffee, Tv, Car, Utensils } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hosp_amenities',
  family: 'catalog',
  label: 'Amenities Grid',
  description: 'Grouped property amenities — room, property, services',
  applicableCategories: ['hospitality', 'hotels', 'accommodation', 'resorts', 'bnb'],
  intentTriggers: {
    keywords: ['amenities', 'facilities', 'pool', 'gym', 'spa', 'wifi', 'parking'],
    queryPatterns: ['what amenities *', 'do you have *', 'is there a *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'categories', type: 'tags', label: 'Amenity Categories' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    categories: [
      { label: 'Room', items: ['WiFi', 'AC', 'TV', 'Minibar', 'Safe'] },
      { label: 'Property', items: ['Pool', 'Gym', 'Spa', 'Restaurant', 'Bar'] },
      { label: 'Services', items: ['Room Service', 'Laundry', 'Parking', 'Airport Shuttle'] },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

const ICONS: Record<string, any> = { WiFi: Wifi, AC: Wind, Pool: Droplets, Gym: Dumbbell, Restaurant: Utensils, Bar: Coffee, TV: Tv, Parking: Car };

export default function AmenitiesBlock({ data, theme }: BlockComponentProps) {
  const categories: Array<{ label: string; items: string[] }> = data.categories || [];
  if (!categories.length) {
    const items: string[] = data.amenities || data.items || [];
    if (items.length) categories.push({ label: 'Amenities', items });
  }
  if (!categories.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      {categories.map((cat, ci) => (
        <div key={ci} style={{ padding: '8px 12px', borderBottom: ci < categories.length - 1 ? `1px solid ${theme.bdr}` : 'none' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: theme.t4, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{cat.label}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {cat.items.map(item => {
              const Icon = ICONS[item];
              return (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: theme.bg, border: `1px solid ${theme.bdr}` }}>
                  {Icon && <Icon size={10} color={theme.accent} />}
                  <span style={{ fontSize: 9, color: theme.t2, fontWeight: 500 }}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
