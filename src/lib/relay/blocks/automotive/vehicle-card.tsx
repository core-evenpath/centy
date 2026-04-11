'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car, Fuel } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_vehicle_card',
  family: 'catalog',
  label: 'Vehicle Card',
  description: 'Vehicle listing with make/model/year, mileage, fuel type, MPG, pricing',
  applicableCategories: ['automotive', 'dealership', 'cars', 'vehicles', 'trucks'],
  intentTriggers: {
    keywords: ['vehicles', 'cars', 'inventory', 'browse', 'listings', 'trucks'],
    queryPatterns: ['show me cars', 'what vehicles *', 'browse inventory', 'cars under *'],
    dataConditions: ['has_vehicles'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Year Make Model' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'mileage', type: 'number', label: 'Mileage' },
      { field: 'fuelType', type: 'text', label: 'Fuel Type' },
      { field: 'mpg', type: 'text', label: 'MPG' },
      { field: 'trim', type: 'text', label: 'Trim' },
      { field: 'exteriorColor', type: 'text', label: 'Exterior Color' },
      { field: 'badge', type: 'text', label: 'Badge' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact', 'grid'],
  sampleData: {
    items: [
      { title: '2024 Toyota Camry XSE', trim: 'XSE V6', price: 34250, mileage: 12, fuelType: 'Gasoline', mpg: '28/39', exteriorColor: 'Midnight Black', badge: 'New Arrival' },
      { title: '2023 Honda CR-V Hybrid', trim: 'Sport Touring', price: 38600, mileage: 8420, fuelType: 'Hybrid', mpg: '40/34', exteriorColor: 'Lunar Silver' },
    ],
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 300,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function VehicleCardBlock({ data, theme }: BlockComponentProps) {
  const items: Array<Record<string, any>> = data.items || [];
  if (!items.length) return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
      <Car size={24} color={theme.t4} />
      <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>No vehicles available</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((v, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, display: 'flex', gap: 10, padding: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <Car size={20} color={theme.t4} />
            {v.badge && <div style={{ position: 'absolute', top: -4, right: -8, background: theme.accent, color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 6 }}>{v.badge}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{v.title}</div>
            <div style={{ fontSize: 9, color: theme.t3, marginTop: 1 }}>{v.trim || ''}{v.exteriorColor ? ` · ${v.exteriorColor}` : ''}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {v.mileage != null && <span style={{ fontSize: 8, color: theme.t3 }}>{v.mileage.toLocaleString()} mi</span>}
              {v.fuelType && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: theme.t3 }}><Fuel size={8} />{v.fuelType}</span>}
              {v.mpg && <span style={{ fontSize: 8, color: theme.t3 }}>{v.mpg} MPG</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>{fmt(v.price)}</span>
              <button style={{ fontSize: 9, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }}>View</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
