'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { MapPin, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'pu_office_locator',
  family: 'info',
  label: 'Office Locator',
  description: 'Location list with address, hours, open/closed status badge',
  applicableCategories: ['government', 'public_services', 'municipal', 'nonprofit'],
  intentTriggers: {
    keywords: ['office', 'location', 'address', 'hours', 'directions', 'branch', 'where'],
    queryPatterns: ['where is the * office', 'office hours for *', 'nearest * location'],
    dataConditions: ['has_locations'],
  },
  dataContract: {
    required: [
      { field: 'offices', type: 'tags', label: 'Office Locations' },
    ],
    optional: [],
  },
  variants: ['default', 'compact'],
  sampleData: {
    offices: [
      { name: 'City Hall', address: '100 Main St', hours: 'Mon-Fri 8 AM - 5 PM', open: true },
      { name: 'Eastside Branch', address: '450 Oak Ave', hours: 'Mon-Fri 9 AM - 4 PM', open: true },
      { name: 'Community Center', address: '22 Park Blvd', hours: 'Sat 10 AM - 2 PM', open: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function OfficeLocatorBlock({ data, theme }: BlockComponentProps) {
  const offices: Array<Record<string, any>> = data.offices || [];
  if (!offices.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {offices.map((o, i) => (
        <div key={i} style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.t1 }}>{o.name}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: o.open ? theme.green : theme.red, background: o.open ? theme.greenBg : theme.redBg, padding: '2px 6px', borderRadius: 4 }}>
              {o.open ? 'Open' : 'Closed'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <MapPin size={9} color={theme.t4} />
            <span style={{ fontSize: 10, color: theme.t2 }}>{o.address}</span>
          </div>
          {o.hours && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={9} color={theme.t4} />
              <span style={{ fontSize: 10, color: theme.t3 }}>{o.hours}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
