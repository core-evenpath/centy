'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Car, Settings } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'auto_vehicle_detail',
  family: 'catalog',
  label: 'Vehicle Detail',
  description: 'Full spec sheet with engine, drivetrain, features, monthly estimate',
  applicableCategories: ['automotive', 'dealership', 'cars', 'vehicles'],
  intentTriggers: {
    keywords: ['specs', 'details', 'features', 'engine', 'drivetrain', 'horsepower'],
    queryPatterns: ['tell me about *', 'specs for *', 'details on *', 'what engine *'],
    dataConditions: ['has_vehicle_detail'],
  },
  dataContract: {
    required: [
      { field: 'title', type: 'text', label: 'Year Make Model' },
      { field: 'price', type: 'currency', label: 'Price' },
    ],
    optional: [
      { field: 'engine', type: 'text', label: 'Engine' },
      { field: 'drivetrain', type: 'text', label: 'Drivetrain' },
      { field: 'transmission', type: 'text', label: 'Transmission' },
      { field: 'horsepower', type: 'number', label: 'Horsepower' },
      { field: 'mpg', type: 'text', label: 'MPG' },
      { field: 'features', type: 'tags', label: 'Features' },
      { field: 'monthlyEstimate', type: 'currency', label: 'Monthly Estimate' },
      { field: 'imageUrl', type: 'image', label: 'Image' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    title: '2024 Toyota Camry XSE V6', price: 34250, engine: '3.5L V6 301hp',
    drivetrain: 'FWD', transmission: '8-Speed Auto', horsepower: 301, mpg: '28/39',
    features: ['Leather Seats', 'Sunroof', 'Apple CarPlay', 'Blind-Spot Monitor', 'Lane Assist'],
    monthlyEstimate: 489,
  },
  preloadable: true,
  streamable: true,
  cacheDuration: 600,
};

function fmt(n: number) { return '$' + n.toLocaleString(); }

export default function VehicleDetailBlock({ data, theme }: BlockComponentProps) {
  const specs = [{ label: 'Engine', value: data.engine },
    { label: 'Drivetrain', value: data.drivetrain }, { label: 'Transmission', value: data.transmission },
    { label: 'Horsepower', value: data.horsepower ? `${data.horsepower} hp` : null },
    { label: 'MPG', value: data.mpg },
  ].filter(s => s.value);
  const features: string[] = data.features || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Car size={14} color={theme.accent} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.t1 }}>{data.title || 'Vehicle'}</span>
      </div>
      <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {specs.map(s => (
          <div key={s.label}>
            <div style={{ fontSize: 8, color: theme.t4, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.t1, marginTop: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      {features.length > 0 && (
        <div style={{ padding: '8px 12px', borderTop: `1px solid ${theme.bdr}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Settings size={9} color={theme.t3} />
            <span style={{ fontSize: 9, fontWeight: 600, color: theme.t3 }}>Key Features</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {features.map(f => <span key={f} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.bg, color: theme.t2 }}>{f}</span>)}
          </div>
        </div>
      )}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${theme.bdr}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>{fmt(data.price || 0)}</span>
          {data.monthlyEstimate && <div style={{ fontSize: 9, color: theme.t3 }}>Est. {fmt(data.monthlyEstimate)}/mo</div>}
        </div>
        <button style={{ fontSize: 10, fontWeight: 600, color: '#fff', background: theme.accent, border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}>Get Quote</button>
      </div>
    </div>
  );
}
