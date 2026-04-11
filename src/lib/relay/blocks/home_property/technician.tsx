'use client';

import type { BlockDefinition, BlockComponentProps } from '../../types';
import { UserCheck, Star } from 'lucide-react';

export const definition: BlockDefinition = {
  id: 'hp_technician',
  family: 'people',
  label: 'Technician Profile',
  description: 'Skilled worker card with license, specialties, job count, rating',
  applicableCategories: ['home_property', 'home_services', 'repair', 'maintenance'],
  intentTriggers: {
    keywords: ['technician', 'plumber', 'electrician', 'handyman', 'contractor', 'worker'],
    queryPatterns: ['who is my technician', 'assigned tech *', 'technician profile'],
    dataConditions: ['has_technician'],
  },
  dataContract: {
    required: [
      { field: 'name', type: 'text', label: 'Technician Name' },
    ],
    optional: [
      { field: 'license', type: 'text', label: 'License Number' },
      { field: 'specialties', type: 'tags', label: 'Specialties' },
      { field: 'jobCount', type: 'number', label: 'Jobs Completed' },
      { field: 'rating', type: 'rating', label: 'Rating' },
      { field: 'yearsExp', type: 'number', label: 'Years Experience' },
      { field: 'imageUrl', type: 'image', label: 'Photo' },
    ],
  },
  variants: ['default', 'compact'],
  sampleData: {
    name: 'Mike Rodriguez', license: 'LIC-48291', specialties: ['HVAC', 'Plumbing', 'Gas Lines'],
    jobCount: 1247, rating: 4.9, yearsExp: 12,
  },
  preloadable: true,
  streamable: false,
  cacheDuration: 300,
};

export default function TechnicianBlock({ data, theme }: BlockComponentProps) {
  const specialties: string[] = data.specialties || [];

  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.bdr}`, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accentBg2}, ${theme.bg})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserCheck size={20} color={theme.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>{data.name}</div>
          {data.license && <div style={{ fontSize: 8, color: theme.t4, marginTop: 1 }}>{data.license}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            {data.rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 600, color: theme.amber }}>
                <Star size={10} fill={theme.amber} color={theme.amber} />{data.rating}
              </span>
            )}
            {data.jobCount && <span style={{ fontSize: 9, color: theme.t3 }}>{data.jobCount.toLocaleString()} jobs</span>}
            {data.yearsExp && <span style={{ fontSize: 9, color: theme.t3 }}>{data.yearsExp}yr exp</span>}
          </div>
        </div>
      </div>
      {specialties.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {specialties.map((s) => (
            <span key={s} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: theme.accentBg, color: theme.accent, fontWeight: 600 }}>{s}</span>
          ))}
        </div>
      )}
      <button style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', background: theme.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginTop: 10 }}>
        Request This Technician
      </button>
    </div>
  );
}
