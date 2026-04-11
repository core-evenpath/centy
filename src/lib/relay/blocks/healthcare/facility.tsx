'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { Building2, Clock } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hc_facility',
  family: 'info',
  label: 'Facility & Departments',
  description: 'Department directory with floor, hours, open/closed status badges',
  applicableCategories: ['healthcare', 'medical', 'hospital', 'clinic'],
  intentTriggers: {
    keywords: ['facility', 'departments', 'directory', 'hours', 'floor', 'location', 'building'],
    queryPatterns: ['where is the *', 'department hours', 'facility directory', 'what floor *'],
    dataConditions: [],
  },
  dataContract: {
    required: [],
    optional: [
      { field: 'facilityName', type: 'text', label: 'Facility Name' },
      { field: 'departments', type: 'tags', label: 'Departments' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    facilityName: 'Central Medical Center',
    departments: [
      { name: 'Emergency', floor: '1st Floor', hours: '24/7', open: true },
      { name: 'Radiology', floor: '2nd Floor', hours: '7 AM - 8 PM', open: true },
      { name: 'Laboratory', floor: '1st Floor', hours: '6 AM - 6 PM', open: true },
      { name: 'Pharmacy', floor: 'Ground Floor', hours: '8 AM - 9 PM', open: true },
      { name: 'Physical Therapy', floor: '3rd Floor', hours: '8 AM - 5 PM', open: false },
    ],
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 600,
};

export default function FacilityBlock({ data, theme }: BlockComponentProps) {
  const depts: Array<Record<string, any>> = data.departments || [];
  if (!depts.length) return null;

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Building2 size={11} color={theme.accent} />
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{data.facilityName || 'Facility Directory'}</span>
      </div>
      {depts.map((d, i) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: i < depts.length - 1 ? `1px solid ${theme.bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.t1 }}>{d.name}</div>
            <div style={{ fontSize: 8, color: theme.t4, display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span>{d.floor}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={7} />{d.hours}</span>
            </div>
          </div>
          <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: d.open ? theme.greenBg : theme.redBg, color: d.open ? theme.green : theme.red }}>
            {d.open ? 'Open' : 'Closed'}
          </span>
        </div>
      ))}
    </div>
  );
}
